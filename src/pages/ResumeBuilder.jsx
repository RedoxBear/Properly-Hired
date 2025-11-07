
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Sparkles, FileText } from "lucide-react";
import QuestionCard from "@/components/builder/QuestionCard";
import { InvokeLLM } from "@/integrations/Core";
import { Resume } from "@/entities/Resume";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import VoiceCapture from "@/components/builder/VoiceCapture";
import { retryWithBackoff } from "@/components/utils/retry";
import { analyzeResumeAgainstJD } from "@/components/utils/articulation";
import { resumeJsonToPlainText } from "@/components/utils/resumeText";

const QUESTIONS = [
  "Tell me about yourself.",
  "What is your career goal?",
  "What inspires you?",
  "Tell me about your past experience.",
  "What do you think the best quality of yours?",
  "Your current Education and Skills?",
  "Any certifications, publications, and awards you'd like people to know?",
  "If you have a million dollars today, what would you do about it?"
];

export default function ResumeBuilder() {
  const [answers, setAnswers] = React.useState(Array(QUESTIONS.length).fill(""));
  const [error, setError] = React.useState("");
  const [building, setBuilding] = React.useState(false);
  const navigate = useNavigate();
  const [voiceTranscript, setVoiceTranscript] = React.useState("");

  const updateAnswer = (i, val) => {
    const next = [...answers];
    next[i] = val;
    setAnswers(next);
  };

  const buildWithAI = async () => {
    setError("");
    const hasAny = answers.some(a => (a || "").trim().length > 0) || (voiceTranscript || "").trim().length > 0;
    if (!hasAny) {
      setError("Please add at least one answer or voice transcript.");
      return;
    }

    const totalChars = answers.join(" ").length + (voiceTranscript || "").length;
    if (totalChars < 200) {
      const ok = window.confirm("Your input is quite short. Would you like to add more before building?");
      if (!ok) return;
    }

    setBuilding(true);

    const prompt = `
You are a professional resume writer. Convert the user's answers and/or full voice transcript into a structured, ATS-friendly resume JSON.

Answers:
1) About yourself: ${answers[0]}
2) Career goal: ${answers[1]}
3) Inspiration: ${answers[2]}
4) Past experience: ${answers[3]}
5) Best qualities: ${answers[4]}
6) Education & skills: ${answers[5]}
7) Certifications, publications, awards: ${answers[6]}
8) If had a million dollars: ${answers[7]}

Voice Transcript (long-form dialog, may include extra details):
${voiceTranscript}

Return a single JSON matching this schema:
- personal_info: { name?: string, email?: string, phone?: string, location?: string, linkedin?: string, portfolio?: string }
- summary: string
- skills: string[]
- experience: array of { company?: string, position?: string, duration?: string, location?: string, achievements?: string[] }
- education: array of { institution?: string, degree?: string, year?: string }
- certifications: string[]
- publications: string[]
- awards: string[]

Ensure the JSON is concise, truthful, and structured for resume templates.
    `;

    try {
      const resp = await retryWithBackoff(() =>
        InvokeLLM({
          prompt,
          response_json_schema: {
            type: "object",
            properties: {
              personal_info: { type: "object", additionalProperties: true },
              summary: { type: "string" },
              skills: { type: "array", items: { type: "string" } },
              experience: { type: "array", items: { type: "object", additionalProperties: true } },
              education: { type: "array", items: { type: "object", additionalProperties: true } },
              certifications: { type: "array", items: { type: "string" } },
              publications: { type: "array", items: { type: "string" } },
              awards: { type: "array", items: { type: "string" } }
            }
          }
        })
      , { retries: 3, baseDelay: 1200 });

      const versionName = `Master Resume (Q&A) - ${format(new Date(), "MMM d, yyyy")}`;

      // Self-check analysis on AI-built master
      const plain = resumeJsonToPlainText(resp || {});
      const analysis = analyzeResumeAgainstJD(plain, "");

      const payload = {
        version_name: versionName,
        original_file_url: "generated://builder",
        parsed_content: JSON.stringify(resp),
        optimized_content: null,
        is_master_resume: true,
        personal_info: resp.personal_info || {},
        skills: resp.skills || [],
        experience: resp.experience || [],
        education: resp.education || [],
        // NEW: quality
        quality_scores: analysis?.scores || null,
        quality_flags: analysis?.flags || [],
        quality_last_analyzed_at: new Date().toISOString()
      };

      const created = await Resume.create(payload);
      navigate(createPageUrl(`ResumeTemplates?resumeId=${created.id}`));
    } catch (e) {
      console.error(e);
      setError("Service is busy. Please try again in a minute.");
    }
    setBuilding(false);
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              Build Your Resume From Scratch
            </CardTitle>
            <p className="text-sm text-slate-600 mt-1">
              Answer by voice or typing. We’ll structure a professional resume for you and let you pick a template.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <VoiceCapture
              transcript={voiceTranscript}
              setTranscript={setVoiceTranscript}
              onUseTranscript={buildWithAI}
              i18n={{
                header: { builder_title: "Voice Session" },
                controls: {
                  start_voice_session: "Start Voice Session",
                  stop_voice_session: "Stop Voice Session",
                  clear_transcript: "Clear Transcript",
                  use_transcript: "Use Transcript to Build",
                }
              }}
            />

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid gap-4">
              {QUESTIONS.map((q, i) => (
                <QuestionCard
                  key={i}
                  index={i + 1}
                  question={q}
                  value={answers[i]}
                  onChange={(v) => updateAnswer(i, v)}
                />
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button
                onClick={buildWithAI}
                disabled={building}
                className="bg-blue-600 hover:bg-blue-700 gap-2"
              >
                {building ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Build Resume with AI
              </Button>
              <div className="text-sm text-slate-500 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Tip: You can capture a long conversation and build from it.
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
