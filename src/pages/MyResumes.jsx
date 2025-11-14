import React, { useState, useEffect, useMemo } from "react";
import { Resume } from "@/entities/Resume";
import { UploadFile, ExtractDataFromUploadedFile } from "@/integrations/Core";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Archive,
    Plus,
    Upload,
    FileText,
    Loader2,
    Star,
    Briefcase,
    Sparkles,
    Trash2,
    Edit
} from "lucide-react";
import { motion } from "framer-motion";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { format } from "date-fns";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { retryWithBackoff } from "@/components/utils/retry";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { analyzeResumeAgainstJD } from "@/components/utils/articulation";
import { resumeJsonToPlainText } from "@/components/utils/resumeText";

export default function MyResumes() {
    const [resumes, setResumes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState("");
    const fileInputRef = React.useRef(null);
    const [sortBy, setSortBy] = useState("date_desc");
    const [selectedIds, setSelectedIds] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        loadResumes();
    }, []);

    const loadResumes = async () => {
        setIsLoading(true);
        try {
            const fetchedResumes = await Resume.list("-created_date");
            setResumes(fetchedResumes);
            clearSelection();
        } catch (error) {
            console.error("Error loading resumes:", error);
            setError("Failed to load your resumes.");
        }
        setIsLoading(false);
    };

    const handleFileUpload = async (file) => {
        if (!file) return;

        setIsUploading(true);
        setError("");

        try {
            const { file_url } = await retryWithBackoff(() => UploadFile({ file }), { retries: 3, baseDelay: 1200 });

            const resumeSchema = {
                type: "object",
                properties: {
                    personal_info: { type: "object", properties: { name: { type: "string" }, email: { type: "string" }, phone: { type: "string" }, location: { type: "string" }, linkedin: { type: "string" }, portfolio: { type: "string" } } },
                    skills: { type: "array", items: { type: "string" } },
                    experience: { type: "array", items: { type: "object", properties: { company: { type: "string" }, position: { type: "string" }, duration: { type: "string" }, achievements: { type: "array", items: { type: "string" } } } } },
                    education: { type: "array", items: { type: "object", properties: { institution: { type: "string" }, degree: { type: "string" }, year: { type: "string" } } } }
                }
            };
            const extractResult = await retryWithBackoff(
                () => ExtractDataFromUploadedFile({ file_url, json_schema: resumeSchema }),
                { retries: 3, baseDelay: 1500 }
            );

            if (extractResult.status !== "success" || !extractResult.output) {
                throw new Error("AI failed to parse resume data. Please try a different PDF or supported image format.");
            }

            const fileNameWithoutExtension = file.name.split('.').slice(0, -1).join('.');
            const versionName = fileNameWithoutExtension || `Resume Draft - ${format(new Date(), 'MMM d, yyyy')}`;

            const parsedObj = extractResult.output || {};
            const plain = resumeJsonToPlainText(parsedObj);
            const analysis = await analyzeResumeAgainstJD(plain, "");

            // Create as MASTER resume (newly uploaded resumes are Master by default)
            const resumeData = {
                version_name: versionName,
                original_file_url: file_url,
                parsed_content: JSON.stringify(parsedObj),
                personal_info: parsedObj.personal_info || {},
                skills: parsedObj.skills || [],
                experience: parsedObj.experience || [],
                education: parsedObj.education || [],
                is_master_resume: true, // Newly uploaded resumes are Master by default
                quality_scores: analysis?.scores || null,
                quality_flags: analysis?.flags || [],
                quality_last_analyzed_at: new Date().toISOString()
            };
            const created = await Resume.create(resumeData);
            
            // Redirect to editor with "new" flag so user can improve it
            navigate(createPageUrl(`ResumeEditor?resumeId=${created.id}&new=1`));

        } catch (err) {
            setError(err.message || "The service is busy. Please try again shortly.");
            console.error("Resume upload error:", err);
        }

        setIsUploading(false);
    };

    const deleteResume = async (resumeId) => {
        const confirmDelete = window.confirm("Delete this resume? This cannot be undone.");
        if (!confirmDelete) return;
        try {
            await Resume.delete(resumeId);
            await loadResumes();
        } catch (err) {
            console.error("Error deleting resume:", err);
            setError("Failed to delete resume.");
        }
    };

    const promoteToMaster = async (resumeId) => {
        try {
            await Resume.update(resumeId, { is_master_resume: true });
            await loadResumes();
        } catch (err) {
            console.error("Error promoting to master:", err);
            setError("Failed to promote resume to master.");
        }
    };

    const setAsOnlyMaster = async (resumeId) => {
        try {
            const others = resumes.filter(r => r.is_master_resume && r.id !== resumeId);
            await Promise.all(others.map(r => Resume.update(r.id, { is_master_resume: false })));
            await Resume.update(resumeId, { is_master_resume: true });
            await loadResumes();
        } catch (err) {
            console.error("Error setting as only master:", err);
            setError("Failed to set resume as only master.");
        }
    };

    const toggleSelected = (id) => {
        setSelectedIds((prev) => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };
    const isSelected = (id) => selectedIds.includes(id);
    const clearSelection = () => setSelectedIds([]);
    const selectAllVisible = () => {
        const all = [...new Set([
            ...sortedMasterResumes.map(r => r.id),
            ...optimizedVersions.map(r => r.id),
        ])];
        setSelectedIds(all);
    };
    const bulkDelete = async () => {
        if (!selectedIds.length) return;
        const ok = window.confirm(`Delete ${selectedIds.length} selected resume(s)? This cannot be undone.`);
        if (!ok) return;
        try {
            await Promise.all(selectedIds.map(id => Resume.delete(id)));
            setSelectedIds([]);
            await loadResumes();
        } catch (err) {
            console.error("Error during bulk delete:", err);
            setError("Failed to delete selected resumes.");
        }
    };

    const masterResumes = resumes.filter(r => r.is_master_resume);
    const optimizedVersions = resumes.filter(r => !r.is_master_resume);

    const sortedMasterResumes = useMemo(() => {
        const arr = [...masterResumes];
        if (sortBy === "date_desc") return arr.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
        if (sortBy === "date_asc") return arr.sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
        if (sortBy === "name_asc") return arr.sort((a, b) => (a.version_name || "").localeCompare(b.version_name || "", undefined, { sensitivity: 'base' }));
        if (sortBy === "name_desc") return arr.sort((a, b) => (b.version_name || "").localeCompare(a.version_name || "", undefined, { sensitivity: 'base' }));
        return arr;
    }, [masterResumes, sortBy]);

    // Get master benchmark for comparison
    const masterBenchmark = useMemo(() => {
        const masters = resumes.filter(r => r.is_master_resume);
        if (!masters.length) return null;
        const scores = masters.map(m => m.quality_scores?.overall).filter(s => typeof s === 'number');
        return scores.length ? Math.max(...scores) : null;
    }, [resumes]);

    return (
        <div className="min-h-screen p-4 md:p-8 bg-gray-50">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-medium mb-4">
                        <Archive className="w-4 h-4" />
                        Resume Management
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-2">My Resumes</h1>
                    <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                        Manage your master resumes and view all the AI-optimized versions.
                    </p>
                </motion.div>

                {error && <Alert variant="destructive" className="mb-6"><AlertDescription>{error}</AlertDescription></Alert>}

                {/* Bulk selection bar */}
                {selectedIds.length > 0 && (
                    <div className="sticky top-2 z-20 mb-4">
                        <div className="flex items-center gap-3 p-3 rounded-xl border bg-white/90 shadow-sm">
                            <div className="text-sm text-slate-700">
                                {selectedIds.length} selected
                            </div>
                            <Button variant="destructive" onClick={bulkDelete}>
                                Delete Selected
                            </Button>
                            <Button variant="outline" onClick={selectAllVisible}>Select All Visible</Button>
                            <Button variant="ghost" onClick={clearSelection}>Clear</Button>
                        </div>
                    </div>
                )}

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Left Column - Upload and Master Resumes */}
                    <div className="lg:col-span-1 space-y-6">
                        <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-slate-800">
                                    <Sparkles className="w-5 h-5 text-indigo-600" />
                                    Start from Scratch (Voice or Type)
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Link to={createPageUrl("ResumeBuilder")}>
                                    <Button className="w-full bg-indigo-600 hover:bg-indigo-700">
                                        Build with AI
                                    </Button>
                                </Link>
                                <p className="text-xs text-slate-500 mt-2 text-center">
                                    Answer simple questions by voice or typing. We'll generate a master resume.
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-slate-800">
                                    <Upload className="w-5 h-5 text-blue-600" />
                                    Upload New Resume (PDF, PNG, JPG)
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={(e) => handleFileUpload(e.target.files[0])}
                                    accept=".pdf,.png,.jpg,.jpeg"
                                    className="hidden"
                                />
                                <Button onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="w-full bg-blue-600 hover:bg-blue-700">
                                    {isUploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                                    {isUploading ? 'Processing...' : 'Upload Resume'}
                                </Button>
                                <p className="text-xs text-slate-500 mt-2 text-center">Supported types: PDF, PNG, JPG, JPEG</p>
                                <p className="text-xs text-blue-600 mt-2 text-center">Will be set as Master Resume - you can improve it in the editor</p>
                            </CardContent>
                        </Card>

                        <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
                            <CardHeader className="flex flex-col gap-3">
                                <CardTitle className="flex items-center gap-2 text-slate-800">
                                    <Star className="w-5 h-5 text-yellow-500" />
                                    Master Resumes
                                </CardTitle>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-slate-600">Sort by</span>
                                    <Select value={sortBy} onValueChange={setSortBy}>
                                        <SelectTrigger className="w-44">
                                            <SelectValue placeholder="Sort" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="date_desc">Date (Newest)</SelectItem>
                                            <SelectItem value="date_asc">Date (Oldest)</SelectItem>
                                            <SelectItem value="name_asc">Name (A-Z)</SelectItem>
                                            <SelectItem value="name_desc">Name (Z-A)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {isLoading ? (
                                    <p className="text-slate-500">Loading...</p>
                                ) : sortedMasterResumes.length > 0 ? (
                                    <>
                                        {sortedMasterResumes.map((resume) => {
                                            const score = resume.quality_scores?.overall;
                                            const criticalCount = (resume.quality_flags || []).filter(f => f.severity === "critical").length;
                                            return (
                                                <div key={resume.id} className="p-3 border rounded-lg bg-yellow-50 border-yellow-200">
                                                    <div className="flex items-start justify-between gap-3 mb-2">
                                                        <div className="pt-1">
                                                            <Checkbox
                                                                checked={isSelected(resume.id)}
                                                                onCheckedChange={() => toggleSelected(resume.id)}
                                                                aria-label="Select resume"
                                                            />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-semibold text-yellow-800 truncate">{resume.version_name}</p>
                                                            <p className="text-xs text-yellow-700">
                                                                Updated {format(new Date(resume.created_date), 'MMM d, yyyy')}
                                                            </p>
                                                            {typeof score === "number" && (
                                                                <div className="mt-1 text-xs flex items-center gap-2">
                                                                    <span className="text-slate-600">Quality:</span>
                                                                    <span className={score >= 75 ? "text-green-600 font-semibold" : score >= 60 ? "text-amber-600 font-semibold" : "text-rose-600 font-semibold"}>
                                                                        {score}/100
                                                                    </span>
                                                                    {criticalCount > 0 && (
                                                                        <span className="text-rose-600">• {criticalCount} critical</span>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-wrap gap-2">
                                                        <Button 
                                                            size="sm" 
                                                            className="bg-blue-600 hover:bg-blue-700 gap-1"
                                                            onClick={() => {
                                                                console.log("=== CLICK DEBUG ===");
                                                                console.log("Resume object:", resume);
                                                                console.log("Resume ID:", resume.id);
                                                                const url = createPageUrl(`ResumeEditorTest?resumeId=${resume.id}`);
                                                                console.log("Navigating to:", url);
                                                                navigate(url);
                                                            }}
                                                            disabled={!resume.id}
                                                        >
                                                            <Edit className="w-3 h-3" />
                                                            Test Editor
                                                        </Button>
                                                        <Link to={createPageUrl(`ResumeQuality?resumeId=${resume.id}`)}>
                                                            <Button size="sm" variant="outline" title="View quality analysis">
                                                                Analysis
                                                            </Button>
                                                        </Link>
                                                        <Button size="sm" variant="ghost" title="Set as only master" onClick={() => setAsOnlyMaster(resume.id)}>
                                                            <Star className="w-4 h-4 text-yellow-600" />
                                                        </Button>
                                                        <Button variant="destructive" size="sm" onClick={() => deleteResume(resume.id)} title="Delete">
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </>
                                ) : (
                                    <p className="text-sm text-slate-500">No master resumes yet. Upload one to get started!</p>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column - Optimized Versions */}
                    <div className="lg:col-span-2">
                        <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-slate-800">
                                    <Briefcase className="w-5 h-5 text-green-600" />
                                    Optimized Resume Versions
                                </CardTitle>
                                {masterBenchmark !== null && (
                                    <p className="text-sm text-slate-600 mt-2">
                                        Master Benchmark: <span className="font-semibold text-blue-600">{masterBenchmark}</span>
                                    </p>
                                )}
                            </CardHeader>
                            <CardContent>
                                {isLoading ? (
                                    <p className="text-slate-500">Loading...</p>
                                ) : optimizedVersions.length > 0 ? (
                                    <div className="space-y-3">
                                        {optimizedVersions.map((resume) => {
                                            const score = resume.quality_scores?.overall;
                                            const criticalCount = (resume.quality_flags || []).filter(f => f.severity === "critical").length;
                                            const benchmark = resume.master_benchmark_overall;
                                            const delta = resume.optimizer_delta;
                                            const beatsBenchmark = typeof score === 'number' && masterBenchmark !== null && score > masterBenchmark;
                                            
                                            return (
                                                <div key={resume.id} className="p-4 border rounded-xl hover:bg-slate-50 transition-colors flex items-start gap-3">
                                                    <div className="pt-1">
                                                        <Checkbox
                                                            checked={isSelected(resume.id)}
                                                            onCheckedChange={() => toggleSelected(resume.id)}
                                                            aria-label="Select resume"
                                                        />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex justify-between items-start gap-3">
                                                            <div className="min-w-0">
                                                                <h3 className="font-semibold text-slate-800 truncate">{resume.version_name}</h3>
                                                                <p className="text-sm text-slate-500">
                                                                    Generated {format(new Date(resume.created_date), 'MMM d, yyyy')}
                                                                </p>
                                                                {typeof score === "number" && (
                                                                    <div className="mt-1 text-xs text-slate-600">
                                                                        Quality: <span className={score >= 75 ? "text-green-600 font-semibold" : score >= 60 ? "text-amber-600 font-semibold" : "text-rose-600 font-semibold"}>{score}</span>
                                                                        {criticalCount > 0 && <span className="ml-2 text-rose-600">• {criticalCount} critical</span>}
                                                                    </div>
                                                                )}
                                                                {typeof benchmark === "number" && typeof delta === "number" && (
                                                                    <div className="mt-1 text-xs text-slate-600">
                                                                        Benchmark: {benchmark} • Delta:{" "}
                                                                        <span className={delta >= 0 ? "text-green-600 font-semibold" : "text-rose-600 font-semibold"}>
                                                                            {delta >= 0 ? '+' : ''}{delta}
                                                                        </span>
                                                                    </div>
                                                                )}
                                                                {beatsBenchmark && (
                                                                    <div className="text-xs text-green-700 mt-1 flex items-center gap-1">
                                                                        <Star className="w-3 h-3" />
                                                                        Beats current Master benchmark
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="flex flex-wrap gap-2 shrink-0">
                                                                <Link to={createPageUrl(`ResumeViewer?resumeId=${resume.id}`)}>
                                                                    <Button size="sm" variant="outline">View & Download</Button>
                                                                </Link>
                                                                <Link to={createPageUrl(`ResumeTemplates?resumeId=${resume.id}`)}>
                                                                    <Button size="sm">Apply Template</Button>
                                                                </Link>
                                                                {beatsBenchmark && (
                                                                    <Button size="sm" variant="outline" className="bg-green-50 hover:bg-green-100 text-green-700" onClick={() => promoteToMaster(resume.id)} title="Promote to Master">
                                                                        Promote to Master
                                                                    </Button>
                                                                )}
                                                                <Button size="sm" variant="destructive" onClick={() => deleteResume(resume.id)} title="Delete">
                                                                    <Trash2 className="w-4 h-4" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <p className="text-sm text-slate-500 text-center py-8">
                                        Your optimized resume versions will appear here after you run the optimizer.
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}