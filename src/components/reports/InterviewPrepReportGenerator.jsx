import { base44 } from "@/api/base44Client";
import { retryWithBackoff } from "@/components/utils/retry";

/**
 * Generates a detailed interview prep report document (like Kyle's report) and stores it on the JobApplication.
 */
export async function generateInterviewPrepReport(applicationId) {
  const app = await base44.entities.JobApplication.get(applicationId);
  if (!app) return null;

  // Skip if already generated
  if (app.interview_prep_report_text) return app.interview_prep_report_text;

  const { job_title, company_name, job_description, summary } = app;
  const simonBrief = summary?.simon_brief || {};
  const interviewPrep = summary?.interview_prep;
  const research = summary?.research_snapshot || {};

  // Try to get resume text
  let resumeSnippet = "";
  if (app.optimized_resume_id) {
    try {
      const resume = await base44.entities.Resume.get(app.optimized_resume_id);
      resumeSnippet = (resume?.optimized_content || resume?.parsed_content || "").slice(0, 2000);
    } catch (_) {}
  }

  const prompt = `You are Kyle, an elite Executive Performance Coach and interview strategist. Generate a comprehensive INTERVIEW PREPARATION document for this candidate.

JOB: ${job_title} at ${company_name}
JD: ${(job_description || "").slice(0, 3000)}

SIMON'S INTELLIGENCE BRIEF:
- Ghost Score: ${simonBrief.ghost_job_score ?? "N/A"}/100
- Risk Level: ${simonBrief.risk_level || "N/A"}
- Role: ${simonBrief.role_classification?.role_type || "N/A"} / ${simonBrief.role_classification?.tier || "N/A"}
- Strategy: ${JSON.stringify(simonBrief.strategy_for_kyle || {})}
- O*NET: ${JSON.stringify(simonBrief.onet_benchmark || {})}

RESEARCH SNAPSHOT:
${JSON.stringify(research)}

CANDIDATE RESUME SNIPPET:
${resumeSnippet || "Not available"}

${interviewPrep ? `EXISTING PREP DATA: ${JSON.stringify(interviewPrep).slice(0, 2000)}` : ""}

Generate a DETAILED interview preparation report in plain text structured EXACTLY like this:

================================================================================
INTERVIEW PREPARATION - ${job_title} at ${company_name}
================================================================================

Generated: [current date]
Role Type: [role classification]

================================================================================
BENCHMARKED STRATEGY (Psychology, Strategy, HR)
================================================================================

[2-3 paragraphs of master interview strategy. Include:
- The candidate's core positioning statement
- The psychological approach (confidence anchoring, mirroring, strategic vulnerability)
- How to leverage the company's culture/values]

---

### Master Interview Strategy: [Job Title]

**Your Goal:** [1-2 sentence positioning statement]

**Core Narrative:** [2-3 sentences on the story arc to tell]

**Psychological Framework:** [key psychological strategies to employ]

================================================================================
LIKELY INTERVIEW QUESTIONS & BEST ANSWERS
================================================================================

[Generate 8-12 questions across behavioral, situational, technical, and culture categories]

For each question:
**Q[N]: "[Question text]"**
Category: [behavioral/situational/technical/culture]
Why They Ask: [1-2 sentences]
Best Answer Strategy: [2-3 sentences with specific guidance referencing the candidate's experience]
STAR Hook: [specific story anchor]

---

================================================================================
QUESTIONS TO ASK THE INTERVIEWER
================================================================================

### Strategic Questions
[3-4 questions that position you as a strategic thinker]

### Narrative Questions
[3-4 questions that demonstrate curiosity about the company story]

### Value-Driving Questions
[3-4 questions showing you're focused on delivering results]

### Insightful Questions
[3-4 questions showing deep research and understanding]

================================================================================
STAR STORY TEMPLATES
================================================================================

[3-4 STAR templates tailored to this role]

**Story [N]: [Scenario Title]**
Situation: [specific context]
Task: [what needed to be done]
Action: [what the candidate did]
Result: [quantified outcome]
Coaching Note: [how to deliver this story effectively]

================================================================================
O*NET ROLE FIT CONTEXT
================================================================================

Work Styles to Demonstrate: [list]
Role Values Alignment: [list]
RIASEC Fit: [description]

================================================================================
PREPARATION CHECKLIST
================================================================================

[10-12 specific, actionable preparation items]
□ [Item 1]
□ [Item 2]
...

================================================================================
FINAL COACHING NOTES
================================================================================

[2-3 paragraphs of final advice, including:
- What to wear/bring
- Energy management tips
- Key phrases to use/avoid
- How to close strong]

Be thorough, specific, and reference the candidate's actual experience where possible.`;

  const response = await retryWithBackoff(
    () => base44.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: false,
    }),
    { retries: 2, baseDelay: 1000 }
  );

  const reportText = typeof response === "string" ? response : (response?.response || response?.content || response?.text || "");

  await base44.entities.JobApplication.update(applicationId, {
    interview_prep_report_text: reportText
  });

  return reportText;
}