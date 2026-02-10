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

      const firecrawlRes = origin
        ? await base44.functions.invoke("firecrawlScrape", {
            action: "extract",
            url: origin,
            json_schema: {
              type: "object",
              properties: {
                mission: { type: "string" },
                products: { type: "array", items: { type: "string" } },
                markets: { type: "array", items: { type: "string" } }
              }
            }
          })
        : null;

      const careerRes = careerUrl
        ? await base44.functions.invoke("firecrawlScrape", {
            action: "extract",
            url: careerUrl,
            json_schema: {
              type: "object",
              properties: {
                culture_signals: { type: "string" },
                open_roles: { type: "array", items: { type: "string" } }
              }
            }
          })
        : null;

      const glassdoorRes = glassdoorUrl
        ? await base44.functions.invoke("firecrawlScrape", {
            action: "extract",
            url: glassdoorUrl,
            json_schema: {
              type: "object",
              properties: {
                review_summary: { type: "string" },
                ratings: { type: "array", items: { type: "string" } }
              }
            }
          })
        : null;

      const githubRes = companyName
        ? await base44.functions.invoke("githubQuery", {
            action: "search_repos",
            query: `${companyName} org`,
            per_page: 5
          })
        : null;

      const brightDataRes = origin
        ? await base44.functions.invoke("brightdataCollect", {
            action: "collect_company",
            company_url: origin
          })
        : null;

      const marketPrompt = `Summarize market insights and financial signals for ${companyName || origin} in 4-6 bullet points. Focus on market size, competitors, funding, and revenue signals if available.`;
      const newsPrompt = `Provide 3 recent news highlights about ${companyName || origin}. Return bullet points with source and date.`;

      const [marketRes, newsRes] = await Promise.all([
        InvokeLLM({ prompt: marketPrompt, add_context_from_internet: true }),
        InvokeLLM({ prompt: newsPrompt, add_context_from_internet: true })
      ]);

      const structured = {
        company_name: companyName,
        job_url: jobUrl,
        company_site: origin,
        career_page: careerRes?.data?.extracted || careerRes || null,
        glassdoor: glassdoorRes?.data?.extracted || glassdoorRes || null,
        firecrawl: firecrawlRes?.data?.extracted || firecrawlRes || null,
        github: githubRes || null,
        brightdata: brightDataRes || null,
        market_insights: marketRes?.response || marketRes?.content || "",
        company_news: newsRes?.response || newsRes?.content || "",
        generated_at: new Date().toISOString()
      };

      const summaryPrompt = `Summarize this company research in 3-5 concise bullets. Focus on culture, hiring signals, market position, and risk.`;
      const summaryRes = await InvokeLLM({
        prompt: `${summaryPrompt}\n\nResearch:\n${JSON.stringify(structured)}`,
        add_context_from_internet: false
      });

      const summaryText = summaryRes?.response || summaryRes?.content || "";
      setSummary(summaryText);
      setPayload(structured);

      if (base44.entities?.CompanyResearch) {
        await base44.entities.CompanyResearch.create({
          company_name: companyName || "",
          job_url: jobUrl || "",
          career_page_url: careerUrl,
          glassdoor_url: glassdoorUrl,
          summary: summaryText,
          research_payload: JSON.stringify(structured),
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
          research_payload: JSON.stringify(structured),
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
