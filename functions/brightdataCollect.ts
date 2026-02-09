import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Bright Data Web Scraper API integration.
 * Actions:
 *   scrape_url       — scrape a single URL via Bright Data SERP/Web Unlocker
 *   search_jobs      — search for job postings via Bright Data datasets
 *   collect_company  — collect company profile data
 */

const BD_API_BASE = "https://api.brightdata.com";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { action = "scrape_url" } = body;

    const apiKey = Deno.env.get("BRIGHTDATA_API_KEY");
    if (!apiKey) {
      return Response.json({ error: "BRIGHTDATA_API_KEY not configured" }, { status: 500 });
    }

    const headers = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    };

    if (action === "scrape_url") {
      const { url, country } = body;
      if (!url) {
        return Response.json({ error: "url is required" }, { status: 400 });
      }

      // Use Web Unlocker API for general page scraping
      const resp = await fetch(`${BD_API_BASE}/request`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          zone: "web_unlocker1",
          url,
          country: country || "us",
          format: "raw",
        }),
      });

      if (!resp.ok) {
        const errText = await resp.text();
        return Response.json({ error: `Bright Data error: ${resp.status}`, details: errText }, { status: resp.status });
      }

      const html = await resp.text();
      return Response.json({
        success: true,
        data: {
          html: html.substring(0, 100000), // Cap at 100KB
          url,
          content_length: html.length,
        },
      });
    }

    if (action === "search_jobs") {
      const { keyword, location, limit = 10 } = body;
      if (!keyword) {
        return Response.json({ error: "keyword is required" }, { status: 400 });
      }

      // Use Bright Data datasets API for job search
      const resp = await fetch(`${BD_API_BASE}/datasets/v3/trigger`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          dataset_id: "gd_lpfll7v5hcqtkxl6l", // LinkedIn Jobs dataset
          endpoint: "/trigger",
          input: [{
            keyword: keyword,
            location: location || "United States",
            limit_per_input: limit,
          }],
          format: "json",
          include_errors: true,
        }),
      });

      if (!resp.ok) {
        const errText = await resp.text();
        return Response.json({ error: `Bright Data jobs error: ${resp.status}`, details: errText }, { status: resp.status });
      }

      const result = await resp.json();
      return Response.json({
        success: true,
        snapshot_id: result.snapshot_id,
        status: result.status || "triggered",
        message: "Job search triggered. Use snapshot_id to check results.",
      });
    }

    if (action === "collect_company") {
      const { company_url } = body;
      if (!company_url) {
        return Response.json({ error: "company_url is required" }, { status: 400 });
      }

      const resp = await fetch(`${BD_API_BASE}/datasets/v3/trigger`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          dataset_id: "gd_l1viktl72bvl7bjuj0", // LinkedIn Company dataset
          input: [{ url: company_url }],
          format: "json",
          include_errors: true,
        }),
      });

      if (!resp.ok) {
        const errText = await resp.text();
        return Response.json({ error: `Bright Data company error: ${resp.status}`, details: errText }, { status: resp.status });
      }

      const result = await resp.json();
      return Response.json({
        success: true,
        snapshot_id: result.snapshot_id,
        status: result.status || "triggered",
        message: "Company data collection triggered. Use snapshot_id to check results.",
      });
    }

    if (action === "get_snapshot") {
      const { snapshot_id } = body;
      if (!snapshot_id) {
        return Response.json({ error: "snapshot_id is required" }, { status: 400 });
      }

      const resp = await fetch(`${BD_API_BASE}/datasets/v3/snapshot/${snapshot_id}?format=json`, {
        method: "GET",
        headers,
      });

      if (!resp.ok) {
        const errText = await resp.text();
        return Response.json({ error: `Snapshot error: ${resp.status}`, details: errText }, { status: resp.status });
      }

      const result = await resp.json();
      return Response.json({ success: true, data: result });
    }

    return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error) {
    console.error("brightdataCollect error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});