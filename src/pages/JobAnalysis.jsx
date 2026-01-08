import React from "react";
import { JobApplication } from "@/entities/JobApplication";
import { InvokeLLM } from "@/integrations/Core";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    Search,
    Sparkles,
    Building,
    Target,
    CheckCircle2,
    Loader2,
    ArrowRight,
    Globe,
    FileText,
    Bot,
    ExternalLink
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { retryWithBackoff } from "@/components/utils/retry";
import CareerArticulationPanel from "@/components/CareerArticulationPanel";
import { Resume } from "@/entities/Resume";
import { composeResume } from "@/components/utils/cvCompose";
import { Link } from 'react-router-dom';
import { scoreAlignment } from "@/components/utils/alignment";
import { tailorByJD } from "@/components/utils/tailorByJD";
import { extractATSKeywords, diffRoleVsCV, idealCandidateFromJD, prioritizeResponsibilities, buildCandidateMatches, interviewerTips } from "@/components/utils/summary";
import { fetchOrgResearch } from "@/components/utils/orgResearch";
import { logEvent } from "@/components/utils/telemetry"; // Updated import path
import CompanyResearchCard from "@/components/company/CompanyResearchCard";

const createPageUrl = (path) => {
    return path.startsWith('/') ? path : `/${path}`;
};

export default function JobAnalysis() {
    const [jobUrl, setJobUrl] = React.useState("");
    const [jobDescription, setJobDescription] = React.useState("");
    const [companyName, setCompanyName] = React.useState("");
    const [jobTitle, setJobTitle] = React.useState("");
    const [isAnalyzing, setIsAnalyzing] = React.useState(false);
    const [analysisResult, setAnalysisResult] = React.useState(null);
    const [error, setError] = React.useState("");
    const [resumeTextForReview, setResumeTextForReview] = React.useState("");
    const [lengthMode, setLengthMode] = React.useState("two_page");
    const [prefillInfo, setPrefillInfo] = React.useState("");
    const [masterResumeRecord, setMasterResumeRecord] = React.useState(null);
    const [savedApp, setSavedApp] = React.useState(null);

    // NEW: URL fetch state and editable lock for JD
    const [isFetchingFromUrl, setIsFetchingFromUrl] = React.useState(false);
    const [jdLocked, setJdLocked] = React.useState(false);

    // NEW: track if we've already logged a job search in this session
    const jobSearchLoggedRef = React.useRef(false);

    React.useEffect(() => {
        (async () => {
            try {
                const masters = await Resume.filter({ is_master_resume: true }, "-created_date", 1);
                if (masters && masters[0]) {
                    setMasterResumeRecord(masters[0]);
                    const raw = masters[0].optimized_content || masters[0].parsed_content || "";
                    setResumeTextForReview(String(raw));
                }
            } catch (e) {
                console.warn("No master resume found for articulation panel.");
            }
        })();
    }, []);

    // NEW: fetch structured fields from URL
    async function autofillFromUrl() {
        if (!jobUrl.trim()) {
            setError("Please paste a job URL first.");
            return;
        }
        // telemetry: ensure a single job_searched log
        try {
            if (!jobSearchLoggedRef.current) {
                await logEvent({
                    type: "job_searched",
                    ts: new Date().toISOString(),
                    url: jobUrl,
                    query: [jobTitle, companyName].filter(Boolean).join(" ") || undefined
                });
                jobSearchLoggedRef.current = true;
            }
            const host = (() => { try { return new URL(jobUrl).host; } catch { return ""; } })();
            const vendor =
                /lever\.co/i.test(host) ? "lever" :
                /greenhouse\.io/i.test(host) ? "greenhouse" :
                /workdayjobs\.com|myworkdayjobs\.com|(^|\.)wd\d+\./i.test(host) ? "workday" :
                /ashbyhq\.com/i.test(host) ? "ashby" :
                /taleo\.net|oraclecloud\.com/i.test(host) ? "taleo" : "other";
            await logEvent({ type: "ats_detected", ts: new Date().toISOString(), host, vendor, url: jobUrl });
        } catch (e) {
            console.error("Telemetry error:", e);
        }
        setIsFetchingFromUrl(true);
        setError("");
        try {
            const res = await retryWithBackoff(
                () => InvokeLLM({
                    prompt: `
You are a structured extractor. Visit this job posting URL and return JSON with:
- job_title: string
- company_name: string
- jd_text: string (the best-available plain text of the job description; include responsibilities, requirements; remove layout noise)

Return empty strings if not visible.

URL: ${jobUrl}
                    `,
                    add_context_from_internet: true,
                    response_json_schema: {
                        type: "object",
                        properties: {
                            job_title: { type: "string" },
                            company_name: { type: "string" },
                            jd_text: { type: "string" }
                        },
                        required: ["job_title", "company_name", "jd_text"]
                    }
                }),
                { retries: 2, baseDelay: 1000 }
            );

            if (res?.job_title) setJobTitle(res.job_title);
            if (res?.company_name) setCompanyName(res.company_name);
            if (res?.jd_text && !jobDescription) {
                setJobDescription(res.jd_text);
                setJdLocked(true);
            }

            setPrefillInfo("Pulled key fields from the job page. Please review before analyzing.");
        } catch (e) {
            console.error(e);
            setError("Couldn’t pull job details from the URL. You can still paste the JD manually.");
        } finally {
            setIsFetchingFromUrl(false);
        }
    }

    // NEW: Auto-try once when user pastes a URL and title/company/JD are empty
    React.useEffect(() => {
        if (!jobUrl) return;
        const emptyKeyFields = !jobTitle && !companyName && !jobDescription;
        if (emptyKeyFields) {
            const t = setTimeout(() => { autofillFromUrl(); }, 350);
            return () => clearTimeout(t);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [jobUrl]);

    // Deep-link prefill and optional autostart (for browser extension)
    const autoStartedRef = React.useRef(false);
    React.useEffect(() => {
        const qp = new URLSearchParams(window.location.search);
        const u = qp.get("url") || "";
        const t = qp.get("title") || "";
        const c = qp.get("company") || "";
        const autostart = qp.get("autostart") === "1";

        if (u) setJobUrl(u);
        if (t) setJobTitle(t);
        if (c) setCompanyName(c);

        if (u && (!t || !c)) {
            setPrefillInfo("We filled the job URL from your browser. Add the job title and company to analyze automatically.");
        }

        // Auto-run only once when required fields are present
        if (u && t && c && autostart && !autoStartedRef.current) {
            autoStartedRef.current = true;
            // Defer to allow state to settle
            setTimeout(() => {
                analyzeJobPosting();
            }, 10);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Build preview CV from latest master resume JSON (if available)
    const parsedMaster = React.useMemo(() => {
        try {
            return resumeTextForReview ? JSON.parse(resumeTextForReview) : null;
        } catch {
            return null;
        }
    }, [resumeTextForReview]);

    // Helper: convert composed CV structure -> plain text for scoring/saving
    const toPlainFromCv = (cv) => {
        if (!cv) return "";
        const expBlocks = (cv.experience || []).flatMap(b => [b.heading, ...(b.lines || [])]);
        const sections = [
            ...(cv.header || []),
            ...(cv.summary || []),
            ...(cv.skills || []),
            ...expBlocks,
            ...(cv.education || [])
        ].filter(Boolean);
        return sections.join("\n");
    };

    // Compose per selected mode (use JD-tailored master data)
    const composedCv = React.useMemo(() => {
        if (!parsedMaster) return null;
        const pi = parsedMaster.personal_info || {};
        const roles = Array.isArray(parsedMaster.experience) ? parsedMaster.experience.map((e) => {
            const duration = e?.duration || "";
            const parts = String(duration).replace("–", "-").split("-").map(s => s.trim());
            const start = parts[0] || "";
            const end = parts[1] || "";
            return {
                title: e?.position || "",
                company: e?.company || "",
                location: e?.location || "",
                start,
                end,
                bullets: Array.isArray(e?.achievements) ? e.achievements : []
            };
        }) : [];
        const data = {
            name: pi.name || "",
            contact: [pi.email, pi.phone, pi.location, pi.linkedin, pi.portfolio].filter(Boolean).join(" | "),
            summary: parsedMaster.summary || "",
            skills: Array.isArray(parsedMaster.skills) ? parsedMaster.skills : [],
            roles,
            education: Array.isArray(parsedMaster.education) ? parsedMaster.education.map(ed => ({
                degree: ed?.degree || "",
                school: ed?.institution || "",
                year: ed?.year || ""
            })) : [],
            extra: undefined
        };
        // JD-aware tailoring
        const tailored = tailorByJD(data, jobDescription || "");
        return composeResume(tailored, { mode: lengthMode, maxBulletsTop: 6, includeAllRoles: true });
    }, [parsedMaster, lengthMode, jobDescription]);

    // Compose Full CV from Master (for Master text scoring) - unchanged (no tailoring)
    const masterCvFull = React.useMemo(() => {
        if (!parsedMaster) return null;
        const pi = parsedMaster.personal_info || {};
        const roles = Array.isArray(parsedMaster.experience) ? parsedMaster.experience.map((e) => {
            const duration = e?.duration || "";
            const parts = String(duration).replace("–", "-").split("-").map(s => s.trim());
            const start = parts[0] || "";
            const end = parts[1] || "";
            return {
                title: e?.position || "",
                company: e?.company || "",
                location: e?.location || "",
                start,
                end,
                bullets: Array.isArray(e?.achievements) ? e.achievements : []
            };
        }) : [];
        const data = {
            name: pi.name || "",
            contact: [pi.email, pi.phone, pi.location, pi.linkedin, pi.portfolio].filter(Boolean).join(" | "),
            summary: parsedMaster.summary || "",
            skills: Array.isArray(parsedMaster.skills) ? parsedMaster.skills : [],
            roles,
            education: Array.isArray(parsedMaster.education) ? parsedMaster.education.map(ed => ({
                degree: ed?.degree || "",
                school: ed?.institution || "",
                year: ed?.year || ""
            })) : [],
            extra: undefined
        };
        return composeResume(data, { mode: "full_cv", maxBulletsTop: 12, includeAllRoles: true });
    }, [parsedMaster]);

    // Plain texts for alignment (active preview + master)
    const optimizedPlain = React.useMemo(() => toPlainFromCv(composedCv), [composedCv]);
    const masterPlain = React.useMemo(() => toPlainFromCv(masterCvFull), [masterCvFull]);

    const analyzeJobPosting = async () => {
        // Always log a single job_searched when Analyze is triggered (even without URL)
        if (!jobSearchLoggedRef.current) {
            try {
                await logEvent({
                    type: "job_searched",
                    ts: new Date().toISOString(),
                    url: jobUrl || undefined,
                    query: [jobTitle, companyName].filter(Boolean).join(" ") || undefined
                });
                jobSearchLoggedRef.current = true;
            } catch (e) {
                console.error("Telemetry error:", e);
            }
        }

        // NEW: If only URL is present, try to fetch first
        if (jobUrl && (!jobTitle || !companyName || !jobDescription)) {
            await autofillFromUrl();
        }

        // NEW: Validate after fetch attempt
        if (!jobTitle.trim() || !companyName.trim() || !jobDescription.trim()) {
            setError("Please provide a job URL and/or ensure Job Title, Company, and the JD text are present.");
            return;
        }

        setIsAnalyzing(true);
        setError("");

        try {
            const analysisPrompt = `
Analyze this job posting and extract key insights. Additionally, detect if the post is likely AI-generated (templated language, unrealistic requirements, vague company signals) and provide humanization tips for the applicant to make their response more authentic if the job posting seems AI-generated.

Job Title: ${jobTitle}
Company: ${companyName}
Job URL: ${jobUrl || 'Not provided'}
Job Description: ${jobDescription}

Please provide a comprehensive analysis in JSON format, including:
1.  **key_requirements**: An array of strings detailing key requirements and skills needed.
2.  **company_culture**: A string summarizing company culture insights (research the company if needed).
3.  **required_qualifications**: An array of strings for important qualifications and experience required.
4.  **nice_to_have_skills**: An array of strings for nice-to-have skills that would be beneficial.
5.  **important_keywords**: An array of strings for specific keywords that should be emphasized in applications.
6.  **seniority_level**: A string assessing the role's seniority level and expectations.
7.  **application_strategy**: A string providing actionable application strategy recommendations.
8.  **optimization_score**: A number representing an overall score for how well an applicant can optimize for this job (e.g., 0-100).
9.  **ai_generated_likelihood**: A number (0-100) indicating the likelihood that the job posting itself was AI-generated.
10. **ai_signals**: An array of strings detailing specific observations or signals that suggest AI generation (e.g., "generic phrasing", "lack of specific details", "buzzword heavy").
11. **humanization_tips**: A string providing specific, actionable advice on how an applicant can make their application (resume, cover letter, interview responses) sound more human and less generic, especially if the job posting is suspected to be AI-generated.

Be thorough and actionable in your analysis. The response MUST be a valid JSON object matching the described schema.
            `;

            const response = await retryWithBackoff(() => InvokeLLM({
                prompt: analysisPrompt,
                add_context_from_internet: true,
                response_json_schema: {
                    type: "object",
                    properties: {
                        key_requirements: { type: "array", items: { type: "string" } },
                        company_culture: { type: "string" },
                        required_qualifications: { type: "array", items: { type: "string" } },
                        nice_to_have_skills: { type: "array", items: { type: "string" } },
                        important_keywords: { type: "array", items: { type: "string" } },
                        seniority_level: { type: "string" },
                        application_strategy: { type: "string" },
                        optimization_score: { type: "number" },
                        ai_generated_likelihood: { type: "number" },
                        ai_signals: { type: "array", items: { type: "string" } },
                        humanization_tips: { type: "string" }
                    }
                }
            }), { retries: 3, baseDelay: 1200 });

            // Save to database, including the full LLM analysis result for future reference
            const savedApplication = await JobApplication.create({
                job_title: jobTitle,
                company_name: companyName,
                job_posting_url: jobUrl || null,
                job_description: jobDescription,
                key_requirements: response.key_requirements,
                company_culture: response.company_culture,
                application_status: "analyzing",
                optimization_score: response.optimization_score || 0,
                ai_generated_likelihood: response.ai_generated_likelihood || 0,
                ai_detection_notes: (response.ai_signals || []).join("; "),
                llm_analysis_result: response // Persist the full LLM analysis result for later use
            });

            // Persist a concise analysis summary to show in Job Library
            const summaryLines = [
                `Role: ${jobTitle} @ ${companyName}`,
                response.company_culture ? `Culture: ${response.company_culture}` : null,
                Array.isArray(response.key_requirements) && response.key_requirements.length
                  ? `Top requirements: ${response.key_requirements.slice(0,5).join(", ")}`
                  : null,
                response.application_strategy ? `Strategy: ${response.application_strategy}` : null
            ].filter(Boolean);
            const summaryMD = summaryLines.join("\n\n");

            // NEW: Build structured summary content using JD + Master CV (masterPlain)
            const ats_keywords = extractATSKeywords(jobDescription || "", masterPlain || "", 30);
            const { lacks, overlaps } = diffRoleVsCV(jobDescription || "", masterPlain || "");
            const ideal = idealCandidateFromJD(jobDescription || "");
            const responsibilities = prioritizeResponsibilities(jobDescription || "", masterPlain || "", 8);
            const candidateMatches = buildCandidateMatches(ideal, masterPlain || "", 8);
            const tips = interviewerTips(jobDescription || "", companyName || "");
            const research = companyName ? await fetchOrgResearch(companyName, jobTitle) : null;

            await JobApplication.update(savedApplication.id, {
                analysis_summary_md: summaryMD || null,
                analysis_summary_html: null, // HTML version could be generated on demand if needed
                last_analysis_at: new Date().toISOString(),
                summary: {
                    ats_keywords,
                    company_overview: research?.overview || null,
                    role_differences: [
                        ...overlaps.slice(0,5).map((l) => `✅ Covered: ${l}`),
                        ...lacks.slice(0,5).map((l) => `⚠️ Add/clarify: ${l}`)
                    ],
                    key_responsibilities: responsibilities,
                    ideal_candidate_profile: ideal,
                    candidate_matches: candidateMatches,
                    interviewer_tips: tips,
                    research_snapshot: research ? {
                        website: research.website,
                        founded: research.founded,
                        size: research.size,
                        industry: research.industry,
                        headquarters: research.headquarters,
                        viability: research.viability,
                        trigger: research.trigger,
                        dna: research.dna,
                        hook: research.hook
                    } : undefined
                }
            });

            // NEW: fetch saved app for rendering summary
            const refreshed = await JobApplication.get(savedApplication.id);
            setSavedApp(refreshed);

            setAnalysisResult({
                ...response,
                applicationId: savedApplication.id
            });

            // NEW: small success cue
            setPrefillInfo("Saved analysis and summary. Open Resume Optimizer or Q&A next.");
        } catch (error) {
            setError("The AI service is receiving many requests. Please try again shortly.");
            console.error("Analysis error:", error);
        }

        setIsAnalyzing(false);
    };

    const resetForm = () => {
        setJobUrl("");
        setJobDescription("");
        setCompanyName("");
        setJobTitle("");
        setAnalysisResult(null);
        setError("");
        setPrefillInfo("");
        setSavedApp(null);
        setJdLocked(false);
        jobSearchLoggedRef.current = false; // Reset telemetry flag
    };

    // Helper to build external job search links
    const buildSearchLinks = () => {
        const qParts = [jobTitle, companyName].filter(Boolean).join(" ");
        const q = encodeURIComponent(qParts || jobTitle || "");
        return {
            indeed: `https://www.indeed.com/jobs?q=${q}`,
            linkedin: `https://www.linkedin.com/jobs/search/?keywords=${q}`
        };
    };
    const { indeed, linkedin } = buildSearchLinks();

    return (
        <div className="min-h-screen p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-8"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-medium mb-4">
                        <Search className="w-4 h-4" />
                        Job Analysis Engine
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">
                        Analyze Job Postings with <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-600">AI Intelligence</span>
                    </h1>
                    <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                        Extract key requirements, understand company culture, and get strategic insights to optimize your application
                    </p>
                </motion.div>

                {/* Alerts */}
                {error && (
                    <Alert variant="destructive" className="mb-6">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}
                {prefillInfo && (
                    <Alert className="mb-6">
                        <AlertDescription>{prefillInfo}</AlertDescription>
                    </Alert>
                )}

                <AnimatePresence mode="wait">
                    {!analysisResult ? (
                        <motion.div
                            key="form"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                        >
                            <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-xl">
                                        <FileText className="w-5 h-5 text-blue-600" />
                                        Job Posting Details
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {/* Basic Job Info */}
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="jobTitle">Job Title *</Label>
                                            <Input
                                                id="jobTitle"
                                                placeholder="e.g. Senior Software Engineer"
                                                value={jobTitle}
                                                onChange={(e) => setJobTitle(e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="companyName">Company Name *</Label>
                                            <Input
                                                id="companyName"
                                                placeholder="e.g. Google, Microsoft, etc."
                                                value={companyName}
                                                onChange={(e) => setCompanyName(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    {/* Job URL */}
                                    <div className="space-y-2">
                                        <Label htmlFor="jobUrl">Job Posting URL</Label>
                                        <div className="flex gap-2">
                                            <div className="relative flex-1">
                                                <Globe className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                                                <Input
                                                    id="jobUrl"
                                                    placeholder="https://company.com/jobs/position"
                                                    className="pl-10"
                                                    value={jobUrl}
                                                    onChange={(e) => setJobUrl(e.target.value)}
                                                    onBlur={() => {
                                                        if (jobUrl && !jobTitle && !companyName && !jobDescription) autofillFromUrl();
                                                    }}
                                                />
                                            </div>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={autofillFromUrl}
                                                disabled={isFetchingFromUrl}
                                                title="Fetch Job Title, Company & JD text"
                                            >
                                                {isFetchingFromUrl ? (
                                                    <>
                                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                        Fetching…
                                                    </>
                                                ) : (
                                                    <>
                                                        <Search className="w-4 h-4 mr-2" />
                                                        Fetch
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                        <p className="text-xs text-slate-500">
                                            Paste the job URL, then click <b>Fetch</b> to auto-fill title, company and the job description text.
                                        </p>
                                    </div>

                                    {/* Job Description */}
                                    <div className="space-y-2">
                                        <Label htmlFor="jobDescription">Job Description *</Label>
                                        <Textarea
                                            id="jobDescription"
                                            placeholder="Paste the full job description here..."
                                            className="min-h-48 resize-y"
                                            value={jobDescription}
                                            readOnly={jdLocked}
                                            onChange={(e) => setJobDescription(e.target.value)}
                                        />
                                        <div className="flex items-center gap-3">
                                            <p className="text-sm text-slate-500">
                                                Tip: Include requirements, responsibilities, and company info for best results
                                            </p>
                                            {jdLocked && (
                                                <Button size="sm" variant="ghost" onClick={() => setJdLocked(false)}>
                                                    Edit description
                                                </Button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Quick external search links */}
                                    {(jobTitle || companyName) && (
                                        <div className="flex flex-wrap gap-3">
                                            <a
                                                href={indeed}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-2 px-3 py-2 rounded-md border bg-white hover:bg-slate-50 text-slate-700"
                                                title="Search similar jobs on Indeed"
                                            >
                                                <ExternalLink className="w-4 h-4" />
                                                View similar roles on Indeed
                                            </a>
                                            <a
                                                href={linkedin}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-2 px-3 py-2 rounded-md border bg-white hover:bg-slate-50 text-slate-700"
                                            >
                                                <ExternalLink className="w-4 h-4" />
                                                View similar roles on LinkedIn
                                            </a>
                                        </div>
                                    )}

                                    {/* Submit Button */}
                                    <Button
                                        onClick={analyzeJobPosting}
                                        disabled={isAnalyzing}
                                        className="w-full bg-blue-600 hover:bg-blue-700 h-12"
                                    >
                                        {isAnalyzing ? (
                                            <>
                                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                                Analyzing Job Posting...
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles className="w-5 h-5 mr-2" />
                                                Analyze with AI
                                            </>
                                        )}
                                    </Button>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="results"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-6"
                        >
                            {/* Analysis Results */}
                            <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
                                <CardHeader>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle className="flex items-center gap-2 text-xl">
                                                <CheckCircle2 className="w-5 h-5 text-green-600" />
                                                Analysis Complete
                                            </CardTitle>
                                            <p className="text-slate-600 mt-1">{jobTitle} at {companyName}</p>
                                        </div>
                                        <Button variant="outline" onClick={resetForm}>
                                            Analyze New Job
                                        </Button>
                                    </div>
                                    {analysisResult.ai_generated_likelihood > 50 && (
                                        <Badge variant="outline" className="mt-2 text-sm text-yellow-700 bg-yellow-50 border-yellow-200">
                                            <Bot className="w-3 h-3 mr-1" />
                                            AI-Generated Likelihood: {analysisResult.ai_generated_likelihood}%
                                        </Badge>
                                    )}
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {/* Key Requirements */}
                                    <div>
                                        <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                                            <Target className="w-4 h-4" />
                                            Key Requirements
                                        </h3>
                                        <div className="flex flex-wrap gap-2">
                                            {analysisResult.key_requirements?.map((req, index) => (
                                                <Badge key={index} variant="secondary" className="bg-blue-50 text-blue-800 border-blue-200">
                                                    {req}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Company Culture */}
                                    <div>
                                        <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                                            <Building className="w-4 h-4" />
                                            Company Culture & Insights
                                        </h3>
                                        <p className="text-slate-700 bg-slate-50 p-4 rounded-lg">
                                            {analysisResult.company_culture}
                                        </p>
                                    </div>

                                    {/* Required Qualifications */}
                                    <div>
                                        <h3 className="font-semibold text-slate-800 mb-3">Required Qualifications</h3>
                                        {/* Company Research Card */}
                                        {savedApp?.summary?.research_snapshot && (
                                            <CompanyResearchCard 
                                                company={companyName} 
                                                orgResearch={{
                                                    overview: savedApp.summary.company_overview,
                                                    website: savedApp.summary.research_snapshot.website,
                                                    founded: savedApp.summary.research_snapshot.founded,
                                                    size: savedApp.summary.research_snapshot.size,
                                                    industry: savedApp.summary.research_snapshot.industry,
                                                    headquarters: savedApp.summary.research_snapshot.headquarters
                                                }}
                                            />
                                        )}
                                        <ul className="space-y-2">
                                            {analysisResult.required_qualifications?.map((qual, index) => (
                                                <li key={index} className="flex items-start gap-2">
                                                    <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                                    <span className="text-slate-700">{qual}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    {analysisResult.humanization_tips && (
                                        <div>
                                            <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                                                <Sparkles className="w-4 h-4" />
                                                Humanization Tips (for AI-generated postings)
                                            </h3>
                                            <p className="text-slate-700 bg-purple-50 p-4 rounded-lg border border-purple-200">
                                                {analysisResult.humanization_tips}
                                            </p>
                                        </div>
                                    )}

                                    {/* Application Strategy */}
                                    <div>
                                        <h3 className="font-semibold text-slate-800 mb-3">Application Strategy</h3>
                                        <p className="text-slate-700 bg-green-50 p-4 rounded-lg border border-green-200">
                                            {analysisResult.application_strategy}
                                        </p>
                                    </div>

                                    {/* Explore similar jobs */}
                                    <div>
                                        <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                                            <Globe className="w-4 h-4" />
                                            Explore Similar Jobs
                                        </h3>
                                        <div className="flex flex-wrap gap-3">
                                            <a
                                                href={indeed}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-2 px-3 py-2 rounded-md border bg-white hover:bg-slate-50 text-slate-700"
                                            >
                                                <ExternalLink className="w-4 h-4" />
                                                Indeed results for “{jobTitle}”
                                            </a>
                                            <a
                                                href={linkedin}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-2 px-3 py-2 rounded-md border bg-white hover:bg-slate-50 text-slate-700"
                                            >
                                                <ExternalLink className="w-4 h-4" />
                                                LinkedIn results for “{jobTitle}”
                                            </a>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Resume Alignment & Quality Review (kept) */}
                            <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
                                <CardHeader>
                                    <CardTitle className="text-xl">Resume Alignment & Quality Review</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <CareerArticulationPanel
                                        resumeText={resumeTextForReview}
                                        jdText={jobDescription}
                                        blockApplyOnCritical={true}
                                        onResolveFlag={() => {}}
                                        masterText={masterPlain}
                                        optimizedText={optimizedPlain}
                                    />
                                </CardContent>
                            </Card>

                            {/* NEW: Analysis Summary (persisted) */}
                            {savedApp && (
                                <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
                                    <CardHeader>
                                        <CardTitle className="text-xl">Analysis Summary</CardTitle>
                                    </CardHeader>
                                    <CardContent className="prose max-w-none">
                                        {savedApp.analysis_summary_html ? (
                                            <div dangerouslySetInnerHTML={{ __html: savedApp.analysis_summary_html }} />
                                        ) : (
                                            <div className="whitespace-pre-wrap text-sm font-sans text-slate-700 leading-relaxed">
                                                {savedApp.analysis_summary_md || "No summary available."}
                                            </div>
                                        )}
                                        {savedApp.summary && (
                                            <div className="mt-4 space-y-4">
                                                {savedApp.summary.company_overview && (
                                                    <div>
                                                        <h4 className="font-semibold mb-2">Company Overview</h4>
                                                        <p className="text-slate-700">{savedApp.summary.company_overview}</p>
                                                    </div>
                                                )}
                                                {savedApp.summary.research_snapshot && (
                                                    <div>
                                                        <h4 className="font-semibold mb-2">Company Snapshot</h4>
                                                        <ul className="list-disc list-inside text-sm text-slate-600">
                                                            {savedApp.summary.research_snapshot.website && <li>Website: <a href={savedApp.summary.research_snapshot.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{savedApp.summary.research_snapshot.website}</a></li>}
                                                            {savedApp.summary.research_snapshot.founded && <li>Founded: {savedApp.summary.research_snapshot.founded}</li>}
                                                            {savedApp.summary.research_snapshot.size && <li>Size: {savedApp.summary.research_snapshot.size}</li>}
                                                            {savedApp.summary.research_snapshot.industry && <li>Industry: {savedApp.summary.research_snapshot.industry}</li>}
                                                            {savedApp.summary.research_snapshot.headquarters && <li>Headquarters: {savedApp.summary.research_snapshot.headquarters}</li>}
                                                        </ul>
                                                    </div>
                                                )}
                                                {savedApp.summary.ats_keywords?.length > 0 && (
                                                    <div>
                                                        <h4 className="font-semibold mb-2">ATS Keywords</h4>
                                                        <div className="flex flex-wrap gap-2">
                                                            {savedApp.summary.ats_keywords.map((kw, idx) => (
                                                                <Badge key={idx} variant="outline" className="bg-blue-50 text-blue-800 border-blue-200">{kw}</Badge>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                                {savedApp.summary.role_differences?.length > 0 && (
                                                    <div>
                                                        <h4 className="font-semibold mb-2">Role Differences vs. Your Master CV</h4>
                                                        <ul className="space-y-1">
                                                            {savedApp.summary.role_differences.map((diff, idx) => (
                                                                <li key={idx} className="text-slate-700">{diff}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                                {savedApp.summary.ideal_candidate_profile && (
                                                    <div>
                                                        <h4 className="font-semibold mb-2">Ideal Candidate Profile from JD</h4>
                                                        <p className="text-slate-700">{savedApp.summary.ideal_candidate_profile}</p>
                                                    </div>
                                                )}
                                                {savedApp.summary.candidate_matches?.length > 0 && (
                                                    <div>
                                                        <h4 className="font-semibold mb-2">How Your Master CV Matches</h4>
                                                        <ul className="list-disc list-inside text-slate-700 space-y-1">
                                                            {savedApp.summary.candidate_matches.map((match, idx) => (
                                                                <li key={idx}>{match}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                                {savedApp.summary.interviewer_tips?.length > 0 && (
                                                    <div>
                                                        <h4 className="font-semibold mb-2">Interviewer Tips</h4>
                                                        <ul className="list-disc list-inside text-slate-700 space-y-1">
                                                            {savedApp.summary.interviewer_tips.map((tip, idx) => (
                                                                <li key={idx}>{tip}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            )}

                            {/* Next Steps */}
                            {/* NEW: guard next-step buttons if we don't yet have an applicationId */}
                            {(() => {
                                const appId = analysisResult?.applicationId;
                                return (
                                    <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
                                        <CardHeader>
                                            <CardTitle className="text-xl">Next Steps</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="grid md:grid-cols-3 gap-4">
                                                {appId ? (
                                                  <Link to={createPageUrl(`ResumeOptimizer?id=${appId}`)}>
                                                    <Button className="w-full bg-green-600 hover:bg-green-700 h-12">
                                                      <FileText className="w-4 h-4 mr-2" />
                                                      Open Resume Optimizer
                                                    </Button>
                                                  </Link>
                                                ) : (
                                                  <Button className="w-full h-12" disabled>
                                                    <FileText className="w-4 h-4 mr-2" />
                                                    Open Resume Optimizer
                                                  </Button>
                                                )}

                                                {appId ? (
                                                    <Link to={createPageUrl(`CoverLetter?id=${appId}`)}>
                                                        <Button variant="outline" className="w-full h-12">
                                                            <Sparkles className="w-4 h-4 mr-2" />
                                                            Create Cover Letter
                                                        </Button>
                                                    </Link>
                                                ) : (
                                                    <Button variant="outline" className="w-full h-12" disabled>
                                                        <Sparkles className="w-4 h-4 mr-2" />
                                                        Create Cover Letter
                                                    </Button>
                                                )}

                                                {appId ? (
                                                    <Link to={createPageUrl(`JobSummary?id=${appId}`)}>
                                                        <Button variant="ghost" className="w-full h-12">
                                                            View Saved Summary
                                                        </Button>
                                                    </Link>
                                                ) : (
                                                    <Button variant="ghost" className="w-full h-12" disabled>
                                                        View Saved Summary
                                                    </Button>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })()}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}