/**
 * Job Source Connectors
 * Provides unified interface to fetch jobs from multiple job boards and APIs
 * Handles API rate limiting, error handling, and result normalization
 */

import { base44 } from "@/api/base44Client";
import { retryWithBackoff } from "@/components/utils/retry";

// Normalized job data structure returned by all connectors
const normalizeJobData = (job) => ({
    job_title: job.job_title?.trim() || "",
    company_name: job.company_name?.trim() || "",
    job_url: job.job_url?.trim() || "",
    job_description: job.job_description || "",
    location: job.location?.trim() || "",
    salary_range: job.salary_range || "",
    source: job.source || "unknown",
    posted_date: job.posted_date,
    remote_friendly: job.remote_friendly || false,
    posted_days_ago: job.posted_days_ago,
    job_id: job.job_id // For deduplication
});

// Indeed API Connector
export const indeedConnector = {
    name: "Indeed",
    async search(query, location, options = {}) {
        try {
            const prompt = `Search Indeed.com for jobs matching:
Query: "${query}"
Location: "${location}"
${options.remote_only ? "Remote preferred" : "Include local and remote"}

Return the top 8-10 actual job listings found on Indeed.

For each job, extract:
- job_title: Exact job title from the listing
- company_name: Company name
- job_url: THE EXACT, SPECIFIC URL from Indeed (e.g., indeed.com/viewjob?jk=...)
- job_description: Complete job description text
- location: City, State or "Remote"
- salary_range: If listed (e.g., "$80k - $120k")
- posted_date: ISO date if available
- remote_friendly: true if remote, false otherwise

**CRITICAL: Only include jobs with direct Indeed URLs that you can verify exist.**

Return as JSON array with structure:
[
  {
    "job_title": "string",
    "company_name": "string", 
    "job_url": "https://indeed.com/viewjob?...",
    "job_description": "string",
    "location": "string",
    "salary_range": "string",
    "posted_date": "ISO string",
    "remote_friendly": boolean,
    "source": "Indeed"
  }
]`;

            const results = await retryWithBackoff(() =>
                base44.integrations.Core.InvokeLLM({
                    prompt,
                    add_context_from_internet: true,
                    response_json_schema: {
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
                                posted_date: { type: "string" },
                                remote_friendly: { type: "boolean" },
                                source: { type: "string" }
                            }
                        }
                    }
                }),
                { retries: 2, baseDelay: 1000 }
            );

            return (results || [])
                .filter(job => job.job_url?.includes("indeed.com"))
                .map(job => normalizeJobData({ ...job, source: "Indeed" }));
        } catch (e) {
            console.error("Indeed search failed:", e);
            return [];
        }
    }
};

// LinkedIn API Connector
export const linkedinConnector = {
    name: "LinkedIn",
    async search(query, location, options = {}) {
        try {
            const prompt = `Search LinkedIn jobs for:
Query: "${query}"
Location: "${location}"
${options.remote_only ? "Remote preferred" : "Include local and remote"}

Return 8-10 actual job listings from LinkedIn.

For each job, extract:
- job_title: Exact job title from LinkedIn
- company_name: Company name
- job_url: THE EXACT URL from LinkedIn (e.g., linkedin.com/jobs/view/...)
- job_description: Complete job description and requirements
- location: City, Country or "Remote"
- salary_range: If mentioned
- posted_date: ISO date when possible
- remote_friendly: true if remote option available

**MUST HAVE**: Direct LinkedIn job URLs only (linkedin.com/jobs/view/[ID])

Return JSON array:
[
  {
    "job_title": "string",
    "company_name": "string",
    "job_url": "https://linkedin.com/jobs/view/...",
    "job_description": "string",
    "location": "string",
    "salary_range": "string",
    "posted_date": "ISO string",
    "remote_friendly": boolean,
    "source": "LinkedIn"
  }
]`;

            const results = await retryWithBackoff(() =>
                base44.integrations.Core.InvokeLLM({
                    prompt,
                    add_context_from_internet: true,
                    response_json_schema: {
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
                                posted_date: { type: "string" },
                                remote_friendly: { type: "boolean" },
                                source: { type: "string" }
                            }
                        }
                    }
                }),
                { retries: 2, baseDelay: 1000 }
            );

            return (results || [])
                .filter(job => job.job_url?.includes("linkedin.com/jobs"))
                .map(job => normalizeJobData({ ...job, source: "LinkedIn" }));
        } catch (e) {
            console.error("LinkedIn search failed:", e);
            return [];
        }
    }
};

// Glassdoor Connector
export const glassdoorConnector = {
    name: "Glassdoor",
    async search(query, location, options = {}) {
        try {
            const prompt = `Search Glassdoor for jobs:
Query: "${query}"
Location: "${location}"
${options.remote_only ? "Remote preferred" : "Include all"}

Find 8-10 jobs on Glassdoor with complete details.

For each job:
- job_title: Job title from Glassdoor
- company_name: Company name
- job_url: THE ACTUAL GLASSDOOR URL (e.g., glassdoor.com/job-listing/... or glassdoor.com/jobs/...)
- job_description: Full job description
- location: City, State or Remote
- salary_range: Glassdoor salary estimate if available
- company_rating: Company rating if available
- remote_friendly: boolean

Return JSON array:
[
  {
    "job_title": "string",
    "company_name": "string",
    "job_url": "https://glassdoor.com/job-listing/...",
    "job_description": "string",
    "location": "string",
    "salary_range": "string",
    "company_rating": "number",
    "remote_friendly": boolean,
    "source": "Glassdoor"
  }
]`;

            const results = await retryWithBackoff(() =>
                base44.integrations.Core.InvokeLLM({
                    prompt,
                    add_context_from_internet: true,
                    response_json_schema: {
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
                                company_rating: { type: "number" },
                                remote_friendly: { type: "boolean" },
                                source: { type: "string" }
                            }
                        }
                    }
                }),
                { retries: 2, baseDelay: 1000 }
            );

            return (results || [])
                .filter(job => job.job_url?.includes("glassdoor.com"))
                .map(job => normalizeJobData({ ...job, source: "Glassdoor" }));
        } catch (e) {
            console.error("Glassdoor search failed:", e);
            return [];
        }
    }
};

// ZipRecruiter Connector
export const zipRecruiterConnector = {
    name: "ZipRecruiter",
    async search(query, location, options = {}) {
        try {
            const prompt = `Search ZipRecruiter for jobs:
Query: "${query}"
Location: "${location}"

Find 8-10 jobs on ZipRecruiter matching the criteria.

For each job extract:
- job_title: Exact job title
- company_name: Company name
- job_url: THE SPECIFIC ZIPRECRUITER URL
- job_description: Complete description
- location: City, State or Remote
- salary_range: If listed
- remote_friendly: Is remote available?

Return JSON array with this structure:
[
  {
    "job_title": "string",
    "company_name": "string",
    "job_url": "https://www.ziprecruiter.com/jobs/...",
    "job_description": "string",
    "location": "string",
    "salary_range": "string",
    "remote_friendly": boolean,
    "source": "ZipRecruiter"
  }
]`;

            const results = await retryWithBackoff(() =>
                base44.integrations.Core.InvokeLLM({
                    prompt,
                    add_context_from_internet: true,
                    response_json_schema: {
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
                                remote_friendly: { type: "boolean" },
                                source: { type: "string" }
                            }
                        }
                    }
                }),
                { retries: 2, baseDelay: 1000 }
            );

            return (results || [])
                .filter(job => job.job_url?.includes("ziprecruiter.com"))
                .map(job => normalizeJobData({ ...job, source: "ZipRecruiter" }));
        } catch (e) {
            console.error("ZipRecruiter search failed:", e);
            return [];
        }
    }
};

// Dice (Tech jobs) Connector
export const diceConnector = {
    name: "Dice",
    async search(query, location, options = {}) {
        try {
            const prompt = `Search Dice (tech job board) for technology jobs:
Query: "${query}"
Location: "${location}"

Find 8-10 tech jobs on Dice.

For each job:
- job_title: Job title
- company_name: Company
- job_url: SPECIFIC DICE URL (dice.com/jobs/...)
- job_description: Full description
- location: City/State or Remote
- salary_range: If available
- tech_skills: Key technologies mentioned
- remote_friendly: boolean

Return JSON:
[
  {
    "job_title": "string",
    "company_name": "string",
    "job_url": "https://www.dice.com/jobs/...",
    "job_description": "string",
    "location": "string",
    "salary_range": "string",
    "tech_skills": ["string"],
    "remote_friendly": boolean,
    "source": "Dice"
  }
]`;

            const results = await retryWithBackoff(() =>
                base44.integrations.Core.InvokeLLM({
                    prompt,
                    add_context_from_internet: true,
                    response_json_schema: {
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
                                tech_skills: { type: "array", items: { type: "string" } },
                                remote_friendly: { type: "boolean" },
                                source: { type: "string" }
                            }
                        }
                    }
                }),
                { retries: 2, baseDelay: 1000 }
            );

            return (results || [])
                .filter(job => job.job_url?.includes("dice.com"))
                .map(job => normalizeJobData({ ...job, source: "Dice" }));
        } catch (e) {
            console.error("Dice search failed:", e);
            return [];
        }
    }
};

// FlexJobs Connector
export const flexJobsConnector = {
    name: "FlexJobs",
    async search(query, location, options = {}) {
        try {
            const prompt = `Search FlexJobs for remote and flexible jobs:
Query: "${query}"
Location: "${location}"

Find 8-10 remote/flexible jobs from FlexJobs.

For each job:
- job_title: Job title
- company_name: Company name
- job_url: SPECIFIC FLEXJOBS URL (flexjobs.com/jobs/...)
- job_description: Complete description
- location: Usually Remote
- salary_range: If provided
- job_type: Full-time, Part-time, Contract, etc.
- remote_type: Fully remote, hybrid, etc.

Return JSON:
[
  {
    "job_title": "string",
    "company_name": "string",
    "job_url": "https://www.flexjobs.com/jobs/...",
    "job_description": "string",
    "location": "string",
    "salary_range": "string",
    "job_type": "string",
    "remote_type": "string",
    "source": "FlexJobs"
  }
]`;

            const results = await retryWithBackoff(() =>
                base44.integrations.Core.InvokeLLM({
                    prompt,
                    add_context_from_internet: true,
                    response_json_schema: {
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
                                job_type: { type: "string" },
                                remote_type: { type: "string" },
                                source: { type: "string" }
                            }
                        }
                    }
                }),
                { retries: 2, baseDelay: 1000 }
            );

            return (results || [])
                .filter(job => job.job_url?.includes("flexjobs.com"))
                .map(job => normalizeJobData({ ...job, source: "FlexJobs", remote_friendly: true }));
        } catch (e) {
            console.error("FlexJobs search failed:", e);
            return [];
        }
    }
};

// WellFound (formerly AngelList) Connector
export const wellFoundConnector = {
    name: "WellFound",
    async search(query, location, options = {}) {
        try {
            const prompt = `Search WellFound (AngelList) for startup and high-growth company jobs:
Query: "${query}"
Location: "${location}"

Find 8-10 jobs on WellFound.

For each job:
- job_title: Position title
- company_name: Company name
- job_url: SPECIFIC WELLFOUND URL (wellfound.com/jobs/... or angel.co/jobs/...)
- job_description: Full description
- location: City/State or Remote
- salary_range: If listed
- equity_offered: If mentioned
- company_stage: Seed, Series A, etc.

Return JSON:
[
  {
    "job_title": "string",
    "company_name": "string",
    "job_url": "https://wellfound.com/jobs/...",
    "job_description": "string",
    "location": "string",
    "salary_range": "string",
    "equity_offered": "string",
    "company_stage": "string",
    "source": "WellFound"
  }
]`;

            const results = await retryWithBackoff(() =>
                base44.integrations.Core.InvokeLLM({
                    prompt,
                    add_context_from_internet: true,
                    response_json_schema: {
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
                                equity_offered: { type: "string" },
                                company_stage: { type: "string" },
                                source: { type: "string" }
                            }
                        }
                    }
                }),
                { retries: 2, baseDelay: 1000 }
            );

            return (results || [])
                .filter(job => job.job_url?.includes("wellfound.com") || job.job_url?.includes("angel.co"))
                .map(job => normalizeJobData({ ...job, source: "WellFound" }));
        } catch (e) {
            console.error("WellFound search failed:", e);
            return [];
        }
    }
};

// Upwork (Freelance/Contract) Connector
export const upworkConnector = {
    name: "Upwork",
    async search(query, location, options = {}) {
        try {
            const prompt = `Search Upwork for freelance and contract jobs:
Query: "${query}"

Find 8-10 relevant freelance/contract jobs on Upwork.

For each job:
- job_title: Job title
- company_name: Client/company name if listed
- job_url: SPECIFIC UPWORK URL (upwork.com/jobs/...)
- job_description: Full description
- job_type: Fixed-price or Hourly
- budget_or_rate: Budget or hourly rate range
- experience_level: Entry, Intermediate, Expert
- remote_friendly: Always true for Upwork

Return JSON:
[
  {
    "job_title": "string",
    "company_name": "string",
    "job_url": "https://www.upwork.com/jobs/...",
    "job_description": "string",
    "job_type": "string",
    "budget_or_rate": "string",
    "experience_level": "string",
    "source": "Upwork"
  }
]`;

            const results = await retryWithBackoff(() =>
                base44.integrations.Core.InvokeLLM({
                    prompt,
                    add_context_from_internet: true,
                    response_json_schema: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                job_title: { type: "string" },
                                company_name: { type: "string" },
                                job_url: { type: "string" },
                                job_description: { type: "string" },
                                job_type: { type: "string" },
                                budget_or_rate: { type: "string" },
                                experience_level: { type: "string" },
                                source: { type: "string" }
                            }
                        }
                    }
                }),
                { retries: 2, baseDelay: 1000 }
            );

            return (results || [])
                .filter(job => job.job_url?.includes("upwork.com/jobs"))
                .map(job => normalizeJobData({ 
                    ...job, 
                    source: "Upwork",
                    location: "Remote",
                    remote_friendly: true 
                }));
        } catch (e) {
            console.error("Upwork search failed:", e);
            return [];
        }
    }
};

// Company Career Pages Connector
export const companyCareerPagesConnector = {
    name: "Company Career Pages",
    async search(query, location, options = {}) {
        try {
            const prompt = `Search company career pages for jobs matching:
Query: "${query}"
Location: "${location}"

Find 5-8 jobs from major company career pages (Google, Microsoft, Amazon, Apple, Meta, AWS, etc.).

For each job:
- job_title: Job title
- company_name: Company name
- job_url: DIRECT URL from company's careers page
- job_description: Full description
- location: City/State or Remote
- salary_range: If listed
- experience_level: Entry, Mid, Senior level

Return JSON:
[
  {
    "job_title": "string",
    "company_name": "string",
    "job_url": "https://..../careers/job/...",
    "job_description": "string",
    "location": "string",
    "salary_range": "string",
    "experience_level": "string",
    "source": "Company Career Pages"
  }
]`;

            const results = await retryWithBackoff(() =>
                base44.integrations.Core.InvokeLLM({
                    prompt,
                    add_context_from_internet: true,
                    response_json_schema: {
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
                                experience_level: { type: "string" },
                                source: { type: "string" }
                            }
                        }
                    }
                }),
                { retries: 2, baseDelay: 1000 }
            );

            return (results || [])
                .map(job => normalizeJobData({ ...job, source: "Company Career Pages" }));
        } catch (e) {
            console.error("Company career pages search failed:", e);
            return [];
        }
    }
};

// --- Regional Connectors ---

// Helper to create a regional connector following the standard pattern
const createRegionalConnector = (name, domain, urlFilter, extraPrompt = "") => ({
    name,
    async search(query, location, options = {}) {
        try {
            const prompt = `Search ${name} (${domain}) for jobs matching:
Query: "${query}"
Location: "${location}"
${options.remote_only ? "Remote preferred" : "Include local and remote"}
${extraPrompt}

Return the top 8-10 actual job listings found on ${name}.

For each job, extract:
- job_title: Exact job title from the listing
- company_name: Company name
- job_url: THE EXACT, SPECIFIC URL from ${name} (must contain ${domain})
- job_description: Complete job description text
- location: City, Region or "Remote"
- salary_range: If listed
- posted_date: ISO date if available
- remote_friendly: true if remote, false otherwise

**CRITICAL: Only include jobs with direct ${name} URLs that you can verify exist.**

Return as JSON array:
[
  {
    "job_title": "string",
    "company_name": "string",
    "job_url": "https://${domain}/...",
    "job_description": "string",
    "location": "string",
    "salary_range": "string",
    "posted_date": "ISO string",
    "remote_friendly": boolean,
    "source": "${name}"
  }
]`;

            const results = await retryWithBackoff(() =>
                base44.integrations.Core.InvokeLLM({
                    prompt,
                    add_context_from_internet: true,
                    response_json_schema: {
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
                                posted_date: { type: "string" },
                                remote_friendly: { type: "boolean" },
                                source: { type: "string" }
                            }
                        }
                    }
                }),
                { retries: 2, baseDelay: 1000 }
            );

            return (results || [])
                .filter(job => job.job_url?.includes(urlFilter))
                .map(job => normalizeJobData({ ...job, source: name }));
        } catch (e) {
            console.error(`${name} search failed:`, e);
            return [];
        }
    }
});

// UK connectors
export const reedConnector = createRegionalConnector("Reed", "reed.co.uk", "reed.co.uk");
export const cvLibraryConnector = createRegionalConnector("CV-Library", "cv-library.co.uk", "cv-library.co.uk");
export const totalJobsConnector = createRegionalConnector("TotalJobs", "totaljobs.com", "totaljobs.com");

// Korea connectors
export const jobKoreaConnector = createRegionalConnector("JobKorea", "jobkorea.co.kr", "jobkorea.co.kr");
export const saraminConnector = createRegionalConnector("Saramin", "saramin.co.kr", "saramin.co.kr");

// Germany connectors
export const stepStoneConnector = createRegionalConnector("StepStone", "stepstone.de", "stepstone.de");
export const xingConnector = createRegionalConnector("Xing", "xing.com", "xing.com");

// Australia connectors
export const seekConnector = createRegionalConnector("Seek", "seek.com.au", "seek.com.au");
export const joraConnector = createRegionalConnector("Jora", "jora.com", "jora.com");

// India connectors
export const naukriConnector = createRegionalConnector("Naukri", "naukri.com", "naukri.com");
export const shineConnector = createRegionalConnector("Shine", "shine.com", "shine.com");

// All available connectors
export const allConnectors = [
    linkedinConnector,
    indeedConnector,
    glassdoorConnector,
    zipRecruiterConnector,
    diceConnector,
    flexJobsConnector,
    wellFoundConnector,
    companyCareerPagesConnector,
    upworkConnector,
    reedConnector,
    cvLibraryConnector,
    totalJobsConnector,
    jobKoreaConnector,
    saraminConnector,
    stepStoneConnector,
    xingConnector,
    seekConnector,
    joraConnector,
    naukriConnector,
    shineConnector
];

// Regional source mapping — determines which connectors to use per country
export const REGIONAL_SOURCES = {
    us: [indeedConnector, linkedinConnector, glassdoorConnector, zipRecruiterConnector, diceConnector, flexJobsConnector, wellFoundConnector, companyCareerPagesConnector, upworkConnector],
    gb: [reedConnector, cvLibraryConnector, totalJobsConnector, linkedinConnector, indeedConnector, glassdoorConnector],
    kr: [jobKoreaConnector, saraminConnector, linkedinConnector],
    de: [stepStoneConnector, xingConnector, linkedinConnector, indeedConnector, glassdoorConnector],
    au: [seekConnector, joraConnector, linkedinConnector, indeedConnector],
    in: [naukriConnector, shineConnector, linkedinConnector, indeedConnector],
    _default: [linkedinConnector, indeedConnector, glassdoorConnector, upworkConnector, companyCareerPagesConnector]
};

export const getConnectorsForRegion = (countryCode) => {
    return REGIONAL_SOURCES[(countryCode || "").toLowerCase()] || REGIONAL_SOURCES._default;
};

// Get specific connector by name
export const getConnector = (name) => {
    return allConnectors.find(c => c.name.toLowerCase() === name.toLowerCase());
};

// De-duplicate jobs by URL and by title+company combination
export const deduplicateJobs = (jobs) => {
    const seen = new Set();
    return jobs.filter(job => {
        // Use URL as primary dedup key
        if (job.job_url && seen.has(job.job_url)) {
            return false;
        }
        
        // Use title+company as secondary key
        const key = `${job.job_title}:${job.company_name}`;
        if (seen.has(key)) {
            return false;
        }
        
        if (job.job_url) seen.add(job.job_url);
        seen.add(key);
        return true;
    });
};
