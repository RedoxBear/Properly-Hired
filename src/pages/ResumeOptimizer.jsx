import { useRef } from "react";
  // Grammar/Style check state
  const [grammarSuggestions, setGrammarSuggestions] = useState(null);
  const [isCheckingGrammar, setIsCheckingGrammar] = useState(false);
  const grammarCheckTextRef = useRef("");

  // Run grammar/style check using OpenAI GPT-4 via Base44
  const runGrammarCheck = async () => {
    setIsCheckingGrammar(true);
    setGrammarSuggestions(null);
    let textToCheck = "";
    // Prefer optimized output, else editable resume
    if (optimizationResults && optimizationResults.optimized_resume_content) {
      // Flatten all text fields for grammar check
      const { summary = "", highlights = [], experience = [], education = [], references = [] } = optimizationResults.optimized_resume_content;
      textToCheck = [summary, ...highlights, ...experience.flatMap(e => e.achievements || []), ...education.map(e => e.institution || ""), ...references.map(r => r.name || "")].join("\n");
    } else {
      textToCheck = editableResume;
    }
    grammarCheckTextRef.current = textToCheck;
    try {
      const prompt = `You are a world-class resume editor and proofreader. Carefully review the following resume text for grammar, clarity, conciseness, and professional tone. Suggest corrections and improvements, but do NOT rewrite the entire text—only point out specific issues and provide improved versions for each.\n\nResume Text:\n${textToCheck}\n\nReturn ONLY a JSON array of objects: [{\n  "issue": string, // short description of the problem\n  "original": string, // the problematic sentence or phrase\n  "suggestion": string // improved version\n}]`;
      const response = await retryWithBackoff(() => InvokeLLM({
        prompt,
        response_json_schema: {
          type: "array",
          items: {
            type: "object",
            properties: {
              issue: { type: "string" },
              original: { type: "string" },
              suggestion: { type: "string" }
            }
          }
        }
      }), { retries: 2, baseDelay: 1200 });
      setGrammarSuggestions(response);
    } catch (e) {
      setGrammarSuggestions([{ issue: "Error running grammar check", original: "", suggestion: "Try again later." }]);
    }
    setIsCheckingGrammar(false);
  };
import React, { useState, useEffect, useCallback } from "react";
import { Resume } from "@/entities/Resume";
import { JobApplication } from "@/entities/JobApplication";
import { JobMatch } from "@/entities/JobMatch";
import { InvokeLLM } from "@/integrations/Core";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Sparkles, Briefcase, Star, Loader2, Lightbulb, Target, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import OptimizationResults from "@/components/resume/OptimizationResults";
import { retryWithBackoff } from "@/components/utils/retry";
import ResumeLengthControls from "@/components/resume/ResumeLengthControls";
import { logEvent } from "@/components/utils/telemetry";
import { Badge } from "@/components/ui/badge";
import AISuggestions from "@/components/resume/AISuggestions";
import CompanyResearchCard from "@/components/company/CompanyResearchCard";

export default function ResumeOptimizer() {
  const [jobApplications, setJobApplications] = useState([]);
  const [jobMatches, setJobMatches] = useState([]);
  const [masterResumes, setMasterResumes] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState("");
  const [selectedMatchId, setSelectedMatchId] = useState("");
  const [selectedResumeId, setSelectedResumeId] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [optimizationResults, setOptimizationResults] = useState(null);
  const [error, setError] = useState("");
  const [retargetEnabled, setRetargetEnabled] = useState(true);
  const [optimizeMode, setOptimizeMode] = useState("two_page"); // "ats_one_page" | "two_page" | "full_cv"
  const [useJobMatch, setUseJobMatch] = useState(false);

  // NEW: Controls for coverage and humanization
  const [aggressiveMatch, setAggressiveMatch] = useState(true);
  const [deepHumanize, setDeepHumanize] = useState(true);
  
  // NEW: AI Suggestions state
  const [suggestions, setSuggestions] = useState(null);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  // Helper: trim summary to 2 sentences or 300 chars for ATS mode
  const shortenSummary = (text, maxSentences = 2, maxChars = 300) => {
    if (!text) return text;
    const sentences = String(text).split(/(?<=[.!?])\s+/).slice(0, maxSentences).join(" ");
    return sentences.length > maxChars ? sentences.slice(0, maxChars).trim() + "…" : sentences;
  };

  // NEW helpers: normalize + merge experience by master to avoid losing roles
  const capBullets = (arr, n) => Array.isArray(arr) ? arr.slice(0, n) : [];
  const norm = (s) => (s || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const roleKey = (r) => `${norm(r?.company)}|${norm(r?.duration)}`;

  const findMatchingOptimizedRole = (optimizedExp, masterRole) => {
    if (!Array.isArray(optimizedExp)) return null;
    const mKey = roleKey(masterRole);
    // 1) exact company+duration match
    let match = optimizedExp.find(o => roleKey(o) === mKey);
    if (match) return match;
    // 2) fallback: same company and overlapping title words
    const mCo = norm(masterRole?.company);
    const mPos = norm(masterRole?.position);
    match = optimizedExp.find(o => norm(o?.company) === mCo && (norm(o?.position).includes(mPos) || mPos.includes(norm(o?.position))));
    if (match) return match;
    // 3) last fallback: same company
    match = optimizedExp.find(o => norm(o?.company) === mCo);
    return match || null;
  };

  const mergeExperienceByMaster = (masterExp, optimizedExp, mode) => {
    const maxRoles = mode === "ats_one_page" ? 4 : mode === "two_page" ? 8 : Number.POSITIVE_INFINITY;
    const maxBullets = mode === "ats_one_page" ? 3 : mode === "two_page" ? 6 : 12;

    const base = Array.isArray(masterExp) ? masterExp.slice(0, maxRoles) : [];
    return base.map(mr => {
      const or = findMatchingOptimizedRole(optimizedExp, mr);
      const merged = {
        // Preserve original identity of roles
        company: mr.company || or?.company || "",
        position: mr.position || or?.position || "",
        duration: mr.duration || or?.duration || "",
        location: mr.location || or?.location || "",
        achievements: (() => {
          const pick = Array.isArray(or?.achievements) && or.achievements.length ? or.achievements : (Array.isArray(mr?.achievements) ? mr.achievements : []);
          return capBullets(pick, maxBullets);
        })()
      };
      return merged;
    });
  };

  // UPDATED: shape optimized content by mode with master merge and unified summary
  const shapeOptimizedForMode = (content, mode, masterData, baseSummary) => {
    const safe = content || {};
    const masterExp = Array.isArray(masterData?.experience) ? masterData.experience : [];
    // Ensure skills is always an array for processing
    const skills = Array.isArray(safe.skills) ? safe.skills : (safe.skills ? [safe.skills].flat() : []);
    const education = Array.isArray(safe.education) ? safe.education : [];
    const references = Array.isArray(safe.references) ? safe.references : [];
    const optimizedExp = Array.isArray(safe.experience) ? safe.experience : [];

    const mergedExp = mergeExperienceByMaster(masterExp, optimizedExp, mode);

    const finalSummary =
      mode === "ats_one_page"
        ? shortenSummary(baseSummary || "")
        : (baseSummary || "");

    return {
      ...safe,
      summary: finalSummary,
      experience: mergedExp,
      skills,
      education,
      references
    };
  };

  const loadInitialData = useCallback(async () => {
    setIsProcessing(true);
    setError("");
    try {
      const [applications, resumes, matches] = await Promise.all([
        JobApplication.list("-created_date", 50),
        Resume.filter({ is_master_resume: true }, "-created_date", 100),
        JobMatch.list("-created_date", 50)
      ]);
      setJobApplications(applications);
      setMasterResumes(resumes);
      setJobMatches(matches);
      if (resumes.length === 0) {
        setError("Please upload or build a master resume first.");
      }
    } catch (e) {
      console.error(e);
      setError("Failed to load your data. Please refresh the page.");
    }
    setIsProcessing(false);
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Auto-select job from URL param (?id=...) when data is loaded
  useEffect(() => {
    const qp = new URLSearchParams(window.location.search);
    const id = qp.get("id");
    if (id && jobApplications.length > 0) {
      const exists = jobApplications.some(j => j.id === id);
      if (exists) setSelectedJobId(id);
    }
  }, [jobApplications]);

  const optimizeResume = async () => {
    if (useJobMatch && !selectedMatchId) {
      setError("Please select a job match to optimize for.");
      return;
    }
    if (!useJobMatch && !selectedJobId) {
      setError("Please select a job application.");
      return;
    }
    if (!selectedResumeId) {
      setError("Please select a master resume.");
      return;
    }
    setIsProcessing(true);
    setError("");

    const selectedMatch = useJobMatch ? jobMatches.find(m => m.id === selectedMatchId) : null;
    const selectedJob = !useJobMatch ? jobApplications.find(j => j.id === selectedJobId) : null;
    const selectedResume = masterResumes.find(r => r.id === selectedResumeId);

    // Build job data from either JobMatch or JobApplication
    const jobData = selectedMatch ? {
      job_title: selectedMatch.job_title,
      company_name: selectedMatch.company_name,
      job_description: selectedMatch.job_description,
      id: selectedMatch.id
    } : {
      job_title: selectedJob.job_title,
      company_name: selectedJob.company_name,
      job_description: selectedJob.job_description,
      id: selectedJob.id
    };

    const modeLabel =
      optimizeMode === "ats_one_page" ? "ATS 1-Page" :
      optimizeMode === "two_page" ? "Pro 2-Page" :
      "Full CV";

    // For Full CV, disable retargeting to avoid title rewriting
    const computedRetarget = optimizeMode === "full_cv" ? false : retargetEnabled;

    // NEW: JobMatch data integration
    const jobMatchEnhancement = selectedMatch ? `
**IMPORTANT - JOB MATCH INSIGHTS AVAILABLE:**
You have access to detailed AI-generated job match analysis. Use this data strategically:

**Key Keywords to Incorporate (${selectedMatch.key_keywords?.length || 0} identified):**
${(selectedMatch.key_keywords || []).join(", ")}
→ ONLY incorporate keywords that align with their ACTUAL experience. Never force keywords for things they haven't done.

**Identified Strengths (leverage these):**
${(selectedMatch.fit_analysis?.strengths || []).map((s, i) => `${i+1}. ${s}`).join("\n")}

**Identified Gaps (be honest about these):**
${(selectedMatch.fit_analysis?.gaps || []).map((g, i) => `${i+1}. ${g}`).join("\n")}

**Required Skills Match:**
${(selectedMatch.fit_analysis?.required_skills_match || []).map(s => 
  `- ${s.skill}: ${s.has_skill ? "✓ HAS (evidence: " + s.evidence + ")" : "✗ MISSING - " + (s.evidence || "not evident in resume")}`
).join("\n")}

**Improvement Suggestions to Apply:**
${(selectedMatch.fit_analysis?.improvement_suggestions || []).map((sugg, i) => `${i+1}. ${sugg}`).join("\n")}

**CRITICAL - How to Use This Data (STAY TRUTHFUL):**
1. **Keywords**: ONLY incorporate keywords that match their actual experience. If a keyword is for something they haven't done, skip it.
2. **Strengths**: Emphasize these areas more prominently since they're proven matches.
3. **Gaps**: If a gap exists and they have ZERO related experience, leave it as a gap. DO NOT fabricate or stretch the truth.
4. **Required Skills**: 
   - For "HAS": Cite the specific evidence mentioned and make it more prominent
   - For "MISSING": Only mention if they have genuinely related/transferable experience. Otherwise, ignore it.
5. **Improvement Suggestions**: ONLY apply suggestions that involve rewording/reframing EXISTING experience, not adding fake experience.

**GROUND RULE: If they didn't do it, don't claim they did. Focus on better articulation of what they ACTUALLY accomplished.**
` : "";

    // NEW: clauses for coverage/humanization
    const coverageClause = aggressiveMatch
      ? `Coverage target: Aim for 95–100% coverage of critical role-specific terms from JOB_POSTING${selectedMatch ? " and the Key Keywords identified in the Job Match data" : ""}.
- Include each critical term at least once in a meaningful sentence or bullet.
- Use synonyms and close variants where natural. Avoid keyword stuffing or awkward phrasing.
- If something is irrelevant or untrue, omit it and leave it as missing.`
      : `Coverage: keep natural language; do not force keywords that are irrelevant or untrue.`;

    // ENHANCED: Much stronger humanization with specific anti-ATS-detection rules
    const humanizeClause = deepHumanize
      ? `CRITICAL - ATS Anti-Detection Humanization (De-AI Mode):

**Sentence Structure & Flow:**
- Mix short punchy statements (5-8 words) with longer detailed ones (15-20 words)
- Vary your sentence openings - avoid starting 3+ bullets with same verb/structure
- Use occasional fragments for impact: "Result: 40% faster deployment."
- Break up perfect parallel structure - it screams AI

**Voice & Tone:**
- Write like a confident professional sharing their story, NOT a marketing brochure
- Use active voice but occasionally break to passive when it flows better
- Include 1-2 industry-specific terms per role, not keyword soup
- Sound like someone who actually DID the work, not someone describing it from outside

**Anti-AI Red Flags to AVOID:**
❌ Never use: "leveraged," "utilized," "spearheaded," "facilitated," "championed," "drove" more than once total
❌ Avoid: "responsible for," "tasked with," "in order to," "due to the fact that"
❌ No marketing speak: "cutting-edge," "best-in-class," "world-class," "next-generation"
❌ No robotic patterns: "Successfully managed X while simultaneously driving Y to achieve Z"
❌ Don't pack 5+ buzzwords in one bullet

**What to DO Instead:**
✅ Lead with concrete actions: "Built," "Created," "Redesigned," "Reduced," "Grew," "Solved"
✅ Show, don't tell: "Redesigned the onboarding workflow → cut time from 12 days to 8 (32% faster)"
✅ Use numbers naturally: "across 3 teams," "within 6 months," "affecting 200+ employees"
✅ Add specificity: mention tools/systems by name, team sizes, timeframes
✅ Vary your metrics format: some as % improvement, some as absolute numbers, some as time saved

**Readability Check:**
- If a recruiter can't skim your bullet in 3 seconds and get the point, rewrite it
- If it sounds like it could describe ANY job at ANY company, add more context
- Read it out loud - if it sounds robotic or overly formal, dial it back

**Example Transformations:**
❌ BAD (AI-detected): "Leveraged cross-functional collaboration to successfully drive implementation of cutting-edge HR analytics platform, resulting in enhanced data-driven decision-making capabilities"
✅ GOOD (human): "Led 3-team effort to launch new HR analytics dashboard. Cut reporting time from 2 days to 2 hours; now used by 40+ managers for headcount planning."

❌ BAD: "Responsible for spearheading the optimization of recruitment processes"
✅ GOOD: "Rebuilt our interview process from scratch—reduced time-to-hire by 18 days while improving offer acceptance from 62% to 81%"

Apply these rules ruthlessly. The goal: pass as 100% human-written to both ATS scanners AND human recruiters.`
      : ``;

    const optimizationPrompt = `You are an expert resume optimizer and ATS specialist with deep knowledge of how modern ATS systems detect AI-generated content.

Goal: Produce a role-aligned, truthful, natural-sounding, recruiter-friendly and keyword-optimized resume that will pass ATS AI-detection filters.

Requested Output Mode: ${modeLabel}

Mode rules:
- ATS 1-Page: Create a concise, 1-page ATS-friendly resume. Use a short 2–3 line summary. Limit each recent role to ~3 impactful, metrics-driven bullets. Focus on keywords and clarity.
- Pro 2-Page: Two-page professional version with a standard summary. Keep up to ~6 bullets on recent roles and ~3–4 on earlier roles as relevant.
- Full CV: Preserve the original breadth and chronology while improving verbiage for clarity and impact. Keep a polished summary. Do not drop relevant sections.

STRUCTURE REQUIREMENTS (Match Master Resume Format):
Your output must follow this exact structure:
1. Career Summary (3-5 lines framing the candidate's value)
2. Career Highlights (3-8 standout achievements from across career - distinct from work history bullets)
3. Core Competencies (6-8 key skills)
4. Professional Experience (chronological work history with company, position, duration, location, achievements)
5. Education
6. References (if provided)

Core rules:
- Optimize for ATS parsing AND for a human reader (varied sentence length, concrete outcomes, avoid buzzword salad).
- **CRITICAL**: Keep facts truthful; do not invent employers, dates, achievements, skills, or experience.
- **CRITICAL**: Only include keywords that match their ACTUAL experience. Never add keywords for things they haven't done.
- **CRITICAL**: All bullet points must be grounded in real work they performed. No fabrication or exaggeration.
- Favor strong, metrics-driven bullet points with clear outcomes (%, $, time saved, throughput, quality, etc.).
- De-duplicate repetitive bullets; prefer consolidated, stronger statements.
- IMPORTANT: Career Highlights should be HIGH-LEVEL achievements that span the career. Do NOT repeat these same bullets in the work history.
- IMPORTANT: Do NOT change company names, original role titles, locations, or date ranges. Preserve them exactly as in MASTER_RESUME_JSON.
- If you want to suggest a retitled emphasis, include it in "title_adjustment_notes" only. Do not alter the "position" fields in the output data.
- **When a skill or experience is missing from their background, leave it missing. Do not try to fill gaps with fabricated content.**

Transferable-skill retargeting: ${computedRetarget ? "ENABLED" : "DISABLED"}.

${jobMatchEnhancement}

${coverageClause}

${humanizeClause}

Preserve sections:
- Do NOT drop Skills or Education; if not changing, keep them from master.
- Include References when provided; keep their fields intact (name, title, company, relation, contacts, identifiers).

Executive Summary:
- Provide "executive_summary": a tailored 3–5 sentence overview that crisply positions the candidate for the target role, highlights strengths and quantified impact, and mirrors the job’s language without exaggeration.
- Make it sound like a confident professional, NOT a LinkedIn influencer or marketing copy.

Additionally, provide a "keyword_coverage" analysis:
- "required_keywords": the most important JD terms (10–30).
- "covered_keywords": which of those appear meaningfully in the optimized resume.
- "missing_keywords": which do not appear (truthfully).
- "coverage_percent": 0–100 measure of covered/required.

FINAL HUMANIZATION CHECK:
Before outputting, read each bullet aloud. If it sounds like a robot wrote it, rewrite it to sound like a real person describing their actual work experience.

Inputs:
MASTER_RESUME_JSON:
${selectedResume.parsed_content}

JOB_POSTING:
${jobData.job_description}

Output JSON:
{
  "optimization_score": number,
  "recommendations": string[],
  "key_keywords": string[],
  "experience_highlights": string[],
  "target_title": string,
  "title_adjustment_notes": string,
  "humanization_notes": string,
  "executive_summary": string,
  "keyword_coverage": {
    "required_keywords": string[],
    "covered_keywords": string[],
    "missing_keywords": string[],
    "coverage_percent": number
  },
  "optimized_resume_content": {
    "personal_info": object,
    "summary": string,
    "highlights": string[],
    "skills": string[],
    "experience": array,
    "education": array,
    "references": array
  }
}`.trim();

    try {
      const response = await retryWithBackoff(() =>
        InvokeLLM({ // Changed from base44.integrations.Core.InvokeLLM to InvokeLLM
          prompt: optimizationPrompt,
          response_json_schema: {
            type: "object",
            properties: {
              optimization_score: { type: "number" },
              recommendations: { type: "array", items: { type: "string" } },
              key_keywords: { type: "array", items: { type: "string" } },
              experience_highlights: { type: "array", items: { type: "string" } },
              target_title: { type: "string" },
              title_adjustment_notes: { type: "string" },
              humanization_notes: { type: "string" },
              executive_summary: { type: "string" },
              keyword_coverage: {
                type: "object",
                properties: {
                  required_keywords: { type: "array", items: { type: "string" } },
                  covered_keywords: { type: "array", items: { type: "string" } },
                  missing_keywords: { type: "array", items: { type: "string" } },
                  coverage_percent: { type: "number" }
                }
              },
              optimized_resume_content: {
                type: "object",
                properties: {
                  personal_info: { type: "object" },
                  summary: { type: "string" },
                  highlights: { type: "array", items: { type: "string" } }, // ADDED THIS
                  skills: { type: "array", items: { type: "string" } },
                  experience: { type: "array", items: { type: "object" } },
                  education: { type: "array", items: { type: "object" } },
                  references: { type: "array", items: { type: "object" } }
                }
              }
            }
          }
        })
      , { retries: 3, baseDelay: 1200 });

      const masterData = (() => {
        try {
          return selectedResume.optimized_content
            ? JSON.parse(selectedResume.optimized_content)
            : (selectedResume.parsed_content ? JSON.parse(selectedResume.parsed_content) : {});
        } catch { return {}; }
      })();

      const optimized = response.optimized_resume_content || {};
      const mergedOptimized = {
        ...optimized,
        highlights: Array.isArray(optimized.highlights) && optimized.highlights.length ? optimized.highlights : (masterData.highlights || response.experience_highlights || []),
        skills: Array.isArray(optimized.skills) && optimized.skills.length ? optimized.skills : (masterData.skills || []),
        education: Array.isArray(optimized.education) && optimized.education.length ? optimized.education : (masterData.education || []),
        references: Array.isArray(optimized.references) && optimized.references.length
          ? optimized.references
          : (masterData.references || selectedResume.references || [])
      };

      const baseSummary =
        (response.optimized_resume_content && response.optimized_resume_content.summary) ||
        masterData.summary ||
        "";

      const execSummary = response.executive_summary || baseSummary;

      const shapedOptimized = shapeOptimizedForMode(mergedOptimized, optimizeMode, masterData, baseSummary);
      const shapedWithExec = { ...shapedOptimized, executive_summary: execSummary };

      const baseName = response.target_title || `${jobData.job_title} — ${jobData.company_name}`;
      const newVersion = await Resume.create({
        version_name: `${baseName} — ${modeLabel}`,
        original_file_url: selectedResume.original_file_url,
        parsed_content: selectedResume.parsed_content,
        optimized_content: JSON.stringify(shapedWithExec),
        is_master_resume: false,
        job_application_id: useJobMatch ? null : jobData.id
      });

      // Update JobApplication or JobMatch status
      if (useJobMatch && selectedMatch) {
        await JobMatch.update(selectedMatchId, {
          status: "interested"
        });
      } else if (selectedJob) {
        await JobApplication.update(selectedJobId, {
          optimization_score: response.optimization_score,
          master_resume_id: selectedResumeId,
          optimized_resume_id: newVersion.id,
          application_status: "ready"
        });
      }

      setOptimizationResults({
        ...response,
        executive_summary: execSummary,
        optimized_resume_content: shapedWithExec,
        jobTitle: jobData.job_title,
        companyName: jobData.company_name,
        // NEW: pass coverage
        keyword_coverage: response.keyword_coverage || null,
        usedJobMatch: useJobMatch,
        jobMatchData: selectedMatch ? {
          match_score: selectedMatch.match_score,
          overall_fit: selectedMatch.fit_analysis?.overall_fit
        } : null
      });

      // telemetry: resume rendered in chosen mode
      try {
        await logEvent({
          type: "resume_rendered",
          ts: new Date().toISOString(),
          app_id: jobData.id,
          mode: optimizeMode,
          humanized: deepHumanize,
          used_job_match: useJobMatch
        });
      } catch (logError) {
        console.error("Telemetry logEvent failed:", logError);
      }
    } catch (e) {
      console.error(e);
      setError("The service is busy right now. Please try again in a minute.");
    }

    setIsProcessing(false);
  };

  const resetOptimization = () => {
    setOptimizationResults(null);
    setSelectedJobId("");
    setSelectedMatchId("");
    setSelectedResumeId("");
    setSuggestions(null);
  };

  // NEW: Get AI Suggestions before full optimization
  const getAISuggestions = async () => {
    if (useJobMatch && !selectedMatchId) {
      setError("Please select a job match first.");
      return;
    }
    if (!useJobMatch && !selectedJobId) {
      setError("Please select a job application first.");
      return;
    }
    if (!selectedResumeId) {
      setError("Please select a master resume first.");
      return;
    }

    setIsLoadingSuggestions(true);
    setError("");
    setSuggestions(null);

    const selectedMatch = useJobMatch ? jobMatches.find(m => m.id === selectedMatchId) : null;
    const selectedJob = !useJobMatch ? jobApplications.find(j => j.id === selectedJobId) : null;
    const selectedResume = masterResumes.find(r => r.id === selectedResumeId);

    const jobDescription = selectedMatch ? selectedMatch.job_description : selectedJob.job_description;

    const jobMatchContext = selectedMatch ? `
**EXISTING JOB MATCH ANALYSIS:**
This job has already been analyzed. Use these insights to refine your suggestions:
- Match Score: ${selectedMatch.match_score}/100
- Overall Fit: ${selectedMatch.fit_analysis?.overall_fit || "N/A"}
- Key Keywords Already Identified: ${(selectedMatch.key_keywords || []).join(", ")}
- Known Strengths: ${(selectedMatch.fit_analysis?.strengths || []).join("; ")}
- Known Gaps: ${(selectedMatch.fit_analysis?.gaps || []).join("; ")}
- Improvement Suggestions Already Made: ${(selectedMatch.fit_analysis?.improvement_suggestions || []).join("; ")}

Your task is to provide even MORE specific, tactical suggestions based on this analysis.
` : "";

    const suggestionPrompt = `You are an expert ATS and resume optimization specialist. Analyze the job posting and the candidate's current resume, then provide specific, actionable suggestions.

**CRITICAL RULE: STAY GROUNDED IN THEIR ACTUAL EXPERIENCE**
- Only suggest improvements that REFRAME or REWORD what they've already done
- Never suggest adding skills, experiences, or achievements they don't have
- Be honest about gaps - if they're missing something, acknowledge it but don't suggest fabricating it
- Focus on better ARTICULATION of real accomplishments, not inventing new ones

${jobMatchContext}

**JOB POSTING:**
${jobDescription}

**CANDIDATE'S CURRENT RESUME:**
${selectedResume.parsed_content}

**Your Task:**
Provide specific, TRUTHFUL suggestions to better position their EXISTING experience for this role.

Return JSON with:
{
  "keywords": string[], // 15-25 keywords from JD that MATCH their actual experience (skip keywords for things they haven't done)
  "experience_suggestions": [
    {
      "text": string, // Suggested rewording of an EXISTING achievement (reference something they actually did)
      "rationale": string // Why reframing this existing bullet would help (1 sentence)
    }
  ], // 5-8 suggestions to REFRAME existing bullets (not add new fake ones)
  "education_tips": string[], // 3-5 tips to highlight education/certs THEY ALREADY HAVE
  "skill_gaps": [
    {
      "skill": string, // A skill from JD that's missing/weak in resume
      "suggestion": string // Be honest: "This skill is not evident in your background" OR "Emphasize [related experience they have]"
    }
  ] // 3-5 skill gaps to address HONESTLY
}

**Guidelines:**
- Keywords: ONLY include keywords that align with their actual background
- Experience suggestions: Must reference ACTUAL projects/roles they've had
  - Good: "Reframe your Q3 2023 dashboard project to emphasize the data visualization aspect"
  - Bad: "Add a bullet about machine learning model deployment" (if they've never done ML)
- Include metrics and specifics, but ONLY from their real work
- Education tips: Only mention degrees/certs they ACTUALLY have
- For skill gaps: Be honest if something is truly missing. Don't suggest stretching the truth.
  - Good: "This role requires Python. If you have any coding experience, mention it; otherwise, this is a true gap."
  - Bad: "Add Python to your skills" (if they don't know Python)
- Keep suggestions concrete and immediately actionable
- Make it sound human, not robotic
- **If they don't have relevant experience for something, say so honestly rather than suggesting they fake it.**`;

    try {
      const response = await retryWithBackoff(() =>
        InvokeLLM({
          prompt: suggestionPrompt,
          response_json_schema: {
            type: "object",
            properties: {
              keywords: { type: "array", items: { type: "string" } },
              experience_suggestions: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    text: { type: "string" },
                    rationale: { type: "string" }
                  }
                }
              },
              education_tips: { type: "array", items: { type: "string" } },
              skill_gaps: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    skill: { type: "string" },
                    suggestion: { type: "string" }
                  }
                }
              }
            }
          }
        }),
        { retries: 2, baseDelay: 1000 }
      );

      setSuggestions(response);
    } catch (e) {
      console.error("Failed to get AI suggestions:", e);
      setError("Failed to generate suggestions. You can still run the full optimization.");
    }

    setIsLoadingSuggestions(false);
  };

  // ...existing code...
  // New: Show and allow editing of original resume and full_cv
  const [editableResume, setEditableResume] = useState("");
  const [editableFullCV, setEditableFullCV] = useState("");

  useEffect(() => {
    if (selectedResumeId) {
      const selectedResume = masterResumes.find(r => r.id === selectedResumeId);
      setEditableResume(selectedResume?.parsed_content || "");
      setEditableFullCV(selectedResume?.parsed_content || ""); // If full_cv is a separate field, replace here
    }
  }, [selectedResumeId, masterResumes]);

  // ...existing code...
  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* ...existing code... */}
        {/* Editable Original Resume Section */}
        {selectedResumeId && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Original Resume (Editable)</CardTitle>
            </CardHeader>
            <CardContent>
              <textarea
                className="w-full h-40 border rounded p-2 text-sm font-mono"
                value={editableResume}
                onChange={e => setEditableResume(e.target.value)}
                disabled={isProcessing}
              />
            </CardContent>
          </Card>
        )}
        {/* Editable Full CV Section */}
        {selectedResumeId && optimizeMode === "full_cv" && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Full CV (Editable)</CardTitle>
            </CardHeader>
            <CardContent>
              <textarea
                className="w-full h-40 border rounded p-2 text-sm font-mono"
                value={editableFullCV}
                onChange={e => setEditableFullCV(e.target.value)}
                disabled={isProcessing}
              />
            </CardContent>
          </Card>
        )}
        {/* ...existing code... */}
        {/* If optimizationResults, show De-AI rewritten output for matching sections */}
        {optimizationResults && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>De-AI Humanized Output (Matching JD)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm whitespace-pre-line">
                {optimizationResults.optimized_resume_content?.experience?.map((role, idx) => {
                  // Check if any achievements match JD terms
                  const jdTerms = optimizationResults.keyword_coverage?.required_keywords || [];
                  const matchedBullets = (role.achievements || []).filter(bullet =>
                    jdTerms.some(term => bullet.toLowerCase().includes(term.toLowerCase()))
                  );
                  return matchedBullets.length > 0 ? (
                    <div key={idx} className="mb-4">
                      <div className="font-semibold">{role.company} — {role.position}</div>
                      <ul className="list-disc ml-6">
                        {matchedBullets.map((bullet, i) => (
                          <li key={i}>{bullet}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null;
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Grammar/Style Check Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Grammar & Style Suggestions (AI-Powered)</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={runGrammarCheck} disabled={isCheckingGrammar} className="mb-4">
              {isCheckingGrammar ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
              {isCheckingGrammar ? "Checking..." : "Check Resume with AI"}
            </Button>
            {grammarSuggestions && grammarSuggestions.length > 0 && (
              <div className="space-y-3">
                {grammarSuggestions.map((s, i) => (
                  <div key={i} className="border rounded p-2 bg-slate-50">
                    <div className="text-xs text-slate-500 mb-1">{s.issue}</div>
                    <div><span className="font-semibold">Original:</span> {s.original}</div>
                    <div><span className="font-semibold">Suggestion:</span> {s.suggestion}</div>
                  </div>
                ))}
              </div>
            )}
            {grammarSuggestions && grammarSuggestions.length === 0 && (
              <div className="text-green-700">No major grammar or style issues found!</div>
            )}
          </CardContent>
        </Card>
        {/* ...existing code... */}
      </div>
    </div>
  );
}