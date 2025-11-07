import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Resume } from "@/entities/Resume";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, ArrowLeft, Save, Merge, Plus, Trash2, CheckCircle } from "lucide-react";
import { createPageUrl } from "@/utils";
import ResumeQualityPanel from "@/components/resume/ResumeQualityPanel";
import { analyzeResumeAgainstJD } from "@/components/utils/articulation";
import { resumeJsonToPlainText } from "@/components/utils/resumeText";
import { motion } from "framer-motion";

export default function ResumeReview() {
    const location = useLocation();
    const navigate = useNavigate();
    const [resume, setResume] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    // Editable fields
    const [versionName, setVersionName] = useState("");
    const [education, setEducation] = useState([]);
    const [experience, setExperience] = useState([]);
    const [skills, setSkills] = useState([]);

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
            
            const parsed = fetched.parsed_content ? JSON.parse(fetched.parsed_content) : {};
            setVersionName(fetched.version_name || "");
            setEducation(Array.isArray(parsed.education) ? parsed.education : []);
            setExperience(Array.isArray(parsed.experience) ? parsed.experience : []);
            setSkills(Array.isArray(parsed.skills) ? parsed.skills : []);
        } catch (err) {
            console.error(err);
            setError("Failed to load resume.");
        }
        setIsLoading(false);
    };

    const reanalyze = async () => {
        if (!resume) return;
        try {
            const parsed = {
                personal_info: resume.personal_info,
                education,
                experience,
                skills
            };
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
    };

    const handleResolve = async (flagId) => {
        if (!resume) return;
        const updated = (resume.quality_flags || []).filter(f => f.id !== flagId);
        await Resume.update(resume.id, { quality_flags: updated });
        await loadResume(resume.id);
    };

    const mergeEducation = (idx1, idx2) => {
        if (idx1 === idx2) return;
        const merged = {
            institution: education[idx1].institution || education[idx2].institution,
            degree: [education[idx1].degree, education[idx2].degree].filter(Boolean).join(", "),
            year: education[idx1].year || education[idx2].year
        };
        const newEdu = education.filter((_, i) => i !== idx1 && i !== idx2);
        newEdu.push(merged);
        setEducation(newEdu);
    };

    const addEducation = () => {
        setEducation([...education, { institution: "", degree: "", year: "" }]);
    };

    const removeEducation = (idx) => {
        setEducation(education.filter((_, i) => i !== idx));
    };

    const updateEducation = (idx, field, value) => {
        const updated = [...education];
        updated[idx] = { ...updated[idx], [field]: value };
        setEducation(updated);
    };

    const mergeExperience = (idx1, idx2) => {
        if (idx1 === idx2) return;
        const merged = {
            company: experience[idx1].company || experience[idx2].company,
            position: [experience[idx1].position, experience[idx2].position].filter(Boolean).join(" / "),
            duration: experience[idx1].duration || experience[idx2].duration,
            location: experience[idx1].location || experience[idx2].location,
            achievements: [...(experience[idx1].achievements || []), ...(experience[idx2].achievements || [])]
        };
        const newExp = experience.filter((_, i) => i !== idx1 && i !== idx2);
        newExp.push(merged);
        setExperience(newExp);
    };

    const addExperience = () => {
        setExperience([...experience, { company: "", position: "", duration: "", location: "", achievements: [] }]);
    };

    const removeExperience = (idx) => {
        setExperience(experience.filter((_, i) => i !== idx));
    };

    const updateExperience = (idx, field, value) => {
        const updated = [...experience];
        if (field === "achievements") {
            updated[idx] = { ...updated[idx], achievements: value.split("\n").filter(Boolean) };
        } else {
            updated[idx] = { ...updated[idx], [field]: value };
        }
        setExperience(updated);
    };

    const saveAndFinalize = async () => {
        if (!resume) return;
        setIsSaving(true);
        setError("");
        try {
            const parsed = {
                personal_info: resume.personal_info,
                education,
                experience,
                skills
            };
            
            // Re-analyze with updated content
            const plain = resumeJsonToPlainText(parsed);
            const analysis = await analyzeResumeAgainstJD(plain, "");
            
            await Resume.update(resume.id, {
                version_name: versionName,
                parsed_content: JSON.stringify(parsed),
                education,
                experience,
                skills,
                quality_scores: analysis?.scores || null,
                quality_flags: analysis?.flags || [],
                quality_last_analyzed_at: new Date().toISOString()
            });
            
            navigate(createPageUrl("MyResumes"));
        } catch (err) {
            console.error(err);
            setError("Failed to save resume.");
        }
        setIsSaving(false);
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
                <Button onClick={() => navigate(createPageUrl("MyResumes"))} className="mt-4">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Resumes
                </Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-4 md:p-8 bg-gray-50">
            <div className="max-w-5xl mx-auto space-y-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between"
                >
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800 mb-2">
                            Review & Finalize Your Resume
                        </h1>
                        <p className="text-lg text-slate-600">
                            Check quality, merge duplicates, and refine content before saving
                        </p>
                    </div>
                    <Button onClick={() => navigate(createPageUrl("MyResumes"))} variant="outline">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                    </Button>
                </motion.div>

                {error && (
                    <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {/* Version Name */}
                <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle>Resume Name</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Input
                            value={versionName}
                            onChange={(e) => setVersionName(e.target.value)}
                            placeholder="e.g., Master Resume - Product Manager"
                        />
                    </CardContent>
                </Card>

                {/* Quality Analysis */}
                <ResumeQualityPanel
                    scores={resume?.quality_scores}
                    flags={resume?.quality_flags || []}
                    onResolve={handleResolve}
                />

                {/* Education Section */}
                <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <span>Education</span>
                            <Button size="sm" onClick={addEducation}>
                                <Plus className="w-4 h-4 mr-2" />
                                Add
                            </Button>
                        </CardTitle>
                        <p className="text-sm text-slate-600">
                            Review and merge duplicate entries. Click merge icon between entries to combine them.
                        </p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {education.map((edu, idx) => (
                            <div key={idx} className="p-4 rounded-lg border bg-white space-y-3">
                                <div className="grid md:grid-cols-3 gap-3">
                                    <div className="space-y-2">
                                        <Label>Institution</Label>
                                        <Input
                                            value={edu.institution || ""}
                                            onChange={(e) => updateEducation(idx, "institution", e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Degree</Label>
                                        <Input
                                            value={edu.degree || ""}
                                            onChange={(e) => updateEducation(idx, "degree", e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Year</Label>
                                        <Input
                                            value={edu.year || ""}
                                            onChange={(e) => updateEducation(idx, "year", e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    {idx > 0 && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => mergeEducation(idx - 1, idx)}
                                            title="Merge with previous entry"
                                        >
                                            <Merge className="w-4 h-4 mr-2" />
                                            Merge with Above
                                        </Button>
                                    )}
                                    <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={() => removeEducation(idx)}
                                    >
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Remove
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {/* Experience Section */}
                <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <span>Experience</span>
                            <Button size="sm" onClick={addExperience}>
                                <Plus className="w-4 h-4 mr-2" />
                                Add
                            </Button>
                        </CardTitle>
                        <p className="text-sm text-slate-600">
                            Review and merge duplicate or overlapping roles
                        </p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {experience.map((exp, idx) => (
                            <div key={idx} className="p-4 rounded-lg border bg-white space-y-3">
                                <div className="grid md:grid-cols-2 gap-3">
                                    <div className="space-y-2">
                                        <Label>Company</Label>
                                        <Input
                                            value={exp.company || ""}
                                            onChange={(e) => updateExperience(idx, "company", e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Position</Label>
                                        <Input
                                            value={exp.position || ""}
                                            onChange={(e) => updateExperience(idx, "position", e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Duration</Label>
                                        <Input
                                            value={exp.duration || ""}
                                            onChange={(e) => updateExperience(idx, "duration", e.target.value)}
                                            placeholder="e.g., Jan 2020 - Present"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Location</Label>
                                        <Input
                                            value={exp.location || ""}
                                            onChange={(e) => updateExperience(idx, "location", e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Achievements (one per line)</Label>
                                    <Textarea
                                        value={(exp.achievements || []).join("\n")}
                                        onChange={(e) => updateExperience(idx, "achievements", e.target.value)}
                                        className="min-h-32"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    {idx > 0 && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => mergeExperience(idx - 1, idx)}
                                            title="Merge with previous entry"
                                        >
                                            <Merge className="w-4 h-4 mr-2" />
                                            Merge with Above
                                        </Button>
                                    )}
                                    <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={() => removeExperience(idx)}
                                    >
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Remove
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3 justify-between">
                    <Button onClick={reanalyze} variant="outline">
                        Re-analyze Quality
                    </Button>
                    <Button onClick={saveAndFinalize} disabled={isSaving} className="bg-green-600 hover:bg-green-700">
                        {isSaving ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Save as Master Resume
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}