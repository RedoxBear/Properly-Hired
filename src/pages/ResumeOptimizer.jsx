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
→ Naturally weave these throughout the resume, especially in summary, skills, and experience bullets.

**Identified Strengths (leverage these):**
${(selectedMatch.fit_analysis?.strengths || []).map((s, i) => `${i+1}. ${s}`).join("\n")}

**Identified Gaps (address where truthful):**
${(selectedMatch.fit_analysis?.gaps || []).map((g, i) => `${i+1}. ${g}`).join("\n")}

**Required Skills Match:**
${(selectedMatch.fit_analysis?.required_skills_match || []).map(s => 
  `- ${s.skill}: ${s.has_skill ? "✓ HAS (evidence: " + s.evidence + ")" : "✗ MISSING - " + (s.evidence || "not evident in resume")}`
).join("\n")}

**Improvement Suggestions to Apply:**
${(selectedMatch.fit_analysis?.improvement_suggestions || []).map((sugg, i) => `${i+1}. ${sugg}`).join("\n")}

**How to Use This Data:**
1. **Keywords**: Incorporate the key_keywords naturally into your bullets and summary
2. **Strengths**: Emphasize these areas more prominently in experience bullets
3. **Gaps**: Where you have related experience, reframe it to address these gaps
4. **Required Skills**: For skills marked as "HAS", cite the evidence. For "MISSING", see if any transferable experience can truthfully address them
5. **Improvement Suggestions**: Apply these specific recommendations to the resume content

Remember: Stay truthful. Don't fabricate experience, but do reframe and emphasize what's relevant.
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
- Keep facts truthful; do not invent employers, dates, or achievements.
- Favor strong, metrics-driven bullet points with clear outcomes (%, $, time saved, throughput, quality, etc.).
- De-duplicate repetitive bullets; prefer consolidated, stronger statements.
- IMPORTANT: Career Highlights should be HIGH-LEVEL achievements that span the career. Do NOT repeat these same bullets in the work history.
- IMPORTANT: Do NOT change company names, original role titles, locations, or date ranges. Preserve them exactly as in MASTER_RESUME_JSON.
- If you want to suggest a retitled emphasis, include it in "title_adjustment_notes" only. Do not alter the "position" fields in the output data.

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

${jobMatchContext}

**JOB POSTING:**
${jobDescription}

**CANDIDATE'S CURRENT RESUME:**
${selectedResume.parsed_content}

**Your Task:**
Provide specific suggestions to tailor this resume for the job posting. Be concrete and actionable.

Return JSON with:
{
  "keywords": string[], // 15-25 critical keywords/phrases from JD that should appear in resume (ATS-friendly terms)
  "experience_suggestions": [
    {
      "text": string, // Specific achievement bullet suggestion (with metrics)
      "rationale": string // Why this bullet would be valuable (1 sentence)
    }
  ], // 5-8 suggested experience bullets that align with the job
  "education_tips": string[], // 3-5 specific education/certification highlights to emphasize
  "skill_gaps": [
    {
      "skill": string, // A skill from JD that's missing/weak in resume
      "suggestion": string // How to address it or emphasize related experience
    }
  ] // 3-5 skill gaps to address
}

**Guidelines:**
- Keywords should be actual terms from the JD (technologies, methodologies, role-specific terms)
- Experience suggestions should be realistic adaptations of their actual experience
- Include metrics and specifics in experience suggestions (%, $, time, scale)
- Education tips should highlight relevant degrees/certs they already have
- For skill gaps, suggest truthful ways to emphasize related experience
- Keep suggestions concrete and immediately actionable
- Make it sound human, not robotic`;

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

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            AI Resume Optimization
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-2">Resume Optimizer</h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Analyze a job posting and tailor your master resume for maximum impact—optimized for ATS and human reviewers with anti-AI-detection humanization.
          </p>
        </motion.div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <AnimatePresence mode="wait">
          {!optimizationResults ? (
            <motion.div key="optimizer" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0.98, scale: 0.98 }}>
              <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Select Job & Master Resume</span>
                    {jobMatches.length > 0 && (
                      <Badge variant={useJobMatch ? "default" : "outline"} className="text-xs">
                        {useJobMatch ? "Using Job Match Data" : "Standard Mode"}
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {jobMatches.length > 0 && (
                    <div className="flex items-center justify-between rounded-lg border p-3 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
                      <div>
                        <div className="font-medium text-purple-800 flex items-center gap-2">
                          <Target className="w-4 h-4" />
                          Use Job Match Insights
                        </div>
                        <p className="text-sm text-purple-700">
                          Leverage AI analysis from Job Matcher for smarter optimization
                        </p>
                      </div>
                      <Switch checked={useJobMatch} onCheckedChange={setUseJobMatch} />
                    </div>
                  )}

                  {useJobMatch && jobMatches.length > 0 ? (
                    <div className="space-y-2">
                      <label className="font-medium flex items-center gap-2">
                        <Target className="w-4 h-4 text-purple-600"/>
                        Job Match
                      </label>
                      <Select value={selectedMatchId} onValueChange={setSelectedMatchId} disabled={isProcessing}>
                        <SelectTrigger className="border-purple-200">
                          <SelectValue placeholder="Choose a job match to optimize for" />
                        </SelectTrigger>
                        <SelectContent>
                          {jobMatches.filter(m => m.status !== "dismissed").map((match) => (
                            <SelectItem key={match.id} value={match.id}>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold">{Math.round(match.match_score)}</span>
                                <span>•</span>
                                <span>{match.job_title} — {match.company_name}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {selectedMatchId && jobMatches.find(m => m.id === selectedMatchId) && (
                        <Alert className="border-purple-200 bg-purple-50 mt-3">
                          <AlertDescription className="text-purple-800 text-sm">
                            <div className="space-y-1">
                              <div><strong>Match Score:</strong> {Math.round(jobMatches.find(m => m.id === selectedMatchId).match_score)}/100</div>
                              <div><strong>Fit:</strong> {jobMatches.find(m => m.id === selectedMatchId).fit_analysis?.overall_fit || "N/A"}</div>
                              <div className="text-xs mt-2">
                                <Zap className="w-3 h-3 inline mr-1" />
                                Will auto-incorporate {jobMatches.find(m => m.id === selectedMatchId).key_keywords?.length || 0} key keywords and apply fit analysis insights
                              </div>
                            </div>
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <label className="font-medium flex items-center gap-2"><Briefcase className="w-4 h-4"/>{`Job Application`}</label>
                      <Select value={selectedJobId} onValueChange={setSelectedJobId} disabled={isProcessing}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a job to optimize for" />
                        </SelectTrigger>
                        <SelectContent>
                          {jobApplications.map((job) => (
                            <SelectItem key={job.id} value={job.id}>
                              {job.job_title} — {job.company_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="font-medium flex items-center gap-2"><Star className="w-4 h-4"/>{`Master Resume`}</label>
                    <Select value={selectedResumeId} onValueChange={setSelectedResumeId} disabled={isProcessing}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a master resume" />
                      </SelectTrigger>
                      <SelectContent>
                        {masterResumes.map((res) => (
                          <SelectItem key={res.id} value={res.id}>
                            {res.version_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between rounded-lg border p-3 bg-slate-50">
                    <div>
                      <div className="font-medium text-slate-800">Retarget using transferable skills</div>
                      <p className="text-sm text-slate-600">When on, the optimizer reframes titles and bullets to the target role while staying truthful.</p>
                    </div>
                    <Switch checked={retargetEnabled} onCheckedChange={setRetargetEnabled} />
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="flex items-center justify-between rounded-lg border p-3 bg-slate-50">
                      <div>
                        <div className="font-medium text-slate-800">Maximize match coverage</div>
                        <p className="text-sm text-slate-600">Try to cover 95–100% of critical JD keywords without stuffing.</p>
                      </div>
                      <Switch checked={aggressiveMatch} onCheckedChange={setAggressiveMatch} />
                    </div>
                    <div className="flex items-center justify-between rounded-lg border p-3 bg-green-50 border-green-200">
                      <div>
                        <div className="font-medium text-green-800 flex items-center gap-1">
                          Deep Humanize (De-AI)
                          <Badge className="bg-green-600 text-white text-xs">Bypass ATS AI Detection</Badge>
                        </div>
                        <p className="text-sm text-green-700">Rewrite to sound 100% human-written. Avoids AI red flags.</p>
                      </div>
                      <Switch checked={deepHumanize} onCheckedChange={setDeepHumanize} />
                    </div>
                  </div>

                  {deepHumanize && (
                    <Alert className="border-green-200 bg-green-50">
                      <AlertDescription className="text-green-800 text-sm">
                        <strong>✨ ATS Bypass Mode Active:</strong> Your resume will be rewritten to pass AI-detection filters used by modern ATS systems. Removes robotic patterns, buzzwords, and AI tells.
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="rounded-lg border p-3 bg-slate-50">
                    <div className="font-medium text-slate-800 mb-2">Output length</div>
                    <ResumeLengthControls mode={optimizeMode} onChange={setOptimizeMode} disabled={isProcessing} />
                    <p className="text-xs text-slate-500 mt-2">
                      ATS 1-Page: concise and keyword-focused • Pro 2-Page: balanced detail • Full CV: comprehensive with polished language
                    </p>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <Button 
                      onClick={getAISuggestions} 
                      disabled={isLoadingSuggestions || isProcessing || (useJobMatch ? !selectedMatchId : !selectedJobId) || !selectedResumeId} 
                      variant="outline"
                      className="h-12 border-2 border-blue-200 hover:bg-blue-50"
                    >
                      {isLoadingSuggestions ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Lightbulb className="w-5 h-5 mr-2" />
                          Get AI Suggestions
                        </>
                      )}
                    </Button>

                    <Button 
                      onClick={optimizeResume} 
                      disabled={isProcessing || (useJobMatch ? !selectedMatchId : !selectedJobId) || !selectedResumeId} 
                      className="bg-blue-600 hover:bg-blue-700 h-12"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Optimizing...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5 mr-2" />
                          {useJobMatch ? "Optimize with Match Data" : "Optimize Resume"}
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {suggestions && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6"
                >
                  <AISuggestions suggestions={suggestions} />
                </motion.div>
              )}
            </motion.div>
          ) : (
            <motion.div key="results" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <OptimizationResults results={optimizationResults} onReset={resetOptimization} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}