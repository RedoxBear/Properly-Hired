export function generateAnswer(opts) {
  const {
    question,
    resumeText,
    jdText,
    style = "balanced",
    format = "plain",
    company = "",
    role = ""
  } = opts || {};

  const brief = (txt, n = 220) => (txt || "").slice(0, n);
  const summary = brief(resumeText, 1200);
  const jd = brief(jdText, 1200);

  const lengthHints =
    style === "concise" ? "Keep to 2–4 sentences." :
    style === "detailed" ? "Aim for 6–9 sentences, with a metric if possible." :
    "Aim for 3–6 sentences, include one metric if relevant.";

  const starOpen =
    format === "star"
      ? "Use STAR: Situation, Task, Action, Result. Be specific and measurable."
      : format === "bullets"
      ? "Answer in 3–5 short bullets, each starting with a strong verb."
      : "Use a natural, straightforward paragraph.";

  const roleLine = role ? `Target Role: ${role}.` : "";
  const companyLine = company ? `Company: ${company}.` : "";

  const base = [
    `Question: ${question || ""}`,
    roleLine,
    companyLine,
    `Candidate Summary: ${summary}`,
    `Job Themes: ${jd}`,
    `Guidance: ${lengthHints} ${starOpen} Mirror the job's language only if it reflects the candidate's real experience. Avoid buzzwords without evidence; prefer outcomes and metrics.`,
  ].join("\n");

  const hasMetrics = /\b(\d+%|\$\d+|[0-9]+ (days|customers|users|projects))\b/i.test(resumeText || "");
  const metricHint = hasMetrics ? " (including a measurable outcome I drove)" : "";

  if (format === "bullets") {
    return [
      `• I’m applying for ${role || "this role"} because the core of my experience aligns with your needs in ${pickThemes(jd)}`,
      `• In my recent work, I ${actionFromResume(summary)}${metricHint}.`,
      `• I’m especially motivated by ${company || "your team"}’s focus on ${pickThemes(jd, 1)} and believe I can contribute immediately.`,
      `• I prioritize clarity, ownership, and measurable results; examples include ${pickMetricExample(summary)}.`
    ].join("\n");
  }

  if (format === "star") {
    return [
      `Situation: ${situationFromResume(summary)}.`,
      `Task: I needed to ${taskFromResume(summary)}.`,
      `Action: I ${actionFromResume(summary)}.`,
      `Result: ${resultFromResume(summary, hasMetrics)}.`
    ].join("\n");
  }

  return (
    `I’m pursuing ${role || "this opportunity"} because my background maps well to your priorities in ${pickThemes(jd)}. ` +
    `Recently, I ${actionFromResume(summary)}${metricHint}, which translates directly to the outcomes you’re targeting. ` +
    `I value clear ownership, cross-functional collaboration, and measurable impact, and I’m confident I can help ${company || "the team"} accelerate results in this role.`
  );
}

// --- tiny phrase helpers
function pickThemes(jd, take = 2) {
  const picks = [...new Set(((jd || "").match(/\b(operations|people|hr|data|automation|process|customer|growth|quality|compliance|analytics|product|delivery|scale|efficiency|cost|onboarding|talent)\b/gi) || []))]
    .slice(0, take);
  return picks.length ? picks.join(", ") : "your core focus areas";
}
function actionFromResume(r) {
  return extractAny(r, [
    /(?:led|owned|built|designed|launched|optimized|automated|negotiated|implemented)\s[^.]+/i
  ], "led cross-functional initiatives end-to-end");
}
function pickMetricExample(r) {
  return extractAny(r, [
    /\b(reduced|improved|increased|saved|grew)\s[^.]+?\b(\d+%|\$\d+|[0-9]+ (days|hours|users|customers|projects))\b/i
  ], "reducing cycle time by 20% and improving quality");
}
function situationFromResume(r) {
  return extractAny(r, [/at\s[^.]+/, /during\s[^.]+/], "At my last company, a key process was underperforming");
}
function taskFromResume(r) {
  return extractAny(r, [/to\s[^.]+/], "to stabilize operations and improve efficiency");
}
function resultFromResume(r, hasMetrics) {
  return hasMetrics ? pickMetricExample(r) : "we hit targets ahead of plan and increased stakeholder satisfaction";
}
function extractAny(text, regs, fallback) {
  for (const rg of regs) { const m = (text || "").match(rg); if (m) return m[0]; }
  return fallback;
}