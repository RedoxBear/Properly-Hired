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
    Layers,
    Paperclip,
    Clock
} from "lucide-react";
import { isAdmin } from "@/components/utils/accessControl";
import { useNavigate } from "react-router-dom";
import ONetAttribution from "@/components/onet/ONetAttribution";
import { onetAggregator } from "@/lib/onetAggregator";
import { getSchemaByFileName, ONET_SCHEMAS, getImportOrder } from "@/lib/onetSchemas";

// localStorage keys for persistence
const CURRENT_JOB_ID_KEY = 'onet_current_job_id';
const JOB_POLL_INTERVAL_MS = 3000; // 3 seconds default

/**
 * Persistent O*NET Import Page
 *
 * Enhanced from ONetImportOptimized with:
 * - File uploads stored on server
 * - Job tracking entity (ONetImportJob)
 * - Background processing (Phase 2+)
 * - Real-time status polling
 * - Job history persistence
 */
export default function ONetImportPersistent() {
    const navigate = useNavigate();
    const [isCheckingAccess, setIsCheckingAccess] = React.useState(true);
    const [error, setError] = React.useState("");

    // Import state
    const [importMode, setImportMode] = React.useState('idle'); // idle, uploading_files, processing, validating, complete
    const [progress, setProgress] = React.useState({ current: 0, total: 0, phase: '', subPhase: '', percentage: 0 });
    const [aggregatorStats, setAggregatorStats] = React.useState(null);
    const [dbStats, setDbStats] = React.useState(null);
    const [uploadStats, setUploadStats] = React.useState(null);

    // File selection
    const [selectedFiles, setSelectedFiles] = React.useState([]);
    const [matchedFiles, setMatchedFiles] = React.useState([]);
    const [unmatchedFiles, setUnmatchedFiles] = React.useState([]);
    const folderInputRef = React.useRef(null);

    // Job tracking
    const [currentJob, setCurrentJob] = React.useState(null);
    const [jobHistory, setJobHistory] = React.useState([]);
    const pollIntervalRef = React.useRef(null);

    // Results
    const [importResult, setImportResult] = React.useState(null);

    React.useEffect(() => {
        checkAccess();
        loadDbStats();
        loadCurrentJob();
        loadJobHistory();
    }, []);

    // Poll job status when job exists and is not in terminal state
    React.useEffect(() => {
        if (!currentJob || ['completed', 'failed', 'cancelled'].includes(currentJob.status)) {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            return;
        }

        const pollJob = async () => {
            try {
                const jobEntity = base44.entities.ONetImportJob;
                if (!jobEntity) return;

                const job = await jobEntity.findOne({ job_id: currentJob.job_id });
                if (job) {
                    setCurrentJob(job);

                    // Update progress from job
                    if (job.progress) {
                        setProgress(job.progress);
                    }
                    if (job.aggregator_stats) {
                        setAggregatorStats(job.aggregator_stats);
                    }
                    if (job.upload_stats) {
                        setUploadStats(job.upload_stats);
                    }

                    // Update UI status
                    if (job.status === 'uploading_files') {
                        setImportMode('uploading_files');
                    } else if (job.status === 'processing') {
                        setImportMode('processing');
                    } else if (job.status === 'validating') {
                        setImportMode('validating');
                    } else if (job.status === 'completed') {
                        setImportMode('complete');
                        setImportResult({
                            success: true,
                            filesProcessed: job.file_metadata?.matched_files?.length || 0,
                            rowsAggregated: job.aggregator_stats?.rowsProcessed || 0,
                            profilesGenerated: job.aggregator_stats?.occupationsFound || 0,
                            profilesUploaded: job.upload_stats?.profilesUploaded || 0,
                            duplicatesSkipped: job.upload_stats?.duplicatesSkipped || 0,
                            errors: job.error_log?.errors || []
                        });
                        loadDbStats();
                    } else if (job.status === 'failed') {
                        setImportMode('idle');
                        setError(job.error_log?.errors?.[0] || 'Job failed');
                    }
                }
            } catch (e) {
                console.error("Error polling job:", e);
            }
        };

        // Poll immediately, then set interval
        pollJob();
        pollIntervalRef.current = setInterval(pollJob, JOB_POLL_INTERVAL_MS);

        return () => {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        };
    }, [currentJob?.job_id]);

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
            const result = await base44.functions.invoke('importONetBulk', {
                action: 'get_counts'
            });

            if (result.success) {
                setDbStats(result.counts);
            }
        } catch (e) {
            console.error("Failed to load DB stats:", e);
            try {
                const profiles = await base44.entities.ONetOccupationProfile?.list('-created_date', 2000);
                setDbStats({ ONetOccupationProfile: profiles?.length || 0 });
            } catch (e2) {
                setDbStats({ ONetOccupationProfile: 0 });
            }
        }
    };

    const loadCurrentJob = async () => {
        try {
            const jobId = localStorage.getItem(CURRENT_JOB_ID_KEY);
            if (!jobId) return;

            const jobEntity = base44.entities.ONetImportJob;
            if (!jobEntity) return;

            const job = await jobEntity.findOne({ job_id: jobId });
            if (job && !['completed', 'failed', 'cancelled'].includes(job.status)) {
                setCurrentJob(job);
                // Trigger polling
            }
        } catch (e) {
            console.error("Error loading current job:", e);
        }
    };

    const loadJobHistory = async () => {
        try {
            const jobEntity = base44.entities.ONetImportJob;
            if (!jobEntity) return;

            const jobs = await jobEntity.list('-started_at', 10);
            setJobHistory(jobs || []);
        } catch (e) {
            console.error("Error loading job history:", e);
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

        setImportMode('uploading_files');
        setError("");
        setImportResult(null);
        onetAggregator.reset();

        try {
            // Generate job ID
            const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            // Create job record in database
            const jobEntity = base44.entities.ONetImportJob;
            if (!jobEntity) {
                throw new Error("ONetImportJob entity not found. Please create it in Base44 admin.");
            }

            const user = await base44.auth.me();
            const job = await jobEntity.create({
                job_id: jobId,
                user_id: user.id,
                status: 'uploading_files',
                progress: { current: 0, total: matchedFiles.length, phase: 'Uploading files', percentage: 0 },
                file_metadata: { matched_files: [], total_files: matchedFiles.length },
                aggregator_stats: {},
                upload_stats: {},
                validation_results: {},
                error_log: { errors: [] },
                retry_count: 0,
                started_at: new Date().toISOString()
            });

            setCurrentJob(job);
            localStorage.setItem(CURRENT_JOB_ID_KEY, jobId);

            // Phase 1: Upload CSV files to server storage
            const uploadedFileUrls = [];
            const totalFiles = matchedFiles.length;

            for (let i = 0; i < matchedFiles.length; i++) {
                const { file, fileName } = matchedFiles[i];

                setProgress({
                    current: i + 1,
                    total: totalFiles,
                    phase: 'Uploading files',
                    subPhase: `${i + 1}/${totalFiles}: ${fileName}`,
                    percentage: Math.round(((i + 1) / totalFiles) * 100)
                });

                try {
                    // Upload file using Base44 storage
                    const fileUrl = await uploadFileToStorage(file);
                    uploadedFileUrls.push({
                        fileName,
                        file_url: fileUrl,
                        phase: matchedFiles[i].schema.phase,
                        size: file.size
                    });

                    // Update job progress
                    await jobEntity.update(jobId, {
                        progress: {
                            current: i + 1,
                            total: totalFiles,
                            phase: 'Uploading files',
                            subPhase: `${i + 1}/${totalFiles}: ${fileName}`,
                            percentage: Math.round(((i + 1) / totalFiles) * 100)
                        },
                        file_metadata: {
                            matched_files: uploadedFileUrls,
                            total_files: totalFiles
                        }
                    });
                } catch (fileError) {
                    console.error(`Error uploading ${fileName}:`, fileError);
                    const errors = job.error_log?.errors || [];
                    errors.push(`Upload failed for ${fileName}: ${fileError.message}`);
                    await jobEntity.update(jobId, {
                        status: 'failed',
                        error_log: { errors },
                        completed_at: new Date().toISOString()
                    });
                    throw new Error(`Failed to upload ${fileName}`);
                }
            }

            // Phase 2: Client-side aggregation (for now - will move to server in Phase 2)
            setProgress({
                current: 0,
                total: matchedFiles.length,
                phase: 'Parsing & Aggregating',
                percentage: 0
            });

            for (let i = 0; i < matchedFiles.length; i++) {
                const { file, fileName } = matchedFiles[i];
                setProgress(p => ({
                    ...p,
                    current: i + 1,
                    phase: `Parsing ${fileName}`,
                    percentage: Math.round(((i + 1) / matchedFiles.length) * 100)
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

                // Update aggregator stats
                setAggregatorStats(onetAggregator.getStats());
                await jobEntity.update(jobId, {
                    aggregator_stats: onetAggregator.getStats()
                });
            }

            // Phase 3: Upload aggregated profiles
            setImportMode('processing');
            const profiles = onetAggregator.getProfiles();

            if (profiles.length === 0) {
                throw new Error("No occupation profiles generated. Make sure Occupation_Data.csv is included.");
            }

            setProgress({
                current: 0,
                total: profiles.length,
                phase: `Mapping to Base44 Storage`,
                subPhase: `Preparing ${profiles.length} profiles...`,
                percentage: 0
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

                setProgress({
                    current: i,
                    total: profiles.length,
                    phase: `Mapping to Base44 Storage`,
                    subPhase: `Batch ${batchNum}/${totalBatches}: Processing ${batch.length} profiles...`,
                    percentage: Math.round((i / profiles.length) * 100)
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

                        setProgress({
                            current: Math.min(i + UPLOAD_BATCH_SIZE, profiles.length),
                            total: profiles.length,
                            phase: `Mapping to Base44 Storage`,
                            subPhase: `Batch ${batchNum}/${totalBatches}: ✓ Stored ${imported} profiles (${duplicates} duplicates)`,
                            percentage: Math.round((Math.min(i + UPLOAD_BATCH_SIZE, profiles.length) / profiles.length) * 100)
                        });

                        // Update job
                        await jobEntity.update(jobId, {
                            upload_stats: {
                                totalBatches,
                                batchStats,
                                profilesUploaded: uploadedCount,
                                duplicatesSkipped: skippedCount
                            },
                            progress: {
                                current: Math.min(i + UPLOAD_BATCH_SIZE, profiles.length),
                                total: profiles.length,
                                phase: `Mapping to Base44 Storage`,
                                percentage: Math.round((Math.min(i + UPLOAD_BATCH_SIZE, profiles.length) / profiles.length) * 100)
                            }
                        });
                    } else {
                        errors.push(result.error);
                    }
                } catch (batchError) {
                    errors.push(`Batch ${batchNum}: ${batchError.message}`);
                }
            }

            // Complete
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

            // Update job to completed
            await jobEntity.update(jobId, {
                status: 'completed',
                upload_stats: {
                    totalBatches: Math.ceil(profiles.length / UPLOAD_BATCH_SIZE),
                    batchStats,
                    profilesUploaded: uploadedCount,
                    duplicatesSkipped: skippedCount
                },
                completed_at: new Date().toISOString()
            });

            // Verify data
            setTimeout(() => {
                loadDbStats();
            }, 1000);

        } catch (e) {
            console.error("Import failed:", e);
            setError(e.message || "Import failed");
            setImportMode('idle');

            // Update job to failed
            if (currentJob) {
                try {
                    const jobEntity = base44.entities.ONetImportJob;
                    await jobEntity.update(currentJob.job_id, {
                        status: 'failed',
                        error_log: { errors: [e.message] },
                        completed_at: new Date().toISOString()
                    });
                } catch (e2) {
                    console.error("Error updating job status:", e2);
                }
            }
        }
    };

    const uploadFileToStorage = async (file) => {
        // File upload with detailed diagnostics
        console.log(`[Upload] Starting upload for: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);

        try {
            // Method 1: Check if base44 has direct file upload
            if (base44.files?.upload) {
                console.log(`[Upload] Using base44.files.upload() for ${file.name}`);
                const response = await base44.files.upload(file);
                console.log(`[Upload] ✓ Uploaded via base44.files: ${response.url}`);
                return response.url;
            }

            // Method 2: Try FormData with /api/upload endpoint
            console.log(`[Upload] Trying /api/upload endpoint for ${file.name}`);
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('base44_token') || ''}`
                }
            });

            if (!response.ok) {
                throw new Error(`${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            console.log(`[Upload] ✓ Uploaded via /api/upload: ${data.url}`);
            return data.url;

        } catch (e) {
            // Provide detailed diagnostics
            const errorMsg = `Failed to upload ${file.name}: ${e.message}`;
            console.error(`[Upload] ✗ ${errorMsg}`);
            console.warn(`[Upload] Available upload methods:`, {
                'base44.files.upload': base44.files?.upload ? 'YES' : 'NO',
                'base44.files': base44.files ? 'EXISTS' : 'NOT FOUND',
                '/api/upload': 'Check if endpoint exists'
            });
            throw new Error(errorMsg);
        }
    };

    const clearData = async () => {
        if (!confirm("This will delete ALL O*NET occupation profiles. Are you sure?")) {
            return;
        }

        setImportMode('processing');
        setProgress({ current: 0, total: 1, phase: 'Clearing data...', percentage: 0 });

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
        setProgress({ current: 0, total: 0, phase: '', subPhase: '', percentage: 0 });
        setAggregatorStats(null);
        setImportResult(null);
        setUploadStats(null);
        setCurrentJob(null);
        localStorage.removeItem(CURRENT_JOB_ID_KEY);
        onetAggregator.reset();
    };

    const resumeJob = async (job) => {
        setCurrentJob(job);
        localStorage.setItem(CURRENT_JOB_ID_KEY, job.job_id);
        setImportMode(job.status);
        if (job.progress) setProgress(job.progress);
        if (job.aggregator_stats) setAggregatorStats(job.aggregator_stats);
        if (job.upload_stats) setUploadStats(job.upload_stats);
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
    const isComplete = profileCount >= 900;

    return (
        <div className="min-h-screen p-4 md:p-8">
            <div className="max-w-5xl mx-auto space-y-6">
                {/* Header */}
                <div className="text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 rounded-full text-sm font-medium mb-4">
                        <Paperclip className="w-4 h-4" /> Persistent Import (Phase 1)
                    </div>
                    <h1 className="text-3xl font-bold text-slate-800 mb-2">O*NET Data Import</h1>
                    <p className="text-slate-600">
                        Persistent uploads with background processing and job tracking
                    </p>
                </div>

                {/* Error */}
                {error && (
                    <Alert variant="destructive">
                        <AlertCircle className="w-4 h-4" />
                        <div>
                            <AlertDescription className="font-semibold mb-2">{error}</AlertDescription>
                            <div className="text-xs mt-2 space-y-1 bg-red-900/20 p-2 rounded border border-red-300">
                                <div className="font-mono">Debug Information:</div>
                                <div>• Check browser console for detailed logs (F12)</div>
                                <div>• File upload might need configuration</div>
                                <div>• See QUICK_START.md Step 2 for setup</div>
                            </div>
                        </div>
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

                    {/* Current Job */}
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-purple-100">
                                    <Clock className="w-5 h-5 text-purple-600" />
                                </div>
                                <div>
                                    <div className="font-medium">Current Job</div>
                                    <div className="text-sm text-slate-600">
                                        {currentJob ? currentJob.status : 'None'}
                                    </div>
                                    <div className="text-xs text-slate-500">
                                        {currentJob?.started_at ? new Date(currentJob.started_at).toLocaleTimeString() : '—'}
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
                            How Persistent Import Works
                        </h3>
                        <div className="grid md:grid-cols-4 gap-4 text-sm">
                            <div className="p-3 bg-white rounded-lg border border-blue-200">
                                <div className="font-medium text-blue-800 mb-1">1. Upload Files</div>
                                <div className="text-slate-600">
                                    CSV files saved to server storage
                                </div>
                            </div>
                            <div className="p-3 bg-white rounded-lg border border-blue-200">
                                <div className="font-medium text-blue-800 mb-1">2. Create Job</div>
                                <div className="text-slate-600">
                                    Job record persists in database
                                </div>
                            </div>
                            <div className="p-3 bg-white rounded-lg border border-blue-200">
                                <div className="font-medium text-blue-800 mb-1">3. Aggregate</div>
                                <div className="text-slate-600">
                                    1.1M rows → ~1,000 profiles
                                </div>
                            </div>
                            <div className="p-3 bg-white rounded-lg border border-blue-200">
                                <div className="font-medium text-blue-800 mb-1">4. Upload</div>
                                <div className="text-slate-600">
                                    Server stores profiles in Base44
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
                                            {progress.current} / {progress.total}
                                        </div>
                                        {progress.subPhase && (
                                            <div className="text-xs text-blue-600 mt-1 font-medium">
                                                {progress.subPhase}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="text-2xl font-bold text-blue-600">
                                    {progress.percentage || 0}%
                                </div>
                            </div>
                            <Progress
                                value={progress.percentage || 0}
                                className="h-3"
                            />

                            {/* What's Happening */}
                            <div className="mt-4 p-3 bg-white rounded border border-blue-200 text-xs text-slate-600">
                                <div className="font-medium text-slate-700 mb-2">
                                    {importMode === 'uploading_files' && '📤 Phase 1: Uploading CSV Files to Server'}
                                    {importMode === 'processing' && '⚙️ Phase 2: Processing Files (Background)'}
                                    {importMode === 'validating' && '✓ Phase 3: Validating Data'}
                                </div>
                                {importMode === 'uploading_files' && (
                                    <div className="space-y-1 text-slate-600">
                                        <div>• Each CSV file is being uploaded to server storage</div>
                                        <div>• Files will persist even if you refresh the page</div>
                                        <div>• Check browser console (F12) for detailed upload logs</div>
                                        <div>• If stuck, see QUICK_START.md Step 2</div>
                                    </div>
                                )}
                                {importMode === 'processing' && (
                                    <div className="space-y-1 text-slate-600">
                                        <div>• CSV files are being parsed and aggregated</div>
                                        <div>• 1.1M rows being converted to ~1,000 occupation profiles</div>
                                        <div>• This phase happens in the background (Phase 2)</div>
                                    </div>
                                )}
                                {importMode === 'validating' && (
                                    <div className="space-y-1 text-slate-600">
                                        <div>• Data is being validated (Phase 4)</div>
                                        <div>• Simon and Kyle agents checking data quality</div>
                                        <div>• Automated tests verifying completeness</div>
                                    </div>
                                )}
                            </div>

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
                                            {aggregatorStats.rowsProcessed?.toLocaleString() || 0}
                                        </div>
                                        <div className="text-xs text-slate-500">Rows Processed</div>
                                    </div>
                                    <div className="p-2 bg-white rounded">
                                        <div className="text-lg font-bold text-slate-800">
                                            {aggregatorStats.occupationsFound?.toLocaleString() || 0}
                                        </div>
                                        <div className="text-xs text-slate-500">Occupations Found</div>
                                    </div>
                                </div>
                            )}

                            {/* Job Details */}
                            {currentJob && (
                                <div className="mt-4 p-3 bg-white rounded border border-blue-200 text-xs">
                                    <div className="font-medium text-slate-700 mb-1">Job ID: {currentJob.job_id}</div>
                                    {currentJob.started_at && (
                                        <div className="text-slate-600">
                                            Started: {new Date(currentJob.started_at).toLocaleString()}
                                        </div>
                                    )}
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
                                                        {importResult.rowsAggregated?.toLocaleString() || 0}
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
                                            {uploadStats && uploadStats.batchStats?.length > 0 && (
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

                                            {/* Job Reference */}
                                            {currentJob && (
                                                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200 text-xs">
                                                    <div className="font-medium text-blue-800">Job Completed:</div>
                                                    <div className="text-blue-700">ID: {currentJob.job_id}</div>
                                                    {currentJob.completed_at && (
                                                        <div className="text-blue-600">
                                                            Finished: {new Date(currentJob.completed_at).toLocaleString()}
                                                        </div>
                                                    )}
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
                                        Start Persistent Import ({matchedFiles.length} files)
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Job History */}
                {jobHistory.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-sm">
                                <Clock className="w-4 h-4" />
                                Recent Jobs
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                {jobHistory.map(job => (
                                    <div key={job.job_id} className="p-3 border rounded-lg flex items-center justify-between text-sm">
                                        <div>
                                            <div className="font-medium">
                                                {new Date(job.started_at).toLocaleString()}
                                            </div>
                                            <div className="text-xs text-slate-600">
                                                {job.file_metadata?.total_files || 0} files • Status: <Badge>{job.status}</Badge>
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => resumeJob(job)}
                                            disabled={job.status === 'completed'}
                                        >
                                            Resume
                                        </Button>
                                    </div>
                                ))}
                            </div>
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
