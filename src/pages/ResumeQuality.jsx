import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Resume } from "@/entities/Resume";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import ResumeQualityPanel from "@/components/resume/ResumeQualityPanel";
import { analyzeResumeAgainstJD } from "@/components/utils/articulation";
import { resumeJsonToPlainText } from "@/components/utils/resumeText";
import { motion } from "framer-motion";

export default function ResumeQuality() {
    const location = useLocation();
    const [resume, setResume] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [isReanalyzing, setIsReanalyzing] = useState(false);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const resumeId = params.get("resumeId");
        if (!resumeId) {
            setError("No resume ID provided.");
            setIsLoading(false);
            return;
        }
        loadResume(resumeId);
    }, [location.search]);

    const loadResume = async (id) => {
        setIsLoading(true);
        setError("");
        try {
            const fetched = await Resume.get(id);
            setResume(fetched);
        } catch (err) {
            console.error(err);
            setError("Failed to load resume.");
        }
        setIsLoading(false);
    };

    const reanalyze = async () => {
        if (!resume) return;
        setIsReanalyzing(true);
        setError("");
        try {
            const parsedContent = resume.optimized_content || resume.parsed_content || "{}";
            const parsed = JSON.parse(parsedContent);
            const plain = resumeJsonToPlainText(parsed);
            const analysis = await analyzeResumeAgainstJD(plain, "");
            
            await Resume.update(resume.id, {
                quality_scores: analysis?.scores || null,
                quality_flags: analysis?.flags || [],
                quality_last_analyzed_at: new Date().toISOString()
            });
            
            await loadResume(resume.id);
        } catch (err) {
            console.error(err);
            setError("Failed to re-analyze resume.");
        }
        setIsReanalyzing(false);
    };

    const handleResolve = async (flagId) => {
        if (!resume) return;
        const updated = (resume.quality_flags || []).filter(f => f.id !== flagId);
        await Resume.update(resume.id, { quality_flags: updated });
        await loadResume(resume.id);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen p-8 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (error && !resume) {
        return (
            <div className="min-h-screen p-8">
                <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
                <Link to={createPageUrl("MyResumes")} className="mt-4 inline-block">
                    <Button variant="outline">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Resumes
                    </Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-4 md:p-8 bg-gray-50">
            <div className="max-w-4xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6"
                >
                    <Link to={createPageUrl("MyResumes")}>
                        <Button variant="outline" className="mb-4">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to My Resumes
                        </Button>
                    </Link>
                    <h1 className="text-3xl font-bold text-slate-800 mb-2">
                        Resume Quality Report
                    </h1>
                    <p className="text-lg text-slate-600">
                        {resume?.version_name}
                    </p>
                </motion.div>

                {error && (
                    <Alert variant="destructive" className="mb-6">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                <ResumeQualityPanel
                    scores={resume?.quality_scores}
                    flags={resume?.quality_flags || []}
                    onResolve={handleResolve}
                />

                <div className="mt-6 flex flex-wrap gap-3">
                    <Button onClick={reanalyze} disabled={isReanalyzing}>
                        {isReanalyzing ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Re-analyzing...
                            </>
                        ) : (
                            "Re-analyze Resume"
                        )}
                    </Button>
                    <Link to={createPageUrl(`ResumeEditor?resumeId=${resume?.id}`)}>
                        <Button variant="outline">
                            Edit Resume
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}