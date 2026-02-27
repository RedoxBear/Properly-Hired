import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Company Research Pipeline — orchestrates multi-source research for a company.
 * Called by Simon agent or frontend when company-intent is detected.
 *
 * Input: { company_name, job_url?, career_page_url? }
 * Output: { success, research_id, summary, research_payload }
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { company_name, job_url, career_page_url, create_inbox_task = true } = body;

    if (!company_name) {
      return Response.json({ error: "company_name is required" }, { status: 400 });
    }

    const results = {
      company_name,
      job_url: job_url || null,
      career_page_url: career_page_url || null,
      glassdoor_url: null,
      firecrawl: { job_page: null, careers_page: null },
      github: null,
      brightdata: null,
      errors: [],
      scraped_at: new Date().toISOString(),
    };

    // 1. Firecrawl: scrape job URL if provided
    if (job_url) {
      try {
        const resp = await base44.functions.invoke('firecrawlScrape', {
          action: 'scrape', url: job_url
        });
        results.firecrawl.job_page = resp?.data || null;
      } catch (e) {
        results.errors.push(`firecrawl job_url: ${e.message}`);
      }
    }

    // 2. Firecrawl: scrape careers page if provided
    if (career_page_url) {
      try {
        const resp = await base44.functions.invoke('firecrawlScrape', {
          action: 'scrape', url: career_page_url
        });
        results.firecrawl.careers_page = resp?.data || null;
      } catch (e) {
        results.errors.push(`firecrawl careers: ${e.message}`);
      }
    }

    // 3. GitHub: search for org/repos
    try {
      const resp = await base44.functions.invoke('githubQuery', {
        action: 'search_repos',
        query: `org:${company_name.toLowerCase().replace(/\s+/g, '')}`,
        per_page: 5
      });
      results.github = resp?.repos || null;
    } catch (e) {
      results.errors.push(`github: ${e.message}`);
    }

    // 4. Bright Data: company signal (best-effort)
    try {
      const linkedinUrl = `https://www.linkedin.com/company/${company_name.toLowerCase().replace(/\s+/g, '-')}`;
      const resp = await base44.functions.invoke('brightdataCollect', {
        action: 'collect_company',
        company_url: linkedinUrl
      });
      results.brightdata = resp || null;
    } catch (e) {
      results.errors.push(`brightdata: ${e.message}`);
    }

    // Build summary
    const summaryParts = [`Company: ${company_name}`];
    if (job_url) summaryParts.push(`Job URL: ${job_url}`);
    if (career_page_url) summaryParts.push(`Careers: ${career_page_url}`);
    if (results.github && results.github.length > 0) {
      summaryParts.push(`GitHub repos: ${results.github.length} (top: ${results.github[0]?.full_name || 'N/A'})`);
    }
    if (results.errors.length > 0) {
      summaryParts.push(`Partial data — ${results.errors.length} source(s) unavailable`);
    }
    const summary = summaryParts.join(' | ');

    // Truncate research_payload to fit entity field
    const payloadStr = JSON.stringify(results).substring(0, 3800);

    // Save to CompanyResearch entity
    const record = await base44.entities.CompanyResearch.create({
      company_name,
      job_url: job_url || "",
      research_payload: payloadStr,
    });

    // Update with summary (separate call to avoid field issues)
    try {
      await base44.entities.CompanyResearch.update(record.id, { summary });
    } catch (_) { /* summary field may not exist yet */ }

    // Create AgentCollabInbox task for Simon
    if (create_inbox_task) {
      try {
        await base44.entities.AgentCollabInbox.create({
          from_agent: "simon",
          to_agent: "simon",
          summary: `Company research completed for ${company_name}`,
          highlights: [
            job_url ? `Job: ${job_url}` : "No specific job URL",
            results.github?.length ? `${results.github.length} GitHub repos found` : "No GitHub presence detected",
            results.errors.length ? `${results.errors.length} sources had errors` : "All sources scraped successfully"
          ].slice(0, 5),
          status: "open",
        });
      } catch (e) {
        console.error("Failed to create inbox task:", e);
      }
    }

    return Response.json({
      success: true,
      research_id: record.id,
      summary,
      research_payload: results,
    });

  } catch (error) {
    console.error("companyResearch error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});