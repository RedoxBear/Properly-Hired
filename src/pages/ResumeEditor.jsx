import React from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, ArrowLeft, CheckCircle2, Sparkles, Star, TrendingUp, Plus, Trash2 } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { analyzeResumeAgainstJD } from "@/components/utils/articulation";
import { resumeJsonToPlainText } from "@/components/utils/resumeText";
import AgentChat from "@/components/agents/AgentChat";
import AgentHandoffCard from "@/components/agents/AgentHandoffCard";
import { parse, parseISO, isValid, differenceInMonths } from "date-fns";

export default function ResumeEditor() {
  const [resume, setResume] = React.useState(null);
  const [draft, setDraft] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [previewMode, setPreviewMode] = React.useState("text");
  const [saving, setSaving] = React.useState(false);
  const [scoring, setScoring] = React.useState(false);
  const [error, setError] = React.useState("");
  const [baselineScore, setBaselineScore] = React.useState(null);
  const [currentScore, setCurrentScore] = React.useState(null);
  const [improved, setImproved] = React.useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = React.useState(false);
  const [lastSavedDraft, setLastSavedDraft] = React.useState(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const rescoreTimeoutRef = React.useRef(null);

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

  const buildText = (content) => {
    if (!content) return "";
    let text = "";
    const pi = content.personal_info || {};
    if (Object.keys(pi).length) {
      text += `${pi?.name || ""}\n${pi?.email || ""} | ${pi?.phone || ""} | ${pi?.location || ""}${pi?.linkedin ? ` | ${pi.linkedin}` : ""}${pi?.portfolio ? ` | ${pi.portfolio}` : ""}\n\n`;
    }

    if (content?.executive_summary || content?.summary) {
      text += "Executive Summary\n-----------------\n";
      text += `${content.executive_summary || content.summary}\n\n`;
    }

    // Career Achievements (pillar format from Achievement-Based CV)
    if (content?.career_achievements?.length) {
      text += "Career Achievements\n-------------------\n";
      content.career_achievements.forEach(pillar => {
        text += `\n${(pillar.pillar_name || '').toUpperCase()}\n`;
        (pillar.items || []).forEach((item, i) => {
          text += `  ${i + 1}. ${item}\n`;
        });
      });
      text += "\n";
    }

    if (content?.skills?.length) {
      text += "Skills\n------\n";
      text += content.skills.map((s) => `• ${s}`).join("\n") + "\n\n";
    }

    if (content?.experience?.length) {
      text += "Experience\n---------\n";
      content.experience.forEach((exp) => {
        text += `${exp.position || ""} at ${exp.company || ""} (${exp.duration || ""})\n`;
        if (exp.achievements?.length) {
          exp.achievements.forEach((a) => {
            text += `   - ${a}\n`;
          });
        }
        text += "\n";
      });
    }

    if (content?.education?.length) {
      text += "Education\n---------\n";
      content.education.forEach((edu) => {
        text += `${edu.degree || ""}, ${edu.institution || ""} ${edu.year ? `(${edu.year})` : ""}\n`;
      });
      text += "\n";
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
      lines.push("## Executive Summary");
      lines.push(summary);
      lines.push("");
    }

    // Career Achievements (pillar format from Achievement-Based CV)
    if (content.career_achievements?.length) {
      lines.push("## Career Achievements");
      content.career_achievements.forEach(pillar => {
        lines.push(`### ${pillar.pillar_name || ''}`);
        (pillar.items || []).forEach(item => lines.push(`- ${item}`));
        lines.push("");
      });
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

    return lines.join("\n").trim();
  };

  const buildJson = (content) => {
    const payload = {
      version_name: resume?.version_name,
      content: content || null
    };
    return JSON.stringify(payload, null, 2);
  };

  const tryParseDate = (str) => {
    if (!str || typeof str !== "string") return null;
    const s = str.trim().toLowerCase().replace("present", new Date().getFullYear().toString());
    const formats = ["MMM yyyy", "MMMM yyyy", "yyyy-MM", "yyyy"];
    for (const f of formats) {
      const d = parse(s, f, new Date());
      if (isValid(d)) return d;
    }
    const iso = parseISO(str);
    if (isValid(iso)) return iso;
    const nd = new Date(str);
    return isValid(nd) ? nd : null;
  };

  const extractRangeFromDuration = (duration) => {
    if (!duration || typeof duration !== "string") return {};
    const parts = duration.replace("–", "-").split("-").map(p => p.trim());
    if (parts.length >= 2) {
      return { start: tryParseDate(parts[0]), end: tryParseDate(parts[1]) };
    }
    const single = tryParseDate(duration);
    return { start: single, end: single };
  };

  const computeTenureStats = (experience) => {
    if (!Array.isArray(experience) || experience.length === 0) return null;
    const tenures = experience.map((e) => {
      const { start, end } = extractRangeFromDuration(e?.duration);
      if (!start || !end) return null;
      const months = Math.max(0, differenceInMonths(end, start));
      return months;
    }).filter((m) => typeof m === "number");

    if (tenures.length === 0) return null;
    const total = tenures.reduce((a, b) => a + b, 0);
    const avg = Math.round(total / tenures.length);
    const shortStints = tenures.filter(m => m < 12).length;
    return { averageMonths: avg, shortStints, totalRoles: tenures.length };
  };

  const download = (type) => {
    const safeName = (resume?.version_name || "Resume").replace(/[\\/:*?"<>|]/g, "_");
    const content = draft || {};

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
    }
  };

  React.useEffect(() => {
    const resumeId = searchParams.get("resumeId");
    const isNew = searchParams.get("new") === "1";
    
    if (!resumeId) {
      console.error("No resumeId in URL params:", window.location.search);
      console.error("Search params:", Object.fromEntries(searchParams));
      setError("No resumeId provided. Please select a resume from My Resumes.");
      setLoading(false);
      return;
    }
    
    
    (async () => {
      try {
        const r = await base44.entities.Resume.get(resumeId);
        
        if (!r) {
          setError("Resume not found. It may have been deleted.");
          setLoading(false);
          return;
        }
        
        setResume(r);
        
        // Try to parse the resume content
        const parsed = safeParse(r.parsed_content);
        const optimized = safeParse(r.optimized_content);
        
        const initialDraft = parsed || optimized || {
          personal_info: {},
          summary: "",
          skills: [],
          highlights: "",
          career_achievements: [],
          experience: [],
          education: []
        };
        
        setDraft(initialDraft);
        setLastSavedDraft(JSON.stringify(initialDraft));
        
        const base = Number(r?.quality_scores?.overall ?? 0);
        setBaselineScore(isFinite(base) ? base : null);
        setCurrentScore(isFinite(base) ? base : null);
      } catch (e) {
        console.error("Error loading resume:", e);
        setError(`Could not load resume: ${e.message || "Unknown error"}`);
      }
      setLoading(false);
    })();
  }, [searchParams]);

  const plain = React.useMemo(() => resumeJsonToPlainText(draft || {}), [draft]);

  // Track unsaved changes
  React.useEffect(() => {
    if (!draft || !lastSavedDraft) return;
    const currentDraftStr = JSON.stringify(draft);
    setHasUnsavedChanges(currentDraftStr !== lastSavedDraft);
  }, [draft, lastSavedDraft]);

  // Auto-rescore on changes (debounced)
  React.useEffect(() => {
    if (!draft || !hasUnsavedChanges) return;
    
    if (rescoreTimeoutRef.current) {
      clearTimeout(rescoreTimeoutRef.current);
    }
    
    rescoreTimeoutRef.current = setTimeout(() => {
      rescore();
    }, 2000); // Rescore 2 seconds after last change
    
    return () => {
      if (rescoreTimeoutRef.current) {
        clearTimeout(rescoreTimeoutRef.current);
      }
    };
  }, [draft, hasUnsavedChanges]);

  const updateField = (path, value) => {
    setDraft((prev) => ({ ...(prev || {}), [path]: value }));
  };

  const updateExperience = (newExp) => {
    setDraft((prev) => ({ ...(prev || {}), experience: newExp }));
  };

  const updateEducation = (newEdu) => {
    setDraft((prev) => ({ ...(prev || {}), education: newEdu }));
  };

  const addExperience = () => {
    const current = draft?.experience || [];
    updateExperience([...current, { company: "", position: "", duration: "", location: "", achievements: [] }]);
  };

  const removeExperience = (index) => {
    const current = draft?.experience || [];
    updateExperience(current.filter((_, i) => i !== index));
  };

  const updateExperienceField = (index, field, value) => {
    const current = [...(draft?.experience || [])];
    current[index] = { ...current[index], [field]: value };
    updateExperience(current);
  };

  const updateExperienceAchievements = (index, value) => {
    const current = [...(draft?.experience || [])];
    const achievements = value.split('\n').filter(line => line.trim());
    current[index] = { ...current[index], achievements };
    updateExperience(current);
  };

  const addEducation = () => {
    const current = draft?.education || [];
    updateEducation([...current, { institution: "", degree: "", year: "" }]);
  };

  const removeEducation = (index) => {
    const current = draft?.education || [];
    updateEducation(current.filter((_, i) => i !== index));
  };

  const updateEducationField = (index, field, value) => {
    const current = [...(draft?.education || [])];
    current[index] = { ...current[index], [field]: value };
    updateEducation(current);
  };

  const addSkill = () => {
    const current = draft?.skills || [];
    updateField("skills", [...current, ""]);
  };

  const removeSkill = (index) => {
    const current = draft?.skills || [];
    updateField("skills", current.filter((_, i) => i !== index));
  };

  const updateSkill = (index, value) => {
    const current = [...(draft?.skills || [])];
    current[index] = value;
    updateField("skills", current);
  };

  const rescore = async () => {
    const resumeId = searchParams.get("resumeId");
    if (!resumeId) return;
    
    setScoring(true);
    setError("");
    try {
      const analysis = await analyzeResumeAgainstJD(plain, "");
      const scoreNow = Number(analysis?.scores?.overall ?? 0);
      setCurrentScore(scoreNow);
      const base = Number(baselineScore ?? 0);
      setImproved(isFinite(base) && isFinite(scoreNow) ? scoreNow > base : false);
      
      await base44.entities.Resume.update(resumeId, {
        quality_scores: analysis?.scores || null,
        quality_flags: analysis?.flags || [],
        quality_last_analyzed_at: new Date().toISOString()
      });
      
      const updated = await base44.entities.Resume.get(resumeId);
      setResume(updated);
    } catch (e) {
      console.error(e);
      setError("Scoring failed. Please try again.");
    }
    setScoring(false);
  };

  const saveEdits = async () => {
    const resumeId = searchParams.get("resumeId");
    if (!resumeId) return;
    
    setSaving(true);
    setError("");
    try {
      const analysis = await analyzeResumeAgainstJD(plain, "");
      const payload = {
        parsed_content: JSON.stringify(draft),
        personal_info: draft.personal_info || {},
        skills: draft.skills || [], // No limit on skills
        experience: draft.experience || [],
        education: draft.education || [],
        quality_scores: analysis?.scores || null,
        quality_flags: analysis?.flags || [],
        quality_last_analyzed_at: new Date().toISOString()
      };
      await base44.entities.Resume.update(resumeId, payload);
      const updated = await base44.entities.Resume.get(resumeId);
      setResume(updated);
      const base = Number(updated?.quality_scores?.overall ?? 0);
      setCurrentScore(isFinite(base) ? base : null);
      if (baselineScore == null) setBaselineScore(base);
      
      // Update saved state
      setLastSavedDraft(JSON.stringify(draft));
      setHasUnsavedChanges(false);
    } catch (e) {
      console.error(e);
      setError("Save failed. Please try again.");
    }
    setSaving(false);
  };

  const promoteToMaster = async () => {
    const resumeId = searchParams.get("resumeId");
    if (!resumeId) return;
    
    try {
      // Simply promote this resume to master without demoting others
      await base44.entities.Resume.update(resumeId, { is_master_resume: true });
      const updated = await base44.entities.Resume.get(resumeId);
      setResume(updated);
      navigate(createPageUrl("MyResumes"));
    } catch (e) {
      console.error(e);
      setError("Could not set this resume as Master.");
    }
  };

  const tenureStats = draft?.experience ? computeTenureStats(draft.experience) : null;
  const recommendProjectCV = tenureStats ? tenureStats.shortStints >= 2 || tenureStats.averageMonths <= 14 : false;

  if (loading) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
      </div>
    );
  }

  if (!resume) {
    const resumeId = searchParams.get("resumeId");
    return (
      <div className="min-h-screen p-6 flex flex-col items-center justify-center text-center space-y-3">
        <p className="text-slate-700 mb-2">{error || "Resume not found."}</p>
        {!resumeId && (
          <p className="text-sm text-slate-500">Debug: Current URL: {window.location.href}</p>
        )}
        <Button onClick={() => navigate(createPageUrl("MyResumes"))} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to My Resumes
        </Button>
      </div>
    );
  }

  const isNew = searchParams.get("new") === "1";
  const previewText = previewMode === "markdown"
    ? buildMarkdown(draft)
    : previewMode === "json"
      ? buildJson(draft)
      : buildText(draft);

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gray-50">
      <div className="max-w-5xl mx-auto space-y-6">
        {isNew && (
          <Alert className="border-blue-200 bg-blue-50">
            <AlertDescription className="text-blue-800">
              <strong>📝 Imported successfully!</strong> Improve your resume below and re-score. When ready, set it as your Master.
            </AlertDescription>
          </Alert>
        )}
        {error && (
          <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>
        )}

        <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
          <CardHeader className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <CardTitle className="text-2xl">Resume Editor</CardTitle>
              <p className="text-sm text-slate-600 mt-1">{resume.version_name}</p>
            </div>
            <div className="flex flex-col gap-3 text-sm text-slate-600">
              <div className="space-y-1 text-left md:text-right">
                <div>
                  Baseline: <span className="font-semibold text-slate-800">{baselineScore ?? "—"}</span>
                </div>
                <div className="flex items-center gap-2 md:justify-end">
                  Current: <span className={`font-semibold ${improved ? "text-green-600" : "text-slate-800"}`}>{currentScore ?? "—"}</span>
                  {improved && <TrendingUp className="w-4 h-4 text-green-600" />}
                </div>
              </div>
              <div className="flex flex-wrap gap-2 md:justify-end">
                <Button onClick={() => download("txt")} size="sm" variant="outline" className="gap-2">
                  Download TXT
                </Button>
                <Button onClick={() => download("md")} size="sm" variant="outline" className="gap-2">
                  Download MD
                </Button>
                <Button onClick={() => download("json")} size="sm" variant="outline" className="gap-2">
                  Download JSON
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <section>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                <Label className="text-base font-semibold">Resume Preview</Label>
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
              </div>
              <div className="border rounded-lg bg-slate-50 p-4 max-h-[320px] overflow-auto">
                <pre className="whitespace-pre-wrap text-sm text-slate-700">{previewText}</pre>
              </div>
              <p className="text-xs text-slate-500 mt-1">Use the toggles to view or download the resume in TXT, Markdown, or JSON.</p>
            </section>
            <section>
              <Label className="text-base font-semibold mb-2 block">Career Summary {draft?.summary && <span className="text-xs text-green-600 ml-2">✓ Filled</span>}</Label>
              <Textarea
                className="w-full min-h-[120px]"
                value={Array.isArray(draft?.summary) ? draft.summary.join("\n") : (draft?.summary || "")}
                onChange={(e) => updateField("summary", e.target.value)}
                placeholder="Professional summary or objective from your CV - your elevator pitch with key qualifications."
              />
              <p className="text-xs text-slate-500 mt-1">Extracted from CV. Edit to make it concise and impactful with ATS-friendly keywords.</p>
            </section>

            <section>
              <div className="flex justify-between items-center mb-2">
                <Label className="text-base font-semibold">Core Competencies</Label>
                <span className="text-xs text-slate-500">{(draft?.skills || []).length} skills</span>
              </div>
              <Textarea
                className="w-full min-h-[80px]"
                value={(draft?.skills || []).join(", ")}
                onChange={(e) => updateField("skills", e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
                placeholder="e.g. Talent Strategy, Workforce Planning, OKRs, ATS, Data Analytics, Change Management, etc."
              />
              <div className="flex flex-wrap gap-2 mt-3">
                {(draft?.skills || []).map((skill, idx) => (
                  <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                    {skill}
                  </span>
                ))}
              </div>
              <p className="text-xs text-slate-500 mt-2">No limit - add all relevant skills. Each appears as a filled box.</p>
            </section>

            {/* Career Achievements (pillar format) — shown when present from Achievement-Based optimization */}
            {(draft?.career_achievements?.length > 0) && (
              <section>
                <Label className="text-base font-semibold mb-2 block">
                  Career Achievements (Pillar Format) <span className="text-xs text-amber-600 ml-2">Achievement-Based CV</span>
                </Label>
                <div className="space-y-4">
                  {(draft.career_achievements || []).map((pillar, pIdx) => (
                    <Card key={pIdx} className="bg-amber-50 border-amber-200">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex justify-between items-start">
                          <Label className="text-sm font-semibold text-amber-800 uppercase tracking-wide">{pillar.pillar_name}</Label>
                          <Button
                            size="sm" variant="ghost"
                            className="text-red-600 hover:text-red-800 hover:bg-red-50"
                            onClick={() => {
                              const updated = [...(draft.career_achievements || [])];
                              updated.splice(pIdx, 1);
                              updateField("career_achievements", updated);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        <Input
                          value={pillar.pillar_name || ""}
                          onChange={(e) => {
                            const updated = [...(draft.career_achievements || [])];
                            updated[pIdx] = { ...updated[pIdx], pillar_name: e.target.value };
                            updateField("career_achievements", updated);
                          }}
                          placeholder="Pillar Name"
                          className="font-semibold"
                        />
                        <Textarea
                          className="min-h-[100px]"
                          value={(pillar.items || []).join("\n")}
                          onChange={(e) => {
                            const updated = [...(draft.career_achievements || [])];
                            updated[pIdx] = {
                              ...updated[pIdx],
                              items: e.target.value.split("\n").filter(line => line.trim())
                            };
                            updateField("career_achievements", updated);
                          }}
                          placeholder="One achievement per line"
                        />
                      </CardContent>
                    </Card>
                  ))}
                  <Button
                    size="sm" variant="outline"
                    className="gap-1 border-amber-300 text-amber-700 hover:bg-amber-50"
                    onClick={() => {
                      const updated = [...(draft.career_achievements || []), { pillar_name: "", items: [] }];
                      updateField("career_achievements", updated);
                    }}
                  >
                    <Plus className="w-4 h-4" />
                    Add Pillar
                  </Button>
                </div>
              </section>
            )}

            <section>
              <Label className="text-base font-semibold mb-2 block">Career Highlights {draft?.highlights && <span className="text-xs text-green-600 ml-2">✓ Filled</span>}</Label>
              <Textarea
                className="w-full min-h-[150px]"
                value={draft?.highlights || ""}
                onChange={(e) => updateField("highlights", e.target.value)}
                placeholder="Key career accomplishments and notable achievements across your entire career. Include as much as possible - this is your highlight reel."
              />
              <p className="text-xs text-slate-500 mt-1">Extract all career highlights from CV. Showcase your biggest wins and most impressive accomplishments.</p>
            </section>

            <section>
              <div className="flex justify-between items-center mb-3">
                <Label className="text-base font-semibold">Professional Experience</Label>
                <Button onClick={addExperience} size="sm" variant="outline" className="gap-1">
                  <Plus className="w-4 h-4" />
                  Add Experience
                </Button>
              </div>
              <div className="space-y-4">
                {(draft?.experience || []).map((exp, index) => (
                  <Card key={index} className="bg-slate-50">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <Label className="text-sm font-semibold text-slate-700">Experience {index + 1}</Label>
                        <Button onClick={() => removeExperience(index)} size="sm" variant="ghost" className="text-red-600 hover:text-red-800 hover:bg-red-50">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="grid md:grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs text-slate-600">Position</Label>
                          <Input
                            value={exp.position || ""}
                            onChange={(e) => updateExperienceField(index, "position", e.target.value)}
                            placeholder="e.g. Senior Engineer"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-slate-600">Company</Label>
                          <Input
                            value={exp.company || ""}
                            onChange={(e) => updateExperienceField(index, "company", e.target.value)}
                            placeholder="e.g. Google"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-slate-600">Duration</Label>
                          <Input
                            value={exp.duration || ""}
                            onChange={(e) => updateExperienceField(index, "duration", e.target.value)}
                            placeholder="e.g. 2019-2024"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-slate-600">Location</Label>
                          <Input
                            value={exp.location || ""}
                            onChange={(e) => updateExperienceField(index, "location", e.target.value)}
                            placeholder="e.g. San Gabriel, CA or Remote"
                          />
                          <p className="text-xs text-slate-500 mt-1">City, State format</p>
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs text-slate-600">Achievements (one per line)</Label>
                        <Textarea
                          className="min-h-[100px]"
                          value={(exp.achievements || []).join("\n")}
                          onChange={(e) => updateExperienceAchievements(index, e.target.value)}
                          placeholder="Led team of 10 engineers&#10;Increased revenue by 25%&#10;Deployed 50+ features"
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {(draft?.experience || []).length === 0 && (
                  <p className="text-sm text-slate-500 text-center py-4">No experience added yet. Click "Add Experience" to start.</p>
                )}
              </div>
            </section>

            <section>
              <div className="flex justify-between items-center mb-3">
                <Label className="text-base font-semibold">Education</Label>
                <Button onClick={addEducation} size="sm" variant="outline" className="gap-1">
                  <Plus className="w-4 h-4" />
                  Add Education
                </Button>
              </div>
              <div className="space-y-4">
                {(draft?.education || []).map((edu, index) => (
                  <Card key={index} className="bg-slate-50">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <Label className="text-sm font-semibold text-slate-700">Education {index + 1}</Label>
                        <Button onClick={() => removeEducation(index)} size="sm" variant="ghost" className="text-red-600 hover:text-red-800 hover:bg-red-50">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="grid md:grid-cols-3 gap-3">
                        <div>
                          <Label className="text-xs text-slate-600">Institution</Label>
                          <Input
                            value={edu.institution || ""}
                            onChange={(e) => updateEducationField(index, "institution", e.target.value)}
                            placeholder="e.g. Stanford University"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-slate-600">Degree</Label>
                          <Input
                            value={edu.degree || ""}
                            onChange={(e) => updateEducationField(index, "degree", e.target.value)}
                            placeholder="e.g. BS Computer Science"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-slate-600">Year</Label>
                          <Input
                            value={edu.year || ""}
                            onChange={(e) => updateEducationField(index, "year", e.target.value)}
                            placeholder="e.g. 2020"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {(draft?.education || []).length === 0 && (
                  <p className="text-sm text-slate-500 text-center py-4">No education added yet. Click "Add Education" to start.</p>
                )}
              </div>
            </section>

            <section>
              <div className="flex justify-between items-center mb-3">
                <Label className="text-base font-semibold">Skills</Label>
                <Button onClick={addSkill} size="sm" variant="outline" className="gap-1">
                  <Plus className="w-4 h-4" />
                  Add Skill
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {(draft?.skills || []).map((skill, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      value={skill || ""}
                      onChange={(e) => updateSkill(index, e.target.value)}
                      placeholder="e.g. Project Management"
                      className="flex-1"
                    />
                    <Button onClick={() => removeSkill(index)} size="icon" variant="ghost" className="text-red-600 hover:text-red-800 hover:bg-red-50 shrink-0">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                {(draft?.skills || []).length === 0 && (
                  <p className="text-sm text-slate-500 text-center py-4 col-span-full">No skills added yet. Click "Add Skill" to start.</p>
                )}
              </div>
            </section>

            <div className="flex flex-wrap gap-3 pt-4 border-t">
              <Button onClick={rescore} disabled={scoring} variant="outline" className="gap-2">
                {scoring ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Scoring
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Re-score
                  </>
                )}
              </Button>
              <Button onClick={saveEdits} disabled={saving} className="bg-blue-600 hover:bg-blue-700 gap-2">
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
              <Button variant="ghost" onClick={() => navigate(createPageUrl("MyResumes"))} className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to My Resumes
              </Button>
            </div>
          </CardContent>
        </Card>

        {improved && !resume?.is_master_resume && (
          <Card className="border-0 shadow-lg bg-gradient-to-r from-green-50 to-emerald-50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-green-800">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                This version beats your baseline!
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Button onClick={promoteToMaster} className="bg-green-600 hover:bg-green-700 gap-2">
                <Star className="w-4 h-4" />
                Make this my Master Resume
              </Button>
              <p className="text-sm text-green-800 self-center">
                Your Master score becomes the benchmark for all optimized resumes.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Floating Save Button */}
        {hasUnsavedChanges && (
          <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-4">
            <Button
              onClick={saveEdits}
              disabled={saving}
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 shadow-2xl gap-2 px-8 py-6 text-base rounded-xl"
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        )}

        <AgentHandoffCard variant="kyle" />

        <AgentChat
          agentName="kyle"
          agentTitle="Kyle - CV Expert"
          autoOpen={false}
          autoSendInitial={false}
          context={{
            page: "ResumeEditor",
            resumeId: resume?.id,
            tenureStats,
            recommendProjectCV
          }}
        />
      </div>
    </div>
  );
}