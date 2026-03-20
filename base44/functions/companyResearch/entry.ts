import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

/**
 * Company Research Pipeline v2 — uses LLM + web search for comprehensive research.
 * Gathers: company history, financials, leadership, culture, Glassdoor/Indeed sentiment,
 * interviewer mapping, and leadership style assessment.
 *
 * Input: { company_name, job_url?, career_page_url?, job_title? }
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
    const { company_name, job_url, career_page_url, job_title, create_inbox_task = true } = body;

    if (!company_name) {
      return Response.json({ error: "company_name is required" }, { status: 400 });
    }

    const results = {
      company_name,
      job_url: job_url || null,
      career_page_url: career_page_url || null,
      glassdoor_url: null,
      scraped_at: new Date().toISOString(),
      errors: [],
    };

    // 1. Firecrawl: scrape job URL if provided
    let jobPageContent = null;
    if (job_url) {
      try {
        const resp = await base44.functions.invoke('firecrawlScrape', {
          action: 'scrape', url: job_url
        });
        jobPageContent = resp?.data?.markdown || resp?.data?.content || null;
        results.job_page_scraped = !!jobPageContent;
      } catch (e) {
        results.errors.push(`firecrawl job_url: ${e.message}`);
      }
    }

    // 2. Firecrawl: scrape careers page if provided
    let careersContent = null;
    if (career_page_url) {
      try {
        const resp = await base44.functions.invoke('firecrawlScrape', {
          action: 'scrape', url: career_page_url
        });
        careersContent = resp?.data?.markdown || resp?.data?.content || null;
      } catch (e) {
        results.errors.push(`firecrawl careers: ${e.message}`);
      }
    }

    // 3. GitHub: search for org/repos
    let githubData = null;
    try {
      const resp = await base44.functions.invoke('githubQuery', {
        action: 'search_repos',
        query: `org:${company_name.toLowerCase().replace(/\s+/g, '')}`,
        per_page: 5
      });
      githubData = resp?.repos || null;
    } catch (e) {
      results.errors.push(`github: ${e.message}`);
    }

    // 4. LLM + Web Search: comprehensive company intelligence
    const jobContext = jobPageContent ? `\n\nScraped Job Posting Content:\n${jobPageContent.substring(0, 2000)}` : '';
    const careersContext = careersContent ? `\n\nScraped Careers Page Content:\n${careersContent.substring(0, 1500)}` : '';
    const githubContext = githubData?.length ? `\n\nGitHub Repos Found: ${githubData.map(r => r.full_name).join(', ')}` : '';

    let companyIntel = null;
    try {
      companyIntel = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a corporate research analyst. Research "${company_name}" thoroughly using real-time web data.
${job_title ? `The user is interested in the role: "${job_title}"` : ''}
${jobContext}${careersContext}${githubContext}

Provide a comprehensive research report covering ALL of the following sections. Use ONLY verified, publicly available information. If data is unavailable, explicitly state "Not available" for that field.

1. **Company Overview & History**: Founded when, by whom, mission, key milestones, headquarters location, industry.
2. **Public Trading & Financials**: Is it publicly traded? If yes: ticker symbol, exchange, latest stock price range, market cap, recent revenue/earnings highlights, notable financial trends. If private: funding stage, notable investors, estimated valuation if known.
3. **Current Leadership Team**: CEO, CFO, CTO/CIO, CHRO/VP People, and other C-suite. For each: full name, title, approximate tenure, brief background. ONLY include names you can verify from public sources.
4. **Potential Interviewers**: Based on the company size and the role "${job_title || 'general'}", map likely interview panel members by function:
   - Recruiter/Talent Acquisition (name if findable, otherwise describe the role)
   - HR Manager/HRBP
   - Hiring Manager / Department Head
   - Skip-level leader (Director/VP)
   For each: provide name if publicly verifiable, title, and reasoning for inclusion. NEVER fabricate names.
5. **Company Culture & Values**: Stated values, mission, work environment (remote/hybrid/onsite), notable culture programs, DEI initiatives.
6. **Glassdoor & Indeed Sentiment**: Overall rating (if findable), common positive themes, common negative themes, CEO approval rating, interview difficulty rating, interview process description.
7. **Leadership Style Assessment**: Based on company culture, Glassdoor reviews, leadership team background, and public statements, assess the dominant leadership style (e.g., Collaborative, Top-down, Innovative/Startup, Corporate/Structured, Mission-driven). Explain what type of candidate thrives vs. struggles at this company.
8. **Red Flags & Green Flags**: Any concerning signals (layoffs, lawsuits, high turnover mentions) and positive signals (growth, awards, strong employer brand).`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            company_overview: {
              type: "object",
              properties: {
                founded: { type: "string" },
                founders: { type: "string" },
                headquarters: { type: "string" },
                industry: { type: "string" },
                mission: { type: "string" },
                key_milestones: { type: "array", items: { type: "string" } },
                employee_count: { type: "string" },
                website: { type: "string" }
              }
            },
            financials: {
              type: "object",
              properties: {
                is_public: { type: "boolean" },
                ticker: { type: "string" },
                exchange: { type: "string" },
                stock_price_range: { type: "string" },
                market_cap: { type: "string" },
                revenue_highlights: { type: "string" },
                funding_stage: { type: "string" },
                notable_investors: { type: "string" },
                financial_trends: { type: "string" }
              }
            },
            leadership_team: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  title: { type: "string" },
                  tenure: { type: "string" },
                  background: { type: "string" },
                  source_url: { type: "string" }
                }
              }
            },
            potential_interviewers: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  role_function: { type: "string" },
                  name: { type: "string" },
                  title: { type: "string" },
                  confidence: { type: "number" },
                  reasoning: { type: "string" },
                  source_url: { type: "string" }
                }
              }
            },
            culture: {
              type: "object",
              properties: {
                stated_values: { type: "array", items: { type: "string" } },
                work_environment: { type: "string" },
                dei_initiatives: { type: "string" },
                notable_programs: { type: "string" }
              }
            },
            review_sentiment: {
              type: "object",
              properties: {
                glassdoor_rating: { type: "string" },
                indeed_rating: { type: "string" },
                ceo_approval: { type: "string" },
                positive_themes: { type: "array", items: { type: "string" } },
                negative_themes: { type: "array", items: { type: "string" } },
                interview_difficulty: { type: "string" },
                interview_process: { type: "string" }
              }
            },
            leadership_style: {
              type: "object",
              properties: {
                dominant_style: { type: "string" },
                description: { type: "string" },
                thrives_profile: { type: "string" },
                struggles_profile: { type: "string" },
                source_signals: { type: "array", items: { type: "string" } }
              }
            },
            flags: {
              type: "object",
              properties: {
                red_flags: { type: "array", items: { type: "string" } },
                green_flags: { type: "array", items: { type: "string" } }
              }
            }
          }
        }
      });
    } catch (e) {
      results.errors.push(`llm_research: ${e.message}`);
    }

    // Merge all data
    results.company_intel = companyIntel || {};
    results.github = githubData;

    // Build summary
    const overview = companyIntel?.company_overview || {};
    const financials = companyIntel?.financials || {};
    const sentiment = companyIntel?.review_sentiment || {};
    const leadership = companyIntel?.leadership_team || [];

    const summaryParts = [`Company: ${company_name}`];
    if (overview.industry) summaryParts.push(`Industry: ${overview.industry}`);
    if (overview.headquarters) summaryParts.push(`HQ: ${overview.headquarters}`);
    if (financials.is_public) summaryParts.push(`Ticker: ${financials.ticker || 'N/A'}`);
    if (sentiment.glassdoor_rating) summaryParts.push(`Glassdoor: ${sentiment.glassdoor_rating}`);
    if (leadership.length) summaryParts.push(`Leadership: ${leadership.length} identified`);
    if (results.errors.length) summaryParts.push(`${results.errors.length} source(s) partial`);
    const summary = summaryParts.join(' | ');

    // Truncate research_payload to fit entity field limit
    const payloadStr = JSON.stringify(results).substring(0, 3900);

    // Save to CompanyResearch entity
    const record = await base44.entities.CompanyResearch.create({
      company_name,
      job_url: job_url || "",
      career_page_url: career_page_url || "",
      research_payload: payloadStr,
      summary,
    });

    // Create AgentCollabInbox task for Kyle with interviewer intel
    if (create_inbox_task) {
      try {
        const interviewers = companyIntel?.potential_interviewers || [];
        const leadershipStyle = companyIntel?.leadership_style || {};
        const interviewerSummary = interviewers.map(i => 
          `${i.role_function}: ${i.name || 'Unknown'} (${i.title || 'N/A'}) — ${i.confidence || 0}% confidence`
        ).join('; ');

        await base44.entities.AgentCollabInbox.create({
          from_agent: "simon",
          to_agent: "kyle",
          summary: `Company intel ready for ${company_name}${job_title ? ` — role: ${job_title}` : ''}`,
          highlights: [
            interviewerSummary ? `Interviewers: ${interviewerSummary}`.substring(0, 120) : "No specific interviewers identified",
            leadershipStyle.dominant_style ? `Leadership style: ${leadershipStyle.dominant_style}`.substring(0, 120) : "Leadership style: Not assessed",
            sentiment.glassdoor_rating ? `Glassdoor: ${sentiment.glassdoor_rating} — Interview: ${sentiment.interview_difficulty || 'N/A'}`.substring(0, 120) : "No review data",
            sentiment.interview_process ? `Process: ${sentiment.interview_process}`.substring(0, 120) : "Interview process: Unknown",
            leadershipStyle.thrives_profile ? `Thrives: ${leadershipStyle.thrives_profile}`.substring(0, 120) : "Candidate fit profile: Not assessed"
          ].slice(0, 5),
          status: "open",
          notes: [
            `Research completed ${new Date().toISOString()}`,
            job_url ? `Job URL: ${job_url}` : "No job URL provided"
          ]
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