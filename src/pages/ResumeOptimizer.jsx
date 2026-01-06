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

    try {
      const response = await retryWithBackoff(() =>
        base44.integrations.Core.InvokeLLM({
          prompt: `Optimize this resume for the job posting. Mode: ${modeLabel}. Resume: ${selectedResume.parsed_content}. Job: ${jobData.job_description}`,
          response_json_schema: {
            type: "object",
            properties: {
              optimization_score: { type: "number" },
              recommendations: { type: "array", items: { type: "string" } },
              optimized_resume_content: { type: "object" }
            }
          }
        }),
        { retries: 3, baseDelay: 1200 }
      );

      const newVersion = await Resume.create({
        version_name: `${jobData.job_title} — ${jobData.company_name} — ${modeLabel}`,
        original_file_url: selectedResume.original_file_url,
        parsed_content: selectedResume.parsed_content,
        optimized_content: JSON.stringify(response.optimized_resume_content),
        is_master_resume: false,
        job_application_id: useJobMatch ? null : jobData.id
      });

      if (!useJobMatch && selectedJob) {
        await JobApplication.update(selectedJobId, {
          optimization_score: response.optimization_score,
          master_resume_id: selectedResumeId,
          optimized_resume_id: newVersion.id,
          application_status: "ready"
        });
      }

      setOptimizationResults({
        ...response,
        jobTitle: jobData.job_title,
        companyName: jobData.company_name
      });

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

                  <Button onClick={optimizeResume} disabled={isProcessing} className="w-full bg-blue-600 hover:bg-blue-700 h-12">
                    {isProcessing ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Processing...</> : <><Sparkles className="w-5 h-5 mr-2" />Optimize Resume</>}
                  </Button>
                </CardContent>
              </Card>
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