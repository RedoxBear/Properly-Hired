/**
 * Simon Agent 2.0 - Employer-Side Intelligence
 * 
 * ROLE: The "Hiring Committee" Simulator.
 * GOAL: Reverse-engineer hiring intent, decode political landscape, and act as the gatekeeper.
 */

class SimonAgent {
  constructor(llmClient) {
    this.llm = llmClient;
    this.systemPrompt = this.buildSystemPrompt();
  }

  async validateCvCoverage(optimizedCv, originalJd) {
    const prompt = `
[ROLE: QUALITY AUDITOR]
You are Simon. Review Kyle's optimized CV against the original JD.

JD: ${originalJd}
Kyle's Output: ${optimizedCv}

[CRITERIA]
1. Does it cover all "Essential Duties"?
2. Are bullets focused on "Career Progression"?
3. Is there any redundancy (e.g., repeating basic duties)?
4. Is the bullet count (max 7) appropriate for the role's weight?

Return JSON: { "is_valid": boolean, "gaps_identified": [], "redundancy_score": 0-100, "recommendations": "" }
`;
    try {
      const response = await this.llm.chat(this.systemPrompt, prompt);
      return JSON.parse(response);
    } catch (e) {
      return { is_valid: false, gaps_identified: ["Validation failed"] };
    }
  }

  buildSystemPrompt() {
    return `You are Simon, the strategic Recruiter Agent and Quality Auditor for the Prague-Day pipeline. 
Your role is the "Hiring Side Agent," responsible for JD Disambiguation and Candidate Briefing.

**PART 1: JD ANALYSIS & DISAMBIGUATION**
1. **Mirror Analysis:** Parse the JD exactly like Kyle (Role Level, clusters, explicit signals).
2. **Hidden Requirements:** Translate what they SAID into what they MEAN (e.g., "Audit ready" → "Paranoid about accuracy").
3. **Ambiguity Detection:** Flag vague language (e.g., "strategic" vs "operational") and produce clarifications for Kyle.
4. **Gap Identification:** Identify what's missing (Budget, Vendor authority, Org design) and flag it.

**PART 2: CANDIDATE BRIEF GENERATION**
- You MUST produce a structured "CANDIDATE BRIEF" using underscores and pipe-delimited clusters.
- **Strong Indicators vs. Red Flags:** Be explicit about hard stops and disqualifiers.
- **Tone Guidance:** Tell Kyle exactly how the candidate should sound (Operational, Strategic, Expert).

**YOUR AUDIT PROTOCOLS:**
1. **Instruction 0.1:** Classify role level (Strategic, Operational, Specialist, or Shared Services).
2. **Instruction 0.2:** Extract 4-5 Responsibility Clusters with specific % weights.
3. **Instruction 0.3:** Identify Explicit and Implicit Signals.
   - **Explicit:** Years of experience, systems (Workday/ADP), compliance (HIPAA), and geographic constraints.
   - **Implicit:** Reading between the lines (e.g., "Scale" = Growth Management, "Audit Ready" = Documentation Discipline).
4. **Instruction 6.1:** Perform the Final 10-Point Quality Checklist:
   - [1] Role level matches title?
   - [2] Profile uses role-appropriate language?
   - [3] Top 3 accomplishments match heaviest clusters?
   - [4] All EXPLICIT signals visible in CV/CL?
   - [5] No over-positioning (bigger roles than needed)?
   - [6] Technical skills curated (Tier 1 vs Tier 2)?
   - [7] Metrics consistent across all documents?
   - [8] Formatting clean/consistent?
   - [9] No typos/grammatical errors?
   - [10] Length appropriate (1-2 pages)?

**YOUR VETO POWER:**
If Kyle fails ≥2 of the checklist points or misses a critical Implicit Signal, you must Veto and return specific instructions for the next draft.`;
  }

  async analyzeJobDescription(jobDescription) {
    const prompt = `
Analyze this job description from an employer's perspective.

**Job Description:**
${jobDescription}

Provide a comprehensive analysis including:
1.  **key_requirements**: An array of strings detailing key requirements and skills needed.
2.  **company_culture**: A string summarizing company culture insights.
3.  **required_qualifications**: An array of strings for important qualifications and experience required.
4.  **nice_to_have_skills**: An array of strings for nice-to-have skills.
5.  **important_keywords**: An array of strings for specific keywords to emphasize.
6.  **seniority_level**: A string assessing the role's seniority level.
7.  **application_strategy**: A string providing actionable application strategy recommendations.
8.  **optimization_score**: A number (0-100) representing how well an applicant can optimize for this job.
9.  **ai_generated_likelihood**: A number (0-100) indicating if the job posting was AI-generated.
10. **ai_signals**: An array of strings detailing signals of AI generation.
11. **humanization_tips**: Advice on how to sound more human in the application.

Format as JSON with these exact fields: key_requirements, company_culture, required_qualifications, nice_to_have_skills, important_keywords, seniority_level, application_strategy, optimization_score, ai_generated_likelihood, ai_signals, humanization_tips`;

    try {
      const response = await this.llm.chat(this.systemPrompt, prompt);
      return this.parseJobAnalysis(response);
    } catch (error) {
      console.error('Simon job analysis error:', error);
      throw error;
    }
  }

  async assessCandidateFit(resumeData, jobDescription) {
    const prompt = `
Assess this candidate's fit for the role from an employer's perspective.

**Resume Data:**
${JSON.stringify(resumeData, null, 2)}

**Job Description:**
${jobDescription}

Provide:
1. Fit level: Strong / Medium / Weak
2. Top 3-5 reasons for the fit assessment
3. What evidence supports advancement
4. What evidence raises concerns
5. Likelihood of passing screening (percentage)
6. What the candidate must emphasize
7. What gaps need to be addressed

Format as JSON with these fields: fitLevel, reasons, supportingEvidence, concerns, screeningLikelihood, emphasisPoints, gaps`;

    try {
      const response = await this.llm.chat(this.systemPrompt, prompt);
      return this.parseFitAssessment(response);
    } catch (error) {
      console.error('Simon fit assessment error:', error);
      throw error;
    }
  }

  async generateKyleBrief(jobDescription, candidateContext = null) {
    const prompt = `
Generate a brief for Kyle (the applicant-side coach) on how to win this role.

**Job Description:**
${jobDescription}

${candidateContext ? `**Candidate Context:**
${JSON.stringify(candidateContext, null, 2)}` : ''}

Provide actionable guidance:
1. What the applicant must demonstrate
2. Top 3 resume emphasis points
3. Quantified wins to highlight
4. Skill gaps to close or downplay
5. Portfolio/proof needed
6. Interview talking points
7. Salary negotiation leverage

Format as JSON with these fields: mustDemonstrate, resumeEmphasis, quantifiedWins, skillGaps, portfolioNeeds, interviewPoints, negotiationLeverage`;

    try {
      const response = await this.llm.chat(this.systemPrompt, prompt);
      return this.parseKyleBrief(response);
    } catch (error) {
      console.error('Simon Kyle brief error:', error);
      throw error;
    }
  }

  async identifyCompetition(jobDescription, marketContext) {
    const prompt = `
Identify the competitive landscape for this role.

**Job Description:**
${jobDescription}

**Market Context:**
${JSON.stringify(marketContext, null, 2)}

Analyze:
1. Typical candidate profile for this role
2. Common backgrounds of successful hires
3. Competitive salary range
4. What makes a candidate stand out
5. Common mistakes applicants make
6. Market demand for this role

Format as JSON with these fields: typicalProfile, successfulBackgrounds, salaryRange, standoutFactors, commonMistakes, marketDemand`;

    try {
      const response = await this.llm.chat(this.systemPrompt, prompt);
      return this.parseCompetitionAnalysis(response);
    } catch (error) {
      console.error('Simon competition analysis error:', error);
      throw error;
    }
  }

  parseJobAnalysis(response) {
    try {
      const parsed = JSON.parse(response);
      return {
        key_requirements: parsed.key_requirements || [],
        company_culture: parsed.company_culture || '',
        required_qualifications: parsed.required_qualifications || [],
        nice_to_have_skills: parsed.nice_to_have_skills || [],
        important_keywords: parsed.important_keywords || [],
        seniority_level: parsed.seniority_level || '',
        application_strategy: parsed.application_strategy || '',
        optimization_score: parsed.optimization_score || 0,
        ai_generated_likelihood: parsed.ai_generated_likelihood || 0,
        ai_signals: parsed.ai_signals || [],
        humanization_tips: parsed.humanization_tips || ''
      };
    } catch (error) {
      return {
        error: 'Failed to parse job analysis',
        rawResponse: response
      };
    }
  }

  parseFitAssessment(response) {
    try {
      const parsed = JSON.parse(response);
      return {
        fitLevel: parsed.fitLevel || 'Medium',
        reasons: parsed.reasons || [],
        supportingEvidence: parsed.supportingEvidence || [],
        concerns: parsed.concerns || [],
        screeningLikelihood: parsed.screeningLikelihood || 50,
        emphasisPoints: parsed.emphasisPoints || [],
        gaps: parsed.gaps || []
      };
    } catch (error) {
      return {
        fitLevel: 'Medium',
        error: 'Failed to parse fit assessment',
        rawResponse: response
      };
    }
  }

  parseKyleBrief(response) {
    try {
      const parsed = JSON.parse(response);
      return {
        mustDemonstrate: parsed.mustDemonstrate || [],
        resumeEmphasis: parsed.resumeEmphasis || [],
        quantifiedWins: parsed.quantifiedWins || [],
        skillGaps: parsed.skillGaps || [],
        portfolioNeeds: parsed.portfolioNeeds || [],
        interviewPoints: parsed.interviewPoints || [],
        negotiationLeverage: parsed.negotiationLeverage || []
      };
    } catch (error) {
      return {
        error: 'Failed to parse Kyle brief',
        rawResponse: response
      };
    }
  }

  parseCompetitionAnalysis(response) {
    try {
      const parsed = JSON.parse(response);
      return {
        typicalProfile: parsed.typicalProfile || '',
        successfulBackgrounds: parsed.successfulBackgrounds || [],
        salaryRange: parsed.salaryRange || {},
        standoutFactors: parsed.standoutFactors || [],
        commonMistakes: parsed.commonMistakes || [],
        marketDemand: parsed.marketDemand || ''
      };
    } catch (error) {
      return {
        error: 'Failed to parse competition analysis',
        rawResponse: response
      };
    }
  }
}

module.exports = SimonAgent;