import React from "react";
import { base44 } from "@/api/base44Client";
import { useSearchParams, useNavigate } from "react-router-dom";
import { resumeJsonToPlainText } from "@/components/utils/resumeText";
import { analyzeResumeAgainstJD } from "@/components/utils/articulation";
import { normalizeAchievementItem } from "@/components/utils/achievementItemUtils";
import { cleanResumeText } from "@/components/utils/cleanResumeText";

const safeParse = (value) => {
  if (!value) return null;
  if (typeof value === "object") return value;
  if (typeof value === "string") {
    try { return JSON.parse(value); } catch { return null; }
  }
  return null;
};

export function useEditorState() {
  const [resume, setResume] = React.useState(null);
  const [draft, setDraft] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
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

  const plain = React.useMemo(() => resumeJsonToPlainText(draft || {}), [draft]);

  // Detect format
  const format = React.useMemo(() => {
    if (!draft) return "chronological";
    if (draft.career_achievements && draft.career_achievements.length > 0) return "achievement";
    return "chronological";
  }, [draft]);

  // Load resume
  React.useEffect(() => {
    const resumeId = searchParams.get("resumeId");
    if (!resumeId) {
      setError("No resumeId provided. Please select a resume from My Resumes.");
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const r = await base44.entities.Resume.get(resumeId);
        if (!r) { setError("Resume not found."); setLoading(false); return; }
        setResume(r);

        const parsed = safeParse(r.parsed_content);
        const optimized = safeParse(r.optimized_content);

        const initialDraft = (r.is_master_resume === false && optimized) ? optimized : parsed || optimized || {
          personal_info: {}, summary: "", skills: [], highlights: "", career_achievements: [], experience: [], education: []
        };

        setDraft(initialDraft);
        setLastSavedDraft(JSON.stringify(initialDraft));

        const base = Number(r?.quality_scores?.overall ?? 0);
        setBaselineScore(isFinite(base) ? base : null);
        setCurrentScore(isFinite(base) ? base : null);
      } catch (e) {
        setError(`Could not load resume: ${e.message}`);
      }
      setLoading(false);
    })();
  }, [searchParams]);

  // Track unsaved changes
  React.useEffect(() => {
    if (!draft || !lastSavedDraft) return;
    setHasUnsavedChanges(JSON.stringify(draft) !== lastSavedDraft);
  }, [draft, lastSavedDraft]);

  // Auto-rescore debounced
  React.useEffect(() => {
    if (!draft || !hasUnsavedChanges) return;
    if (rescoreTimeoutRef.current) clearTimeout(rescoreTimeoutRef.current);
    rescoreTimeoutRef.current = setTimeout(() => rescore(), 2000);
    return () => { if (rescoreTimeoutRef.current) clearTimeout(rescoreTimeoutRef.current); };
  }, [draft, hasUnsavedChanges]);

  const updateField = (path, value) => setDraft(prev => ({ ...(prev || {}), [path]: value }));

  const rescore = async () => {
    const resumeId = searchParams.get("resumeId");
    if (!resumeId) return;
    setScoring(true);
    setError("");
    try {
      const analysis = await analyzeResumeAgainstJD(plain, "");
      const scoreNow = Number(analysis?.scores?.overall ?? 0);
      setCurrentScore(scoreNow);
      setImproved(isFinite(baselineScore) && isFinite(scoreNow) ? scoreNow > baselineScore : false);
      await base44.entities.Resume.update(resumeId, {
        quality_scores: analysis?.scores || null,
        quality_flags: analysis?.flags || [],
        quality_last_analyzed_at: new Date().toISOString()
      });
      const updated = await base44.entities.Resume.get(resumeId);
      setResume(updated);
    } catch (e) {
      console.error(e);
      setError("Scoring failed.");
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
        optimized_content: JSON.stringify(draft),
        personal_info: draft.personal_info || {},
        skills: draft.skills || [],
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
      setLastSavedDraft(JSON.stringify(draft));
      setHasUnsavedChanges(false);
    } catch (e) {
      console.error(e);
      setError("Save failed.");
    }
    setSaving(false);
  };

  const buildText = (content) => {
    if (!content) return "";
    let text = "";
    const pi = content.personal_info || {};
    if (Object.keys(pi).length) {
      text += `${pi?.name || ""}\n${pi?.email || ""} | ${pi?.phone || ""} | ${pi?.location || ""}${pi?.linkedin ? ` | ${pi.linkedin}` : ""}${pi?.portfolio ? ` | ${pi.portfolio}` : ""}\n\n`;
    }
    if (content?.executive_summary || content?.summary) {
      text += `Executive Summary\n-----------------\n${content.executive_summary || content.summary}\n\n`;
    }
    if (content?.career_achievements?.length) {
      text += "Career Achievements\n-------------------\n";
      content.career_achievements.forEach(pillar => {
        text += `\n${(pillar.pillar_name || '').toUpperCase()}\n`;
        (pillar.items || []).forEach((item, i) => {
          const n = normalizeAchievementItem(item);
          text += `  ${i + 1}. ${n.text}${n.formula ? ` [${n.formula}]` : ""}\n`;
        });
      });
      text += "\n";
    }
    if (content?.skills?.length) {
      text += "Skills\n------\n" + content.skills.map(s => `• ${s}`).join("\n") + "\n\n";
    }
    if (content?.experience?.length) {
      text += "Experience\n---------\n";
      content.experience.forEach(exp => {
        text += `${exp.position || ""} at ${exp.company || ""} (${exp.duration || ""})\n`;
        if (exp.achievements?.length) exp.achievements.forEach(a => { text += `   - ${a}\n`; });
        text += "\n";
      });
    }
    if (content?.education?.length) {
      text += "Education\n---------\n";
      content.education.forEach(edu => { text += `${edu.degree || ""}, ${edu.institution || ""} ${edu.year ? `(${edu.year})` : ""}\n`; });
    }
    return text.trim();
  };

  const download = (type) => {
    const safeName = (resume?.version_name || "Resume").replace(/[\\/:*?"<>|]/g, "_");
    const content = draft || {};
    const text = type === "json" ? JSON.stringify({ version_name: resume?.version_name, content }, null, 2) : buildText(content);
    const mime = type === "json" ? "application/json" : type === "md" ? "text/markdown" : "text/plain";
    const ext = type;
    const blob = new Blob([text], { type: `${mime};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${safeName}.${ext}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return {
    resume, draft, setDraft, loading, saving, scoring, error, setError,
    baselineScore, currentScore, improved, hasUnsavedChanges,
    format, plain, updateField, rescore, saveEdits, download, searchParams, navigate
  };
}