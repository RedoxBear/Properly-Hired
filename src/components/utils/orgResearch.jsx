import { InvokeLLM } from "@/integrations/Core";

export async function fetchOrgResearch(company, jobTitle = "") {
  if (!company || !company.trim()) {
    return { overview: "", website: "", founded: "", size: "", industry: "", headquarters: "", viability: "", trigger: "", dna: "", hook: "" };
  }

  try {
    const result = await InvokeLLM({
      prompt: `
  Research the company "${company}" ${jobTitle ? `and the specific role "${jobTitle}"` : ""} like a Headhunter. 
  Follow the "Deep Dive" Protocol:

  1. **Viability Check (Ghost Job):** Is this role real? Look for "posting history", "recruiter activity", "evergreen" signs, or recent layoffs.
  2. **Follow the Money (The Trigger):** Find the financial trigger opening this headcount (Series X funding, Revenue growth, IPO, Turnaround). Why now?
  3. **Leadership DNA (Culture):** Look at executive backgrounds (ex-Google, ex-Amazon, ex-Defense). What does that say about the culture?
  4. **Operational Signals (The Hook):** What specific physical/digital project are they building NOW (New Office, Factory, Product Launch)? Connect it to the role.

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
    "hook": "Specific project/initiative to reference"
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
          hook: { type: "string" }
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
      hook: String(result?.hook || "")
    };
  } catch {
    // Fallback: return empty fields (no placeholder text)
    return { overview: "", website: "", founded: "", size: "", industry: "", headquarters: "", viability: "", trigger: "", dna: "", hook: "" };
  }
}