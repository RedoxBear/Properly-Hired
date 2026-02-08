import { base44 } from "@/api/base44Client";

const KYLE_TRIGGERS = [
  "resume", "cv", "cover letter", "bullet", "optimize", "rewrite",
  "coaching", "improve", "ats", "action verb", "achievement", "arc",
  "star method", "interview prep", "career summary", "objective",
  "skills section", "experience section", "formatting", "template"
];

const SIMON_TRIGGERS = [
  "company", "industry", "market", "trade", "sector", "ghost job",
  "job quality", "job posting", "employer", "hiring", "trend",
  "salary", "compensation", "wage", "bls", "dol", "labor",
  "compliance", "workforce", "role classification", "job analysis"
];

/**
 * Classify user intent to decide if we should route to Kyle or Simon.
 * Returns "kyle" | "simon" | null
 */
export function classifyIntent(message) {
  const lower = message.toLowerCase();

  let kyleScore = 0;
  let simonScore = 0;

  for (const trigger of KYLE_TRIGGERS) {
    if (lower.includes(trigger)) kyleScore++;
  }
  for (const trigger of SIMON_TRIGGERS) {
    if (lower.includes(trigger)) simonScore++;
  }

  // Need at least 1 trigger match to route
  if (kyleScore === 0 && simonScore === 0) return null;

  if (simonScore > kyleScore) return "simon";
  if (kyleScore > simonScore) return "kyle";

  // Tie — default to kyle since we're in resume builder context
  return kyleScore > 0 ? "kyle" : null;
}

/**
 * Delegate to Kyle or Simon via InvokeLLM with structured output.
 */
export async function delegateToExpert(expert, context) {
  const { questionId, questionText, userAnswer, userMessage, resumeDraft } = context;

  const expertName = expert === "kyle" ? "Kyle (CV & Cover Letter Expert)" : "Simon (Recruiting & HR Expert)";

  const expertFocus = expert === "kyle"
    ? "Focus on: resume improvement, bullet rewrites (ARC formula), cover letter strategies, coaching tips, interview prep, and career document optimization."
    : "Focus on: industry analysis, company research, labor market context, ghost-job detection, role classification, trade/sector trends, and employer compliance.";

  const prompt = `You are ${expertName}, consulting for a user building their resume.

${expertFocus}

CONTEXT:
- The user is on Question ${(questionId || 0) + 1} of 8: "${questionText || "N/A"}"
- Their current answer draft: "${userAnswer || "(empty)"}"
- Their message to you: "${userMessage}"
${resumeDraft ? `- Resume draft so far: ${resumeDraft.substring(0, 500)}...` : ""}

Respond with a structured JSON:
- summary: 1-2 sentence expert insight
- action_items: array of exactly 3 short bullet-point recommendations
- rewrite_suggestion: 1 short example rewrite or improvement (if applicable, otherwise a brief tip)

Be concise, specific, and actionable. Do not repeat the question back.`;

  const result = await base44.integrations.Core.InvokeLLM({
    prompt,
    response_json_schema: {
      type: "object",
      properties: {
        summary: { type: "string" },
        action_items: { type: "array", items: { type: "string" } },
        rewrite_suggestion: { type: "string" }
      },
      required: ["summary", "action_items", "rewrite_suggestion"]
    }
  });

  return { expert, ...result };
}