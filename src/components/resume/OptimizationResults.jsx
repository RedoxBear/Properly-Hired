import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
    CheckCircle2, 
    Target, 
    Lightbulb, 
    Star,
    Download,
    RefreshCw,
    TrendingUp,
    FileText,
    Palette
} from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { cleanResumeText } from "@/components/utils/cleanResumeText";

export default function OptimizationResults({ results, onReset }) {
    const getScoreColor = (score) => {
        if (score >= 80) return "text-green-600";
        if (score >= 60) return "text-yellow-600";
        return "text-red-600";
    };

    const getScoreGradient = (score) => {
        if (score >= 80) return "from-green-500 to-emerald-500";
        if (score >= 60) return "from-yellow-500 to-orange-500";
        return "from-red-500 to-pink-500";
    };

    // Helper: strip markdown formatting from any string
    const clean = (s) => cleanResumeText(s);

    // NEW: Build formatted text from results for download
    const buildResumeText = () => {
        let text = "";

        // Helper to add sections that are simple lists of strings
        const addSectionToText = (title, contentLines) => {
            if (!contentLines || contentLines.length === 0) return;
            text += `\n${title}\n${'-'.repeat(title.length)}\n`;
            contentLines.forEach((line) => {
                if (typeof line === "string") {
                    text += `- ${clean(line)}\n`;
                }
            });
            text += '\n'; // Add a newline after each section for separation
        };

        if (results.optimized_resume_content && typeof results.optimized_resume_content === "object") {
            const optimized = results.optimized_resume_content;

            // Personal Info
            if (optimized.personal_info) {
                const pi = optimized.personal_info;
                if (pi.name) text += `${clean(pi.name)}\n`;
                const contactInfo = [];
                if (pi.email) contactInfo.push(pi.email);
                if (pi.phone) contactInfo.push(pi.phone);
                if (pi.location) contactInfo.push(clean(pi.location));
                if (pi.linkedin) contactInfo.push(pi.linkedin);
                if (pi.portfolio) contactInfo.push(pi.portfolio);
                if (contactInfo.length > 0) {
                    text += `${contactInfo.join(' | ')}\n\n`;
                }
            }

            // Executive Summary (preferred) or Summary
            if (optimized.executive_summary) {
                addSectionToText("Executive Summary", [clean(optimized.executive_summary)]);
            } else if (optimized.summary) {
                addSectionToText("Summary", [clean(optimized.summary)]);
            }
            // Note: If optimized.professional_summary is still needed here, it would be an 'else if' after optimized.summary.
            // Based on the outline, executive_summary and summary are the prioritized fields within optimized_resume_content.

            // Career Achievements (pillar format)
            if (optimized.career_achievements && optimized.career_achievements.length > 0) {
                text += `\nCareer Achievements\n${'-'.repeat("Career Achievements".length)}\n`;
                optimized.career_achievements.forEach(pillar => {
                    text += `\n${clean(pillar.pillar_name || '').toUpperCase()}\n`;
                    (pillar.items || []).forEach((item, i) => {
                        text += `  ${i + 1}. ${clean(item)}\n`;
                    });
                });
                text += '\n';
            }

            // Skills
            if (optimized.skills && optimized.skills.length > 0) {
                addSectionToText("Skills", optimized.skills);
            }

            // Experience
            if (optimized.experience && optimized.experience.length > 0) {
                text += `\nExperience\n${'-'.repeat("Experience".length)}\n`;
                optimized.experience.forEach(exp => {
                    text += `${clean(exp.position || '')} at ${clean(exp.company || '')}`;
                    if (exp.location) text += `, ${clean(exp.location)}`;
                    text += '\n';
                    if (exp.duration) text += `${clean(exp.duration)}\n`;
                    if (exp.achievements && exp.achievements.length > 0) {
                        exp.achievements.forEach(ach => text += `  - ${clean(ach)}\n`);
                    }
                    text += '\n'; // Separate entries with an extra newline
                });
            }

            // Education
            if (optimized.education && optimized.education.length > 0) {
                text += `\nEducation\n${'-'.repeat("Education".length)}\n`;
                optimized.education.forEach(edu => {
                    text += `${edu.degree || ''}, ${edu.institution || ''}`;
                    if (edu.location) text += `, ${edu.location}`;
                    text += '\n';
                    if (edu.year) text += `Graduated: ${edu.year}\n`;
                    if (edu.gpa) text += `GPA: ${edu.gpa}\n`;
                    text += '\n'; // Separate entries with an extra newline
                });
            }

        } else {
            // Fallback for results that only have `optimized_resume_sections` and other lists
            text += `Optimized Resume for ${results.jobTitle || 'Job Role'} at ${results.companyName || 'Company'}\n\n`;

            // NEW: Include top-level executive_summary in fallback if it exists
            if (results.executive_summary) {
                addSectionToText("Executive Summary", [results.executive_summary]);
            } else if (results.optimized_resume_sections?.professional_summary) {
                addSectionToText("Professional Summary", [results.optimized_resume_sections.professional_summary]);
            }
            if (results.key_keywords && results.key_keywords.length > 0) {
                addSectionToText("Key Keywords", results.key_keywords);
            }
            if (results.experience_highlights && results.experience_highlights.length > 0) {
                addSectionToText("Experience Highlights", results.experience_highlights);
            }
            if (results.optimized_resume_sections?.key_skills && results.optimized_resume_sections.key_skills.length > 0) {
                addSectionToText("Optimized Skills", results.optimized_resume_sections.key_skills);
            }
            if (results.optimized_resume_sections?.experience_bullets && results.optimized_resume_sections.experience_bullets.length > 0) {
                addSectionToText("Improved Experience Bullets", results.optimized_resume_sections.experience_bullets);
            }
        }

        return text.trim();
    };

    // NEW: Trigger client-side download
    const downloadFile = (content, filename, mime = "text/plain") => {
        const blob = new Blob([content], { type: mime + ";charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    };

    const handleDownloadTxt = () => {
        const baseName = `${results.jobTitle || 'Resume'} - ${results.companyName || 'Optimized'}`.replace(/[\\/:*?"<>|]/g, "_");
        const content = buildResumeText();
        downloadFile(content, `${baseName}.txt`, "text/plain");
    };

    const handleDownloadJson = () => {
        const baseName = `${results.jobTitle || 'Resume'} - ${results.companyName || 'Optimized'}`.replace(/[\\/:*?"<>|]/g, "_");
        const payload = {
            job_title: results.jobTitle,
            company_name: results.companyName,
            optimization_score: results.optimization_score,
            executive_summary: results.executive_summary || null, // NEW: Add executive_summary to JSON payload
            optimized_resume_content: results.optimized_resume_content || null, // Full structured resume
            key_keywords: results.key_keywords || [],
            experience_highlights: results.experience_highlights || [],
            optimized_resume_sections: results.optimized_resume_sections || null // Sectional summaries
        };
        downloadFile(JSON.stringify(payload, null, 2), `${baseName}.json`, "application/json");
    };

    const cov = results.keyword_coverage || null;

    return (
        <div className="space-y-6">
            {/* Header with Score */}
            <Card className="shadow-xl border-0 bg-gradient-to-r from-white to-slate-50">
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="flex items-center gap-2 text-2xl">
                                <CheckCircle2 className="w-6 h-6 text-green-600" />
                                Optimization Complete
                            </CardTitle>
                            <p className="text-slate-600 mt-1">
                                Resume optimized for {results.jobTitle} at {results.companyName}
                            </p>
                        </div>
                        <Button variant="outline" onClick={onReset} className="gap-2">
                            <RefreshCw className="w-4 h-4" />
                            Optimize New Resume
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-6">
                        <div className="relative">
                            <div className={`w-24 h-24 rounded-full bg-gradient-to-r ${getScoreGradient(results.optimization_score)} flex items-center justify-center`}>
                                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center">
                                    <span className={`text-2xl font-bold ${getScoreColor(results.optimization_score)}`}>
                                        {results.optimization_score}%
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-semibold text-slate-800 mb-2">Match Score</h3>
                            <Progress value={results.optimization_score} className="h-3" />
                            <p className="text-sm text-slate-600 mt-2">
                                {results.optimization_score >= 80 && "Excellent match! Your resume aligns very well with the job requirements."}
                                {results.optimization_score >= 60 && results.optimization_score < 80 && "Good match with room for improvement."}
                                {results.optimization_score < 60 && "Significant optimization needed to improve match score."}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* NEW: Keyword Coverage */}
            {cov && (
                <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Target className="w-5 h-5 text-blue-600" />
                            Keyword Coverage
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-4">
                            <div className="min-w-[84px]">
                                <div className="text-2xl font-bold text-slate-800">{Math.round(cov.coverage_percent || 0)}%</div>
                                <div className="text-xs text-slate-500">coverage</div>
                            </div>
                            <div className="flex-1">
                                <Progress value={cov.coverage_percent || 0} className="h-2" />
                                <div className="text-xs text-slate-500 mt-2">
                                    Covered {cov.covered_keywords?.length || 0} of {(cov.required_keywords?.length || 0)} required terms
                                </div>
                            </div>
                        </div>
                        {Array.isArray(cov.missing_keywords) && cov.missing_keywords.length > 0 && (
                            <div className="mt-4">
                                <div className="text-sm font-medium text-slate-800 mb-1">Consider weaving in:</div>
                                <div className="flex flex-wrap gap-2">
                                    {cov.missing_keywords.map((k, i) => (
                                        <Badge key={i} className="bg-amber-50 text-amber-800 border-amber-200">{k}</Badge>
                                    ))}
                                </div>
                                <p className="text-xs text-slate-500 mt-2">Add only if truthful and relevant; prefer natural phrasing over stuffing.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* NEW: Tailored Executive Summary */}
            {results.executive_summary && (
                <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="w-5 h-5 text-slate-700" />
                            Tailored Executive Summary
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-lg">
                            {clean(results.executive_summary)}
                        </p>
                    </CardContent>
                </Card>
            )}
            
            {/* NEW: Humanization Notes */}
            {results.humanization_notes && (
                <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="w-5 h-5 text-slate-700" />
                            Humanization Notes
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-lg">
                            {clean(results.humanization_notes)}
                        </p>
                    </CardContent>
                </Card>
            )}

            <div className="grid lg:grid-cols-2 gap-6">
                {/* Recommendations */}
                <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Lightbulb className="w-5 h-5 text-yellow-600" />
                            Optimization Recommendations
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-3">
                            {results.recommendations?.map((rec, index) => (
                                <motion.li 
                                    key={index}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200"
                                >
                                    <TrendingUp className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                                    <span className="text-slate-700">{clean(rec)}</span>
                                </motion.li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>

                {/* Key Keywords */}
                <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Target className="w-5 h-5 text-blue-600" />
                            Key Keywords to Emphasize
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2">
                            {results.key_keywords?.map((keyword, index) => (
                                <Badge 
                                    key={index} 
                                    className="bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100"
                                >
                                    {clean(keyword)}
                                </Badge>
                            ))}
                        </div>
                        <p className="text-sm text-slate-600 mt-4">
                            Include these keywords naturally throughout your resume to improve ATS compatibility.
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Experience Highlights */}
            <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Star className="w-5 h-5 text-purple-600" />
                        Experience Highlights to Feature
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid md:grid-cols-2 gap-4">
                        {results.experience_highlights?.map((highlight, index) => (
                            <div key={index} className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                                <div className="flex items-start gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                                    <span className="text-slate-700">{clean(highlight)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Achievement-Based Pillars (Career Achievements) */}
            {results.optimized_resume_content?.career_achievements?.length > 0 && (
                <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Star className="w-5 h-5 text-amber-600" />
                            Career Achievements (Pillar Format)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {results.optimized_resume_content.career_achievements.map((pillar, pIdx) => (
                            <div key={pIdx}>
                                <h3 className="font-semibold text-slate-800 mb-3 uppercase tracking-wide text-sm border-b pb-1">
                                    {clean(pillar.pillar_name)}
                                </h3>
                                <ul className="space-y-2">
                                    {pillar.items?.map((item, iIdx) => (
                                        <li key={iIdx} className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
                                            <CheckCircle2 className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                                            <span className="text-slate-700 text-sm">{clean(item)}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}

            {/* Optimized Sections */}
            {results.optimized_resume_sections && (
                <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                            AI-Optimized Resume Sections
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Professional Summary */}
                        {results.optimized_resume_sections.professional_summary && (
                            <div>
                                <h3 className="font-semibold text-slate-800 mb-2">Professional Summary</h3>
                                <p className="text-slate-700 bg-slate-50 p-4 rounded-lg leading-relaxed">
                                    {clean(results.optimized_resume_sections.professional_summary)}
                                </p>
                            </div>
                        )}

                        {/* Key Skills */}
                        {results.optimized_resume_sections.key_skills && (
                            <div>
                                <h3 className="font-semibold text-slate-800 mb-2">Optimized Skills Section</h3>
                                <div className="flex flex-wrap gap-2">
                                    {results.optimized_resume_sections.key_skills.map((skill, index) => (
                                        <Badge key={index} variant="secondary" className="bg-green-50 text-green-800">
                                            {clean(skill)}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Experience Bullets */}
                        {results.optimized_resume_sections.experience_bullets && (
                            <div>
                                <h3 className="font-semibold text-slate-800 mb-2">Improved Experience Bullets</h3>
                                <ul className="space-y-2">
                                    {results.optimized_resume_sections.experience_bullets.map((bullet, index) => (
                                        <li key={index} className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                            <span className="text-slate-700">{clean(bullet)}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* CV Style Tag */}
            {results.cvStyle && (
                <div className="flex items-center gap-2">
                    <Badge className={results.cvStyle === "achievement" 
                        ? "bg-amber-100 text-amber-800 border-amber-200" 
                        : "bg-blue-100 text-blue-800 border-blue-200"}>
                        {results.cvStyle === "achievement" ? "Achievement-Based (Exp)" : "Chronological (Chron)"}
                    </Badge>
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
                <Button onClick={handleDownloadTxt} className="bg-green-600 hover:bg-green-700 gap-2">
                    <Download className="w-4 h-4" />
                    Download as TXT
                </Button>
                <Button onClick={handleDownloadJson} variant="outline" className="gap-2">
                    <Download className="w-4 h-4" />
                    Download as JSON
                </Button>
                <Link to={createPageUrl("MyResumes")}>
                    <Button variant="outline" className="gap-2 border-green-200 text-green-700 hover:bg-green-50">
                        <FileText className="w-4 h-4" />
                        View in My Resumes
                    </Button>
                </Link>
                <Link to={createPageUrl("ResumeTemplates")}>
                    <Button variant="outline" className="gap-2 border-purple-200 text-purple-700 hover:bg-purple-50">
                        <Palette className="w-4 h-4" />
                        View Templates
                    </Button>
                </Link>
            </div>
        </div>
    );
}