import React from "react";
import { base44 } from "@/api/base44Client";
import { useSearchParams, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Loader2 } from "lucide-react";

/**
 * Router: detects the resume format and redirects to the appropriate editor.
 * - If resume has career_achievements → AchievementEditor
 * - Otherwise → ChronologicalEditor
 */
export default function ResumeEditor() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  React.useEffect(() => {
    const resumeId = searchParams.get("resumeId");
    const isNew = searchParams.get("new");
    const forceFormat = searchParams.get("format"); // allow explicit override

    if (!resumeId) {
      navigate(createPageUrl("MyResumes"));
      return;
    }

    (async () => {
      try {
        if (forceFormat === "achievement") {
          navigate(createPageUrl("AchievementEditor") + `?resumeId=${resumeId}${isNew ? "&new=1" : ""}`, { replace: true });
          return;
        }
        if (forceFormat === "chronological") {
          navigate(createPageUrl("ChronologicalEditor") + `?resumeId=${resumeId}${isNew ? "&new=1" : ""}`, { replace: true });
          return;
        }

        // Auto-detect format
        const r = await base44.entities.Resume.get(resumeId);
        let hasAchievements = false;

        if (r) {
          const safeParse = (v) => {
            if (!v) return null;
            if (typeof v === "object") return v;
            try { return JSON.parse(v); } catch { return null; }
          };
          const optimized = safeParse(r.optimized_content);
          const parsed = safeParse(r.parsed_content);
          const content = (r.is_master_resume === false && optimized) ? optimized : parsed || optimized;
          hasAchievements = content?.career_achievements?.length > 0;
        }

        const target = hasAchievements ? "AchievementEditor" : "ChronologicalEditor";
        navigate(createPageUrl(target) + `?resumeId=${resumeId}${isNew ? "&new=1" : ""}`, { replace: true });
      } catch (e) {
        console.error("Error detecting format:", e);
        navigate(createPageUrl("ChronologicalEditor") + `?resumeId=${resumeId}${isNew ? "&new=1" : ""}`, { replace: true });
      }
    })();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen p-6 flex items-center justify-center">
      <div className="text-center space-y-3">
        <Loader2 className="w-6 h-6 animate-spin text-slate-500 mx-auto" />
        <p className="text-sm text-slate-600">Detecting resume format...</p>
      </div>
    </div>
  );
}