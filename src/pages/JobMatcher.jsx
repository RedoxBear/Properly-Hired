import React, { useState, useEffect } from "react";
import { JobMatch } from "@/entities/JobMatch";
import { Resume } from "@/entities/Resume";
import { JobApplication } from "@/entities/JobApplication";
import { InvokeLLM } from "@/integrations/Core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { retryWithBackoff } from "@/components/utils/retry";
import { format, formatDistanceToNow } from "date-fns";
import {
    Target,
    Sparkles,
    CheckCircle2,
    XCircle,
    AlertCircle,
    TrendingUp,
    Briefcase,
    FileText,
    Plus,
    Search,
    Loader2,
    ThumbsUp,
    ThumbsDown,
    Eye,
    ExternalLink,
    Zap,
    RefreshCw,
    Filter
} from "lucide-react";
import { motion } from "framer-motion";

export default function JobMatcher() {
    const [matches, setMatches] = useState([]);
    const [resumes, setResumes] = useState([]);
    const [selectedResume, setSelectedResume] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isScanning, setIsScanning] = useState(false);
    const [error, setError] = useState("");
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [statusFilter, setStatusFilter] = useState("all");
    const [scoreFilter, setScoreFilter] = useState("all");
    
    const [jobInput, setJobInput] = useState({
        job_url: "",
        job_title: "",
        company_name: "",
        job_description: "",
        location: "",
        salary_range: ""
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [fetchedMatches, fetchedResumes] = await Promise.all([
                JobMatch.list("-created_date"),
                Resume.filter({ is_master_resume: true }, "-created_date", 50)
            ]);
            setMatches(fetchedMatches);
            setResumes(fetchedResumes);
            if (fetchedResumes.length > 0 && !selectedResume) {
                setSelectedResume(fetchedResumes[0].id);
            }
        } catch (e) {
            console.error("Error loading data:", e);
            setError("Failed to load data");
        }
        setIsLoading(false);
    };

    const analyzeJobFit = async (jobData, resumeId) => {
        const resume = resumes.find(r => r.id === resumeId);
        if (!resume) throw new Error("Resume not found");

        const analysisPrompt = `You are an expert career advisor and ATS specialist. Analyze how well this candidate's resume matches the job posting.

**JOB POSTING:**
Title: ${jobData.job_title}
Company: ${jobData.company_name}
${jobData.location ? `Location: ${jobData.location}` : ''}
${jobData.salary_range ? `Salary: ${jobData.salary_range}` : ''}

Description:
${jobData.job_description}

**CANDIDATE RESUME:**
${resume.parsed_content}

**Your Task:**
Provide a comprehensive fit analysis with actionable insights.

Return JSON with:
{
  "match_score": number, // 0-100 overall match score
  "overall_fit": string, // "excellent" (85-100), "good" (70-84), "fair" (50-69), "poor" (<50)
  "strengths": string[], // 3-5 specific areas where candidate is strong match
  "gaps": string[], // 3-5 specific gaps or weaknesses
  "required_skills_match": [
    {
      "skill": string, // Required skill from JD
      "has_skill": boolean, // Does resume show this skill?
      "evidence": string // Where/how it appears in resume (or "Not evident")
    }
  ], // 8-12 key required skills
  "experience_alignment": string, // 2-3 sentences on experience fit
  "education_match": string, // 1-2 sentences on education/certification fit
  "improvement_suggestions": string[], // 5-7 specific, actionable ways to improve resume for this role
  "key_keywords": string[], // 15-20 critical keywords from JD for ATS
  "ai_reasoning": string // 2-3 sentences explaining the match score and overall assessment
}

**Guidelines:**
- Be honest and specific - don't inflate scores
- Strengths should cite actual resume content
- Gaps should be constructive, not harsh
- Improvement suggestions must be actionable and specific
- Keywords should be actual terms from the JD
- For required_skills_match, focus on must-have technical and soft skills
- Consider years of experience, seniority level, industry fit
- Assessment should help candidate decide if they should apply`;

        const response = await retryWithBackoff(() =>
            InvokeLLM({
                prompt: analysisPrompt,
                response_json_schema: {
                    type: "object",
                    properties: {
                        match_score: { type: "number" },
                        overall_fit: { type: "string" },
                        strengths: { type: "array", items: { type: "string" } },
                        gaps: { type: "array", items: { type: "string" } },
                        required_skills_match: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    skill: { type: "string" },
                                    has_skill: { type: "boolean" },
                                    evidence: { type: "string" }
                                }
                            }
                        },
                        experience_alignment: { type: "string" },
                        education_match: { type: "string" },
                        improvement_suggestions: { type: "array", items: { type: "string" } },
                        key_keywords: { type: "array", items: { type: "string" } },
                        ai_reasoning: { type: "string" }
                    }
                }
            }),
            { retries: 2, baseDelay: 1000 }
        );

        return response;
    };

    const handleAddJob = async () => {
        if (!jobInput.job_title || !jobInput.company_name || !jobInput.job_description) {
            setError("Job title, company name, and description are required");
            return;
        }

        if (!selectedResume) {
            setError("Please select a resume to match against");
            return;
        }

        setIsScanning(true);
        setError("");

        try {
            const analysis = await analyzeJobFit(jobInput, selectedResume);

            const matchData = {
                job_title: jobInput.job_title,
                company_name: jobInput.company_name,
                job_url: jobInput.job_url || "",
                job_description: jobInput.job_description,
                location: jobInput.location || "",
                salary_range: jobInput.salary_range || "",
                posted_date: new Date().toISOString(),
                resume_id: selectedResume,
                match_score: analysis.match_score,
                fit_analysis: {
                    overall_fit: analysis.overall_fit,
                    strengths: analysis.strengths,
                    gaps: analysis.gaps,
                    required_skills_match: analysis.required_skills_match,
                    experience_alignment: analysis.experience_alignment,
                    education_match: analysis.education_match,
                    improvement_suggestions: analysis.improvement_suggestions
                },
                key_keywords: analysis.key_keywords,
                status: "new",
                ai_reasoning: analysis.ai_reasoning,
                auto_matched: false,
                job_source: "manual"
            };

            await JobMatch.create(matchData);
            setShowAddDialog(false);
            setJobInput({
                job_url: "",
                job_title: "",
                company_name: "",
                job_description: "",
                location: "",
                salary_range: ""
            });
            await loadData();
        } catch (e) {
            console.error("Error analyzing job:", e);
            setError("Failed to analyze job fit. Please try again.");
        }

        setIsScanning(false);
    };

    const updateMatchStatus = async (matchId, newStatus) => {
        try {
            await JobMatch.update(matchId, { status: newStatus });
            await loadData();
        } catch (e) {
            console.error("Error updating status:", e);
        }
    };

    const createApplication = async (match) => {
        try {
            await JobApplication.create({
                job_title: match.job_title,
                company_name: match.company_name,
                job_posting_url: match.job_url,
                job_description: match.job_description,
                application_status: "ready",
                master_resume_id: match.resume_id,
                key_requirements: match.key_keywords || []
            });
            await updateMatchStatus(match.id, "interested");
        } catch (e) {
            console.error("Error creating application:", e);
            setError("Failed to create application");
        }
    };

    const filteredMatches = matches.filter(match => {
        const statusMatch = statusFilter === "all" || match.status === statusFilter;
        const scoreMatch = 
            scoreFilter === "all" ||
            (scoreFilter === "excellent" && match.match_score >= 85) ||
            (scoreFilter === "good" && match.match_score >= 70 && match.match_score < 85) ||
            (scoreFilter === "fair" && match.match_score >= 50 && match.match_score < 70) ||
            (scoreFilter === "poor" && match.match_score < 50);
        return statusMatch && scoreMatch;
    });

    const stats = {
        total: matches.length,
        excellent: matches.filter(m => m.match_score >= 85).length,
        good: matches.filter(m => m.match_score >= 70 && m.match_score < 85).length,
        new: matches.filter(m => m.status === "new").length
    };

    const getScoreColor = (score) => {
        if (score >= 85) return "text-emerald-600";
        if (score >= 70) return "text-blue-600";
        if (score >= 50) return "text-amber-600";
        return "text-red-600";
    };

    const getScoreBgColor = (score) => {
        if (score >= 85) return "bg-emerald-50 border-emerald-200";
        if (score >= 70) return "bg-blue-50 border-blue-200";
        if (score >= 50) return "bg-amber-50 border-amber-200";
        return "bg-red-50 border-red-200";
    };

    const getFitIcon = (score) => {
        if (score >= 85) return CheckCircle2;
        if (score >= 70) return TrendingUp;
        if (score >= 50) return AlertCircle;
        return XCircle;
    };

    return (
        <div className="min-h-screen p-4 md:p-8 bg-gray-50">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 rounded-full text-sm font-medium mb-4">
                        <Target className="w-4 h-4" />
                        AI Job Matching
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-2">Job Matcher</h1>
                    <p className="text-lg text-slate-600 max-w-3xl">
                        AI-powered job matching that analyzes your resume against job postings and provides detailed fit analysis with actionable recommendations.
                    </p>
                </motion.div>

                {error && (
                    <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="p-4">
                            <div className="text-2xl font-bold text-slate-800">{stats.total}</div>
                            <div className="text-sm text-slate-600">Total Matches</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-emerald-50 border-emerald-200">
                        <CardContent className="p-4">
                            <div className="text-2xl font-bold text-emerald-700">{stats.excellent}</div>
                            <div className="text-sm text-emerald-600">Excellent Fit (85+)</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-blue-50 border-blue-200">
                        <CardContent className="p-4">
                            <div className="text-2xl font-bold text-blue-700">{stats.good}</div>
                            <div className="text-sm text-blue-600">Good Fit (70-84)</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-purple-50 border-purple-200">
                        <CardContent className="p-4">
                            <div className="text-2xl font-bold text-purple-700">{stats.new}</div>
                            <div className="text-sm text-purple-600">New Matches</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Controls */}
                <Card>
                    <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1">
                                <label className="text-sm font-medium text-slate-700 mb-2 block">
                                    Match Against Resume:
                                </label>
                                <Select value={selectedResume || ""} onValueChange={setSelectedResume}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a resume..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {resumes.map(r => (
                                            <SelectItem key={r.id} value={r.id}>
                                                {r.version_name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex gap-2 items-end">
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger className="w-[140px]">
                                        <Filter className="w-4 h-4 mr-2" />
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Status</SelectItem>
                                        <SelectItem value="new">New</SelectItem>
                                        <SelectItem value="reviewed">Reviewed</SelectItem>
                                        <SelectItem value="interested">Interested</SelectItem>
                                        <SelectItem value="applied">Applied</SelectItem>
                                        <SelectItem value="dismissed">Dismissed</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Select value={scoreFilter} onValueChange={setScoreFilter}>
                                    <SelectTrigger className="w-[140px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Scores</SelectItem>
                                        <SelectItem value="excellent">Excellent (85+)</SelectItem>
                                        <SelectItem value="good">Good (70-84)</SelectItem>
                                        <SelectItem value="fair">Fair (50-69)</SelectItem>
                                        <SelectItem value="poor">Poor (&lt;50)</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                                    <DialogTrigger asChild>
                                        <Button className="bg-blue-600 hover:bg-blue-700">
                                            <Plus className="w-4 h-4 mr-2" />
                                            Add Job
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                                        <DialogHeader>
                                            <DialogTitle>Add Job to Match</DialogTitle>
                                        </DialogHeader>
                                        <div className="space-y-4 py-4">
                                            <div className="grid md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-sm font-medium">Job Title *</label>
                                                    <Input
                                                        value={jobInput.job_title}
                                                        onChange={(e) => setJobInput({...jobInput, job_title: e.target.value})}
                                                        placeholder="e.g. Senior Software Engineer"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-sm font-medium">Company *</label>
                                                    <Input
                                                        value={jobInput.company_name}
                                                        onChange={(e) => setJobInput({...jobInput, company_name: e.target.value})}
                                                        placeholder="e.g. Google"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium">Job URL</label>
                                                <Input
                                                    value={jobInput.job_url}
                                                    onChange={(e) => setJobInput({...jobInput, job_url: e.target.value})}
                                                    placeholder="https://..."
                                                />
                                            </div>
                                            <div className="grid md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-sm font-medium">Location</label>
                                                    <Input
                                                        value={jobInput.location}
                                                        onChange={(e) => setJobInput({...jobInput, location: e.target.value})}
                                                        placeholder="e.g. San Francisco, CA"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-sm font-medium">Salary Range</label>
                                                    <Input
                                                        value={jobInput.salary_range}
                                                        onChange={(e) => setJobInput({...jobInput, salary_range: e.target.value})}
                                                        placeholder="e.g. $120k-$180k"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium">Job Description *</label>
                                                <Textarea
                                                    value={jobInput.job_description}
                                                    onChange={(e) => setJobInput({...jobInput, job_description: e.target.value})}
                                                    placeholder="Paste the full job description..."
                                                    className="min-h-[200px]"
                                                />
                                            </div>
                                            <Alert className="border-blue-200 bg-blue-50">
                                                <AlertDescription className="text-blue-800 text-sm">
                                                    <strong>💡 Tip:</strong> The more complete the job description, the better the AI can analyze your fit and provide recommendations.
                                                </AlertDescription>
                                            </Alert>
                                            <div className="flex gap-3">
                                                <Button 
                                                    onClick={handleAddJob} 
                                                    disabled={isScanning}
                                                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                                                >
                                                    {isScanning ? (
                                                        <>
                                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                            Analyzing Fit...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Zap className="w-4 h-4 mr-2" />
                                                            Analyze Match
                                                        </>
                                                    )}
                                                </Button>
                                                <Button 
                                                    variant="outline" 
                                                    onClick={() => setShowAddDialog(false)}
                                                    disabled={isScanning}
                                                >
                                                    Cancel
                                                </Button>
                                            </div>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Matches List */}
                {isLoading ? (
                    <div className="text-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                        <p className="text-slate-600">Loading matches...</p>
                    </div>
                ) : filteredMatches.length === 0 ? (
                    <Card>
                        <CardContent className="py-16 text-center">
                            <Target className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                            <h3 className="text-xl font-medium text-slate-600 mb-2">No job matches yet</h3>
                            <p className="text-slate-500 mb-6">
                                Add a job posting to see how well it matches your resume with AI-powered analysis.
                            </p>
                            <Button onClick={() => setShowAddDialog(true)} className="bg-blue-600 hover:bg-blue-700">
                                <Plus className="w-4 h-4 mr-2" />
                                Add Your First Job
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {filteredMatches.map(match => {
                            const FitIcon = getFitIcon(match.match_score);
                            const linkedResume = resumes.find(r => r.id === match.resume_id);
                            const skillsMatched = match.fit_analysis?.required_skills_match?.filter(s => s.has_skill).length || 0;
                            const totalSkills = match.fit_analysis?.required_skills_match?.length || 0;

                            return (
                                <motion.div key={match.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                                    <Card className={`${getScoreBgColor(match.match_score)} hover:shadow-lg transition-all`}>
                                        <CardHeader>
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <h3 className="text-xl font-bold text-slate-800 truncate">
                                                            {match.job_title}
                                                        </h3>
                                                        <Badge variant={match.status === "new" ? "default" : "outline"}>
                                                            {match.status}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-slate-600 mb-1">{match.company_name}</p>
                                                    <div className="flex flex-wrap gap-2 text-sm text-slate-500">
                                                        {match.location && <span>📍 {match.location}</span>}
                                                        {match.salary_range && <span>💰 {match.salary_range}</span>}
                                                        <span>🕒 {formatDistanceToNow(new Date(match.created_date), { addSuffix: true })}</span>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className={`text-4xl font-bold ${getScoreColor(match.match_score)} mb-1`}>
                                                        {match.match_score}
                                                    </div>
                                                    <div className="text-xs text-slate-600 uppercase tracking-wider">
                                                        {match.fit_analysis?.overall_fit || "Match Score"}
                                                    </div>
                                                    <FitIcon className={`w-6 h-6 mx-auto mt-2 ${getScoreColor(match.match_score)}`} />
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            {/* Skills Progress */}
                                            {totalSkills > 0 && (
                                                <div>
                                                    <div className="flex justify-between text-sm mb-2">
                                                        <span className="text-slate-700 font-medium">Required Skills Match</span>
                                                        <span className={getScoreColor(match.match_score)}>
                                                            {skillsMatched}/{totalSkills} ({Math.round((skillsMatched/totalSkills)*100)}%)
                                                        </span>
                                                    </div>
                                                    <Progress value={(skillsMatched/totalSkills)*100} className="h-2" />
                                                </div>
                                            )}

                                            {/* AI Reasoning */}
                                            {match.ai_reasoning && (
                                                <div className="bg-white/60 rounded-lg p-3 text-sm text-slate-700">
                                                    <strong className="text-slate-800">AI Assessment:</strong> {match.ai_reasoning}
                                                </div>
                                            )}

                                            {/* Detailed Analysis */}
                                            <Tabs defaultValue="strengths" className="w-full">
                                                <TabsList className="grid w-full grid-cols-3">
                                                    <TabsTrigger value="strengths">Strengths</TabsTrigger>
                                                    <TabsTrigger value="gaps">Gaps</TabsTrigger>
                                                    <TabsTrigger value="improve">Improve</TabsTrigger>
                                                </TabsList>
                                                <TabsContent value="strengths" className="space-y-2 mt-4">
                                                    {match.fit_analysis?.strengths?.map((strength, idx) => (
                                                        <div key={idx} className="flex items-start gap-2 text-sm">
                                                            <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                                                            <span className="text-slate-700">{strength}</span>
                                                        </div>
                                                    ))}
                                                </TabsContent>
                                                <TabsContent value="gaps" className="space-y-2 mt-4">
                                                    {match.fit_analysis?.gaps?.map((gap, idx) => (
                                                        <div key={idx} className="flex items-start gap-2 text-sm">
                                                            <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                                                            <span className="text-slate-700">{gap}</span>
                                                        </div>
                                                    ))}
                                                </TabsContent>
                                                <TabsContent value="improve" className="space-y-2 mt-4">
                                                    {match.fit_analysis?.improvement_suggestions?.map((suggestion, idx) => (
                                                        <div key={idx} className="flex items-start gap-2 text-sm">
                                                            <Sparkles className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                                                            <span className="text-slate-700">{suggestion}</span>
                                                        </div>
                                                    ))}
                                                </TabsContent>
                                            </Tabs>

                                            {/* Actions */}
                                            <div className="flex flex-wrap gap-2 pt-4 border-t">
                                                {match.status === "new" && (
                                                    <>
                                                        <Button 
                                                            size="sm" 
                                                            onClick={() => updateMatchStatus(match.id, "reviewed")}
                                                            variant="outline"
                                                        >
                                                            <Eye className="w-4 h-4 mr-1" />
                                                            Mark Reviewed
                                                        </Button>
                                                        <Button 
                                                            size="sm" 
                                                            onClick={() => createApplication(match)}
                                                            className="bg-blue-600 hover:bg-blue-700"
                                                        >
                                                            <ThumbsUp className="w-4 h-4 mr-1" />
                                                            I'm Interested
                                                        </Button>
                                                        <Button 
                                                            size="sm" 
                                                            onClick={() => updateMatchStatus(match.id, "dismissed")}
                                                            variant="outline"
                                                            className="text-red-600 hover:text-red-700"
                                                        >
                                                            <ThumbsDown className="w-4 h-4 mr-1" />
                                                            Not Interested
                                                        </Button>
                                                    </>
                                                )}
                                                {match.job_url && (
                                                    <a href={match.job_url} target="_blank" rel="noopener noreferrer">
                                                        <Button size="sm" variant="outline">
                                                            <ExternalLink className="w-4 h-4 mr-1" />
                                                            View Job
                                                        </Button>
                                                    </a>
                                                )}
                                                <Link to={createPageUrl(`ResumeOptimizer?id=${match.job_application_id || ''}`)}>
                                                    <Button size="sm" variant="outline">
                                                        <FileText className="w-4 h-4 mr-1" />
                                                        Optimize Resume
                                                    </Button>
                                                </Link>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}