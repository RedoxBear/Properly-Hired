import React from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle2, Sparkles, Star, ArrowLeft } from "lucide-react";
import { createPageUrl } from "@/utils";
import { useEditorState } from "@/components/editor/useEditorState";
import EditorHeader from "@/components/editor/EditorHeader";
import PersonalInfoSection from "@/components/editor/PersonalInfoSection";
import SummarySection from "@/components/editor/SummarySection";
import SkillsSection from "@/components/editor/SkillsSection";
import ExperienceSection from "@/components/editor/ExperienceSection";
import EducationSection from "@/components/editor/EducationSection";
import PillarEditor from "@/components/editor/PillarEditor";
import AchievementPreview from "@/components/editor/AchievementPreview";
import FormatConverter, { achievementToChronological } from "@/components/editor/FormatConverter";
import AgentChat from "@/components/agents/AgentChat";
import AgentHandoffCard from "@/components/agents/AgentHandoffCard";

export default function AchievementEditor() {
  const {
    resume, draft, setDraft, loading, saving, scoring, error, setError,
    baselineScore, currentScore, improved, hasUnsavedChanges,
    format, updateField, rescore, saveEdits, download, searchParams, navigate
  } = useEditorState();

  const handleConvert = (targetFormat) => {
    if (targetFormat === "chronological") {
      const converted = achievementToChronological(draft);
      setDraft(converted);
      const resumeId = searchParams.get("resumeId");
      navigate(createPageUrl("ChronologicalEditor") + `?resumeId=${resumeId}`);
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
      <div className="min-h-screen p-6 flex flex-col items-center justify-center text-center space-y-3">
        <p className="text-slate-700">{error || "Resume not found."}</p>
        <Button onClick={() => navigate(createPageUrl("MyResumes"))} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to My Resumes
        </Button>
      </div>
    );
  }

  const isNew = searchParams.get("new") === "1";

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gray-50">
      <div className="max-w-6xl mx-auto space-y-6">
        {isNew && (
          <Alert className="border-amber-200 bg-amber-50">
            <AlertDescription className="text-amber-800">
              <strong>📝 Achievement-Based CV imported!</strong> Edit your pillars and achievements below.
            </AlertDescription>
          </Alert>
        )}
        {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

        <EditorHeader
          resume={resume}
          baselineScore={baselineScore}
          currentScore={currentScore}
          improved={improved}
          scoring={scoring}
          onRescore={rescore}
          onDownload={download}
          formatLabel="Achievement-Based"
          hasUnsavedChanges={hasUnsavedChanges}
        />

        {/* Format Converter */}
        <FormatConverter currentFormat="achievement" onConvert={handleConvert} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Editor Column */}
          <div className="space-y-6">
            <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
              <CardContent className="space-y-6 pt-6">
                <PersonalInfoSection
                  personalInfo={draft?.personal_info}
                  onChange={(pi) => updateField("personal_info", pi)}
                />

                <SummarySection
                  value={draft?.executive_summary || draft?.summary}
                  onChange={(v) => updateField("executive_summary", v)}
                  label="Executive Summary"
                />

                {/* Career Achievements Pillar Editor */}
                <PillarEditor
                  careerAchievements={draft?.career_achievements}
                  onChange={(ca) => updateField("career_achievements", ca)}
                />

                <SkillsSection
                  skills={draft?.skills}
                  onChange={(s) => updateField("skills", s)}
                />

                {/* Lightweight Experience */}
                <ExperienceSection
                  experience={draft?.experience}
                  onChange={(exp) => updateField("experience", exp)}
                  lightweight={true}
                />

                <EducationSection
                  education={draft?.education}
                  onChange={(edu) => updateField("education", edu)}
                />

                {/* Actions */}
                <div className="flex flex-wrap gap-3 pt-4 border-t">
                  <Button onClick={rescore} disabled={scoring} variant="outline" className="gap-2">
                    {scoring ? <><Loader2 className="w-4 h-4 animate-spin" /> Scoring</> : <><Sparkles className="w-4 h-4" /> Re-score</>}
                  </Button>
                  <Button onClick={saveEdits} disabled={saving} className="bg-amber-600 hover:bg-amber-700 gap-2">
                    {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving</> : "Save Changes"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Preview Column */}
          <div className="lg:sticky lg:top-20 lg:self-start">
            <AchievementPreview draft={draft} />
          </div>
        </div>

        {improved && !resume?.is_master_resume && (
          <Card className="border-0 shadow-lg bg-gradient-to-r from-green-50 to-emerald-50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-green-800">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                This version beats your baseline!
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Button
                onClick={async () => {
                  const resumeId = searchParams.get("resumeId");
                  if (!resumeId) return;
                  await base44.entities.Resume.update(resumeId, { is_master_resume: true });
                  navigate(createPageUrl("MyResumes"));
                }}
                className="bg-green-600 hover:bg-green-700 gap-2"
              >
                <Star className="w-4 h-4" /> Make this my Master Resume
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Floating Save */}
        {hasUnsavedChanges && (
          <div className="fixed bottom-6 right-6 z-50">
            <Button onClick={saveEdits} disabled={saving} size="lg" className="bg-amber-600 hover:bg-amber-700 shadow-2xl gap-2 px-8 py-6 text-base rounded-xl">
              {saving ? <><Loader2 className="w-5 h-5 animate-spin" /> Saving...</> : <><CheckCircle2 className="w-5 h-5" /> Save Changes</>}
            </Button>
          </div>
        )}

        <AgentHandoffCard variant="kyle" />
        <AgentChat agentName="kyle" agentTitle="Kyle - CV Expert" autoOpen={false} autoSendInitial={false} context={{ page: "AchievementEditor", resumeId: resume?.id }} />
      </div>
    </div>
  );
}