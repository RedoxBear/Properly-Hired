/**
 * Kyle Agent 2.0 - Applicant-Side Intelligence
 * 
 * ROLE: The "Strategic Storyteller" & Career Coach.
 * GOAL: Transform "Employee Records" into "Hero Narratives" using Psychology.
 */

class KyleAgent {
  constructor(llmClient) {
    this.llm = llmClient;
    this.systemPrompt = this.buildSystemPrompt();
  }

  buildSystemPrompt() {
    return `You are Kyle, an elite Executive Career Coach operating under the "HR CV & Application Tailoring" Systematic Framework.

**YOUR OPERATING PIPELINE:**

**PART 0: PRELIMINARY ANALYSIS**
1. **Classify Role Level:** Strategic/Executive, Operational/Management, Specialist, or Shared Services.
2. **Extract Responsibility Clusters:** Group JD into 4-5 clusters with percentage weights (summing to 100%).
3. **Signal Identification:** List Explicit Signals (must-haves) and Implicit Signals (tone/framing triggers).

**PART 1: CV VARIANT SELECTION & FRAMING**
- Select Variant: Master_CV, V4 (Strategic), or V4.1 (Shared Services).
- Right-Size Profile: 120-150 words max. Lead with the heaviest cluster. Match JD title level.
- Real Estate Allocation: Adjust bullet density to match cluster weights. Compare actual vs. target allocation.
- Technical Skills: Curate into Tier 1 (Explicit), Tier 2 (Secondary), and Tier 3 (Omit).
- Experience Rewording: Front-load matching clusters, quantify impact, and use JD-specific language. Limit: 7 bullets per role. Focus on Career Progression and Zero Redundancy.

**PART 2: COVER LETTER GENERATION**
- Structure: 3 paragraphs (Opening: Cluster 1 | Middle: Clusters 2-3 | Closing: Cluster 4 + Fit).
- Tone Calibration: Strategic (Visionary), Operational (Execution), Shared Services (Efficiency), or Specialist (Domain-expert).

**PART 3: APPLICATION ANSWERS & CONSISTENCY**
- Follow specific templates for "Experience," "Interest," and "Challenges."
- Consistency Audit: Metrics, terminology, and accomplishments must match across all documents.

**PART 4: QUALITY CHECKLIST**
- Run Instruction 6.1, 6.2, and 6.3 before final delivery.

**VISUAL STANDARD:**
- 40-character underscores (________________________________________)
- Pipe-delimited metrics bar.
- Strategic Impact headers.`;
  }

  async optimizeResume(resumeData, jobDescription, simonIntel) {
    const prompt = `
[STEP 1: REVIEW SIMON'S INTEL]
Simon's Analysis: ${JSON.stringify(simonIntel)}

[STEP 2: OPTIMIZE]
Target Job: ${simonIntel.job_title}
Master CV: ${JSON.stringify(resumeData)}

[TASK]
1. Map the JD requirements to the Master CV. Identify Gaps.
2. Rewrite the experience section. Use between 3-7 bullets per role based on the complexity required by the JD.
3. Ensure bullets demonstrate "Career Progression" (e.g., increased headcount, budget, or technical complexity).
4. Remove redundant bullets. If you proved "Workday Expert" in 2024, don't waste a bullet on it in 2015 unless the 2015 context is different.

Return JSON: { "optimized_cv": "text", "coverage_map": {}, "progression_highlights": [] }
`;
    // ... logic to call LLM and return
  }

  async optimizeResume(resumeData, jobDescription, targetRole = null) {
    const prompt = `
Rewrite this resume to position the candidate as the *perfect solution* for this specific Job Description.

**Target Role/Context:** ${targetRole || 'Best Match'}
**Job Description (The Problem):**
${jobDescription}

**Resume Data (The Solution):**
${JSON.stringify(resumeData, null, 2)}

**Task:**
1. Identify the "Narrative Arc" (e.g., "From Junior Dev to System Architect").
2. Rewrite the top 3-5 bullet points using the CAR framework (Context, Action, Result) to directly address the JD's "Hair on Fire" pain points.
3. Quantify results where possible (estimate if needed, but mark as [Estimate]).

Return JSON:
{
  "narrative_strategy": "String explaining the angle",
  "optimized_summary": "A punchy 3-sentence professional summary",
  "bullet_transformations": [
    {
      "original": "Old bullet text",
      "optimized": "New CAR-format bullet",
      "reasoning": "Why this change matters"
    }
  ],
  "keyword_injection": ["List of keywords naturally added"],
  "readability_score": 0-100
}
`;

    try {
      const response = await this.llm.chat(this.systemPrompt, prompt);
      return this.parseOptimization(response);
    } catch (error) {
      console.error('Kyle 2.0 optimization error:', error);
      throw error;
    }
  }

  async generateCoverLetter(resumeData, jobDescription, companyName, options = {}) {
    const prompt = `
Write a "Sniper" Cover Letter. No "To Whom It May Concern". No generic fluff.

**Company:** ${companyName}
**Job Description:**
${jobDescription}

**Candidate Highlights:**
${JSON.stringify(resumeData.experience ? resumeData.experience.slice(0, 2) : "See Resume", null, 2)}

**Strategy:**
1. **The Hook:** Sentence 1 must address the company's specific challenge (inferred from JD).
2. **The Proof:** Paragraph 2 connects a specific past win to that challenge.
3. **The Close:** Confident, not desperate.

Return JSON:
{
  "hook_sentence": "The opening line",
  "body_paragraphs": ["Para 1", "Para 2"],
  "closing": "The sign-off",
  "full_text": "The complete letter formatted with newlines"
}
`;
    try {
      const response = await this.llm.chat(this.systemPrompt, prompt);
      return this.parseCoverLetter(response);
    } catch (error) {
      console.error('Kyle 2.0 cover letter error:', error);
      throw error;
    }
  }

  async prepareInterviewAnswers(resumeData, jobDescription, questionType = 'behavioral') {
    const prompt = `
Play "The Devil's Advocate". Look at this resume vs. the JD and find the Weakest Link.

**Resume:**
${JSON.stringify(resumeData, null, 2)}
**JD:**
${jobDescription}

**Task:**
1. Identify the "Gap" (e.g., missing skill, short tenure, title mismatch).
2. Formulate the *hardest* question a skeptic interviewer would ask.
3. Draft a "Pivot Answer" that acknowledges the gap but steers to a strength.

Return JSON:
{
  "identified_weakness": "String",
  "hardest_question": "The question",
  "suggested_answer_strategy": "How to pivot",
  "sample_response": "Verbatim script"
}
`;
    try {
      const response = await this.llm.chat(this.systemPrompt, prompt);
      return this.parseInterviewPrep(response);
    } catch (error) {
      console.error('Kyle 2.0 interview prep error:', error);
      throw error;
    }
  }

  async parseResume(rawText) {
     // Basic pass-through to LLM for extraction
     const prompt = `Extract structured JSON from this resume text: ${rawText.substring(0, 3000)}... 
     Return schema: { contact: {}, skills: [], experience: [], education: [] }`;
     try {
       const response = await this.llm.chat(this.systemPrompt, prompt);
       return JSON.parse(response);
     } catch (e) {
       return { error: "Parse failed" };
     }
  }
  
  // --- Parsers ---

  parseOptimization(response) {
    try {
      return JSON.parse(response);
    } catch (error) {
      return { error: 'Failed to parse optimization', rawResponse: response };
    }
  }

  parseCoverLetter(response) {
    try {
      const parsed = JSON.parse(response);
      // Ensure full_text exists if not returned by LLM
      if (!parsed.full_text && parsed.hook_sentence) {
        parsed.full_text = `${parsed.hook_sentence}\n\n${parsed.body_paragraphs.join('\n\n')}\n\n${parsed.closing}`;
      }
      return parsed;
    } catch (error) {
      return { error: 'Failed to parse cover letter', rawResponse: response };
    }
  }

  parseInterviewPrep(response) {
    try {
      return JSON.parse(response);
    } catch (error) {
      return { error: 'Failed to parse interview prep', rawResponse: response };
    }
  }

  // Legacy method support if needed
  async screenResume(resume, jd) {
      return this.optimizeResume(resume, jd); 
  }
  async answerApplicationQuestions(resume, jd, q) {
      return this.prepareInterviewAnswers(resume, jd);
  }
}

module.exports = KyleAgent;