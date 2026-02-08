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

// Explicit cross-referral phrases that override keyword scoring
const HANDOFF_TO_SIMON = [
  "about the company", "about the industry", "industry context",
  "company culture", "company research", "market data",
  "what does the industry", "tell me about the sector",
  "is this a ghost job", "is this posting real", "job quality",
  "what's the market like", "hiring trends", "labor market"
];

const HANDOFF_TO_KYLE = [
  "from the applicant", "as an applicant", "what should i do",
  "how should i position", "help with my resume", "improve my cv",
  "write a cover letter", "prepare for interview", "coaching",
  "how do i answer", "help me write", "optimize my", "rewrite my"
];

/**
 * Classify user intent to decide if we should route to Kyle or Simon.
 * Returns "kyle" | "simon" | null
 */
export function classifyIntent(message) {
  const lower = message.toLowerCase();

  // Check explicit handoff phrases first (highest priority)
  for (const phrase of HANDOFF_TO_SIMON) {
    if (lower.includes(phrase)) return "simon";
  }
  for (const phrase of HANDOFF_TO_KYLE) {
    if (lower.includes(phrase)) return "kyle";
  }

  // Fall back to keyword scoring
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
 * Get a human-friendly handoff message for the CVBot to display.
 */
export function getHandoffMessage(expert) {
  if (expert === "kyle") {
    return "I'll get **Career Coach Kyle** to assist you with that!";
  }
  if (expert === "simon") {
    return "I'll get **Simon the Insider** to help you with that inquiry!";
  }
  return null;
}

/**
 * Delegate to Kyle or Simon via InvokeLLM with structured output.
 * Includes cross-referral: Kyle suggests Simon for industry Qs, Simon suggests Kyle for applicant Qs.
 */
export async function delegateToExpert(expert, context) {
  const { questionId, questionText, userAnswer, userMessage, resumeDraft } = context;

  const expertName = expert === "kyle"
    ? "Kyle, the Career Coach"
    : "Simon, the Insider & Recruiting Expert";

  const expertFocus = expert === "kyle"
    ? `Focus on: resume improvement, bullet rewrites (ARC formula), cover letter strategies, coaching tips, interview prep, and career document optimization.

CROSS-REFERRAL: If the user's question is really about company research, industry analysis, market trends, or ghost-job detection, include in your summary: "For deeper industry and company context, I'd recommend asking Simon the Insider." Do NOT try to answer industry/company questions yourself — acknowledge and suggest Simon.`
    : `Focus on: industry analysis, company research, labor market context, ghost-job detection, role classification, trade/sector trends, and employer compliance.

CROSS-REFERRAL: If the user's question is really about resume writing, cover letters, interview prep, or how to position themselves as an applicant, include in your summary: "For applicant-side strategy and resume optimization, I'd recommend asking Career Coach Kyle." Do NOT try to answer resume/CV questions yourself — acknowledge and suggest Kyle.`;

  const prompt = `You are ${expertName}, consulting for a user building their resume.

${expertFocus}

CONTEXT:
- The user is on Question ${(questionId || 0) + 1} of 8: "${questionText || "N/A"}"
- Their current answer draft: "${userAnswer || "(empty)"}"
- Their message to you: "${userMessage}"
${resumeDraft ? `- Resume draft so far: ${resumeDraft.substring(0, 500)}...` : ""}

Respond with a structured JSON:
- summary: 1-2 sentence expert insight (include cross-referral to the other expert if the question overlaps their domain)
- action_items: array of exactly 3 short bullet-point recommendations
- rewrite_suggestion: 1 short example rewrite or improvement (if applicable, otherwise a brief tip)
- handoff_to: "kyle" or "simon" or null — set this if the question is better answered by the other expert

Be concise, specific, and actionable. Do not repeat the question back.`;

  const result = await base44.integrations.Core.InvokeLLM({
    prompt,
    response_json_schema: {
      type: "object",
      properties: {
        summary: { type: "string" },
        action_items: { type: "array", items: { type: "string" } },
        rewrite_suggestion: { type: "string" },
        handoff_to: { type: "string" }
      },
      required: ["summary", "action_items", "rewrite_suggestion"]
    }
  });

  return { expert, ...result };
}