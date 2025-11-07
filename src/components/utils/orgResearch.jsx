import { InvokeLLM } from "@/integrations/Core";

export async function fetchOrgResearch(company) {
  if (!company || !company.trim()) {
    return { overview: "", website: "", founded: "", size: "", industry: "", headquarters: "" };
  }

  try {
    const result = await InvokeLLM({
      prompt: `
Research the company "${company}" and return concise, factual, up-to-date details.
- Use reputable public sources (official website, Wikipedia, news, Crunchbase-like profiles).
- Prefer the company's canonical homepage for website.
- Summarize in 2–4 sentences for overview (no marketing fluff, no quotes, no links).
- If a field is unknown, return an empty string.

Return ONLY JSON that matches the schema:
{
  "overview": "2–4 sentence summary",
  "website": "https://...",
  "founded": "YYYY or 'YYYY (city/state/country)'",
  "size": "approximate employees or revenue range if available",
  "industry": "primary industry/sector",
  "headquarters": "City, State/Region, Country"
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
          headquarters: { type: "string" }
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
      headquarters: String(result?.headquarters || "")
    };
  } catch {
    // Fallback: return empty fields (no placeholder text)
    return { overview: "", website: "", founded: "", size: "", industry: "", headquarters: "" };
  }
}