import React from "react";
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
import ChronologicalPreview from "@/components/editor/ChronologicalPreview";
import FormatConverter, { chronologicalToAchievement } from "@/components/editor/FormatConverter";
import AgentChat from "@/components/agents/AgentChat";
import AgentHandoffCard from "@/components/agents/AgentHandoffCard";

export default function ChronologicalEditor() {
  const {
    resume, draft, setDraft, loading, saving, scoring, error, setError,
    baselineScore, currentScore, improved, hasUnsavedChanges,
    format, updateField, rescore, saveEdits, download, searchParams, navigate
  } = useEditorState();

  const handleConvert = (targetFormat) => {
    if (targetFormat === "achievement") {
      const converted = chronologicalToAchievement(draft);
      setDraft(converted);
      // Navigate to achievement editor
      const resumeId = searchParams.get("resumeId");
      navigate(createPageUrl("AchievementEditor") + `?resumeId=${resumeId}`);
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
          <Alert className="border-blue-200 bg-blue-50">
            <AlertDescription className="text-blue-800">
              <strong>📝 Imported successfully!</strong> Edit your resume below and save when ready.
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
          formatLabel="Chronological"
          hasUnsavedChanges={hasUnsavedChanges}
        />

        {/* Format Converter */}
        <FormatConverter currentFormat="chronological" onConvert={handleConvert} />

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
                  value={draft?.summary || draft?.executive_summary}
                  onChange={(v) => updateField("summary", v)}
                  label="Professional Summary"
                />

                <SkillsSection
                  skills={draft?.skills}
                  onChange={(s) => updateField("skills", s)}
                />

                <ExperienceSection
                  experience={draft?.experience}
                  onChange={(exp) => updateField("experience", exp)}
                  lightweight={false}
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
                  <Button onClick={saveEdits} disabled={saving} className="bg-blue-600 hover:bg-blue-700 gap-2">
                    {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving</> : "Save Changes"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Preview Column */}
          <div className="lg:sticky lg:top-20 lg:self-start">
            <ChronologicalPreview draft={draft} />
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
            <Button onClick={saveEdits} disabled={saving} size="lg" className="bg-blue-600 hover:bg-blue-700 shadow-2xl gap-2 px-8 py-6 text-base rounded-xl">
              {saving ? <><Loader2 className="w-5 h-5 animate-spin" /> Saving...</> : <><CheckCircle2 className="w-5 h-5" /> Save Changes</>}
            </Button>
          </div>
        )}

        <AgentHandoffCard variant="kyle" />
        <AgentChat agentName="kyle" agentTitle="Kyle - CV Expert" autoOpen={false} autoSendInitial={false} context={{ page: "ChronologicalEditor", resumeId: resume?.id }} />
      </div>
    </div>
  );
}