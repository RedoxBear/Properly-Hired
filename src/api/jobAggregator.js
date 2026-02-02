/**
 * Job Aggregator
 * Coordinates fetching jobs from multiple sources and intelligent ranking/deduplication
 */

import { retryWithBackoff } from "@/components/utils/retry";
import { base44 } from "@/api/base44Client";
import {
    allConnectors,
    deduplicateJobs
} from "./jobSourceConnectors";

class JobAggregator {
    constructor() {
        this.cache = new Map();
        this.cacheTimeout = 30 * 60 * 1000; // 30 minutes
    }

    /**
     * Get cache key for a search
     */
    getCacheKey(query, location, options = {}) {
        return `${query}:${location}:${JSON.stringify(options)}`;
    }

    /**
     * Clear expired cache entries
     */
    clearExpiredCache() {
        const now = Date.now();
        for (const [key, value] of this.cache.entries()) {
            if (now - value.timestamp > this.cacheTimeout) {
                this.cache.delete(key);
            }
        }
    }

    /**
     * Search multiple job sources in parallel with timeout
     */
    async aggregateJobs(query, location, options = {}) {
        const {
            sources = "all",
            remote_only = false,
            timeout = 45000, // 45 seconds total timeout
            cache = true
        } = options;

        // Check cache
        if (cache) {
            this.clearExpiredCache();
            const cacheKey = this.getCacheKey(query, location, options);
            if (this.cache.has(cacheKey)) {
                console.log("Returning cached job results for:", query);
                return this.cache.get(cacheKey).results;
            }
        }

        try {
            // Determine which connectors to use
            let connectorsToUse = allConnectors;
            if (sources !== "all" && Array.isArray(sources)) {
                connectorsToUse = allConnectors.filter(c =>
                    sources.some(s => c.name.toLowerCase().includes(s.toLowerCase()))
                );
            }

            console.log(`Searching ${connectorsToUse.length} job sources for: "${query}" in "${location}"`);

            // Execute searches in parallel with Promise.allSettled for resilience
            const searchPromises = connectorsToUse.map(connector =>
                retryWithBackoff(
                    () => connector.search(query, location, { remote_only }),
                    { retries: 1, baseDelay: 500, timeout }
                ).catch(e => {
                    console.warn(`${connector.name} search failed:`, e.message);
                    return [];
                })
            );

            // Wait for all searches with timeout
            const results = await Promise.race([
                Promise.allSettled(searchPromises),
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error("Job aggregation timeout")), timeout)
                )
            ]);

            // Extract successful results
            const allJobs = results
                .filter(r => r.status === "fulfilled" && Array.isArray(r.value))
                .flatMap(r => r.value);

            console.log(`Found ${allJobs.length} total jobs across ${connectorsToUse.length} sources`);

            // Deduplicate
            const deduped = deduplicateJobs(allJobs);
            console.log(`After deduplication: ${deduped.length} unique jobs`);

            // Sort by recency (newer first)
            const sorted = deduped.sort((a, b) => {
                const dateA = new Date(a.posted_date || 0);
                const dateB = new Date(b.posted_date || 0);
                return dateB - dateA;
            });

            // Cache results
            if (cache) {
                const cacheKey = this.getCacheKey(query, location, options);
                this.cache.set(cacheKey, {
                    results: sorted,
                    timestamp: Date.now()
                });
            }

            return sorted;
        } catch (e) {
            console.error("Job aggregation failed:", e);
            throw new Error(`Failed to aggregate jobs: ${e.message}`);
        }
    }

    /**
     * Search jobs and score them against user background
     * Returns jobs ranked by background fit
     */
    async aggregateAndScoreJobs(query, location, userBackground, options = {}) {
        try {
            // Get aggregated jobs
            const jobs = await this.aggregateJobs(query, location, options);

            if (jobs.length === 0) {
                return [];
            }

            // Score each job based on user background
            const scoredJobs = await this.scoreJobsAgainstBackground(
                jobs.slice(0, 15), // Limit to top 15 for scoring efficiency
                userBackground
            );

            // Sort by relevance score (highest first)
            return scoredJobs.sort((a, b) => (b.background_fit_score || 0) - (a.background_fit_score || 0));
        } catch (e) {
            console.error("Aggregation and scoring failed:", e);
            throw e;
        }
    }

    /**
     * Score jobs against user background using AI
     * Considers skills, experience level, industry, role progression
     */
    async scoreJobsAgainstBackground(jobs, userBackground) {
        try {
            if (!Array.isArray(jobs) || jobs.length === 0) {
                return [];
            }

            const jobSummaries = jobs.map(j => ({
                title: j.job_title,
                company: j.company_name,
                description: j.job_description?.substring(0, 500) || "",
                location: j.location,
                source: j.source
            }));

            const prompt = `You are an expert career advisor. Score how well each job aligns with this candidate's background:

**CANDIDATE BACKGROUND:**
- Current/Latest Role: ${userBackground.current_title || "Not specified"}
- Years of Experience: ${userBackground.years_experience || "Not specified"}
- Top Skills: ${Array.isArray(userBackground.skills) ? userBackground.skills.join(", ") : userBackground.skills || "Not specified"}
- Industries: ${userBackground.industries || "Not specified"}
- Education: ${userBackground.education || "Not specified"}
- Desired Career Direction: ${userBackground.desired_direction || "Not specified"}

**JOBS TO SCORE:**
${jobSummaries.map((j, i) => `
${i + 1}. ${j.title} at ${j.company} (${j.source})
   Location: ${j.location}
   Description excerpt: ${j.description}
`).join("")}

**SCORING CRITERIA (0-100):**
- **Skills Match** (30%): How many required skills does candidate have?
- **Experience Level Fit** (25%): Is it a logical next step or sideways move?
- **Industry/Domain Knowledge** (20%): Does they have relevant industry experience?
- **Growth Opportunity** (15%): Does this advance their career trajectory?
- **Location Fit** (10%): Does location match their preferences?

For each job, provide:
1. A background_fit_score (0-100)
2. Key reasons this is a good/poor fit
3. How it aligns with their career trajectory

Return as JSON array matching the order of jobs above:
[
  {
    "job_index": number,
    "background_fit_score": number,
    "skills_match": number,
    "experience_fit": string,
    "industry_relevance": string,
    "career_alignment": string,
    "reasons": string[]
  }
]

**IMPORTANT:**
- Be honest about fit - don't inflate scores
- Consider if this is a lateral move, step up, or step down
- If skills/experience don't match, score accordingly
- Return scores in the exact order of the jobs above`;

            const response = await retryWithBackoff(() =>
                base44.integrations.Core.InvokeLLM({
                    prompt,
                    response_json_schema: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                job_index: { type: "number" },
                                background_fit_score: { type: "number" },
                                skills_match: { type: "number" },
                                experience_fit: { type: "string" },
                                industry_relevance: { type: "string" },
                                career_alignment: { type: "string" },
                                reasons: { type: "array", items: { type: "string" } }
                            }
                        }
                    }
                }),
                { retries: 2, baseDelay: 1000 }
            );

            // Merge scores with job data
            return jobs.map((job, idx) => {
                const score = (response || []).find(s => s.job_index === idx);
                return {
                    ...job,
                    background_fit_score: score?.background_fit_score || 0,
                    background_analysis: {
                        skills_match: score?.skills_match || 0,
                        experience_fit: score?.experience_fit || "",
                        industry_relevance: score?.industry_relevance || "",
                        career_alignment: score?.career_alignment || "",
                        reasons: score?.reasons || []
                    }
                };
            });
        } catch (e) {
            console.error("Background scoring failed:", e);
            // Return jobs without scores if scoring fails
            return jobs.map(j => ({ ...j, background_fit_score: 0 }));
        }
    }

    /**
     * Extract user background from resume data
     * Used for intelligent job matching
     */
    async extractUserBackground(resumeData) {
        try {
            const prompt = `Extract candidate background profile from this resume for job matching purposes:

**RESUME CONTENT:**
${typeof resumeData === "string" ? resumeData : JSON.stringify(resumeData, null, 2)}

Return JSON with:
{
  "current_title": "Their current or most recent job title",
  "years_experience": number, // Total years in workforce
  "skills": ["array", "of", "top", "skills"], // Top 5-8 skills
  "industries": ["industry1", "industry2"], // Industries they've worked in
  "education": "Degree, certifications",
  "desired_direction": "Career path they're targeting based on resume trajectory",
  "seniority_level": "Entry / Mid-level / Senior / Lead",
  "tech_focused": boolean, // Is this a technical role?
  "remote_preference": "Flexible / Prefers Remote / Location-based"
}`;

            const background = await base44.integrations.Core.InvokeLLM({
                prompt,
                response_json_schema: {
                    type: "object",
                    properties: {
                        current_title: { type: "string" },
                        years_experience: { type: "number" },
                        skills: { type: "array", items: { type: "string" } },
                        industries: { type: "array", items: { type: "string" } },
                        education: { type: "string" },
                        desired_direction: { type: "string" },
                        seniority_level: { type: "string" },
                        tech_focused: { type: "boolean" },
                        remote_preference: { type: "string" }
                    }
                }
            });

            return background;
        } catch (e) {
            console.error("Failed to extract user background:", e);
            return null;
        }
    }

    /**
     * Get aggregation statistics
     */
    getCacheStats() {
        return {
            cached_searches: this.cache.size,
            cache_entries: Array.from(this.cache.keys())
        };
    }

    /**
     * Clear all cache
     */
    clearCache() {
        this.cache.clear();
        console.log("Job aggregator cache cleared");
    }
}

// Export singleton instance
export const jobAggregator = new JobAggregator();

// Export class for testing
export default JobAggregator;
