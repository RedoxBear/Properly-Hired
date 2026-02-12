import { InvokeLLM } from "@/integrations/Core";

export async function fetchOrgResearch(company, jobTitle = "") {
  if (!company || !company.trim()) {
    return {
      overview: "",
      website: "",
      founded: "",
      size: "",
      industry: "",
      headquarters: "",
      viability: "",
      trigger: "",
      dna: "",
      hook: "",
      linkedin_company_url: "",
      linkedin_people_url: "",
      likely_manager_titles: "",
      leadership_team_summary: "",
      geographic_activity_summary: ""
    };
  }

  try {
    const result = await InvokeLLM({
      prompt: `
  Research "${company}" ${jobTitle ? `for the role "${jobTitle}"` : ""} using PUBLICLY available web information only.
  Prioritize LinkedIn and official public pages over speculative sources.

  Focus on:
  1) Hiring manager direction: likely manager titles for this role.
  2) Leadership team context: who appears to lead this function.
  3) Geographic footprint and business activity.
  4) Company basics (website, size, industry, HQ, founded).

  Constraints:
  - Do not mention or rely on private/internal MCP tools.
  - If uncertain, return concise neutral phrasing like "Not clearly available publicly".
  - Avoid hallucinated names or claims.
  - Prefer practical prep insights over speculative analysis.

  Return ONLY JSON that matches the schema:
  {
    "overview": "2–4 sentence general summary of the company",
    "website": "Canonical homepage URL",
    "founded": "YYYY",
    "size": "Employee/Revenue range",
    "industry": "Primary sector",
    "headquarters": "City, Country",
    "viability": "Is it real? (Yes/No/Maybe) + Brief reason",
    "trigger": "Why is this open today? (Money/Growth/Pain)",
    "dna": "Who are we impressing? (e.g., 'ex-Amazon ops culture')",
    "hook": "Specific project/initiative to reference",
    "linkedin_company_url": "LinkedIn company profile URL if found",
    "linkedin_people_url": "LinkedIn people search URL for this company and role keywords",
    "likely_manager_titles": "Likely reporting-line titles to target in outreach",
    "leadership_team_summary": "Short summary of function leadership and decision-makers",
    "geographic_activity_summary": "Regions/cities where the business appears most active"
  }
      `.trim(),
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          overview: { type: "string" },
          website: { type: "string" },
          founded: { type: "string" },
          size: { type: "string" },
          industry: { type: "string" },
          headquarters: { type: "string" },
          viability: { type: "string" },
          trigger: { type: "string" },
          dna: { type: "string" },
          hook: { type: "string" },
          linkedin_company_url: { type: "string" },
          linkedin_people_url: { type: "string" },
          likely_manager_titles: { type: "string" },
          leadership_team_summary: { type: "string" },
          geographic_activity_summary: { type: "string" }
        }
      }
    });

    // Ensure object shape and strip accidental links from overview
    const cleanOverview = String(result?.overview || "")
      .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, "$1")
      .replace(/\bhttps?:\/\/\S+/gi, "")
      .replace(/\s{2,}/g, " ")
      .trim();

    return {
      overview: cleanOverview,
      website: String(result?.website || ""),
      founded: String(result?.founded || ""),
      size: String(result?.size || ""),
      industry: String(result?.industry || ""),
      headquarters: String(result?.headquarters || ""),
      viability: String(result?.viability || ""),
      trigger: String(result?.trigger || ""),
      dna: String(result?.dna || ""),
      hook: String(result?.hook || ""),
      linkedin_company_url: String(result?.linkedin_company_url || ""),
      linkedin_people_url: String(result?.linkedin_people_url || ""),
      likely_manager_titles: String(result?.likely_manager_titles || ""),
      leadership_team_summary: String(result?.leadership_team_summary || ""),
      geographic_activity_summary: String(result?.geographic_activity_summary || "")
    };
  } catch {
    // Fallback: return empty fields (no placeholder text)
    return {
      overview: "",
      website: "",
      founded: "",
      size: "",
      industry: "",
      headquarters: "",
      viability: "",
      trigger: "",
      dna: "",
      hook: "",
      linkedin_company_url: "",
      linkedin_people_url: "",
      likely_manager_titles: "",
      leadership_team_summary: "",
      geographic_activity_summary: ""
    };
  }
}
