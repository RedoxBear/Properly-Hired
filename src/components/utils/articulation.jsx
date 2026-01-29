/* Career articulation analyzer (JS)

Exports:
- analyzeResumeAgainstJD(resume, jd): ArticulationResult
*/

import { resumeAPI } from "@/api/client";

const METRIC_TOKENS = ["%", "$", "k", "k+", "million", "billion", "x", "reduced", "increased", "improved", "grew", "saved"];
const VAGUE_PHRASES = ["responsible for", "worked on", "involved in", "helped with", "assisted with"];
const OUTDATED_STACK = ["cobol", "vb6", "flash", "silverlight"];

function pct(n) { return Math.max(0, Math.min(100, Math.round(n))); }

function localHeuristicAnalysis(resume, jd) {
  const r = (resume || "").toLowerCase();
  const j = (jd || "").toLowerCase();

  const lines = r.split(/\n+/);
  const expLines = lines.filter(l =>
    /experience|project|role|manager|engineer|director|lead|analyst|consultant/i.test(l) || /•|- /.test(l)
  );

  // Evidence: presence of metrics/quantifiers in exp bullets
  const metricHits = expLines.filter(l => METRIC_TOKENS.some(t => l.includes(t)));
  const evidence = pct((metricHits.length / Math.max(1, expLines.length)) * 100);

  // Vague phrasing density
  const vagueHits = expLines.filter(l => VAGUE_PHRASES.some(p => l.includes(p)));
  const coherence = pct(100 - (vagueHits.length / Math.max(1, expLines.length)) * 60); // penalize vague

  // Growth: very naive seniority proxy
  const seniorTokens = ["senior", "sr.", "lead", "manager", "head", "director", "principal"];
  const juniorTokens = ["junior", "intern", "assistant"];
  const seniorCount = (r.match(new RegExp(`\\b(${seniorTokens.join("|")})\\b`, "gi")) || []).length;
  const juniorCount = (r.match(new RegExp(`\\b(${juniorTokens.join("|")})\\b`, "gi")) || []).length;
  const growth = pct(50 + Math.min(50, (seniorCount - juniorCount) * 10));

  // Freshness: outdated stack penalty + JD alignment nudge
  const outdatedHits = OUTDATED_STACK.filter(s => r.includes(s)).length;
  const jdRoleTokens = (j.match(/\b(data|hr|people|operations|product|marketing|sales|design|engineering|finance)\b/g) || []).length;
  const freshness = pct(100 - outdatedHits * 20 + Math.min(10, jdRoleTokens * 2));

  // Composite
  const overall = pct(Math.round(evidence * 0.35 + coherence * 0.30 + growth * 0.20 + freshness * 0.15));

  // Flags
  const flags = [];

  if (evidence < 65) {
    flags.push({
      id: "evidence-low",
      severity: "critical",
      title: "Add measurable outcomes",
      detail: "Your experience bullets lack metrics and impact statements.",
      suggestion: "Add %/$/time savings/volume (e.g., “Reduced onboarding time by 32% → 8 days”).",
      section: "experience",
    });
  }
  if (vagueHits.length > 0) {
    flags.push({
      id: "vague-bullets",
      severity: "warn",
      title: "Vague phrasing detected",
      detail: `Found ${vagueHits.length} bullets with weak verbs (e.g., “responsible for”).`,
      suggestion: "Rewrite with strong verbs + outputs (e.g., “Designed X resulting in Y”).",
      section: "experience",
    });
  }
  if (growth < 60) {
    flags.push({
      id: "growth-unclear",
      severity: "warn",
      title: "Career progression unclear",
      detail: "Title progression or scope growth isn’t obvious.",
      suggestion: "Add scope signals (team size, budget, seniority, cross-function partners).",
      section: "summary",
    });
  }
  if (/20(1[0-5]|0[0-9])/.test(r)) {
    flags.push({
      id: "stale-dates",
      severity: "info",
      title: "Older experience dominates",
      detail: "Most recent roles appear more than ~10 years old.",
      suggestion: "Condense older roles; emphasize recent, relevant impact.",
      section: "experience",
    });
  }
  if (outdatedHits > 0) {
    flags.push({
      id: "outdated-stack",
      severity: "info",
      title: "Outdated tools referenced",
      detail: `Detected: ${OUTDATED_STACK.filter(s => r.includes(s)).join(", ")}`,
      suggestion: "Add modern equivalents or remove if irrelevant to the target JD.",
      section: "skills",
    });
  }

  if (j && !sharesEnoughTerms(r, j)) {
    flags.push({
      id: "alignment-low",
      severity: "warn",
      title: "Low alignment to this job",
      detail: "Your resume doesn’t strongly reflect key themes from this JD.",
      suggestion: "Mirror the JD’s language where true to your experience.",
      section: "summary",
    });
  }

  return { scores: { coherence, growth, evidence, freshness, overall }, flags };
}

function sharesEnoughTerms(r, j) {
  const rTerms = new Set(r.split(/\W+/).filter(Boolean));
  const jTerms = (j.match(/\b\w+\b/g) || []).filter(Boolean);
  let hit = 0;
  for (const t of jTerms) if (rTerms.has(t)) hit++;
  return hit > Math.max(10, jTerms.length * 0.08);
}

export async function analyzeResumeAgainstJD(resume, jd) {
  try {
    // Attempt to use AI Backend (Kyle Agent)
    // resumeAPI expects { resumeData: ..., jobDescription: ... }
    // Since 'resume' here is raw text, we might need to wrap it or parse it first.
    // However, resumeAPI.analyze expects JSON resumeData generally, but let's see if we can pass text.
    // The current backend implementation of analyzeResume expects resumeData JSON.
    // So we might need to construct a minimal JSON object wrapping the text if we don't have the structured data handy.
    
    // Construct a pseudo-resume object for the API if we only have text
    const resumeDataPayload = {
      raw_text: resume,
      // If we had structured data we would pass it, but this function signature only takes text string 'resume'.
      // The backend 'analyzeResume' logic (Kyle) handles JSON. 
      // We'll wrap the text in a 'summary' field or just pass it as a custom field the backend can handle.
      summary: resume 
    };

    const aiResult = await resumeAPI.analyze(resumeDataPayload, jd || "General Review");

    // Map AI result to { scores, flags } format
    const overall = aiResult.score || 0;
    
    // AI returns 'strengths', 'weaknesses', 'fixes'
    const flags = [];
    
    (aiResult.weaknesses || []).forEach((weakness, i) => {
      flags.push({
        id: `ai-weakness-${i}`,
        severity: "warn",
        title: "Weakness Detected",
        detail: weakness,
        suggestion: (aiResult.fixes && aiResult.fixes[i]) ? aiResult.fixes[i] : "Review and improve this area.",
        section: "summary"
      });
    });

    // If no flags from AI, maybe it passed?
    if (flags.length === 0 && overall < 100) {
       flags.push({
         id: "ai-general",
         severity: "info",
         title: "AI Review",
         detail: aiResult.summary || "Review complete.",
         suggestion: "See fixes below.",
         section: "summary"
       });
    }

    return {
      scores: {
        coherence: overall, // Proxy
        growth: overall,    // Proxy
        evidence: overall,  // Proxy
        freshness: overall, // Proxy
        overall: overall
      },
      flags: flags
    };

  } catch (error) {
    console.warn("AI Analysis failed, falling back to local heuristics:", error);
    return localHeuristicAnalysis(resume, jd);
  }
}