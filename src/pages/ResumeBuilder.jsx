import React from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { InvokeLLM } from "@/integrations/Core";
import { Resume } from "@/entities/Resume";
import { createPageUrl } from "@/utils";
import { retryWithBackoff } from "@/components/utils/retry";
import { analyzeResumeAgainstJD } from "@/components/utils/articulation";
import { resumeJsonToPlainText } from "@/components/utils/resumeText";
import CVWizard, { QUESTIONS } from "@/components/builder/CVWizard";

export default function ResumeBuilder() {
  const [isBuilding, setIsBuilding] = React.useState(false);
  const navigate = useNavigate();

  const buildWithAI = async (answers, voiceTranscript) => {
    setIsBuilding(true);

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
${voiceTranscript || ""}

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
        quality_scores: analysis?.scores || null,
        quality_flags: analysis?.flags || [],
        quality_last_analyzed_at: new Date().toISOString()
      };

      const created = await Resume.create(payload);

      // Clear draft after successful build
      localStorage.removeItem("cvbuilder_draft");

      navigate(createPageUrl(`ResumeTemplates?resumeId=${created.id}`));
    } catch (e) {
      console.error(e);
      alert("Service is busy. Please try again in a minute.");
    } finally {
      setIsBuilding(false);
    }
  };

  return (
    <CVWizard
      onBuild={buildWithAI}
      isBuilding={isBuilding}
    />
  );
}
