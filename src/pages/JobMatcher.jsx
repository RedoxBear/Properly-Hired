import React from "react";
import { base44 } from "@/api/base44Client";

const JobMatch = base44.entities.JobMatch;
const Resume = base44.entities.Resume;
const JobApplication = base44.entities.JobApplication;
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
    Filter,
    Lightbulb
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export default function JobMatcher() {
    const navigate = useNavigate();
    const [matches, setMatches] = React.useState([]);
    const [resumes, setResumes] = React.useState([]);
    const [selectedResume, setSelectedResume] = React.useState("");
    const [isLoading, setIsLoading] = React.useState(true);
    const [isScanning, setIsScanning] = React.useState(false);
    const [error, setError] = React.useState("");
    const [showAddDialog, setShowAddDialog] = React.useState(false);
    const [statusFilter, setStatusFilter] = React.useState("all");
    const [scoreFilter, setScoreFilter] = React.useState("all");
    const [isAutoSearching, setIsAutoSearching] = React.useState(false);
    const [searchQuery, setSearchQuery] = React.useState("");
    const [minScoreFilter, setMinScoreFilter] = React.useState(0);
    const [locationFilter, setLocationFilter] = React.useState("");
    const [locationTypeFilter, setLocationTypeFilter] = React.useState("all");
    const [sortBy, setSortBy] = React.useState("score_desc");
    const [aiSuggestions, setAiSuggestions] = React.useState(null);
    const [isLoadingSuggestions, setIsLoadingSuggestions] = React.useState(false);
    const [userLocation, setUserLocation] = React.useState(null);
    const [searchRadius, setSearchRadius] = React.useState(30);
    const [isDetectingLocation, setIsDetectingLocation] = React.useState(false);
    
    const [jobInput, setJobInput] = React.useState({
        job_url: "",
        job_title: "",
        company_name: "",
        job_description: "",
        location: "",
        salary_range: ""
    });

    React.useEffect(() => {
        loadData();
        detectUserLocation();
    }, []);

    const detectUserLocation = async () => {
        setIsDetectingLocation(true);
        try {
            // Try browser geolocation first
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    async (position) => {
                        const { latitude, longitude } = position.coords;
                        
                        // Reverse geocode to get city/state
                        const locationPrompt = `Given coordinates ${latitude}, ${longitude}, return the city and state in JSON format:
                        { "city": "string", "state": "string", "country": "string" }`;
                        
                        try {
                            const locationData = await base44.integrations.Core.InvokeLLM({
                                prompt: locationPrompt,
                                add_context_from_internet: true,
                                response_json_schema: {
                                    type: "object",
                                    properties: {
                                        city: { type: "string" },
                                        state: { type: "string" },
                                        country: { type: "string" }
                                    }
                                }
                            });
                            
                            setUserLocation({
                                lat: latitude,
                                lon: longitude,
                                city: locationData.city,
                                state: locationData.state,
                                country: locationData.country
                            });
                        } catch (e) {
                            console.error("Reverse geocoding failed:", e);
                            setUserLocation({ lat: latitude, lon: longitude });
                        }
                        setIsDetectingLocation(false);
                    },
                    async (error) => {
                        console.warn("Geolocation denied, using IP-based location:", error);
                        await fallbackToIPLocation();
                    }
                );
            } else {
                await fallbackToIPLocation();
            }
        } catch (e) {
            console.error("Location detection failed:", e);
            setIsDetectingLocation(false);
        }
    };

    const fallbackToIPLocation = async () => {
        try {
            const ipLocationPrompt = `Detect my approximate location based on my IP address. Return JSON:
            { "city": "string", "state": "string", "country": "string", "lat": number, "lon": number }`;
            
            const ipLocation = await base44.integrations.Core.InvokeLLM({
                prompt: ipLocationPrompt,
                add_context_from_internet: true,
                response_json_schema: {
                    type: "object",
                    properties: {
                        city: { type: "string" },
                        state: { type: "string" },
                        country: { type: "string" },
                        lat: { type: "number" },
                        lon: { type: "number" }
                    }
                }
            });
            
            setUserLocation(ipLocation);
        } catch (e) {
            console.error("IP location detection failed:", e);
        }
        setIsDetectingLocation(false);
    };

    const loadData = async () => {
        setIsLoading(true);
        setError("");
        try {
            const [fetchedMatches, fetchedResumes] = await Promise.all([
                JobMatch.list("-created_date"),
                Resume.filter({ is_master_resume: true }, "-created_date", 50)
            ]);
            setMatches(fetchedMatches);
            setResumes(fetchedResumes);
            
            // Auto-select first resume if none selected
            if (fetchedResumes.length > 0 && !selectedResume) {
                setSelectedResume(fetchedResumes[0].id);
            }
            
            // Show warning if no resumes exist
            if (fetchedResumes.length === 0) {
                setError("Please create a master resume first before adding jobs to match.");
            }
        } catch (e) {
            console.error("Error loading data:", e);
            setError("Failed to load data. Please refresh the page.");
        }
        setIsLoading(false);
    };

    const analyzeJobFit = async (jobData, resumeId) => {
        const resume = resumes.find(r => r.id === resumeId);
        if (!resume) throw new Error("Resume not found");

        const analysisPrompt = `You are an expert career advisor and ATS specialist. Analyze how well this candidate's resume matches the job posting using a **FUZZY MATCHING** approach.

**SCORING CALIBRATION:**
- **50-60%**: Fair match / Transferable skills. Candidate has core potential but lacks some specific requirements. Worth applying if they can learn on the job.
- **60-75%**: Good match. Has most core skills.
- **75%+**: Excellent match.

**CRITICAL RULE: RECOGNIZE TRANSFERABLE SKILLS**
- Do NOT penalize heavily for missing exact keywords if the underlying skill is present.
- Look for *equivalent* experience (e.g., "Client Management" can match "Account Executive").
- If the candidate has 50-60% of the requirements, consider it a viable "stretch" role.

**CRITICAL RULE: STAY GROUNDED IN ACTUAL EXPERIENCE**
- Only suggest improvements based on what the candidate has ACTUALLY done
- Never suggest adding skills, experience, or achievements they don't have
- Focus on REFRAMING and REPOSITIONING existing experience, not inventing new content
- Be honest about gaps - don't suggest fabricating experience to fill them
- Improvement suggestions should be about better ARTICULATION of real experience, not adding fake experience

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
Provide a comprehensive fit analysis with actionable insights that are TRUTHFUL and GROUNDED in their actual background.

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
  "improvement_suggestions": string[], // 5-7 specific ways to REFRAME/REWORD existing experience for this role (NOT adding new experience)
  "key_keywords": string[], // 15-20 critical keywords from JD for ATS
  "ai_reasoning": string // 2-3 sentences explaining the match score and overall assessment
}

**Guidelines:**
- Be honest and specific - don't inflate scores
- Strengths should cite actual resume content with specific examples
- Gaps should be constructive, not harsh
- **CRITICAL**: Improvement suggestions must ONLY suggest rewording/reframing EXISTING experience
  - Good: "Reframe your project management experience to emphasize Agile methodology you used"
  - Bad: "Add Agile certification to your resume" (if they don't have it)
  - Good: "Highlight the data analysis you did in your Q3 2023 project"
  - Bad: "Add machine learning experience" (if they don't have it)
- Keywords should be actual terms from the JD
- For required_skills_match, cite specific examples from resume or mark as "Not evident"
- Consider years of experience, seniority level, industry fit
- Assessment should help candidate decide if they should apply
- If a skill is missing, say it's missing - don't suggest fabricating it`;

        const response = await retryWithBackoff(() =>
            base44.integrations.Core.InvokeLLM({
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
        // Validation
        if (!jobInput.job_title?.trim() || !jobInput.company_name?.trim() || !jobInput.job_description?.trim()) {
            setError("Job title, company name, and description are required");
            return;
        }

        if (!selectedResume) {
            setError("Please select a resume to match against");
            return;
        }

        // Verify resume exists
        const resume = resumes.find(r => r.id === selectedResume);
        if (!resume) {
            setError("Selected resume not found. Please select a valid resume.");
            return;
        }

        setIsScanning(true);
        setError("");

        try {
            console.log("Starting job analysis with resume:", selectedResume);
            
            const analysis = await analyzeJobFit(jobInput, selectedResume);

            console.log("Analysis complete:", analysis);

            const matchData = {
                job_title: jobInput.job_title.trim(),
                company_name: jobInput.company_name.trim(),
                job_url: jobInput.job_url?.trim() || "",
                job_description: jobInput.job_description.trim(),
                location: jobInput.location?.trim() || "",
                salary_range: jobInput.salary_range?.trim() || "",
                posted_date: new Date().toISOString(),
                resume_id: selectedResume,
                match_score: analysis.match_score || 0,
                fit_analysis: {
                    overall_fit: analysis.overall_fit || "unknown",
                    strengths: analysis.strengths || [],
                    gaps: analysis.gaps || [],
                    required_skills_match: analysis.required_skills_match || [],
                    experience_alignment: analysis.experience_alignment || "",
                    education_match: analysis.education_match || "",
                    improvement_suggestions: analysis.improvement_suggestions || []
                },
                key_keywords: analysis.key_keywords || [],
                status: "new",
                ai_reasoning: analysis.ai_reasoning || "",
                auto_matched: false,
                job_source: "manual"
            };

            console.log("Creating job match with data:", matchData);
            
            const created = await JobMatch.create(matchData);
            
            console.log("Job match created successfully:", created);

            // Reset form and close dialog
            setShowAddDialog(false);
            setJobInput({
                job_url: "",
                job_title: "",
                company_name: "",
                job_description: "",
                location: "",
                salary_range: ""
            });
            
            // Reload data to show new match
            await loadData();
            
        } catch (e) {
            console.error("Error analyzing job:", e);
            setError(`Failed to analyze job fit: ${e.message || "Please try again."}`);
        } finally {
            setIsScanning(false);
        }
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

    const quickApplyToTracker = async (match) => {
        try {
            const newApp = await JobApplication.create({
                job_title: match.job_title,
                company_name: match.company_name,
                job_posting_url: match.job_url,
                job_description: match.job_description,
                application_status: "ready",
                optimization_score: match.match_score,
                key_requirements: match.key_keywords,
                master_resume_id: match.resume_id,
                applied: false
            });
            
            await updateMatchStatus(match.id, "interested");
            navigate(createPageUrl("ApplicationTracker"));
        } catch (e) {
            console.error("Quick apply failed:", e);
            setError("Failed to add to tracker");
        }
    };

    const generateAiSuggestions = async () => {
        if (!selectedResume) {
            setError("Please select a resume first");
            return;
        }

        setIsLoadingSuggestions(true);
        try {
            const resume = resumes.find(r => r.id === selectedResume);
            if (!resume) return;

            const resumeContent = JSON.parse(resume.parsed_content || resume.optimized_content);
            const skills = Array.isArray(resumeContent.skills) ? resumeContent.skills.join(", ") : "";
            const experience = Array.isArray(resumeContent.experience) 
                ? resumeContent.experience.map(e => `${e.position} at ${e.company}`).join("; ")
                : "";

            const prompt = `Based on this resume profile, suggest 5 specific job titles/roles and 3 industry sectors this candidate should target.

Resume Summary:
Skills: ${skills}
Experience: ${experience}

Return JSON with:
{
  "job_titles": [array of 5 specific job titles],
  "industries": [array of 3 industries],
  "reasoning": "brief explanation of why these are good fits"
}`;

            const response = await base44.integrations.Core.InvokeLLM({
                prompt,
                response_json_schema: {
                    type: "object",
                    properties: {
                        job_titles: { type: "array", items: { type: "string" } },
                        industries: { type: "array", items: { type: "string" } },
                        reasoning: { type: "string" }
                    }
                }
            });

            setAiSuggestions(response);
        } catch (e) {
            console.error("Failed to generate suggestions:", e);
        }
        setIsLoadingSuggestions(false);
    };

    const autoSearchJobs = async () => {
        if (!selectedResume) {
            setError("Please select a resume first");
            return;
        }

        const resume = resumes.find(r => r.id === selectedResume);
        if (!resume) {
            setError("Selected resume not found");
            return;
        }

        setIsAutoSearching(true);
        setError("");

        try {
            // Parse full resume content for comprehensive matching
            const resumeData = JSON.parse(resume.parsed_content || "{}");
            const skills = resumeData.skills || [];
            const experience = resumeData.experience || [];
            const latestRole = experience[0]?.position || "";
            const yearsExp = experience.length;

            // Extract last 10 roles or up to 10 years of history
            const roleHistory = experience
                .slice(0, 10)
                .map(e => `${e.position} at ${e.company}`)
                .join("; ");
            
            // Build rich context from CV
            const cvContext = {
                current_title: latestRole,
                role_history: roleHistory,
                skills: skills.slice(0, 8).join(", "),
                experience_level: yearsExp > 7 ? "Senior" : yearsExp > 3 ? "Mid-level" : "Entry-level",
                industries: [...new Set(experience.map(e => e.company).slice(0, 3))].join(", "),
                key_achievements: experience.slice(0, 2).flatMap(e => e.achievements?.slice(0, 2) || []).join("; ")
            };
            
            const query = searchQuery || latestRole || skills.slice(0, 3).join(", ");

            // Build location context
            const locationContext = userLocation 
                ? `\n**LOCATION PREFERENCE:**
- User Location: ${userLocation.city}, ${userLocation.state}
- Search Radius: ${searchRadius} miles
- Prioritize jobs within this radius, but include remote opportunities
- For in-person jobs, prefer locations within ${searchRadius} miles of ${userLocation.city}, ${userLocation.state}`
                : "";

            // Enhanced search using full CV context
            const searchPrompt = `Perform a real-time web search for ACTUAL, ACTIVE job postings on LinkedIn, Indeed, Glassdoor, and company career pages.

**CANDIDATE PROFILE:**
- Current Role: ${cvContext.current_title}
- Work History (Last 10 roles/years): ${cvContext.role_history}
- Top Skills: ${cvContext.skills}
- Experience Level: ${cvContext.experience_level}
${locationContext}

**SEARCH QUERY:** "${query} jobs"

**CRITICAL: REAL LINKS ONLY**
- You MUST return **REAL, CLICKABLE URLs** found in the search results.
- **DO NOT** construct or guess URLs (e.g., do not make up "company.com/careers/role").
- **DO NOT** return generic search pages (e.g., "linkedin.com/jobs/search?keywords=...").
- Valid URL examples: 
  - linkedin.com/jobs/view/...
  - indeed.com/viewjob?...
  - greenhouse.io/...
  - lever.co/...
  - myworkdayjobs.com/...

**Task:**
Find 10-12 matching jobs. Include "fuzzy" matches where skills transfer.

Return JSON format with:
- job_title: Exact title from the listing
- company_name: Company name
- job_url: THE SPECIFIC, WORKING URL
- job_description: A detailed summary of requirements and responsibilities (extract as much as possible from the snippet/page)
- location: Specific city/state
- salary_range: If mentioned
- source: Site name
- posted_days_ago: Estimate from "Posted X days ago"

**Constraint:**
If you cannot find a specific, direct URL for a job, **DO NOT INCLUDE IT**. Quality over quantity. Real links are the highest priority.`;

            const searchResults = await retryWithBackoff(() =>
                base44.integrations.Core.InvokeLLM({
                    prompt: searchPrompt,
                    add_context_from_internet: true,
                    response_json_schema: {
                        type: "object",
                        properties: {
                            jobs: {
                                type: "array",
                                items: {
                                    type: "object",
                                    properties: {
                                        job_title: { type: "string" },
                                        company_name: { type: "string" },
                                        job_url: { type: "string" },
                                        job_description: { type: "string" },
                                        location: { type: "string" },
                                        salary_range: { type: "string" },
                                        source: { type: "string" },
                                        posted_days_ago: { type: "number" }
                                    }
                                }
                            }
                        }
                    }
                }),
                { retries: 2, baseDelay: 1500 }
            );

            // Filter for valid, specific links only
            const validJobs = (searchResults?.jobs || []).filter(job => {
                const url = job.job_url?.toLowerCase() || "";
                const isValidUrl = url.startsWith('http://') || url.startsWith('https://');
                const isGenericSearch = url.includes('/search') || url.includes('/jobs?q=') || url.includes('search_id');
                return isValidUrl && !isGenericSearch;
            });
            
            if (validJobs.length === 0) {
                setError("No jobs with verified, specific links found. Please try a different title or field.");
                setIsAutoSearching(false);
                return;
            }

            // Analyze each job against the resume
            let processedCount = 0;
            for (const job of validJobs) {
                try {
                    // Check if job already exists (by URL or title+company)
                    const existing = matches.find(m => 
                        (m.job_url && m.job_url === job.job_url) ||
                        (m.job_title === job.job_title && m.company_name === job.company_name)
                    );
                    
                    if (existing) {
                        console.log(`Skipping duplicate: ${job.job_title} at ${job.company_name}`);
                        continue;
                    }

                    const analysis = await analyzeJobFit(job, selectedResume);

                    await JobMatch.create({
                        job_title: job.job_title,
                        company_name: job.company_name,
                        job_url: job.job_url || "",
                        job_description: job.job_description,
                        location: job.location || "",
                        salary_range: job.salary_range || "",
                        posted_date: new Date().toISOString(),
                        resume_id: selectedResume,
                        match_score: analysis.match_score || 0,
                        fit_analysis: {
                            overall_fit: analysis.overall_fit || "unknown",
                            strengths: analysis.strengths || [],
                            gaps: analysis.gaps || [],
                            required_skills_match: analysis.required_skills_match || [],
                            experience_alignment: analysis.experience_alignment || "",
                            education_match: analysis.education_match || "",
                            improvement_suggestions: analysis.improvement_suggestions || []
                        },
                        key_keywords: analysis.key_keywords || [],
                        status: "new",
                        ai_reasoning: analysis.ai_reasoning || "",
                        auto_matched: true,
                        job_source: job.source || "web_search"
                    });

                    processedCount++;
                } catch (e) {
                    console.error(`Error processing job ${job.job_title}:`, e);
                }
            }

            await loadData();
            setError(`Successfully found and analyzed ${processedCount} new job matches!`);
        } catch (e) {
            console.error("Error searching jobs:", e);
            setError("Failed to search jobs. Please try again.");
        }

        setIsAutoSearching(false);
    };

    const filteredMatches = React.useMemo(() => {
        let filtered = matches.filter(match => {
            const statusMatch = statusFilter === "all" || match.status === statusFilter;
            const scoreMatch = 
                scoreFilter === "all" ||
                (scoreFilter === "excellent" && match.match_score >= 85) ||
                (scoreFilter === "good" && match.match_score >= 70 && match.match_score < 85) ||
                (scoreFilter === "fair" && match.match_score >= 50 && match.match_score < 70) ||
                (scoreFilter === "poor" && match.match_score < 50);
            const minScoreMatch = match.match_score >= minScoreFilter;
            
            // Location type filter (Remote, City, State)
            let locationTypeMatch = true;
            if (locationTypeFilter !== "all") {
                const loc = (match.location || "").toLowerCase();
                if (locationTypeFilter === "remote") {
                    locationTypeMatch = /remote|work from home|wfh|anywhere/i.test(match.location || "");
                } else if (locationTypeFilter === "city") {
                    locationTypeMatch = loc && !/remote|work from home|wfh/i.test(loc) && /,/.test(loc);
                } else if (locationTypeFilter === "state") {
                    // State-level filtering - locations with US state abbreviations
                    locationTypeMatch = loc && /\b[A-Z]{2}\b/.test(match.location || "");
                }
            }
            
            const locationMatch = !locationFilter || 
                (match.location && match.location.toLowerCase().includes(locationFilter.toLowerCase()));
            
            return statusMatch && scoreMatch && minScoreMatch && locationTypeMatch && locationMatch;
        });

        // Sort
        if (sortBy === "score_desc") {
            filtered.sort((a, b) => (b.match_score || 0) - (a.match_score || 0));
        } else if (sortBy === "score_asc") {
            filtered.sort((a, b) => (a.match_score || 0) - (b.match_score || 0));
        } else if (sortBy === "date_desc") {
            filtered.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
        } else if (sortBy === "date_asc") {
            filtered.sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
        }

        return filtered;
    }, [matches, statusFilter, scoreFilter, minScoreFilter, locationFilter, locationTypeFilter, sortBy]);

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

                {/* Auto Search */}
                <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <Search className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-slate-800">AI Job Search</h3>
                                <p className="text-sm text-slate-600">Automatically find & match jobs from Indeed, LinkedIn, Glassdoor, and ZipRecruiter based on your CV</p>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <div>
                                <label className="text-sm font-medium text-slate-700 mb-2 block">
                                    Select Your Resume/CV *
                                </label>
                                <Select value={selectedResume || ""} onValueChange={setSelectedResume}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Choose a resume to match against..." />
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
                            
                            {/* Location Settings */}
                            <div className="flex gap-3 items-end">
                                <div className="flex-1">
                                    <label className="text-sm font-medium text-slate-700 mb-2 block">
                                        Your Location {isDetectingLocation && "(Detecting...)"}
                                    </label>
                                    <Input
                                        value={userLocation ? `${userLocation.city}, ${userLocation.state}` : "Detecting..."}
                                        readOnly
                                        className="bg-slate-50"
                                    />
                                </div>
                                <div className="w-32">
                                    <label className="text-sm font-medium text-slate-700 mb-2 block">
                                        Radius (mi)
                                    </label>
                                    <Input
                                        type="number"
                                        min="5"
                                        max="200"
                                        value={searchRadius}
                                        onChange={(e) => setSearchRadius(Number(e.target.value))}
                                    />
                                </div>
                                <Button 
                                    onClick={detectUserLocation} 
                                    disabled={isDetectingLocation}
                                    variant="outline"
                                    size="sm"
                                >
                                    {isDetectingLocation ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                                </Button>
                            </div>
                            
                            <div className="flex gap-3">
                                <Input
                                    placeholder="Search by Job Title, Field, or Keywords..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    disabled={isAutoSearching || !selectedResume}
                                    className="flex-1"
                                />
                                <Button 
                                    onClick={autoSearchJobs} 
                                    disabled={isAutoSearching || !selectedResume}
                                    className="bg-purple-600 hover:bg-purple-700 whitespace-nowrap"
                                >
                                    {isAutoSearching ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Searching...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="w-4 h-4 mr-2" />
                                            Auto-Search Jobs
                                        </>
                                    )}
                                </Button>
                                <Button 
                                    onClick={generateAiSuggestions} 
                                    disabled={isLoadingSuggestions || !selectedResume} 
                                    variant="outline" 
                                    className="border-blue-600 text-blue-700"
                                >
                                    {isLoadingSuggestions ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Loading...
                                        </>
                                    ) : (
                                        <>
                                            <Lightbulb className="w-4 h-4 mr-2" />
                                            Get AI Suggestions
                                        </>
                                    )}
                                </Button>
                            </div>
                            {!selectedResume && (
                                <Alert className="border-amber-200 bg-amber-50">
                                    <AlertDescription className="text-amber-800">
                                        Please select your resume/CV above to start searching
                                    </AlertDescription>
                                </Alert>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {aiSuggestions && (
                    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                        <CardHeader>
                            <CardTitle className="text-blue-900 flex items-center gap-2">
                                <Lightbulb className="w-5 h-5 text-yellow-500" />
                                AI Career Suggestions
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <h4 className="font-semibold text-sm text-blue-800 mb-2">Recommended Job Titles:</h4>
                                <div className="flex flex-wrap gap-2">
                                    {aiSuggestions.job_titles?.map((title, idx) => (
                                        <Badge key={idx} className="bg-blue-100 text-blue-800 border-blue-200">{title}</Badge>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <h4 className="font-semibold text-sm text-blue-800 mb-2">Target Industries:</h4>
                                <div className="flex flex-wrap gap-2">
                                    {aiSuggestions.industries?.map((ind, idx) => (
                                        <Badge key={idx} className="bg-indigo-100 text-indigo-800 border-indigo-200">{ind}</Badge>
                                    ))}
                                </div>
                            </div>
                            {aiSuggestions.reasoning && (
                                <div>
                                    <h4 className="font-semibold text-sm text-blue-800 mb-2">Why These Are Good Fits:</h4>
                                    <p className="text-sm text-blue-900">{aiSuggestions.reasoning}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Controls */}
                <Card>
                    <CardContent className="p-4">
                        <div className="space-y-4">
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
                                    <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                                        <DialogTrigger asChild>
                                            <Button className="bg-blue-600 hover:bg-blue-700">
                                                <Plus className="w-4 h-4 mr-2" />
                                                Add Job
                                            </Button>
                                        </DialogTrigger>
                                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white border-slate-200 shadow-xl">
                                        <DialogHeader>
                                            <DialogTitle>Add Job to Match</DialogTitle>
                                        </DialogHeader>
                                        <div className="space-y-4 py-4">
                                            {resumes.length === 0 && (
                                                <Alert variant="destructive">
                                                    <AlertDescription>
                                                        You need to create a master resume first. Go to <strong>My Resumes</strong> to upload or build one.
                                                    </AlertDescription>
                                                </Alert>
                                            )}
                                            
                                            <div>
                                                <label className="text-sm font-medium mb-2 block">Match Against Resume *</label>
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
                                            
                                            <div className="grid md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-sm font-medium">Job Title *</label>
                                                    <Input
                                                        value={jobInput.job_title}
                                                        onChange={(e) => setJobInput({...jobInput, job_title: e.target.value})}
                                                        placeholder="e.g. Senior Software Engineer"
                                                        disabled={resumes.length === 0}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-sm font-medium">Company *</label>
                                                    <Input
                                                        value={jobInput.company_name}
                                                        onChange={(e) => setJobInput({...jobInput, company_name: e.target.value})}
                                                        placeholder="e.g. Google"
                                                        disabled={resumes.length === 0}
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium">Job URL</label>
                                                <Input
                                                    value={jobInput.job_url}
                                                    onChange={(e) => setJobInput({...jobInput, job_url: e.target.value})}
                                                    placeholder="https://..."
                                                    disabled={resumes.length === 0}
                                                />
                                            </div>
                                            <div className="grid md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-sm font-medium">Location</label>
                                                    <Input
                                                        value={jobInput.location}
                                                        onChange={(e) => setJobInput({...jobInput, location: e.target.value})}
                                                        placeholder="e.g. San Francisco, CA"
                                                        disabled={resumes.length === 0}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-sm font-medium">Salary Range</label>
                                                    <Input
                                                        value={jobInput.salary_range}
                                                        onChange={(e) => setJobInput({...jobInput, salary_range: e.target.value})}
                                                        placeholder="e.g. $120k-$180k"
                                                        disabled={resumes.length === 0}
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
                                                    disabled={resumes.length === 0}
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
                                                    disabled={isScanning || resumes.length === 0}
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
                                                    onClick={() => {
                                                        setShowAddDialog(false);
                                                        setError("");
                                                    }}
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
                        
                        {/* Filters & Sort */}
                        <div className="border-t pt-4 mt-4">
                            <div className="flex items-center gap-2 mb-3">
                                <Filter className="w-4 h-4 text-slate-500" />
                                <span className="text-sm font-medium text-slate-700">Filters & Sort</span>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                                <div>
                                    <label className="text-xs text-slate-600 mb-1 block">Status</label>
                                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                                        <SelectTrigger className="h-9">
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
                                </div>
                                <div>
                                    <label className="text-xs text-slate-600 mb-1 block">Score Range</label>
                                    <Select value={scoreFilter} onValueChange={setScoreFilter}>
                                        <SelectTrigger className="h-9">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Scores</SelectItem>
                                            <SelectItem value="excellent">85+</SelectItem>
                                            <SelectItem value="good">70-84</SelectItem>
                                            <SelectItem value="fair">50-69</SelectItem>
                                            <SelectItem value="poor">&lt;50</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <label className="text-xs text-slate-600 mb-1 block">Min Score</label>
                                    <Input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={minScoreFilter}
                                        onChange={(e) => setMinScoreFilter(Number(e.target.value))}
                                        className="h-9"
                                        placeholder="0"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-slate-600 mb-1 block">Location Type</label>
                                    <Select value={locationTypeFilter} onValueChange={setLocationTypeFilter}>
                                        <SelectTrigger className="h-9">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Types</SelectItem>
                                            <SelectItem value="remote">Remote</SelectItem>
                                            <SelectItem value="city">City</SelectItem>
                                            <SelectItem value="state">State</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <label className="text-xs text-slate-600 mb-1 block">Search Location</label>
                                    <Input
                                        value={locationFilter}
                                        onChange={(e) => setLocationFilter(e.target.value)}
                                        className="h-9"
                                        placeholder="Search..."
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-slate-600 mb-1 block">Sort By</label>
                                    <Select value={sortBy} onValueChange={setSortBy}>
                                        <SelectTrigger className="h-9">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="score_desc">Score (High to Low)</SelectItem>
                                            <SelectItem value="score_asc">Score (Low to High)</SelectItem>
                                            <SelectItem value="date_desc">Date (Newest)</SelectItem>
                                            <SelectItem value="date_asc">Date (Oldest)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            {(statusFilter !== "all" || scoreFilter !== "all" || minScoreFilter > 0 || locationFilter || locationTypeFilter !== "all") && (
                                <div className="flex items-center gap-2 mt-3">
                                    <Button 
                                        size="sm" 
                                        variant="outline"
                                        onClick={() => {
                                            setStatusFilter("all");
                                            setScoreFilter("all");
                                            setMinScoreFilter(0);
                                            setLocationFilter("");
                                            setLocationTypeFilter("all");
                                        }}
                                    >
                                        Clear Filters
                                    </Button>
                                    <span className="text-xs text-slate-500">
                                        Showing {filteredMatches.length} of {matches.length} matches
                                    </span>
                                </div>
                            )}
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
                                                           className="bg-green-600 hover:bg-green-700"
                                                        >
                                                           <ThumbsUp className="w-4 h-4 mr-1" />
                                                           Full Analysis
                                                        </Button>
                                                        <Button 
                                                           size="sm" 
                                                           onClick={() => quickApplyToTracker(match)}
                                                           variant="outline"
                                                           className="border-blue-600 text-blue-700"
                                                        >
                                                           <Briefcase className="w-4 h-4 mr-1" />
                                                           Quick Apply
                                                        </Button>
                                                        <Button 
                                                           size="sm" 
                                                           onClick={() => updateMatchStatus(match.id, "dismissed")}
                                                           variant="outline"
                                                           className="text-red-600 hover:text-red-700"
                                                        >
                                                           <ThumbsDown className="w-4 h-4 mr-1" />
                                                           Dismiss
                                                        </Button>
                                                    </>
                                                )}
                                                {match.job_url && (
                                                    <a 
                                                        href={match.job_url.startsWith('http') ? match.job_url : `https://${match.job_url}`} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                    >
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