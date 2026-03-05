import React from "react";
import { base44 } from "@/api/base44Client";
import { hasAccess, canPerformAction, TIERS, getWeekStart, getTierLimit, formatLimit } from "@/components/utils/accessControl";
import UpgradePrompt from "@/components/subscription/UpgradePrompt";

const Resume = base44.entities.Resume;
const JobApplication = base44.entities.JobApplication;
const JobMatch = base44.entities.JobMatch;

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Sparkles, Briefcase, Star, Loader2, Lightbulb, Target, Zap, FileText, CheckCircle2, Award, BookOpen } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import OptimizationResults from "@/components/resume/OptimizationResults";
import { retryWithBackoff } from "@/components/utils/retry";
import ResumeLengthControls from "@/components/resume/ResumeLengthControls";
import { logEvent } from "@/components/utils/telemetry";
import { Badge } from "@/components/ui/badge";
import CompanyResearchCard from "@/components/company/CompanyResearchCard";
import AgentChat from "@/components/agents/AgentChat";
import CvStylePrompt from "@/components/resume/CvStylePrompt";
import { resolveCvStyle } from "@/components/utils/cvStyleResolver";
import { cleanResumeData } from "@/components/utils/cleanResumeText";
import { buildAchievementCvPrompt } from "@/components/resume/AchievementCvPrompt";
import { generateAnalysisReport } from "@/components/reports/AnalysisReportGenerator";
import AnalysisReportView from "@/components/reports/AnalysisReportView";
import { generateInterviewPrep } from "@/functions/generateInterviewPrep";
import { generateInterviewPrepReport } from "@/components/reports/InterviewPrepReportGenerator";
import HumanOptimizationToggle from "@/components/resume/HumanOptimizationToggle";
import { buildHumanOptimizationEnhancement } from "@/components/resume/HumanOptimizationPrompt";

// Kyle's Expertise Domains
const KYLE_EXPERTISE_DOMAINS = [
  { name: "CV Best Practices", icon: "📄", color: "blue" },
  { name: "Cover Letter Strategies", icon: "💌", color: "purple" },
  { name: "Bullet Point Formula (ARC)", icon: "✏️", color: "green" },
  { name: "Interview Prep (STAR)", icon: "⭐", color: "yellow" },
  { name: "Career Positioning", icon: "🎯", color: "red" },
  { name: "Achievement Framing", icon: "🏆", color: "orange" }
];

const QualityFrameworkCard = ({ framework, isExpanded, onToggle }) => (
  <Card className="mb-3 hover:shadow-md transition-shadow">
    <CardHeader className="pb-2 cursor-pointer" onClick={onToggle}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckCircle2 size={18} className="text-green-600" />
          <CardTitle className="text-sm font-semibold">{framework.category}</CardTitle>
        </div>
        <span className="text-xs text-gray-500">{framework.criteria.length} items</span>
      </div>
    </CardHeader>
    {isExpanded && (
      <CardContent className="pt-0">
        <ul className="space-y-1">
          {framework.criteria.map((criterion, idx) => (
            <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
              <span className="text-green-600 mt-1">✓</span>
              <span>{criterion}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    )}
  </Card>
);

export default function ResumeOptimizer() {
  const [jobApplications, setJobApplications] = React.useState([]);
  const [jobMatches, setJobMatches] = React.useState([]);
  const [masterResumes, setMasterResumes] = React.useState([]);
  const [selectedJobId, setSelectedJobId] = React.useState("");
  const [selectedMatchId, setSelectedMatchId] = React.useState("");
  const [selectedResumeId, setSelectedResumeId] = React.useState("");
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [optimizationResults, setOptimizationResults] = React.useState(null);
  const [error, setError] = React.useState("");
  const [retargetEnabled, setRetargetEnabled] = React.useState(true);
  const [optimizeMode, setOptimizeMode] = React.useState("two_page");
  const [useJobMatch, setUseJobMatch] = React.useState(false);
  const [aggressiveMatch, setAggressiveMatch] = React.useState(true);
  const [deepHumanize, setDeepHumanize] = React.useState(true);
  const [suggestions, setSuggestions] = React.useState(null);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = React.useState(false);
  const [tailoringSuggestions, setTailoringSuggestions] = React.useState(null);
  const [isLoadingTailoring, setIsLoadingTailoring] = React.useState(false);
  const [optimizedVersions, setOptimizedVersions] = React.useState([]);
  const [selectedVersion, setSelectedVersion] = React.useState(0);
  
  // Kyle's enhancements
  const [positioningAnalysis, setPositioningAnalysis] = React.useState(null);
  const [qualityFramework, setQualityFramework] = React.useState(null);
  const [applicationPackageStrategy, setApplicationPackageStrategy] = React.useState(null);
  const [expandedFrameworks, setExpandedFrameworks] = React.useState({});
  const [isLoadingPositioning, setIsLoadingPositioning] = React.useState(false);
  const [isLoadingQualityFramework, setIsLoadingQualityFramework] = React.useState(false);
  const [kyleArcGuidance, setKyleArcGuidance] = React.useState(null);
  const [isLoadingArc, setIsLoadingArc] = React.useState(false);
  const [currentUser, setCurrentUser] = React.useState(null);
  const [optimizationCount, setOptimizationCount] = React.useState(0);

  // CV Style auto-detection
  const [resolvedCvStyle, setResolvedCvStyle] = React.useState(null);
  const [selectedCvStyle, setSelectedCvStyle] = React.useState(null);
  const [analysisReportText, setAnalysisReportText] = React.useState("");
  const [isGeneratingReport, setIsGeneratingReport] = React.useState(false);

  // Human Optimization state
  const [humanOptEnabled, setHumanOptEnabled] = React.useState(false);
  const [humanOptCount, setHumanOptCount] = React.useState(0);

  React.useEffect(() => {
    const dismissed = localStorage.getItem("guided-tour-dismissed") === "true";
    if (dismissed) return;
    const sessionKey = "guided-tour-resume-optimizer-shown";
    if (sessionStorage.getItem(sessionKey) === "true") return;
    sessionStorage.setItem(sessionKey, "true");
    window.dispatchEvent(new CustomEvent("guided-tour:start"));
  }, []);

  const loadInitialData = React.useCallback(async () => {
    setIsProcessing(true);
    setError("");
    try {
      const [applications, masterResumesResult, allResumes, matches, user] = await Promise.all([
        JobApplication.list("-created_date", 50),
        Resume.filter({ is_master_resume: true }, "-created_date", 100),
        Resume.list("-created_date", 500),
        JobMatch.list("-created_date", 50),
        base44.auth.me()
      ]);
      setJobApplications(applications);
      setMasterResumes(masterResumesResult);
      setJobMatches(matches);
      setCurrentUser(user);

      // Count this week's optimizations (Monday to Sunday)
      const weekStart = getWeekStart();
      const optimizedThisWeek = allResumes.filter(r =>
        !r.is_master_resume && new Date(r.created_date) >= weekStart
      ).length;
      setOptimizationCount(optimizedThisWeek);

      // Count this week's human optimizations (track via version name suffix)
      const humanOptThisWeek = allResumes.filter(r =>
        !r.is_master_resume &&
        r.version_name?.includes("Human") &&
        new Date(r.created_date) >= weekStart
      ).length;
      setHumanOptCount(humanOptThisWeek);

      if (masterResumesResult.length === 0) {
        setError("Please upload or build a master resume first.");
      }
    } catch (e) {
      console.error(e);
      setError("Failed to load your data. Please refresh the page.");
    }
    setIsProcessing(false);
  }, []);

  React.useEffect(() => {
    // Scroll to top when page loads
    window.scrollTo(0, 0);
    loadInitialData();
  }, [loadInitialData]);

  React.useEffect(() => {
    const qp = new URLSearchParams(window.location.search);
    const id = qp.get("id");
    if (id && jobApplications.length > 0) {
      const exists = jobApplications.some(j => j.id === id);
      if (exists) {
        setSelectedJobId(id);
        // Auto-generate analysis report on handoff from Job Analysis
        const app = jobApplications.find(j => j.id === id);
        if (app && !app.analysis_report_text) {
          setIsGeneratingReport(true);
          generateAnalysisReport(id).then(text => {
            setAnalysisReportText(text || "");
          }).catch(console.error).finally(() => setIsGeneratingReport(false));
        } else if (app?.analysis_report_text) {
          setAnalysisReportText(app.analysis_report_text);
        }

        // Auto-generate interview prep data + report on handoff
        if (app && !app.summary?.interview_prep) {
          generateInterviewPrep({ action: "generate", job_application_id: id }).catch(console.error);
        }
        if (app && !app.interview_prep_report_text) {
          generateInterviewPrepReport(id).catch(console.error);
        }
      }
    }
  }, [jobApplications]);

  // Auto-resolve CV style when job + resume are selected
  React.useEffect(() => {
    if (!selectedJobId && !selectedMatchId) { setResolvedCvStyle(null); setSelectedCvStyle(null); return; }
    if (!selectedResumeId) { setResolvedCvStyle(null); setSelectedCvStyle(null); return; }

    const job = useJobMatch
      ? jobMatches.find(m => m.id === selectedMatchId)
      : jobApplications.find(j => j.id === selectedJobId);
    const resume = masterResumes.find(r => r.id === selectedResumeId);
    if (!job || !resume) return;

    const resumeText = resume.parsed_content || resume.optimized_content || "";
    const roleClassification = job.llm_analysis_result?.simon_role_classification
      || job.summary?.simon_brief?.role_classification
      || {};

    const style = resolveCvStyle("auto", job.job_title, roleClassification, resumeText);
    setResolvedCvStyle(style);
    // Pre-select chronological as default, let user choose
    setSelectedCvStyle(null);
  }, [selectedJobId, selectedMatchId, selectedResumeId, useJobMatch, jobApplications, jobMatches, masterResumes]);

  // Load Kyle's Positioning Analysis
  const loadPositioningAnalysis = async () => {
    if (!selectedJobId || !selectedResumeId) {
      setError("Please select both a job and resume");
      return;
    }

    setIsLoadingPositioning(true);
    try {
      const job = jobApplications.find(j => j.id === selectedJobId);

      const response = await retryWithBackoff(() =>
        base44.integrations.Core.InvokeLLM({
          prompt: `You are Kyle, a Career Positioning Expert. Analyze this role and provide SPECIFIC, ACTIONABLE strategic positioning guidance.

Role: ${job.job_title}
Company: ${job.company_name}
Job Description: ${job.job_description}

YOUR TASK:
1. Write a 2-3 sentence positioning statement that frames the candidate's value proposition for THIS specific role
2. Identify 4-5 key themes the candidate should emphasize (e.g., "Technical Leadership", "Cross-functional Collaboration")
3. List 4-5 specific focus areas for the application (e.g., "Highlight budget management experience", "Emphasize cloud migration projects")
4. Provide a concrete application approach strategy (2-3 sentences on how to structure the application)

CRITICAL: Provide REAL, SPECIFIC guidance - not generic placeholders. Every field must contain actual strategic advice.

Return JSON with complete data:
{
  "positioning_statement": "Actual 2-3 sentence statement here",
  "key_themes": ["Theme 1", "Theme 2", "Theme 3", "Theme 4"],
  "focus_areas": ["Specific area 1", "Specific area 2", "Specific area 3", "Specific area 4"],
  "application_approach": "Actual 2-3 sentence strategy here"
}`,
          response_json_schema: {
            type: "object",
            properties: {
              positioning_statement: { type: "string", description: "2-3 sentence positioning statement" },
              key_themes: { type: "array", items: { type: "string" }, minItems: 4 },
              focus_areas: { type: "array", items: { type: "string" }, minItems: 4 },
              application_approach: { type: "string", description: "2-3 sentence strategy" }
            },
            required: ["positioning_statement", "key_themes", "focus_areas", "application_approach"]
          }
        })
      );

      setPositioningAnalysis(response);
    } catch (e) {
      console.error("Failed to load positioning analysis:", e);
      setError("Could not generate positioning analysis");
    }
    setIsLoadingPositioning(false);
  };

  // Load Quality Framework
  const loadQualityFramework = async () => {
    if (!selectedJobId) {
      setError("Please select a job");
      return;
    }

    setIsLoadingQualityFramework(true);
    try {
      const job = jobApplications.find(j => j.id === selectedJobId);

      const response = await retryWithBackoff(() =>
        base44.integrations.Core.InvokeLLM({
          prompt: `You are Kyle, a Resume Quality Auditor. Create a SPECIFIC quality checklist for optimizing a CV for this role.

Role: ${job.job_title}
Company: ${job.company_name}

Create evaluation criteria for these 4 categories:
1. Professional Summary - What makes a summary strong for THIS specific role?
2. Experience Section - What should experience bullets emphasize for THIS role?
3. Skills Section - Which skills are critical to highlight?
4. Formatting & Design - What format considerations matter for THIS role?

For EACH category, provide 4-5 SPECIFIC, ACTIONABLE quality criteria (not generic advice).

Example criteria format:
- "Summary mentions X years of experience in [specific domain]"
- "Each bullet quantifies impact with metrics"
- "Skills section includes [specific tools] required in JD"

CRITICAL: Provide REAL, SPECIFIC criteria - not generic placeholders.

Return JSON:
{
  "categories": [
    {
      "category": "Professional Summary",
      "criteria": ["Specific criterion 1", "Specific criterion 2", "Specific criterion 3", "Specific criterion 4"]
    },
    {
      "category": "Experience Section",
      "criteria": ["Specific criterion 1", "Specific criterion 2", "Specific criterion 3", "Specific criterion 4"]
    },
    {
      "category": "Skills Section",
      "criteria": ["Specific criterion 1", "Specific criterion 2", "Specific criterion 3", "Specific criterion 4"]
    },
    {
      "category": "Formatting & Design",
      "criteria": ["Specific criterion 1", "Specific criterion 2", "Specific criterion 3", "Specific criterion 4"]
    }
  ]
}`,
          response_json_schema: {
            type: "object",
            properties: {
              categories: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    category: { type: "string" },
                    criteria: { type: "array", items: { type: "string" }, minItems: 4 }
                  },
                  required: ["category", "criteria"]
                },
                minItems: 4
              }
            },
            required: ["categories"]
          }
        })
      );

      setQualityFramework(response);
      setExpandedFrameworks({});
    } catch (e) {
      console.error("Failed to load quality framework:", e);
      setError("Could not generate quality framework");
    }
    setIsLoadingQualityFramework(false);
  };

  const getKyleArcGuidance = async () => {
      if (!selectedResumeId) {
          setError("Please select a resume");
          return;
      }

      setIsLoadingArc(true);
      setError("");
      try {
          const resume = masterResumes.find(r => r.id === selectedResumeId);
          if (!resume) {
              setError("Selected resume not found. Please select another.");
              setIsLoadingArc(false);
              return;
          }

          const contentToParse = resume.parsed_content || resume.optimized_content;
          if (!contentToParse) {
              setError("Resume content not available. Please try another resume.");
              setIsLoadingArc(false);
              return;
          }

          let resumeContent;
          try {
              resumeContent = typeof contentToParse === 'string'
                  ? JSON.parse(contentToParse)
                  : contentToParse;
          } catch (parseError) {
              console.error("Failed to parse resume content:", parseError);
              setError("Resume content is corrupted or invalid. Please upload the resume again.");
              setIsLoadingArc(false);
              return;
          }
          const experiences = resumeContent.experience || [];

          if (experiences.length === 0) {
              setError("No experience entries found in this resume.");
              setIsLoadingArc(false);
              return;
          }

          // Collect all bullets for analysis
          const allBullets = [];
          experiences.forEach((exp, idx) => {
              (exp.achievements || []).forEach((bullet, bidx) => {
                  allBullets.push({
                      role: `${exp.position} at ${exp.company}`,
                      bullet: bullet,
                      index: `${idx + 1}.${bidx + 1}`
                  });
              });
          });

          if (allBullets.length === 0) {
              setError("No bullet points found in resume experience. Please add achievements to your resume.");
              setIsLoadingArc(false);
              return;
          }

          const prompt = `You are Kyle, a CV expert specializing in the ARC formula (Action + Result + Context).

The ARC Formula:
- ACTION: Strong verb + what you did
- RESULT: Quantified impact (%, $, time saved, etc.)
- CONTEXT: Why it mattered / business impact

Analyze EACH of these ${allBullets.length} resume bullets and provide feedback:

${allBullets.map(b => `[${b.index}] ${b.role}: "${b.bullet}"`).join("\n")}

For EACH bullet provide:
1. ARC Score (0-10 as a NUMBER): Rate how well it follows Action + Result + Context
2. What's missing: Specific feedback (e.g., "No quantified result", "Weak action verb 'managed'", "Missing business context")
3. Improved version: Rewrite using ARC formula with strong action verb + quantified result + context

CRITICAL REQUIREMENTS:
- arc_score must be a NUMBER 0-10, not a string
- Analyze ALL ${allBullets.length} bullets - do not skip any
- Improved versions must be complete sentences with ACTION + RESULT + CONTEXT
- Be specific in the "missing" field about what exact elements are lacking

Return JSON:
{
  "bullet_analysis": [
    {
      "original": "The exact original bullet text",
      "arc_score": 4,
      "missing": "No quantified result, weak verb 'managed', no context on impact",
      "improved": "Led 12-person team to deliver $2M project 3 weeks ahead of schedule, reducing operational costs by 25%"
    }
  ]
}`;

          const kyleResponse = await retryWithBackoff(() =>
              base44.integrations.Core.InvokeLLM({
                  prompt,
                  response_json_schema: {
                      type: "object",
                      properties: {
                          bullet_analysis: {
                              type: "array",
                              items: {
                                  type: "object",
                                  properties: {
                                      original: { type: "string" },
                                      arc_score: { type: "number" },
                                      missing: { type: "string" },
                                      improved: { type: "string" }
                                  },
                                  required: ["original", "arc_score", "missing", "improved"]
                              }
                          }
                      },
                      required: ["bullet_analysis"]
                  }
              }),
              { retries: 3, baseDelay: 1500 }
          );

          if (!kyleResponse || !kyleResponse.bullet_analysis || kyleResponse.bullet_analysis.length === 0) {
              setError("ARC analysis returned empty results. Please try again.");
              setIsLoadingArc(false);
              return;
          }

          setKyleArcGuidance(kyleResponse);
      } catch (e) {
          console.error("Kyle ARC analysis failed:", e);
          setError("ARC analysis failed. The service may be busy - please try again in a moment.");
      }
      setIsLoadingArc(false);
  };

  const generateTailoringSuggestions = async () => {
      if (!selectedJobId || !selectedResumeId) {
          setError("Please select both a job and resume");
          return;
      }

      setIsLoadingTailoring(true);
      try {
          const job = jobApplications.find(j => j.id === selectedJobId);
          const resume = masterResumes.find(r => r.id === selectedResumeId);

          if (!resume) {
              setError("Selected resume not found. Please select another.");
              setIsLoadingTailoring(false);
              return;
          }

          const contentToParse = resume.parsed_content || resume.optimized_content;
          if (!contentToParse) {
              setError("Resume content not available. Please try another resume.");
              setIsLoadingTailoring(false);
              return;
          }

          let resumeContent;
          try {
              resumeContent = typeof contentToParse === 'string'
                  ? JSON.parse(contentToParse)
                  : contentToParse;
          } catch (parseError) {
              console.error("Failed to parse resume content:", parseError);
              setError("Resume content is corrupted or invalid. Please upload the resume again.");
              setIsLoadingTailoring(false);
              return;
          }

          const currentSummary = resumeContent.summary || resumeContent.executive_summary || "";
          const experiences = resumeContent.experience || [];

          const prompt = `Analyze this resume against the job description and provide specific tailoring suggestions.

  Job Title: ${job.job_title}
  Job Description: ${job.job_description}

  Current Resume Summary: ${currentSummary}

  Current Experience History:
  ${experiences.map((exp, idx) => `
  Role ${idx + 1}: ${exp.position} at ${exp.company}
  Bullets: ${(exp.achievements || []).join("; ")}
  `).join("\n")}

  Provide:
  1. A tailored professional summary (2-3 sentences) optimized for this role
  2. For each experience section, suggest 3 improved bullet points that emphasize relevant skills/achievements
  3. Keywords from JD that should appear in the resume

  Return JSON with:
  {
  "tailored_summary": "string",
  "experience_suggestions": [
  {
    "role": "string",
    "bullets": ["bullet1", "bullet2", "bullet3"]
  }
  ],
  "missing_keywords": ["keyword1", "keyword2"]
  }`;

          const response = await base44.integrations.Core.InvokeLLM({
              prompt,
              response_json_schema: {
                  type: "object",
                  properties: {
                      tailored_summary: { type: "string" },
                      experience_suggestions: {
                          type: "array",
                          items: {
                              type: "object",
                              properties: {
                                  role: { type: "string" },
                                  bullets: { type: "array", items: { type: "string" } }
                              }
                          }
                      },
                      missing_keywords: { type: "array", items: { type: "string" } }
                  }
              }
          });

          setTailoringSuggestions(response);
      } catch (e) {
          console.error("Failed to generate tailoring suggestions:", e);
      }
      setIsLoadingTailoring(false);
  };

  const optimizeResume = async (generateMultiple = false) => {
    // Check tier limits
    if (!canPerformAction(currentUser, "optimize_resume", optimizationCount)) {
      setError("You've reached your weekly optimization limit. Upgrade to Pro for unlimited optimizations.");
      return;
    }

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

    const modeLabel = optimizeMode === "ats_one_page" ? "ATS 1-Page" : optimizeMode === "two_page" ? "2-Page Pro" : "Full CV";

    // Determine CV style(s) to generate
    const userChoice = selectedCvStyle || resolvedCvStyle || "chronological";
    const finalCvStyle = userChoice;
    const stylesToGenerate = finalCvStyle === "both" ? ["chronological", "achievement"] : [finalCvStyle];

    // Define STRICT constraints based on mode - MUST BE ENFORCED
    const constraints = optimizeMode === "ats_one_page"
        ? `**ATS 1-PAGE MODE - STRICT CONSTRAINTS:**
- MAXIMUM 3 bullet points per role (STRICTLY ENFORCED - never exceed 3)
- Focus ONLY on the most impactful, JD-relevant achievements
- Use SHORT, punchy bullets (under 120 characters each)
- Include ONLY the 3-4 most recent/relevant roles
- Skip older roles (10+ years) entirely or combine into one-line "Earlier Experience" note
- Professional summary: 2-3 sentences MAX
- Skills section: 8-12 most relevant keywords only
- NO elaborate descriptions - every word must earn its place
- Target: Under 400 words total for all experience bullets combined`
        : optimizeMode === "two_page"
        ? `**PRO 2-PAGE MODE - BALANCED CONSTRAINTS:**
- EXACTLY 4-5 bullet points per recent role (last 5 years) - no more, no less
- 2-3 bullet points for older roles (5-10 years)
- 1-2 bullet points for roles 10+ years old
- Bullets should be medium length (100-180 characters each)
- Include ALL relevant job history but with proportional detail
- Professional summary: 3-4 sentences with key value proposition
- Skills section: 15-20 relevant keywords organized by category
- More detail on quantified achievements and context
- Target: 600-800 words total for all experience bullets combined`
        : `**FULL CV MODE - COMPREHENSIVE CONSTRAINTS:**
- EXACTLY 5-7 bullet points per role (no exceptions)
- Include EVERY job from the candidate's history without omissions
- Bullets should be detailed (150-250 characters each)
- Comprehensive coverage of responsibilities AND achievements
- Professional summary: 4-5 sentences with full value proposition
- Skills section: Complete list of all relevant skills (20+)
- Include ALL education, certifications, and professional development
- Include volunteer work, side projects, publications if present
- Full context for each achievement with metrics where available
- Target: 1000+ words total for all experience bullets combined`;

    try {
        const numVersions = generateMultiple ? 3 : 1;
        const versions = [];

        // Parse resume to extract all job history items
        let resumeData;
        try {
            resumeData = JSON.parse(selectedResume.parsed_content);
        } catch (parseError) {
            console.error("Failed to parse resume content:", parseError);
            setError("Resume content is corrupted or invalid. Please upload the resume again.");
            setIsProcessing(false);
            return;
        }
        const allJobHistory = resumeData.experience || [];

        // Create detailed job history breakdown for analysis
        const jobHistoryBreakdown = allJobHistory.map((job, idx) => `
**JOB ${idx + 1}:**
- Position: ${job.position}
- Company: ${job.company}
- Duration: ${job.duration || 'N/A'}
- Location: ${job.location || 'N/A'}
- Current Bullets: ${(job.achievements || []).map((b, i) => `\n  ${i + 1}. ${b}`).join('')}
`).join('\n');

        for (const cvStyle of stylesToGenerate) {
          const styleTag = cvStyle === "achievement" ? "Exp" : "Chron";

          // Build human optimization enhancement if enabled
          const humanOptEnhancement = humanOptEnabled ? buildHumanOptimizationEnhancement({
            targetRole: jobData.job_title,
            targetCompany: jobData.company_name,
            toneFit: ""
          }) : "";

          // For achievement style, use the dedicated achievement CV prompt builder
          if (cvStyle === "achievement") {
            for (let i = 0; i < numVersions; i++) {
              const baseAchievementPrompt = buildAchievementCvPrompt({
                jobTitle: jobData.job_title,
                companyName: jobData.company_name,
                jobDescription: jobData.job_description,
                resumeContent: selectedResume.parsed_content,
                modeLabel,
                constraints,
                variationIndex: i,
                generateMultiple,
              });
              const achievementPrompt = humanOptEnabled 
                ? `${humanOptEnhancement}\n\n${baseAchievementPrompt}`
                : baseAchievementPrompt;

              const response = await retryWithBackoff(() =>
                base44.integrations.Core.InvokeLLM({
                  prompt: achievementPrompt,
                  response_json_schema: {
                    type: "object",
                    properties: {
                      optimization_score: { type: "number" },
                      jd_style_analysis: {
                        type: "object",
                        properties: {
                          bullet_length: { type: "string" },
                          tone: { type: "string" },
                          verb_pattern: { type: "array", items: { type: "string" } },
                          sentence_target: { type: "string" }
                        }
                      },
                      formula_distribution: {
                        type: "object",
                        properties: {
                          ARC: { type: "number" }, TEAL: { type: "number" }, XYZ: { type: "number" },
                          CAR: { type: "number" }, PAR: { type: "number" }, SOAR: { type: "number" },
                          STAR: { type: "number" }, LPS: { type: "number" }, ELITE: { type: "number" }
                        }
                      },
                      recommendations: { type: "array", items: { type: "string" } },
                      pillars: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            name: { type: "string" },
                            items: { type: "array", items: { type: "string" } }
                          }
                        }
                      },
                      optimized_resume_content: {
                        type: "object",
                        properties: {
                          personal_info: {
                            type: "object",
                            properties: {
                              name: { type: "string" },
                              email: { type: "string" },
                              phone: { type: "string" },
                              location: { type: "string" },
                              linkedin: { type: "string" },
                              portfolio: { type: "string" }
                            }
                          },
                          executive_summary: { type: "string" },
                          career_achievements: {
                            type: "array",
                            items: {
                              type: "object",
                              properties: {
                                pillar_name: { type: "string" },
                                items: { type: "array", items: {
                                  type: "object",
                                  properties: {
                                    text: { type: "string" },
                                    formula: { type: "string" }
                                  },
                                  required: ["text", "formula"]
                                } }
                              }
                            }
                          },
                          skills: { type: "array", items: { type: "string" } },
                          experience: {
                            type: "array",
                            items: {
                              type: "object",
                              properties: {
                                position: { type: "string" },
                                company: { type: "string" },
                                location: { type: "string" },
                                duration: { type: "string" },
                                achievements: { type: "array", items: { type: "string" } }
                              }
                            }
                          },
                          education: {
                            type: "array",
                            items: {
                              type: "object",
                              properties: {
                                degree: { type: "string" },
                                institution: { type: "string" },
                                year: { type: "string" }
                              }
                            }
                          }
                        },
                        required: ["personal_info", "skills", "experience"]
                      }
                    }
                  }
                }),
                { retries: 3, baseDelay: 1200 }
              );

              if (response.optimized_resume_content) {
                response.optimized_resume_content = cleanResumeData(response.optimized_resume_content);
              }
              if (response.recommendations) {
                response.recommendations = response.recommendations.map(r => cleanResumeData(r));
              }

              const humanTag = humanOptEnabled ? " - Human" : "";
              const versionSuffix = generateMultiple ? ` v${i + 1}` : "";
              const newVersion = await Resume.create({
                version_name: `${jobData.job_title} - ${jobData.company_name} - ${modeLabel} - ${styleTag}${humanTag}${versionSuffix}`,
                original_file_url: selectedResume.original_file_url,
                parsed_content: selectedResume.parsed_content,
                optimized_content: JSON.stringify(response.optimized_resume_content),
                is_master_resume: false,
                job_application_id: useJobMatch ? null : jobData.id
              });

              versions.push({
                ...response,
                resumeId: newVersion.id,
                jobTitle: jobData.job_title,
                companyName: jobData.company_name,
                cvStyle
              });
            }
            continue; // skip to next style
          }

          // Chronological style — existing prompt
          const cvStyleInstruction = `\n**CV FORMAT: CHRONOLOGICAL**
- Standard reverse-chronological format.
- Each role lists bullets in natural time-order, blending responsibilities with achievements.
- ATS-optimized with clear section headers.

**JD POWER TERM EXTRACTION (do this silently before writing):**
A. VERB+NOUN PAIRS (highest AI screener weight): Extract the specific actions the JD asks for. Match the JD's verb+noun structure but use natural verbs (JD: "conduct investigations" → You: "handled investigations"). Each major JD verb+noun pair MUST map to at least one bullet. These MUST appear in BULLET TEXT, not just skills sidebar.
B. HARD SKILLS/TOOLS (medium weight): Every named tool/system must appear in BOTH the skills section AND at least one bullet. Skills section alone is not enough — AI weights in-context mentions higher.
C. SOFT REQUIREMENTS (differentiating): Industry signals in company descriptions, scope signals in bullets ("across CA, IL, and SC"), pace signals ("90 days", "85 locations").

**KEYWORD PLACEMENT (AI screeners weight locations differently):**
- Professional Summary: HIGH weight — include 2-3 major JD terms naturally
- Bullet text (recent roles): HIGHEST weight — all MUST requirements mapped here
- Bullet text (older roles): MEDIUM weight — PLUS requirements here
- Skills list: MEDIUM weight — every JD skill listed once
- Role titles: HIGH weight — match JD title where honest
- KEY: If a MUST requirement only appears in an older role, add a reference in a recent role too (if honest)\n`;

        for (let i = 0; i < numVersions; i++) {
            const chronHumanPrefix = humanOptEnabled ? humanOptEnhancement + "\n\n" : "";
            const response = await retryWithBackoff(() =>
              base44.integrations.Core.InvokeLLM({
                prompt: `${chronHumanPrefix}You are a strict, objective Resume Auditor and Career Coach.
${cvStyleInstruction} Your goal is to optimize this resume for the specific Job Description (JD) provided, adhering to strict TRUTHFULNESS and STRATEGIC REFRAMING principles.

            **PART 1: CRITICAL TRUTHFULNESS RULES**
            1. **NO FABRICATION:** Do NOT invent roles, companies, titles, skills, or achievements not present in the original resume.
            2. **REALITY CHECK:** If the candidate lacks a specific skill required by the JD, DO NOT add it. Do not lie to "please" the ATS.
            3. **REFRAMING OVER INVENTING:** Rephrase, reorder, and emphasize *existing* experience to align with JD keywords, but facts must remain true.
            4. **IRRELEVANT DATA:** Summarize or omit completely irrelevant experience to save space, provided it doesn't create unexplained gaps.

            **PART 2: STRATEGIC REFRAMING RULES (Apply these aggressively)**
            1. **THE "SO WHAT?" RULE (Outcome Linking):** Never state a responsibility without its business impact.
               - Bad: "Managed employee relations."
               - Good: "Accelerated productivity by 180% by implementing automated performance tracking."
               - Fix: Ask "Did this save money, make money, or save time?" Put the answer FIRST.
            
            2. **THE "BUILDER" VERB SWAP:** Replace passive "maintenance" verbs with active "construction" verbs.
               - Banned: Managed, Oversaw, Served as, Acted as, Maintained, Handled.
               - Required: Architected, Engineered, Scaled, Accelerated, Deployed, Built (0-to-1).
               - Goal: Signal value creation, not just caretaking.

            3. **KILL THE "POLICY FACTORY" SIGNAL:** Reframe administrative work as infrastructure building.
               - Delete: "Designed handbook", "Updated policies".
               - Replace with: "Engineered compliance frameworks", "Built scalable people infrastructure".

            4. **THE GLOBAL CONTEXT PIVOT:** If the candidate has international experience, FLAGG IT explicitly in titles or headers (e.g., "Head of U.S. Operations (Global Market Entry)").

            5. **SUMMARY REWRITE STRATEGY:** Use this formula: "[Adjective] [Target Role Title] + [Years Exp] + [Specialty 1] + [Specialty 2]".
               - Example: "Business-Minded Head of People & Global Ops Builder... Specialized in 0-to-1 scaling and cross-border compliance."

            **PART 3: CHRONOLOGY & 10-YEAR+ RULE (CRITICAL)**
            1. **Strict Chronology:** You MUST maintain reverse chronological order for ALL roles.
            2. **The 10-Year Handling:** 
               - For roles within the last 10 years: Detail them fully.
               - For roles OLDER than 10 years:
                 - If **HIGHLY RELEVANT** to the target JD: Keep detailed bullets to show depth of expertise.
                 - If **LESS RELEVANT**: Do NOT delete. Summarize them in a "Previous Experience" or "Early Career" section/grouping with just Company, Title, Dates, and a 1-line summary.
               - **GOAL:** Provide a complete history (no gaps) while focusing attention on recent/relevant work. Do NOT truncate the career history.

            **PART 4: INDIVIDUAL JOB EVALUATION (CRITICAL - NEW REQUIREMENT)**
            You MUST evaluate EACH job history item individually against the JD:
            1. **Analyze each role's relevance:** For every single position listed below, assess how its responsibilities and achievements align with the target JD requirements.
            2. **Provide tailored context:** For each role, extract and reframe achievements that match JD keywords, skills, and desired outcomes.
            3. **Include ALL positions:** Do not skip any job in your output. Every position from the original resume must appear in the optimized version, even if summarized.
            4. **Match to JD requirements:** Explicitly identify which JD requirements each role addresses, and optimize bullets accordingly.

            **COMPLETE JOB HISTORY BREAKDOWN (${allJobHistory.length} positions total):**
            ${jobHistoryBreakdown}

            **OPTIMIZATION INSTRUCTIONS:**
            - **Mode:** ${modeLabel}
            ${constraints}
            - **Task:** Rewrite the resume content to maximize relevance to the JD. You MUST process and include ALL ${allJobHistory.length} job history items listed above. Evaluate each one individually for JD alignment.

            **BULLET POINT COUNT ENFORCEMENT (MODE: ${modeLabel}):**
            ${optimizeMode === "ats_one_page" ? `
            FOR ATS 1-PAGE MODE - COUNT YOUR BULLETS:
            - Recent roles (last 3-5 years): EXACTLY 2-3 bullets each (NOT 4, NOT 5)
            - Older roles: 1 bullet OR skip entirely
            - Total experience section: MAX 10-12 bullets across ALL roles
            - If you exceed these counts, you FAIL the task` : optimizeMode === "two_page" ? `
            FOR PRO 2-PAGE MODE - COUNT YOUR BULLETS:
            - Recent roles (last 5 years): EXACTLY 4-5 bullets each (NOT 3, NOT 6)
            - Older roles (5-10 years): EXACTLY 2-3 bullets each
            - Very old roles (10+ years): 1-2 bullets each
            - Total experience section: 20-30 bullets across ALL roles` : `
            FOR FULL CV MODE - COUNT YOUR BULLETS:
            - ALL roles: EXACTLY 5-7 bullets each (minimum 5, maximum 7)
            - Include EVERY role from the resume without exception
            - Comprehensive detail on each achievement
            - Total experience section: 35+ bullets across ALL roles`}

            **INPUT DATA:**
            - **Job Description:** ${jobData.job_description}
            - **Original Resume (Full Context):** ${selectedResume.parsed_content}
            ${generateMultiple ? `- **Variation:** Create variation ${i + 1} with a slightly different truthful angle.` : ''}

            **CRITICAL OUTPUT REQUIREMENTS:**
            1. optimization_score MUST be a numeric value (0-100), NOT a string or percentage symbol
               - Example: "optimization_score": 85 (CORRECT)
               - Example: "optimization_score": "85%" (WRONG)
            2. COUNT your bullets before submitting - verify they match the ${modeLabel} requirements above
            3. PRESERVE the core meaning of achievements - reframe wording but don't invent new achievements
            4. **NO MARKDOWN FORMATTING:** Do NOT use asterisks (*), double asterisks (**), underscores (_), hash symbols (#), or any other markdown formatting in ANY output text. All text must be plain, clean, professional text with no special formatting characters.`,
                response_json_schema: {
                  type: "object",
                  properties: {
                    optimization_score: { 
                      type: "number",
                      description: "Match score 0-100 as a NUMBER not string"
                    },
                    recommendations: { type: "array", items: { type: "string" } },
                    optimized_resume_content: {
                      type: "object",
                      properties: {
                        personal_info: {
                          type: "object",
                          properties: {
                            name: { type: "string" },
                            email: { type: "string" },
                            phone: { type: "string" },
                            location: { type: "string" },
                            linkedin: { type: "string" },
                            portfolio: { type: "string" }
                          }
                        },
                        executive_summary: { type: "string" },
                        skills: { type: "array", items: { type: "string" } },
                        experience: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              position: { type: "string" },
                              company: { type: "string" },
                              location: { type: "string" },
                              duration: { type: "string" },
                              achievements: { type: "array", items: { type: "string" } }
                            }
                          }
                        },
                        education: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              degree: { type: "string" },
                              institution: { type: "string" },
                              location: { type: "string" },
                              year: { type: "string" },
                              gpa: { type: "string" }
                            }
                          }
                        }
                      },
                      required: ["personal_info", "skills", "experience"]
                    }
                  }
                }
              }),
              { retries: 3, baseDelay: 1200 }
            );

            // Clean all markdown/asterisk formatting from the optimized content
            if (response.optimized_resume_content) {
              response.optimized_resume_content = cleanResumeData(response.optimized_resume_content);
            }
            if (response.executive_summary) {
              response.executive_summary = cleanResumeData(response.executive_summary);
            }
            if (response.recommendations) {
              response.recommendations = response.recommendations.map(r => cleanResumeData(r));
            }

            const chronHumanTag = humanOptEnabled ? " - Human" : "";
            const versionSuffix = generateMultiple ? ` v${i + 1}` : "";
            const newVersion = await Resume.create({
              version_name: `${jobData.job_title} - ${jobData.company_name} - ${modeLabel} - ${styleTag}${chronHumanTag}${versionSuffix}`,
              original_file_url: selectedResume.original_file_url,
              parsed_content: selectedResume.parsed_content,
              optimized_content: JSON.stringify(response.optimized_resume_content),
              is_master_resume: false,
              job_application_id: useJobMatch ? null : jobData.id
            });

            versions.push({
                ...response,
                resumeId: newVersion.id,
                jobTitle: jobData.job_title,
                companyName: jobData.company_name,
                cvStyle
            });
        }
        } // end stylesToGenerate loop

        // When "both" is selected or multi-version, show version compare UI
        if (versions.length > 1) {
            setOptimizedVersions(versions);
            setSelectedVersion(0);
        }

        if (!useJobMatch && selectedJob) {
          const existingSummary = selectedJob.summary || {};
          await JobApplication.update(selectedJobId, {
            optimization_score: versions[0].optimization_score,
            master_resume_id: selectedResumeId,
            optimized_resume_id: versions[0].resumeId,
            application_status: "ready",
            summary: { ...existingSummary, cv_style_resolved: finalCvStyle }
          });
        }

        setOptimizationResults(versions[0]);

        try {
          await logEvent({
            type: "resume_rendered",
            ts: new Date().toISOString(),
            app_id: jobData.id,
            mode: optimizeMode
          });
        } catch (logError) {
          console.error("Telemetry failed:", logError);
        }
    } catch (e) {
      console.error(e);
      setError("The service is busy right now. Please try again in a minute.");
    } finally {
      setIsProcessing(false);
    }
  };

  const resetOptimization = () => {
      setOptimizationResults(null);
      setSelectedJobId("");
      setSelectedMatchId("");
      setSelectedResumeId("");
      setSuggestions(null);
      setTailoringSuggestions(null);
      setOptimizedVersions([]);
      setSelectedVersion(0);
      setResolvedCvStyle(null);
      setSelectedCvStyle(null);
      setHumanOptEnabled(false);
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-full text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            AI Resume Optimizer
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-2">
            Optimize Your Resume with <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600">AI Intelligence</span>
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Tailor your resume for specific job applications and maximize your ATS score
          </p>
        </motion.div>

        {/* Kyle's Expertise Domains Display */}
        <Card className="mb-6 border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-900">
              <Award className="w-5 h-5 text-orange-600" />
              Kyle's Career Coaching Expertise
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {KYLE_EXPERTISE_DOMAINS.map((domain, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 bg-white/60 rounded-lg border border-amber-100 hover:bg-white transition-colors">
                  <span className="text-2xl">{domain.icon}</span>
                  <span className="text-sm font-medium text-amber-900">{domain.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Analysis Report (auto-generated on handoff) */}
        {(analysisReportText || isGeneratingReport) && (
          <AnalysisReportView
            reportText={analysisReportText}
            jobTitle={jobApplications.find(j => j.id === selectedJobId)?.job_title}
            companyName={jobApplications.find(j => j.id === selectedJobId)?.company_name}
            isGenerating={isGeneratingReport}
          />
        )}

        {error && <Alert variant="destructive" className="mb-6"><AlertDescription>{error}</AlertDescription></Alert>}

        {/* Tier Limit Warning */}
        {currentUser && !canPerformAction(currentUser, "optimize_resume", optimizationCount) && (
          <UpgradePrompt 
            feature="resume_optimizations" 
            currentTier={currentUser.subscription_tier || TIERS.FREE}
            variant="alert"
          />
        )}

        <AnimatePresence mode="wait">
          {!optimizationResults ? (
            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-green-600" />
                    Select Job & Resume
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center gap-3 p-4 bg-slate-100 rounded-lg border border-slate-200">
                    <Switch checked={useJobMatch} onCheckedChange={setUseJobMatch} />
                    <span className="text-sm font-medium text-slate-700">Use Job Match instead of Application</span>
                  </div>

                  {!useJobMatch ? (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Job Application</label>
                      <Select value={selectedJobId} onValueChange={setSelectedJobId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a job application" />
                        </SelectTrigger>
                        <SelectContent>
                          {jobApplications.map(job => (
                            <SelectItem key={job.id} value={job.id}>
                              {job.job_title} at {job.company_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Job Match</label>
                      <Select value={selectedMatchId} onValueChange={setSelectedMatchId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a job match" />
                        </SelectTrigger>
                        <SelectContent>
                          {jobMatches.map(match => (
                            <SelectItem key={match.id} value={match.id}>
                              {match.job_title} at {match.company_name} ({match.match_score}% match)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Master Resume</label>
                    <Select value={selectedResumeId} onValueChange={setSelectedResumeId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your master resume" />
                      </SelectTrigger>
                      <SelectContent>
                        {masterResumes.map(resume => (
                          <SelectItem key={resume.id} value={resume.id}>
                            {resume.version_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <ResumeLengthControls value={optimizeMode} onChange={setOptimizeMode} />

                  {/* CV Style Prompt — always shown so user can choose Achievement-Based */}
                  <CvStylePrompt
                    onSelect={setSelectedCvStyle}
                    selectedStyle={selectedCvStyle || resolvedCvStyle}
                    isSeniorRole={resolvedCvStyle === "both"}
                  />

                  <div className="flex items-center justify-between p-4 bg-slate-100 rounded-lg border border-slate-200">
                    <span className="text-sm font-medium text-slate-700">Aggressive Keyword Matching</span>
                    <Switch checked={aggressiveMatch} onCheckedChange={setAggressiveMatch} />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-100 rounded-lg border border-slate-200">
                    <span className="text-sm font-medium text-slate-700">Deep Humanization (Anti-AI Detection)</span>
                    <Switch checked={deepHumanize} onCheckedChange={setDeepHumanize} />
                  </div>

                  {/* Human Optimization - Premium Feature */}
                  <HumanOptimizationToggle
                    enabled={humanOptEnabled}
                    onToggle={setHumanOptEnabled}
                    canUse={canPerformAction(currentUser, "human_optimization", humanOptCount)}
                    usageCount={humanOptCount}
                    usageLimit={getTierLimit(currentUser, "human_optimization")}
                    currentTier={currentUser?.subscription_tier || TIERS.FREE}
                  />

                  <div className="flex gap-3">
                      <Button
                        onClick={() => optimizeResume(false)}
                        disabled={isProcessing}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 h-12"
                      >
                        {isProcessing ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Processing...</> : <><Sparkles className="w-5 h-5 mr-2" />Optimize Resume</>}
                      </Button>
                      <Button onClick={() => optimizeResume(true)} disabled={isProcessing} variant="outline" className="border-purple-600 text-purple-700 h-12">
                        Generate 3 Versions
                      </Button>
                  </div>

                  {/* Kyle's Enhanced Analysis Section */}
                  <div className="border-t pt-6 mt-6">
                    <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-amber-600" />
                      Kyle's Career Coaching Analysis
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Button
                        onClick={loadPositioningAnalysis}
                        disabled={isLoadingPositioning || !selectedJobId}
                        variant="outline"
                        className="border-amber-600 text-amber-700 hover:bg-amber-50"
                      >
                        {isLoadingPositioning ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Loading...</> : <><Target className="w-4 h-4 mr-2" />Positioning Analysis</>}
                      </Button>
                      <Button
                        onClick={loadQualityFramework}
                        disabled={isLoadingQualityFramework || !selectedJobId}
                        variant="outline"
                        className="border-green-600 text-green-700 hover:bg-green-50"
                      >
                        {isLoadingQualityFramework ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Loading...</> : <><CheckCircle2 className="w-4 h-4 mr-2" />Quality Framework</>}
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex gap-3 mt-3">
                    <Button onClick={generateTailoringSuggestions} disabled={isLoadingTailoring || !selectedJobId || !selectedResumeId} variant="outline" className="flex-1">
                      {isLoadingTailoring ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Loading...</> : <><Target className="w-4 h-4 mr-2" />Tailoring Suggestions</>}
                    </Button>
                    <Button onClick={getKyleArcGuidance} disabled={isLoadingArc || !selectedResumeId} variant="outline" className="flex-1 border-purple-600 text-purple-700">
                      {isLoadingArc ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Loading...</> : <><Zap className="w-4 h-4 mr-2" />Kyle's ARC Review</>}
                    </Button>
                  </div>
                  </CardContent>
                  </Card>

                  {tailoringSuggestions && (
                  <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
                  <CardHeader>
                    <CardTitle className="text-purple-900 flex items-center gap-2">
                      <Lightbulb className="w-5 h-5 text-yellow-500" />
                      AI Tailoring Suggestions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {tailoringSuggestions.tailored_summary && (
                      <div>
                        <h4 className="font-semibold text-sm text-purple-800 mb-2">Suggested Professional Summary:</h4>
                        <p className="text-sm text-purple-900 bg-white/70 p-3 rounded-lg border border-purple-200">{tailoringSuggestions.tailored_summary}</p>
                      </div>
                    )}
                    {tailoringSuggestions.experience_suggestions?.map((exp, idx) => (
                      <div key={idx}>
                        <h4 className="font-semibold text-sm text-purple-800 mb-2">{exp.role}:</h4>
                        <ul className="space-y-1">
                          {exp.bullets?.map((bullet, bidx) => (
                            <li key={bidx} className="text-sm text-purple-900 bg-white/70 p-2 rounded border border-purple-100">• {bullet}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                    {tailoringSuggestions.missing_keywords?.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-sm text-purple-800 mb-2">Keywords to Add:</h4>
                        <div className="flex flex-wrap gap-2">
                          {tailoringSuggestions.missing_keywords.map((kw, idx) => (
                            <Badge key={idx} className="bg-yellow-100 text-yellow-800 border-yellow-200">{kw}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                  </Card>
                  )}

                  {/* Kyle's Positioning Analysis */}
                  {positioningAnalysis && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200 mb-6">
                  <CardHeader>
                    <CardTitle className="text-blue-900 flex items-center gap-2">
                      <Target className="w-5 h-5 text-blue-600" />
                      Kyle's Positioning Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {positioningAnalysis.positioning_statement && (
                      <div className="bg-white/70 p-4 rounded-lg border border-blue-200">
                        <h4 className="font-semibold text-sm text-blue-900 mb-2">Your Positioning Statement:</h4>
                        <p className="text-sm text-blue-800 italic">"{positioningAnalysis.positioning_statement}"</p>
                      </div>
                    )}
                    
                    {positioningAnalysis.key_themes?.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-sm text-blue-900 mb-2">Key Themes to Emphasize:</h4>
                        <div className="flex flex-wrap gap-2">
                          {positioningAnalysis.key_themes.map((theme, idx) => (
                            <Badge key={idx} className="bg-blue-100 text-blue-800 border-blue-200">{theme}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {positioningAnalysis.focus_areas?.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-sm text-blue-900 mb-2">Focus Areas for Application:</h4>
                        <ul className="space-y-1">
                          {positioningAnalysis.focus_areas.map((area, idx) => (
                            <li key={idx} className="text-sm text-blue-800 flex items-start gap-2">
                              <span className="text-blue-600 mt-0.5">→</span>
                              <span>{area}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {positioningAnalysis.application_approach && (
                      <div className="bg-blue-100/50 p-3 rounded-lg border border-blue-200">
                        <h4 className="font-semibold text-sm text-blue-900 mb-1">Application Approach:</h4>
                        <p className="text-sm text-blue-800">{positioningAnalysis.application_approach}</p>
                      </div>
                    )}
                  </CardContent>
                  </Card>
                  </motion.div>
                  )}

                  {/* Kyle's Quality Framework */}
                  {qualityFramework && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 mb-6">
                  <CardHeader>
                    <CardTitle className="text-green-900 flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      CV Quality Framework & Checklist
                    </CardTitle>
                    <p className="text-sm text-green-700 font-normal mt-2">Evaluate your resume against these quality criteria:</p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {qualityFramework.categories?.map((category, idx) => (
                        <QualityFrameworkCard
                          key={idx}
                          framework={category}
                          isExpanded={expandedFrameworks[idx]}
                          onToggle={() => {
                            setExpandedFrameworks(prev => ({
                              ...prev,
                              [idx]: !prev[idx]
                            }));
                          }}
                        />
                      ))}
                    </div>
                  </CardContent>
                  </Card>
                  </motion.div>
                  )}

                  {kyleArcGuidance && (
                  <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
                  <CardHeader>
                    <CardTitle className="text-purple-900 flex items-center gap-2">
                      <Zap className="w-5 h-5 text-purple-500" />
                      Kyle's ARC Formula Analysis
                    </CardTitle>
                    <p className="text-sm text-purple-700">Action + Result + Context scoring for your bullets</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {kyleArcGuidance.bullet_analysis?.map((item, idx) => (
                      <div key={idx} className="bg-white/70 p-4 rounded-lg border border-purple-200 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-purple-700">Bullet {idx + 1}</span>
                          <Badge className={`${
                            item.arc_score >= 8 ? 'bg-green-100 text-green-800' :
                            item.arc_score >= 6 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            ARC Score: {item.arc_score}/10
                          </Badge>
                        </div>
                        <div className="text-sm text-slate-700 italic">{item.original}</div>
                        {item.missing && (
                          <div className="text-xs text-orange-700 bg-orange-50 p-2 rounded border border-orange-200">
                            ⚠️ Missing: {item.missing}
                          </div>
                        )}
                        <div className="text-sm text-green-700 bg-green-50 p-2 rounded border border-green-200">
                          ✓ Improved: {item.improved}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                  </Card>
                  )}
                </motion.div>
              ) : (
                <motion.div key="results" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                  {optimizedVersions.length > 1 && (
                    <Card className="mb-6 bg-blue-50 border-blue-200">
                      <CardHeader>
                        <CardTitle className="text-blue-900 text-base">Compare Optimized Versions</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                         {optimizedVersions.map((version, idx) => (
                           <Button
                             key={idx}
                             onClick={() => {
                               setSelectedVersion(idx);
                               setOptimizationResults(version);
                             }}
                             variant={selectedVersion === idx ? "default" : "outline"}
                             size="sm"
                           >
                             {version.cvStyle === "achievement" ? "Achievement" : "Chronological"} ({version.optimization_score}%)
                           </Button>
                         ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  <OptimizationResults results={optimizationResults} onReset={resetOptimization} />
                </motion.div>
              )}
        </AnimatePresence>
      </div>

      {/* Kyle AI Agent Chat */}
      <AgentChat
        agentName="kyle"
        agentTitle="Kyle - CV Expert"
        context={{
          selectedJob: selectedJobId ? jobApplications.find(j => j.id === selectedJobId)?.job_title : "",
          selectedResume: selectedResumeId ? masterResumes.find(r => r.id === selectedResumeId)?.version_name : "",
          optimizationMode: optimizeMode,
          hasResults: !!optimizationResults
        }}
      />
    </div>
  );
}