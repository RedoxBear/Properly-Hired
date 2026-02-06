import React from "react";
import { Resume } from "@/entities/Resume";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Download, FileText, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function ResumeViewer() {
    const [resume, setResume] = React.useState(null);
    const [loading, setLoading] = React.useState(true);
    const navigate = useNavigate();

    React.useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const id = urlParams.get("resumeId");
        if (!id) {
            setLoading(false);
            return;
        }
        const load = async () => {
            const res = await Resume.get(id);
            setResume(res);
            setLoading(false);
        };
        load();
    }, []);

    const buildText = (data) => {
        let text = "";
        const optimized = data.optimized_content ? JSON.parse(data.optimized_content) : null;
        const parsed = data.parsed_content ? JSON.parse(data.parsed_content) : null;

        const useData = optimized || parsed || null;

        if (useData?.personal_info) {
            const pi = useData.personal_info;
            text += `${pi?.name || ''}\n${pi?.email || ''} | ${pi?.phone || ''} | ${pi?.location || ''}${pi?.linkedin ? ` | ${pi.linkedin}` : ''}${pi?.portfolio ? ` | ${pi.portfolio}` : ''}\n\n`;
        }

        // NEW: include Executive Summary (preferred) or Summary
        if (useData?.executive_summary || useData?.summary) {
            text += "Summary\n------\n";
            text += `${useData.executive_summary || useData.summary}\n\n`;
        }

        if (useData?.skills?.length) {
            text += "Skills\n------\n";
            text += useData.skills.map(s => `• ${s}`).join("\n") + "\n\n";
        }
        if (useData?.experience?.length) {
            text += "Experience\n---------\n";
            useData.experience.forEach(exp => {
                text += `${exp.position || ''} at ${exp.company || ''} (${exp.duration || ''})\n`;
                if (exp.achievements?.length) {
                    exp.achievements.forEach(a => text += `   - ${a}\n`);
                }
                text += "\n";
            });
        }
        if (useData?.education?.length) {
            text += "Education\n---------\n";
            useData.education.forEach(edu => {
                text += `${edu.degree || ''}, ${edu.institution || ''} ${edu.year ? `(${edu.year})` : ''}\n`;
            });
            text += "\n";
        }
        // NEW: Professional References
        if (useData?.references?.length) {
            text += "Professional References\n-----------------------\n";
            useData.references.forEach(ref => {
                const header = [ref.name, ref.title, ref.company].filter(Boolean).join(" • ");
                text += `${header}\n`;
                const contacts = [ref.email, ref.phone, ref.linkedin, ref.github, ref.website].filter(Boolean).join(" | ");
                if (contacts) text += `   ${contacts}\n`;
                if (Array.isArray(ref.identifiers) && ref.identifiers.length) {
                    ref.identifiers.forEach(id => {
                        const line = id.type ? `${id.type}: ${id.value}` : `${id.value}`;
                        text += `   - ${line}\n`;
                    });
                }
                text += "\n";
            });
        }

        return text.trim();
    };

    const download = (type) => {
        const safeName = (resume?.version_name || "Resume").replace(/[\\/:*?"<>|]/g, "_");
        
        if (type === "txt") {
            const content = buildText(resume);
            const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${safeName}.txt`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
        } else if (type === "json") {
            // Standard JSON export (content only)
            const payload = {
                version_name: resume?.version_name,
                optimized_content: resume?.optimized_content ? JSON.parse(resume.optimized_content) : null,
                parsed_content: resume?.parsed_content ? JSON.parse(resume.parsed_content) : null
            };
            const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${safeName}.json`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
        } else if (type === "repo") {
            // Full Repository Backup (includes all metadata, scores, flags, etc.)
            const payload = {
                ...resume,
                optimized_content: resume?.optimized_content ? JSON.parse(resume.optimized_content) : null,
                parsed_content: resume?.parsed_content ? JSON.parse(resume.parsed_content) : null,
                exported_at: new Date().toISOString(),
                _meta: {
                    description: "Full Resume Repository Backup",
                    app: "Prague Day"
                }
            };
            const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${safeName}_repository_backup.json`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen p-6 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
            </div>
        );
    }

    if (!resume) {
        return (
            <div className="min-h-screen p-6 flex flex-col items-center justify-center text-center">
                <FileText className="w-10 h-10 text-slate-400 mb-3" />
                <p className="text-slate-600">Resume not found.</p>
                <Button className="mt-4" onClick={() => navigate(createPageUrl("MyResumes"))}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to My Resumes
                </Button>
            </div>
        );
    }

    const isOptimized = resume.is_master_resume === false;

    return (
        <div className="min-h-screen p-4 md:p-8">
            <div className="max-w-3xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">{resume.version_name}</h1>
                        <div className="mt-2">
                            <Badge variant="secondary" className={isOptimized ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
                                {isOptimized ? "Optimized Version" : "Master Resume"}
                            </Badge>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={() => download("txt")} className="gap-2">
                            <Download className="w-4 h-4" />
                            Download TXT
                        </Button>
                        <Button onClick={() => download("json")} variant="outline" className="gap-2">
                            <Download className="w-4 h-4" />
                            Download JSON
                        </Button>
                        <Button onClick={() => download("repo")} variant="outline" className="gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300">
                            <Download className="w-4 h-4" />
                            Repository Backup
                        </Button>
                    </div>
                </div>

                <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle>Preview</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <pre className="whitespace-pre-wrap text-sm text-slate-700">
{buildText(resume)}
                        </pre>
                    </CardContent>
                </Card>

                <div>
                    <Button variant="outline" onClick={() => navigate(createPageUrl("MyResumes"))} className="gap-2">
                        <ArrowLeft className="w-4 h-4" />
                        Back to My Resumes
                    </Button>
                </div>
            </div>
        </div>
    );
}