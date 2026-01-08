import React from "react";
import { base44 } from "@/api/base44Client";

const Resume = base44.entities.Resume;
const JobApplication = base44.entities.JobApplication;
const JobMatch = base44.entities.JobMatch;

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Sparkles, Briefcase, Star, Loader2, Lightbulb, Target, Zap, FileText } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import OptimizationResults from "@/components/resume/OptimizationResults";
import { retryWithBackoff } from "@/components/utils/retry";
import ResumeLengthControls from "@/components/resume/ResumeLengthControls";
import { logEvent } from "@/components/utils/telemetry";
import { Badge } from "@/components/ui/badge";
import AISuggestions from "@/components/resume/AISuggestions";
import CompanyResearchCard from "@/components/company/CompanyResearchCard";

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

  const loadInitialData = React.useCallback(async () => {
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

  React.useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  React.useEffect(() => {
    const qp = new URLSearchParams(window.location.search);
    const id = qp.get("id");
    if (id && jobApplications.length > 0) {
      const exists = jobApplications.some(j => j.id === id);
      if (exists) setSelectedJobId(id);
    }
  }, [jobApplications]);

  const generateTailoringSuggestions = async () => {
      if (!selectedJobId || !selectedResumeId) {
          setError("Please select both a job and resume");
          return;
      }

      setIsLoadingTailoring(true);
      try {
          const job = jobApplications.find(j => j.id === selectedJobId);
          const resume = masterResumes.find(r => r.id === selectedResumeId);

          const resumeContent = JSON.parse(resume.parsed_content || resume.optimized_content);
          const currentSummary = resumeContent.summary || resumeContent.executive_summary || "";
          const experiences = resumeContent.experience || [];

          const prompt = `Analyze this resume against the job description and provide specific tailoring suggestions.

  Job Title: ${job.job_title}
  Job Description: ${job.job_description}

  Current Resume Summary: ${currentSummary}

  Current Experience Bullets (first 3 roles):
  ${experiences.slice(0, 3).map((exp, idx) => `
  Role ${idx + 1}: ${exp.position} at ${exp.company}
  Bullets: ${(exp.achievements || []).slice(0, 3).join("; ")}
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

    const modeLabel = optimizeMode === "ats_one_page" ? "ATS 1-Page" : optimizeMode === "two_page" ? "Pro 2-Page" : "Full CV";
    
    // Define constraints based on mode
    const constraints = optimizeMode === "full_cv" 
        ? "For Full CV mode, provide comprehensive details. You MUST provide between 4 to 7 bullet points per experience role, prioritising relevance to the JD. Do not exceed 7 bullets." 
        : optimizeMode === "ats_one_page"
        ? "Keep it concise for a 1-page limit. Use maximum 3-4 highly relevant bullet points per role."
        : "Balance detail for a 2-page limit. Use 4-5 relevant bullet points per role.";

    try {
        const numVersions = generateMultiple ? 3 : 1;
        const versions = [];

        for (let i = 0; i < numVersions; i++) {
            const response = await retryWithBackoff(() =>
              base44.integrations.Core.InvokeLLM({
                prompt: `You are a strict, objective Resume Auditor and Career Coach. Your goal is to optimize this resume for the specific Job Description (JD) provided, but you must adhere to a strict code of TRUTHFULNESS.

            **CRITICAL RULES:**
            1. **NO FABRICATION:** You must NOT invent roles, companies, titles, skills, or achievements that are not present in the original resume.
            2. **REALITY CHECK:** If the candidate lacks a specific skill required by the JD, DO NOT add it. Do not lie to "please" the ATS.
            3. **REFRAMING OVER INVENTING:** You may rephrase, reorder, and emphasize *existing* experience to better align with the JD keywords, but the underlying facts must remain true to the original input.
            4. **NON-PLEASING TONE:** Do not write fluff. Be direct, factual, and impact-oriented.
            5. **IRRELEVANT DATA:** If the original resume contains experience that is completely irrelevant to this JD and wastes space, you may summarize or omit it to make room for relevant details (unless it causes a gap).

            **OPTIMIZATION INSTRUCTIONS:**
            - **Mode:** ${modeLabel}
            - **Constraints:** ${constraints}
            - **Task:** Rewrite the resume content to maximize relevance to the JD *strictly* using the candidate's actual history.

            **INPUT DATA:**
            - **Job Description:** ${jobData.job_description}
            - **Original Resume:** ${selectedResume.parsed_content}
            ${generateMultiple ? `- **Variation:** Create variation ${i + 1} with a slightly different truthful angle.` : ''}`,
                response_json_schema: {
                  type: "object",
                  properties: {
                    optimization_score: { type: "number" },
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

            const versionSuffix = generateMultiple ? ` v${i + 1}` : "";
            const newVersion = await Resume.create({
              version_name: `${jobData.job_title} — ${jobData.company_name} — ${modeLabel}${versionSuffix}`,
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
                companyName: jobData.company_name
            });
        }

        if (generateMultiple) {
            setOptimizedVersions(versions);
            setSelectedVersion(0);
        }

        if (!useJobMatch && selectedJob) {
          await JobApplication.update(selectedJobId, {
            optimization_score: versions[0].optimization_score,
            master_resume_id: selectedResumeId,
            optimized_resume_id: versions[0].resumeId,
            application_status: "ready"
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
    }

    setIsProcessing(false);
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

        {error && <Alert variant="destructive" className="mb-6"><AlertDescription>{error}</AlertDescription></Alert>}

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

                  <div className="flex items-center justify-between p-4 bg-slate-100 rounded-lg border border-slate-200">
                    <span className="text-sm font-medium text-slate-700">Aggressive Keyword Matching</span>
                    <Switch checked={aggressiveMatch} onCheckedChange={setAggressiveMatch} />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-100 rounded-lg border border-slate-200">
                    <span className="text-sm font-medium text-slate-700">Deep Humanization (Anti-AI Detection)</span>
                    <Switch checked={deepHumanize} onCheckedChange={setDeepHumanize} />
                  </div>

                  <div className="flex gap-3">
                      <Button onClick={() => optimizeResume(false)} disabled={isProcessing} className="flex-1 bg-blue-600 hover:bg-blue-700 h-12">
                        {isProcessing ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Processing...</> : <><Sparkles className="w-5 h-5 mr-2" />Optimize Resume</>}
                      </Button>
                      <Button onClick={() => optimizeResume(true)} disabled={isProcessing} variant="outline" className="border-purple-600 text-purple-700 h-12">
                        Generate 3 Versions
                      </Button>
                  </div>
                  <Button onClick={generateTailoringSuggestions} disabled={isLoadingTailoring || !selectedJobId || !selectedResumeId} variant="outline" className="w-full">
                    {isLoadingTailoring ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Loading...</> : <><Target className="w-4 h-4 mr-2" />Get AI Tailoring Suggestions</>}
                  </Button>
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
                </motion.div>
              ) : (
                <motion.div key="results" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                  {optimizedVersions.length > 1 && (
                    <Card className="mb-6 bg-blue-50 border-blue-200">
                      <CardHeader>
                        <CardTitle className="text-blue-900 text-base">Compare Optimized Versions</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex gap-2">
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
                              Version {idx + 1} ({version.optimization_score}%)
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
    </div>
  );
}