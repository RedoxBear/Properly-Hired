import { base44 } from "@/api/base44Client";
import { retryWithBackoff } from "@/components/utils/retry";

/**
 * Generates a detailed analysis report document (like Simon's report) and stores it on the JobApplication.
 * Called automatically during the handoff from Job Analysis → Resume Optimizer.
 */
export async function generateAnalysisReport(applicationId) {
  const app = await base44.entities.JobApplication.get(applicationId);
  if (!app) return null;

  // Skip if already generated
  if (app.analysis_report_text) return app.analysis_report_text;

  const { job_title, company_name, job_description, summary, llm_analysis_result } = app;
  const simonBrief = summary?.simon_brief || {};
  const research = summary?.research_snapshot || {};

  const prompt = `You are Simon, a recruiting intelligence analyst. Generate a comprehensive ANALYSIS REPORT for this job application.

JOB: ${job_title} at ${company_name}
JD: ${(job_description || "").slice(0, 3000)}

SIMON'S BRIEF:
- Ghost Score: ${simonBrief.ghost_job_score ?? "N/A"}/100
- Risk Level: ${simonBrief.risk_level || "N/A"}
- Role Classification: ${JSON.stringify(simonBrief.role_classification || {})}
- Agency Detection: ${JSON.stringify(simonBrief.agency_detection || {})}
- O*NET Benchmark: ${JSON.stringify(simonBrief.onet_benchmark || {})}
- Strategy for Kyle: ${JSON.stringify(simonBrief.strategy_for_kyle || {})}
- Overall Recommendation: ${JSON.stringify(simonBrief.overall_recommendation || {})}

RESEARCH SNAPSHOT:
${JSON.stringify(research)}

LLM ANALYSIS:
- Key Requirements: ${(llm_analysis_result?.key_requirements || []).join(", ")}
- Company Culture: ${llm_analysis_result?.company_culture || "N/A"}
- Seniority Level: ${llm_analysis_result?.seniority_level || "N/A"}
- AI Generated Likelihood: ${llm_analysis_result?.ai_generated_likelihood || 0}%
- Humanization Tips: ${llm_analysis_result?.humanization_tips || "N/A"}
- Application Strategy: ${llm_analysis_result?.application_strategy || "N/A"}

ATS Keywords: ${(summary?.ats_keywords || []).join(", ")}
Role Differences: ${(summary?.role_differences || []).join("; ")}
Candidate Matches: ${(summary?.candidate_matches || []).join("; ")}
Interviewer Tips: ${(summary?.interviewer_tips || []).join("; ")}

Generate a DETAILED analysis report in plain text format structured EXACTLY like this:

# ANALYSIS REPORT: [Job Title] at [Company]
Generated: [current date]
Seniority Tier: [tier]

================================================================================
GHOST JOB AUDIT (Simon)
================================================================================
Score: [X]/100
Verdict: [risk level]
Rationale: [detailed 3-5 sentence explanation of ghost job indicators, positive signals, and overall assessment]

================================================================================
ROLE CLASSIFICATION
================================================================================
Role Type: [type]
Tier: [tier]
Positive Signals:
- [signal 1]
- [signal 2]
Indicators/Concerns:
- [indicator 1]
- [indicator 2]

================================================================================
COMPANY OVERVIEW
================================================================================
[Company overview paragraph including industry, size, headquarters, founded, website if available]

================================================================================
KEY REQUIREMENTS ANALYSIS
================================================================================
[For each key requirement, provide a bullet with assessment of difficulty and importance]

================================================================================
ATS KEYWORD STRATEGY
================================================================================
Must-Have Keywords: [list]
Nice-to-Have Keywords: [list]
Keyword Density Strategy: [brief guidance]

================================================================================
ROLE VS CANDIDATE GAP ANALYSIS
================================================================================
Strengths (Covered):
- [strength 1]
- [strength 2]
Gaps (Need Attention):
- [gap 1]
- [gap 2]

================================================================================
APPLICATION STRATEGY (Simon → Kyle Handoff)
================================================================================
Approach: [recommended approach]
Tone: [recommended tone]
Must-Win Priorities:
1. [priority 1]
2. [priority 2]
3. [priority 3]
Avoid:
- [thing to avoid 1]
- [thing to avoid 2]

================================================================================
OVERALL RECOMMENDATION
================================================================================
Decision: [STRONGLY PURSUE / PURSUE / CONSIDER / SKIP]
Confidence: [X]%
Reasoning: [2-3 sentence reasoning]

Be thorough, specific, and actionable. Use real data from the analysis, don't fabricate.`;

  const response = await retryWithBackoff(
    () => base44.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: false,
    }),
    { retries: 2, baseDelay: 1000 }
  );

  const reportText = typeof response === "string" ? response : (response?.response || response?.content || response?.text || "");

  // Store on the application
  await base44.entities.JobApplication.update(applicationId, {
    analysis_report_text: reportText
  });

  return reportText;
}