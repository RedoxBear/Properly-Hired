import React from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
    Upload,
    Loader2,
    CheckCircle2,
    AlertCircle,
    Database,
    Zap,
    RefreshCw,
    Trash2,
    Info,
    FileText,
    Users,
    Layers
} from "lucide-react";
import { isAdmin } from "@/components/utils/accessControl";
import { useNavigate } from "react-router-dom";
import ONetAttribution from "@/components/onet/ONetAttribution";
import { onetAggregator } from "@/lib/onetAggregator";
import { getSchemaByFileName, ONET_SCHEMAS, getImportOrder } from "@/lib/onetSchemas";

const STORAGE_KEY = 'onet_optimized_import_state';

/**
 * Optimized O*NET Import Page
 *
 * Uses Option C architecture:
 * - Aggregates ~1.1M rows into ~1,000 occupation profiles
 * - Server-side bulkCreate for speed
 * - Proper duplicate detection by SOC code
 */
export default function ONetImportOptimized() {
    const navigate = useNavigate();
    const [isCheckingAccess, setIsCheckingAccess] = React.useState(true);
    const [error, setError] = React.useState("");

    // Import state
    const [importMode, setImportMode] = React.useState('idle'); // idle, parsing, aggregating, uploading, complete
    const [progress, setProgress] = React.useState({ current: 0, total: 0, phase: '', subPhase: '' });
    const [aggregatorStats, setAggregatorStats] = React.useState(null);
    const [dbStats, setDbStats] = React.useState(null);
    const [uploadStats, setUploadStats] = React.useState(null);

    // File selection
    const [selectedFiles, setSelectedFiles] = React.useState([]);
    const [matchedFiles, setMatchedFiles] = React.useState([]);
    const [unmatchedFiles, setUnmatchedFiles] = React.useState([]);
    const folderInputRef = React.useRef(null);

    // Results
    const [importResult, setImportResult] = React.useState(null);

    React.useEffect(() => {
        checkAccess();
        loadDbStats();
    }, []);

    const checkAccess = async () => {
        setIsCheckingAccess(true);
        try {
            const user = await base44.auth.me();
            if (!isAdmin(user)) {
                setError("Access Denied: Admin privileges required.");
                setTimeout(() => navigate("/Dashboard"), 2000);
                return;
            }
        } catch (e) {
            setError("Failed to verify access.");
            setTimeout(() => navigate("/Dashboard"), 2000);
        } finally {
            setIsCheckingAccess(false);
        }
    };

    const loadDbStats = async () => {
        try {
            // Use server function to get accurate counts
            const result = await base44.functions.invoke('importONetBulk', {
                action: 'get_counts'
            });

            if (result.success) {
                setDbStats(result.counts);
            }
        } catch (e) {
            console.warn("Failed to load DB stats via function:", e.message);
            // Fallback to client-side count
            try {
                const profiles = await base44.entities.ONetOccupationProfile?.list('-created_date', 2000);
                setDbStats({ ONetOccupationProfile: profiles?.length || 0 });
            } catch (e2) {
                console.warn("Entities not found yet (will be created during import):", e2.message);
                // Default: no profiles yet
                setDbStats({ ONetOccupationProfile: 0 });
            }
        }
    };

    const handleFolderSelect = async (e) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        const matched = [];
        const unmatched = [];

        for (const file of files) {
            const schema = getSchemaByFileName(file.name);
            if (schema) {
                matched.push({ file, schema, fileName: schema.fileName });
            } else if (file.name.endsWith('.csv')) {
                unmatched.push({ fileName: file.name });
            }
        }

        // Sort by import order (phase)
        matched.sort((a, b) => a.schema.phase - b.schema.phase);

        setSelectedFiles(files);
        setMatchedFiles(matched);
        setUnmatchedFiles(unmatched);
        setError("");

        if (folderInputRef.current) {
            folderInputRef.current.value = "";
        }
    };

    const startImport = async () => {
        if (matchedFiles.length === 0) return;

        setImportMode('parsing');
        setError("");
        setImportResult(null);
        onetAggregator.reset();

        try {
            const totalFiles = matchedFiles.length;

            // Phase 1: Parse all files and aggregate locally
            setProgress({ current: 0, total: totalFiles, phase: 'Parsing & Aggregating' });

            for (let i = 0; i < matchedFiles.length; i++) {
                const { file, fileName } = matchedFiles[i];
                setProgress(p => ({
                    ...p,
                    current: i + 1,
                    phase: `Parsing ${fileName}`
                }));

                try {
                    const text = await file.text();
                    const result = onetAggregator.processFile(fileName, text);

                    if (!result.success && !result.skipped) {
                        console.warn(`Warning processing ${fileName}:`, result.error);
                    }
                } catch (fileError) {
                    console.error(`Error reading ${fileName}:`, fileError);
                }

                // Update aggregator stats display
                setAggregatorStats(onetAggregator.getStats());
            }

            // Phase 2: Upload aggregated profiles to server with mapping progress
            setImportMode('uploading');
            const profiles = onetAggregator.getProfiles();

            if (profiles.length === 0) {
                throw new Error("No occupation profiles generated. Make sure Occupation_Data.csv is included.");
            }

            setProgress({
                current: 0,
                total: profiles.length,
                phase: `Mapping to Base44 Storage`,
                subPhase: `Preparing ${profiles.length} profiles...`
            });

            // Send to server in batches
            const UPLOAD_BATCH_SIZE = 100;
            let uploadedCount = 0;
            let skippedCount = 0;
            const errors = [];
            const batchStats = [];

            for (let i = 0; i < profiles.length; i += UPLOAD_BATCH_SIZE) {
                const batch = profiles.slice(i, i + UPLOAD_BATCH_SIZE);
                const batchNum = Math.floor(i / UPLOAD_BATCH_SIZE) + 1;
                const totalBatches = Math.ceil(profiles.length / UPLOAD_BATCH_SIZE);

                // Update status before upload
                setProgress({
                    current: i,
                    total: profiles.length,
                    phase: `Mapping to Base44 Storage`,
                    subPhase: `Batch ${batchNum}/${totalBatches}: Processing ${batch.length} profiles...`
                });

                try {
                    const result = await base44.functions.invoke('importONetBulk', {
                        action: 'bulk_import_profiles',
                        profiles: batch
                    });

                    if (result.success) {
                        const imported = result.stats.imported;
                        const duplicates = result.stats.duplicates_skipped;
                        uploadedCount += imported;
                        skippedCount += duplicates;

                        batchStats.push({
                            batchNum,
                            imported,
                            duplicates,
                            duration: result.stats.duration_ms
                        });

                        // Update status with storage confirmation
                        setProgress({
                            current: Math.min(i + UPLOAD_BATCH_SIZE, profiles.length),
                            total: profiles.length,
                            phase: `Mapping to Base44 Storage`,
                            subPhase: `Batch ${batchNum}/${totalBatches}: ✓ Stored ${imported} profiles (${duplicates} duplicates skipped)`
                        });
                    } else {
                        errors.push(result.error);
                        setProgress(p => ({
                            ...p,
                            subPhase: `Batch ${batchNum}/${totalBatches}: ✗ Error - ${result.error}`
                        }));
                    }
                } catch (batchError) {
                    errors.push(`Batch ${batchNum}: ${batchError.message}`);
                    setProgress(p => ({
                        ...p,
                        subPhase: `Batch ${batchNum}/${totalBatches}: ✗ Upload failed - ${batchError.message}`
                    }));
                }
            }

            // Complete - show storage confirmation
            setImportMode('complete');
            setUploadStats({
                totalBatches: Math.ceil(profiles.length / UPLOAD_BATCH_SIZE),
                batchStats,
                totalDuration: batchStats.reduce((sum, b) => sum + b.duration, 0)
            });

            setImportResult({
                success: true,
                filesProcessed: matchedFiles.length,
                rowsAggregated: onetAggregator.getStats().rowsProcessed,
                profilesGenerated: profiles.length,
                profilesUploaded: uploadedCount,
                duplicatesSkipped: skippedCount,
                errors
            });

            // Verify data was actually stored in Base44
            setTimeout(() => {
                loadDbStats();
            }, 1000);

        } catch (e) {
            console.error("Import failed:", e);
            setError(e.message || "Import failed");
            setImportMode('idle');
        }
    };

    const clearData = async () => {
        if (!confirm("This will delete ALL O*NET occupation profiles. Are you sure?")) {
            return;
        }

        setImportMode('parsing');
        setProgress({ current: 0, total: 1, phase: 'Clearing data...' });

        try {
            await base44.functions.invoke('importONetBulk', {
                action: 'clear_entity',
                entityName: 'ONetOccupationProfile'
            });

            setImportResult(null);
            loadDbStats();
        } catch (e) {
            setError(`Failed to clear data: ${e.message}`);
        } finally {
            setImportMode('idle');
        }
    };

    const resetForm = () => {
        setSelectedFiles([]);
        setMatchedFiles([]);
        setUnmatchedFiles([]);
        setImportMode('idle');
        setProgress({ current: 0, total: 0, phase: '', subPhase: '' });
        setAggregatorStats(null);
        setImportResult(null);
        setUploadStats(null);
        onetAggregator.reset();
    };

    if (isCheckingAccess) {
        return (
            <div className="min-h-screen p-8 flex items-center justify-center">
                <div className="flex items-center gap-3 text-slate-600">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Verifying access...</span>
                </div>
            </div>
        );
    }

    const profileCount = dbStats?.ONetOccupationProfile || 0;
    const isComplete = profileCount >= 900; // ~1000 expected occupations

    return (
        <div className="min-h-screen p-4 md:p-8">
            <div className="max-w-5xl mx-auto space-y-6">
                {/* Header */}
                <div className="text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 rounded-full text-sm font-medium mb-4">
                        <Zap className="w-4 h-4" /> Optimized Import (Option C)
                    </div>
                    <h1 className="text-3xl font-bold text-slate-800 mb-2">O*NET Data Import</h1>
                    <p className="text-slate-600">
                        Aggregates 1.1M rows → ~1,000 occupation profiles with server-side bulkCreate
                    </p>
                </div>

                {/* Error */}
                {error && (
                    <Alert variant="destructive">
                        <AlertCircle className="w-4 h-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {/* Status Cards */}
                <div className="grid md:grid-cols-3 gap-4">
                    {/* Database Status */}
                    <Card className={isComplete ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'}>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${isComplete ? 'bg-green-100' : 'bg-yellow-100'}`}>
                                    <Database className={`w-5 h-5 ${isComplete ? 'text-green-600' : 'text-yellow-600'}`} />
                                </div>
                                <div>
                                    <div className="font-medium">Database Status</div>
                                    <div className="text-2xl font-bold">
                                        {profileCount.toLocaleString()}
                                    </div>
                                    <div className="text-xs text-slate-500">
                                        occupation profiles
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Architecture */}
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-purple-100">
                                    <Layers className="w-5 h-5 text-purple-600" />
                                </div>
                                <div>
                                    <div className="font-medium">Architecture</div>
                                    <div className="text-sm text-slate-600">
                                        Aggregated Profiles
                                    </div>
                                    <div className="text-xs text-slate-500">
                                        1 record per occupation
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Actions */}
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="font-medium">Actions</div>
                                    <div className="text-xs text-slate-500">Manage data</div>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={loadDbStats}
                                        disabled={importMode !== 'idle'}
                                    >
                                        <RefreshCw className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={clearData}
                                        disabled={importMode !== 'idle'}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* How It Works */}
                <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="p-4">
                        <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                            <Info className="w-4 h-4" />
                            How This Works (Speed Optimized)
                        </h3>
                        <div className="grid md:grid-cols-3 gap-4 text-sm">
                            <div className="p-3 bg-white rounded-lg border border-blue-200">
                                <div className="font-medium text-blue-800 mb-1">1. Parse Locally</div>
                                <div className="text-slate-600">
                                    All 40 CSV files are parsed in your browser
                                </div>
                            </div>
                            <div className="p-3 bg-white rounded-lg border border-blue-200">
                                <div className="font-medium text-blue-800 mb-1">2. Aggregate</div>
                                <div className="text-slate-600">
                                    1.1M rows → ~1,000 occupation profiles with embedded skills, tasks, etc.
                                </div>
                            </div>
                            <div className="p-3 bg-white rounded-lg border border-blue-200">
                                <div className="font-medium text-blue-800 mb-1">3. Bulk Upload</div>
                                <div className="text-slate-600">
                                    Server-side bulkCreate for fast import (minutes vs hours)
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Import Progress */}
                {importMode !== 'idle' && importMode !== 'complete' && (
                    <Card className="bg-blue-50 border-blue-200">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                                    <div className="flex-1">
                                        <div className="font-semibold text-blue-900">{progress.phase}</div>
                                        <div className="text-sm text-blue-700">
                                            {progress.current} / {progress.total} profiles
                                        </div>
                                        {progress.subPhase && (
                                            <div className="text-xs text-blue-600 mt-1 font-medium">
                                                {progress.subPhase}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="text-2xl font-bold text-blue-600">
                                    {progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0}%
                                </div>
                            </div>
                            <Progress
                                value={progress.total > 0 ? (progress.current / progress.total) * 100 : 0}
                                className="h-3"
                            />

                            {aggregatorStats && (
                                <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                                    <div className="p-2 bg-white rounded">
                                        <div className="text-lg font-bold text-slate-800">
                                            {aggregatorStats.filesProcessed}
                                        </div>
                                        <div className="text-xs text-slate-500">Files Parsed</div>
                                    </div>
                                    <div className="p-2 bg-white rounded">
                                        <div className="text-lg font-bold text-slate-800">
                                            {aggregatorStats.rowsProcessed.toLocaleString()}
                                        </div>
                                        <div className="text-xs text-slate-500">Rows Processed</div>
                                    </div>
                                    <div className="p-2 bg-white rounded">
                                        <div className="text-lg font-bold text-slate-800">
                                            {aggregatorStats.occupationsFound.toLocaleString()}
                                        </div>
                                        <div className="text-xs text-slate-500">Occupations Found</div>
                                    </div>
                                </div>
                            )}

                            {/* Storage Progress Details */}
                            {importMode === 'uploading' && uploadStats && uploadStats.batchStats.length > 0 && (
                                <div className="mt-4 space-y-2">
                                    <div className="text-xs font-semibold text-slate-700 mb-2">Storage Progress:</div>
                                    <div className="max-h-24 overflow-y-auto space-y-1">
                                        {uploadStats.batchStats.slice(-5).map((batch, idx) => (
                                            <div key={idx} className="text-xs p-2 bg-white rounded border border-blue-200">
                                                <span className="font-medium">Batch {batch.batchNum}:</span>
                                                <span className="text-green-600 ml-1">✓ {batch.imported} stored</span>
                                                {batch.duplicates > 0 && (
                                                    <span className="text-amber-600 ml-1">⊘ {batch.duplicates} skipped</span>
                                                )}
                                                <span className="text-slate-500 ml-1">({batch.duration}ms)</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Import Result */}
                {importResult && (
                    <Card className={importResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}>
                        <CardContent className="p-6">
                            <div className="flex items-start gap-3">
                                <div className={`p-2 rounded-lg ${importResult.success ? 'bg-green-100' : 'bg-red-100'}`}>
                                    {importResult.success ? (
                                        <CheckCircle2 className="w-6 h-6 text-green-600" />
                                    ) : (
                                        <AlertCircle className="w-6 h-6 text-red-600" />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <div className={`font-semibold text-lg ${importResult.success ? 'text-green-900' : 'text-red-900'}`}>
                                        {importResult.success ? '✓ Import Complete - Data Stored in Base44' : 'Import Failed'}
                                    </div>

                                    {importResult.success && (
                                        <>
                                            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                                                <div className="p-3 bg-white rounded-lg">
                                                    <div className="text-2xl font-bold text-slate-800">
                                                        {importResult.filesProcessed}
                                                    </div>
                                                    <div className="text-xs text-slate-500">Files Processed</div>
                                                </div>
                                                <div className="p-3 bg-white rounded-lg">
                                                    <div className="text-2xl font-bold text-slate-800">
                                                        {importResult.rowsAggregated.toLocaleString()}
                                                    </div>
                                                    <div className="text-xs text-slate-500">Rows Aggregated</div>
                                                </div>
                                                <div className="p-3 bg-white rounded-lg border-2 border-green-400">
                                                    <div className="text-2xl font-bold text-green-600">
                                                        {importResult.profilesUploaded}
                                                    </div>
                                                    <div className="text-xs text-slate-500">Profiles in Base44</div>
                                                </div>
                                                <div className="p-3 bg-white rounded-lg">
                                                    <div className="text-2xl font-bold text-amber-600">
                                                        {importResult.duplicatesSkipped}
                                                    </div>
                                                    <div className="text-xs text-slate-500">Duplicates Skipped</div>
                                                </div>
                                            </div>

                                            {/* Batch Details */}
                                            {uploadStats && uploadStats.batchStats.length > 0 && (
                                                <div className="mt-4 p-4 bg-white rounded-lg border border-green-200">
                                                    <div className="text-sm font-semibold text-slate-800 mb-3">
                                                        Base44 Storage Details ({uploadStats.totalBatches} batches):
                                                    </div>
                                                    <div className="max-h-32 overflow-y-auto space-y-1">
                                                        {uploadStats.batchStats.map((batch, idx) => (
                                                            <div key={idx} className="text-xs p-2 bg-slate-50 rounded flex justify-between items-center">
                                                                <span className="font-medium">Batch {batch.batchNum}:</span>
                                                                <span className="text-green-600">✓ {batch.imported} stored</span>
                                                                {batch.duplicates > 0 && (
                                                                    <span className="text-amber-600">⊘ {batch.duplicates} skipped</span>
                                                                )}
                                                                <span className="text-slate-500">({batch.duration}ms)</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <div className="mt-2 text-xs text-slate-600">
                                                        Total storage time: {uploadStats.totalDuration}ms
                                                    </div>
                                                </div>
                                            )}

                                            {/* Database Verification */}
                                            {dbStats && (
                                                <div className="mt-4 p-3 bg-green-100 rounded-lg border border-green-300">
                                                    <div className="text-xs font-semibold text-green-800">
                                                        ✓ Verified in Database: {dbStats.ONetOccupationProfile?.toLocaleString() || 0} occupation profiles
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}

                                    {importResult.errors?.length > 0 && (
                                        <div className="mt-3 p-3 bg-white rounded border text-sm">
                                            <div className="font-medium text-red-700 mb-1">
                                                {importResult.errors.length} Errors:
                                            </div>
                                            <ul className="list-disc list-inside text-red-600 text-xs">
                                                {importResult.errors.slice(0, 5).map((err, i) => (
                                                    <li key={i}>{err}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    <Button
                                        onClick={resetForm}
                                        variant="outline"
                                        className="mt-4"
                                    >
                                        Start New Import
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* File Selection */}
                {importMode === 'idle' && !importResult && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Upload className="w-5 h-5" />
                                Select O*NET CSV Folder
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="border-2 border-dashed border-slate-200 rounded-lg p-8 text-center">
                                <input
                                    ref={folderInputRef}
                                    type="file"
                                    multiple
                                    webkitdirectory="true"
                                    onChange={handleFolderSelect}
                                    className="hidden"
                                />
                                <Button
                                    onClick={() => folderInputRef.current?.click()}
                                    size="lg"
                                    className="mb-4"
                                >
                                    <Upload className="w-5 h-5 mr-2" />
                                    Select Folder
                                </Button>
                                <p className="text-sm text-slate-500">
                                    Select your O*NET database folder containing all CSV files
                                </p>
                            </div>

                            {matchedFiles.length > 0 && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <Badge variant="outline" className="bg-green-50 text-green-700">
                                                {matchedFiles.length} files matched
                                            </Badge>
                                            {unmatchedFiles.length > 0 && (
                                                <Badge variant="outline" className="ml-2 bg-yellow-50 text-yellow-700">
                                                    {unmatchedFiles.length} unrecognized
                                                </Badge>
                                            )}
                                        </div>
                                    </div>

                                    {/* File Preview */}
                                    <div className="max-h-48 overflow-y-auto border rounded-lg">
                                        <div className="grid grid-cols-2 gap-1 p-2">
                                            {matchedFiles.map((item, idx) => (
                                                <div key={idx} className="flex items-center gap-2 p-2 bg-slate-50 rounded text-sm">
                                                    <FileText className="w-4 h-4 text-green-500" />
                                                    <span className="truncate">{item.fileName}</span>
                                                    <Badge className="text-xs ml-auto">P{item.schema.phase}</Badge>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <Button
                                        onClick={startImport}
                                        size="lg"
                                        className="w-full bg-green-600 hover:bg-green-700"
                                    >
                                        <Zap className="w-5 h-5 mr-2" />
                                        Start Optimized Import ({matchedFiles.length} files)
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* What Gets Created */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm">What Gets Created: ONetOccupationProfile</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xs text-slate-600 space-y-2">
                            <p>Each occupation profile contains:</p>
                            <div className="grid md:grid-cols-3 gap-2">
                                <div className="p-2 bg-slate-50 rounded">
                                    <div className="font-medium">Basic Info</div>
                                    <div className="text-slate-500">title, description, job_zone</div>
                                </div>
                                <div className="p-2 bg-slate-50 rounded">
                                    <div className="font-medium">Skills & Abilities</div>
                                    <div className="text-slate-500">Top 35 each with importance/level</div>
                                </div>
                                <div className="p-2 bg-slate-50 rounded">
                                    <div className="font-medium">Tasks</div>
                                    <div className="text-slate-500">Top 30 tasks with ratings</div>
                                </div>
                                <div className="p-2 bg-slate-50 rounded">
                                    <div className="font-medium">Knowledge</div>
                                    <div className="text-slate-500">Top 35 knowledge areas</div>
                                </div>
                                <div className="p-2 bg-slate-50 rounded">
                                    <div className="font-medium">Technology</div>
                                    <div className="text-slate-500">Hot tech, in-demand skills</div>
                                </div>
                                <div className="p-2 bg-slate-50 rounded">
                                    <div className="font-medium">Related</div>
                                    <div className="text-slate-500">Similar occupations, alt titles</div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Attribution */}
                <ONetAttribution />
            </div>
        </div>
    );
}
