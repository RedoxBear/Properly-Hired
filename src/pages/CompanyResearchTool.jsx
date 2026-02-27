import React from "react";
import { base44 } from "@/api/base44Client";
import { InvokeLLM } from "@/integrations/Core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Building2, Sparkles, Save } from "lucide-react";

const truncateText = (value, max = 240) => {
  if (!value) return "";
  const text = String(value);
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
};

const compactResearchPayload = (research) => {
  const raw = JSON.stringify(research);
  if (raw.length <= 3800) return raw;

  const compact = {
    company_name: research?.company_name || "",
    generated_at: research?.generated_at || new Date().toISOString(),
    interviewer_map: (research?.interviewer_map || []).slice(0, 4),
    leadership_style_assessment: research?.leadership_style_assessment || null,
    culture_sentiment: research?.culture_sentiment || null,
    financial_snapshot: research?.financial_snapshot || null,
    firecrawl: {
      company_culture: truncateText(research?.firecrawl?.company_culture, 280),
      values: (research?.firecrawl?.values || []).slice(0, 8),
      open_positions: (research?.firecrawl?.open_positions || []).slice(0, 12)
    },
    career_page: {
      culture_signals: truncateText(research?.career_page?.culture_signals, 280),
      open_roles: (research?.career_page?.open_roles || []).slice(0, 12),
      application_links: (research?.career_page?.application_links || []).slice(0, 8)
    },
    payload_truncated: true
  };
  return JSON.stringify(compact);
};

export default function CompanyResearchTool() {
  const [companyName, setCompanyName] = React.useState("");
  const [jobUrl, setJobUrl] = React.useState("");
  const [summary, setSummary] = React.useState("");
  const [payload, setPayload] = React.useState(null);
  const [isRunning, setIsRunning] = React.useState(false);
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState("");

  const runResearch = async () => {
    setIsRunning(true);
    setError("");
    setSuccess("");
    try {
      const origin = (() => { try { return new URL(jobUrl).origin; } catch { return ""; } })();
      const careerUrl = origin ? `${origin}/careers` : "";
      const glassdoorUrl = companyName
        ? `https://www.glassdoor.com/Search/results.htm?keyword=${encodeURIComponent(companyName)}`
        : "";
      const extractWithFirecrawl = async (url, jsonSchema) => {
        if (!url) return null;
        try {
          const response = await base44.functions.invoke("firecrawlScrape", {
            action: "extract",
            url,
            json_schema: jsonSchema
          });
          return response?.data?.extracted || response || null;
        } catch (e) {
          console.warn(`Firecrawl extract failed for ${url}:`, e?.message || e);
          return null;
        }
      };

      const firecrawlData = await extractWithFirecrawl(origin || jobUrl, {
        type: "object",
        properties: {
          company_culture: { type: "string" },
          values: { type: "array", items: { type: "string" } },
          open_positions: { type: "array", items: { type: "string" } },
          leadership_mentions: { type: "array", items: { type: "string" } },
          recruiter_mentions: { type: "array", items: { type: "string" } }
        }
      });

      const careerData = await extractWithFirecrawl(careerUrl, {
        type: "object",
        properties: {
          culture_signals: { type: "string" },
          open_roles: { type: "array", items: { type: "string" } },
          recruiter_titles: { type: "array", items: { type: "string" } },
          application_links: { type: "array", items: { type: "string" } }
        }
      });

      const leadershipUrls = origin
        ? [`${origin}/about`, `${origin}/team`, `${origin}/leadership`, `${origin}/company`]
        : [];
      const leadershipPages = (await Promise.all(
        leadershipUrls.map((url) => extractWithFirecrawl(url, {
          type: "object",
          properties: {
            leadership_people: { type: "array", items: { type: "string" } },
            leadership_roles: { type: "array", items: { type: "string" } },
            leadership_style_clues: { type: "string" }
          }
        }))
      )).filter(Boolean);

      const glassdoorData = await extractWithFirecrawl(glassdoorUrl, {
        type: "object",
        properties: {
          review_summary: { type: "string" },
          ratings: { type: "array", items: { type: "string" } },
          leadership_sentiment: { type: "string" },
          culture_sentiment: { type: "string" }
        }
      });

      let githubRes = null;
      try {
        githubRes = companyName
          ? await base44.functions.invoke("githubQuery", {
              action: "search_repos",
              query: `${companyName} org`,
              per_page: 5
            })
          : null;
      } catch (e) {
        console.warn("GitHub lookup failed:", e?.message || e);
      }

      let brightDataTrigger = null;
      let brightDataSnapshot = null;
      if (origin) {
        try {
          brightDataTrigger = await base44.functions.invoke("brightdataCollect", {
            action: "collect_company",
            company_url: origin
          });
          if (brightDataTrigger?.snapshot_id) {
            brightDataSnapshot = await base44.functions.invoke("brightdataCollect", {
              action: "get_snapshot",
              snapshot_id: brightDataTrigger.snapshot_id
            });
          }
        } catch (e) {
          console.warn("Bright Data lookup failed:", e?.message || e);
        }
      }

      let financialSnapshot = null;
      try {
        if (companyName) {
          const financeRes = await base44.functions.invoke("queryAlphaVantage", {
            action: "company_financials",
            companyName,
            includeHistory: false
          });
          financialSnapshot = financeRes?.snapshot || null;
        }
      } catch (e) {
        console.warn("Alpha Vantage lookup failed:", e?.message || e);
      }

      const synthesis = await InvokeLLM({
        prompt: `
You are Simon, a recruiting intelligence analyst.
Generate:
- interviewer_map (role/possible person/confidence/source)
- leadership_style_assessment (style label + survive_vs_thrive_signal + fit guidance)
- culture_sentiment (positives and risks)
- next_steps_for_kyle (3 concrete interview prep points)

Rules:
- Do not fabricate names.
- Prefer specific person names only when explicitly supported by source.
- Otherwise use granular role labels (Senior Recruiter, Hiring Manager for Engineering, etc.).

Research:
${JSON.stringify({
          company_name: companyName,
          firecrawl: firecrawlData,
          career_page: careerData,
          leadership_pages: leadershipPages,
          glassdoor: glassdoorData,
          github: githubRes,
          brightdata: brightDataTrigger,
          brightdata_snapshot: brightDataSnapshot?.data || null,
          financial_snapshot: financialSnapshot
        })}
        `,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            interviewer_map: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  stakeholder_role: { type: "string" },
                  likely_person: { type: "string" },
                  confidence: { type: "number" },
                  reasoning: { type: "string" },
                  source: { type: "string" }
                }
              }
            },
            leadership_style_assessment: {
              type: "object",
              properties: {
                style_label: { type: "string" },
                survive_vs_thrive_signal: { type: "string" },
                summary: { type: "string" },
                fit_guidance: { type: "string" }
              }
            },
            culture_sentiment: {
              type: "object",
              properties: {
                positives: { type: "array", items: { type: "string" } },
                risks: { type: "array", items: { type: "string" } }
              }
            },
            next_steps_for_kyle: { type: "array", items: { type: "string" } }
          }
        }
      });

      const structured = {
        company_name: companyName,
        job_url: jobUrl,
        company_site: origin,
        firecrawl: firecrawlData,
        career_page: careerData,
        leadership_pages: leadershipPages,
        glassdoor: glassdoorData,
        github: githubRes,
        brightdata: brightDataTrigger,
        brightdata_snapshot: Array.isArray(brightDataSnapshot?.data)
          ? brightDataSnapshot.data.slice(0, 2)
          : brightDataSnapshot?.data || null,
        financial_snapshot: financialSnapshot,
        interviewer_map: synthesis?.interviewer_map || [],
        leadership_style_assessment: synthesis?.leadership_style_assessment || null,
        culture_sentiment: synthesis?.culture_sentiment || null,
        next_steps_for_kyle: synthesis?.next_steps_for_kyle || [],
        generated_at: new Date().toISOString()
      };

      const summaryRes = await InvokeLLM({
        prompt: `Summarize this company research in 5 concise bullets for job-seeker decision-making. Include leadership style, likely interview stakeholders, and financial viability.\n\nResearch:\n${JSON.stringify(structured)}`,
        add_context_from_internet: false
      });

      const summaryText = truncateText(summaryRes?.response || summaryRes?.content || "", 580);
      setSummary(summaryText);
      setPayload(structured);

      if (base44.entities?.CompanyResearch) {
        await base44.entities.CompanyResearch.create({
          company_name: companyName || "",
          job_url: jobUrl || "",
          career_page_url: careerUrl,
          glassdoor_url: glassdoorUrl,
          summary: summaryText,
          research_payload: compactResearchPayload(structured),
          created_at: new Date().toISOString(),
          created_by: "system"
        });
      } else {
        const key = "company-research";
        const existing = JSON.parse(localStorage.getItem(key) || "[]");
        existing.unshift({
          id: `cr-${Date.now()}`,
          company_name: companyName || "",
          job_url: jobUrl || "",
          summary: summaryText,
          research_payload: compactResearchPayload(structured),
          created_at: new Date().toISOString(),
          created_by: "system"
        });
        localStorage.setItem(key, JSON.stringify(existing));
      }

      setSuccess("Company research generated and saved.");
    } catch (e) {
      console.error("Company research tool failed:", e);
      setError("Failed to generate company research. Ensure MCP tools are configured.");
    }
    setIsRunning(false);
  };

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gray-50">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-medium mb-3">
            <Building2 className="w-4 h-4" />
            Company Research Tool
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-800">AI Company Research Automation</h1>
          <p className="text-slate-600">Generate market insights, news, and financial summaries in one run.</p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert className="border-green-200 bg-green-50">
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              Run Research
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Company name"
            />
            <Input
              value={jobUrl}
              onChange={(e) => setJobUrl(e.target.value)}
              placeholder="Job URL (optional)"
            />
            <Button onClick={runResearch} disabled={isRunning} className="gap-2">
              <Sparkles className="w-4 h-4" />
              {isRunning ? "Running..." : "Generate Research"}
            </Button>
          </CardContent>
        </Card>

        {summary && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Save className="w-5 h-5 text-emerald-600" />
                Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea value={summary} readOnly className="min-h-[140px]" />
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">Auto-generated</Badge>
                <Badge variant="secondary">Saved</Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {payload && (
          <Card>
            <CardHeader>
              <CardTitle>Research Payload (Preview)</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs whitespace-pre-wrap text-slate-600">
                {JSON.stringify(payload, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
