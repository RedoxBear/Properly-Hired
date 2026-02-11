import React from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Download, FileText, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function ResumeViewer() {
    const [resume, setResume] = React.useState(null);
    const [loading, setLoading] = React.useState(true);
    const [previewMode, setPreviewMode] = React.useState("text");
    const navigate = useNavigate();

    React.useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const id = urlParams.get("resumeId");
        if (!id) {
            setLoading(false);
            return;
        }
        const load = async () => {
            try {
                const res = await base44.entities.Resume.get(id);
                setResume(res);
            } catch (error) {
                console.error("Failed to load resume:", error);
            }
            setLoading(false);
        };
        load();
    }, []);

    const safeParse = (value) => {
        if (!value) return null;
        if (typeof value === "object") return value;
        if (typeof value === "string") {
            try {
                return JSON.parse(value);
            } catch (error) {
                console.error("Failed to parse resume content:", error);
                return null;
            }
        }
        return null;
    };

    const resolveContent = (data) => {
        return safeParse(data?.optimized_content) || safeParse(data?.parsed_content) || null;
    };

    const buildText = (content) => {
        let text = "";
        const useData = content;

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

    const buildMarkdown = (content) => {
        if (!content) return "";
        const lines = [];
        const pi = content.personal_info || {};
        if (pi.name) lines.push(`# ${pi.name}`);
        const contact = [pi.email, pi.phone, pi.location, pi.linkedin, pi.portfolio].filter(Boolean).join(" | ");
        if (contact) lines.push(contact);
        lines.push("");

        const summary = content.executive_summary || content.summary;
        if (summary) {
            lines.push("## Summary");
            lines.push(summary);
            lines.push("");
        }

        if (content.skills?.length) {
            lines.push("## Skills");
            content.skills.forEach((skill) => lines.push(`- ${skill}`));
            lines.push("");
        }

        if (content.experience?.length) {
            lines.push("## Experience");
            content.experience.forEach((exp) => {
                const header = [exp.position, exp.company].filter(Boolean).join(" at ");
                const meta = [exp.duration, exp.location].filter(Boolean).join(" • ");
                lines.push(`### ${header || "Role"}`);
                if (meta) lines.push(meta);
                if (exp.achievements?.length) {
                    exp.achievements.forEach((item) => lines.push(`- ${item}`));
                }
                lines.push("");
            });
        }

        if (content.education?.length) {
            lines.push("## Education");
            content.education.forEach((edu) => {
                const detail = [edu.degree, edu.institution].filter(Boolean).join(", ");
                const meta = [edu.year, edu.location].filter(Boolean).join(" • ");
                lines.push(`- ${detail}${meta ? ` (${meta})` : ""}`);
            });
            lines.push("");
        }

        if (content.references?.length) {
            lines.push("## Professional References");
            content.references.forEach((ref) => {
                const header = [ref.name, ref.title, ref.company].filter(Boolean).join(" • ");
                lines.push(`- ${header}`);
            });
            lines.push("");
        }

        return lines.join("\n").trim();
    };

    const buildJson = (content) => {
        const payload = {
            version_name: resume?.version_name,
            content: content || null
        };
        return JSON.stringify(payload, null, 2);
    };

    const download = (type) => {
        const safeName = (resume?.version_name || "Resume").replace(/[\\/:*?"<>|]/g, "_");
        const content = resolveContent(resume);
        
        if (type === "txt") {
            const text = buildText(content);
            const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${safeName}.txt`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
        } else if (type === "md") {
            const markdown = buildMarkdown(content);
            const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${safeName}.md`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
        } else if (type === "json") {
            const blob = new Blob([buildJson(content)], { type: "application/json;charset=utf-8" });
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
                optimized_content: safeParse(resume?.optimized_content),
                parsed_content: safeParse(resume?.parsed_content),
                exported_at: new Date().toISOString(),
                _meta: {
                    description: "Full Resume Repository Backup",
                    app: "Properly Hired"
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
    const content = resolveContent(resume);
    const previewText = previewMode === "markdown"
        ? buildMarkdown(content)
        : previewMode === "json"
            ? buildJson(content)
            : buildText(content);

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
                        <Button onClick={() => download("md")} variant="outline" className="gap-2">
                            <Download className="w-4 h-4" />
                            Download MD
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
                    <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <CardTitle>Preview</CardTitle>
                        <div className="flex flex-wrap gap-2">
                            <Button
                                variant={previewMode === "text" ? "default" : "outline"}
                                size="sm"
                                onClick={() => setPreviewMode("text")}
                            >
                                Text
                            </Button>
                            <Button
                                variant={previewMode === "markdown" ? "default" : "outline"}
                                size="sm"
                                onClick={() => setPreviewMode("markdown")}
                            >
                                Markdown
                            </Button>
                            <Button
                                variant={previewMode === "json" ? "default" : "outline"}
                                size="sm"
                                onClick={() => setPreviewMode("json")}
                            >
                                JSON
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <pre className="whitespace-pre-wrap text-sm text-slate-700">
{previewText}
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
