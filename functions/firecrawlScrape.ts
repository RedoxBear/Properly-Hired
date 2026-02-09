import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Firecrawl integration — scrape a URL and return structured content.
 * Actions:
 *   scrape   — scrape a single URL, return markdown + metadata
 *   extract  — scrape + extract structured data via a JSON schema
 */

const FIRECRAWL_BASE = "https://api.firecrawl.dev/v1";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { action = "scrape", url, json_schema, formats } = body;

    if (!url) {
      return Response.json({ error: "url is required" }, { status: 400 });
    }

    const apiKey = Deno.env.get("FIRECRAWL_API_KEY");
    if (!apiKey) {
      return Response.json({ error: "FIRECRAWL_API_KEY not configured" }, { status: 500 });
    }

    if (action === "scrape") {
      const payload = {
        url,
        formats: formats || ["markdown", "html"],
      };

      const resp = await fetch(`${FIRECRAWL_BASE}/scrape`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
      });

      if (!resp.ok) {
        const errText = await resp.text();
        return Response.json({ error: `Firecrawl error: ${resp.status}`, details: errText }, { status: resp.status });
      }

      const result = await resp.json();
      return Response.json({
        success: true,
        data: {
          markdown: result.data?.markdown || "",
          html: result.data?.html || "",
          metadata: result.data?.metadata || {},
          url: result.data?.metadata?.sourceURL || url,
        },
      });
    }

    if (action === "extract") {
      if (!json_schema) {
        return Response.json({ error: "json_schema is required for extract action" }, { status: 400 });
      }

      const payload = {
        url,
        formats: ["extract"],
        extract: { schema: json_schema },
      };

      const resp = await fetch(`${FIRECRAWL_BASE}/scrape`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
      });

      if (!resp.ok) {
        const errText = await resp.text();
        return Response.json({ error: `Firecrawl extract error: ${resp.status}`, details: errText }, { status: resp.status });
      }

      const result = await resp.json();
      return Response.json({
        success: true,
        data: {
          extracted: result.data?.extract || {},
          metadata: result.data?.metadata || {},
          url: result.data?.metadata?.sourceURL || url,
        },
      });
    }

    return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error) {
    console.error("firecrawlScrape error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});