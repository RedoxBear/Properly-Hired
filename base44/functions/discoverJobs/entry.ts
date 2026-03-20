import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

/**
 * discoverJobs — Autonomous Job Discovery Function
 *
 * Queries JSearch, Adzuna, and USAJobs APIs for job listings matching
 * the user's profile. Scores each result against the user's master resume,
 * deduplicates, and creates JobListing records.
 *
 * Body params:
 *   user_id      (string, required)
 *   search_query (string) — job title / keywords, e.g. "HR Director"
 *   location     (string) — city or state, e.g. "Los Angeles, CA"
 *   remote_only  (boolean) — filter for remote roles only
 *
 * Returns:
 *   { discovered, new_listings, duplicates_skipped, below_threshold, high_match }
 */

// ── Helpers ──────────────────────────────────────────────────────

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text.toLowerCase().trim()));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function normalize(str: string): string {
  return (str || '').toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
}

async function dedupHash(company: string, title: string, location: string): Promise<string> {
  return sha256(normalize(company) + '|' + normalize(title) + '|' + normalize(location));
}

// ── Match Scoring (5 dimensions, 0–100) ─────────────────────────

const SENIORITY_TIERS: Record<string, number> = {
  'intern': 1, 'associate': 2, 'coordinator': 2, 'specialist': 3,
  'analyst': 3, 'manager': 4, 'senior manager': 5, 'hrbp': 4,
  'director': 6, 'senior director': 7, 'vp': 8, 'vice president': 8,
  'head of': 8, 'chief': 9, 'ceo': 10, 'coo': 10, 'cfo': 10,
};

function detectTier(title: string): number {
  const t = title.toLowerCase();
  for (const [kw, tier] of Object.entries(SENIORITY_TIERS)) {
    if (t.includes(kw)) return tier;
  }
  return 3; // default: professional
}

function extractKeywords(text: string): Set<string> {
  const stopwords = new Set(['the','and','or','of','in','a','an','to','for','with','on','at','by','is','are','be','was','were','has','have','this','that','which','from','as','it','its','we','our','you','your','their','will','can','may','should','must','not','no','if','but','so','than','then','when','where','how','what','who']);
  return new Set(
    text.toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2 && !stopwords.has(w))
  );
}

function scoreMatch(job: NormalizedJob, resumeText: string, query: string): number {
  const resumeKw = extractKeywords(resumeText);
  const jdKw     = extractKeywords((job.title + ' ' + job.description).toLowerCase());
  const queryKw  = extractKeywords(query);

  // 1. Job title alignment (30pts) — query terms in job title
  const titleWords = extractKeywords(job.title);
  const titleOverlap = queryKw.size > 0
    ? [...queryKw].filter(w => titleWords.has(w)).length / queryKw.size
    : 0.5;
  const titleScore = Math.round(titleOverlap * 30);

  // 2. Skills overlap (35pts) — JD keywords that also appear in resume
  const jdList = [...jdKw];
  const skillOverlap = jdList.length > 0
    ? jdList.filter(w => resumeKw.has(w)).length / jdList.length
    : 0.3;
  const skillScore = Math.round(Math.min(skillOverlap * 2.5, 1) * 35); // scale — JDs are verbose

  // 3. Industry/domain match (15pts) — HR-relevant terms
  const hrTerms = new Set(['hr','human','resources','talent','recruiting','people','workforce','payroll','benefits','compensation','hris','onboarding','compliance','employee','labor','organizational']);
  const jdHR = [...jdKw].filter(w => hrTerms.has(w)).length;
  const resumeHR = [...resumeKw].filter(w => hrTerms.has(w)).length;
  const industryScore = (jdHR > 0 && resumeHR > 0) ? 15 : jdHR > 0 ? 8 : 5;

  // 4. Location / remote fit (10pts)
  const locationScore = job.remote ? 10 : 7; // remote always fits; on-site partial credit

  // 5. Seniority level match (10pts) — penalise large tier gaps
  const resumeTierWords = ['director','senior','manager','vp','chief','head of','coordinator','specialist'];
  const resumeTierGuess = resumeTierWords.find(w => resumeText.toLowerCase().includes(w)) || 'manager';
  const resumeTier = detectTier(resumeTierGuess);
  const jobTier    = detectTier(job.title);
  const tierDiff   = Math.abs(resumeTier - jobTier);
  const seniorityScore = tierDiff === 0 ? 10 : tierDiff === 1 ? 8 : tierDiff === 2 ? 5 : 2;

  return Math.min(100, titleScore + skillScore + industryScore + locationScore + seniorityScore);
}

// ── API Fetchers ─────────────────────────────────────────────────

interface NormalizedJob {
  source: string;
  external_id: string;
  title: string;
  company: string;
  location: string;
  remote: boolean;
  url: string;
  description: string;
  salary_min: number | null;
  salary_max: number | null;
  posted_at: string | null;
}

async function fetchJSearch(query: string, location: string, remoteOnly: boolean): Promise<NormalizedJob[]> {
  const apiKey = Deno.env.get('JSEARCH_API_KEY');
  if (!apiKey) {
    console.log('[discoverJobs] JSEARCH_API_KEY not set — skipping JSearch');
    return [];
  }

  const params = new URLSearchParams({
    query: query + (location ? ` in ${location}` : ''),
    page: '1',
    num_pages: '1',
    date_posted: 'week',
    ...(remoteOnly && { remote_jobs_only: 'true' }),
  });

  const resp = await fetch(`https://jsearch.p.rapidapi.com/search?${params}`, {
    headers: {
      'X-RapidAPI-Key': apiKey,
      'X-RapidAPI-Host': 'jsearch.p.rapidapi.com',
    },
  });

  if (!resp.ok) {
    console.error(`[discoverJobs] JSearch error ${resp.status}`);
    return [];
  }

  const data = await resp.json().catch(() => ({ data: [] }));
  return (data.data || []).map((j: any): NormalizedJob => ({
    source: 'jsearch',
    external_id: j.job_id || '',
    title: j.job_title || '',
    company: j.employer_name || '',
    location: [j.job_city, j.job_state, j.job_country].filter(Boolean).join(', '),
    remote: j.job_is_remote || false,
    url: j.job_apply_link || j.job_google_link || '',
    description: j.job_description || '',
    salary_min: j.job_min_salary || null,
    salary_max: j.job_max_salary || null,
    posted_at: j.job_posted_at_datetime_utc || null,
  }));
}

async function fetchAdzuna(query: string, location: string, remoteOnly: boolean): Promise<NormalizedJob[]> {
  const appId  = Deno.env.get('ADZUNA_APP_ID');
  const apiKey = Deno.env.get('ADZUNA_APP_KEY');
  if (!appId || !apiKey) {
    console.log('[discoverJobs] ADZUNA_APP_ID/ADZUNA_APP_KEY not set — skipping Adzuna');
    return [];
  }

  const params = new URLSearchParams({
    app_id: appId,
    app_key: apiKey,
    results_per_page: '20',
    what: query,
    ...(location && { where: location }),
    ...(remoteOnly && { title_only: 'remote' }),
    content_type: 'application/json',
  });

  const resp = await fetch(`https://api.adzuna.com/v1/api/jobs/us/search/1?${params}`, {
    headers: { Accept: 'application/json' },
  });

  if (!resp.ok) {
    console.error(`[discoverJobs] Adzuna error ${resp.status}`);
    return [];
  }

  const data = await resp.json().catch(() => ({ results: [] }));
  return (data.results || []).map((j: any): NormalizedJob => ({
    source: 'adzuna',
    external_id: j.id || '',
    title: j.title || '',
    company: j.company?.display_name || '',
    location: j.location?.display_name || '',
    remote: (j.title || '').toLowerCase().includes('remote'),
    url: j.redirect_url || '',
    description: j.description || '',
    salary_min: j.salary_min || null,
    salary_max: j.salary_max || null,
    posted_at: j.created || null,
  }));
}

async function fetchUSAJobs(query: string, location: string): Promise<NormalizedJob[]> {
  const email  = Deno.env.get('USAJOBS_EMAIL');
  const apiKey = Deno.env.get('USAJOBS_API_KEY');
  if (!email || !apiKey) {
    console.log('[discoverJobs] USAJOBS_EMAIL/USAJOBS_API_KEY not set — skipping USAJobs');
    return [];
  }

  const params = new URLSearchParams({
    Keyword: query,
    ResultsPerPage: '25',
    ...(location && { LocationName: location }),
  });

  const resp = await fetch(`https://data.usajobs.gov/api/search?${params}`, {
    headers: {
      'Authorization-Key': apiKey,
      'User-Agent': email,
      Host: 'data.usajobs.gov',
    },
  });

  if (!resp.ok) {
    console.error(`[discoverJobs] USAJobs error ${resp.status}`);
    return [];
  }

  const data = await resp.json().catch(() => ({ SearchResult: { SearchResultItems: [] } }));
  const items = data.SearchResult?.SearchResultItems || [];

  return items.map((item: any): NormalizedJob => {
    const j = item.MatchedObjectDescriptor || {};
    const pay = j.PositionRemuneration?.[0] || {};
    return {
      source: 'usajobs',
      external_id: j.PositionID || '',
      title: j.PositionTitle || '',
      company: j.OrganizationName || '',
      location: j.PositionLocationDisplay || '',
      remote: (j.PositionSchedule || []).some((s: any) => s.Name?.toLowerCase().includes('remote')),
      url: j.ApplyURI?.[0] || j.PositionURI || '',
      description: j.QualificationSummary || j.UserArea?.Details?.JobSummary || '',
      salary_min: pay.MinimumRange ? parseFloat(pay.MinimumRange) : null,
      salary_max: pay.MaximumRange ? parseFloat(pay.MaximumRange) : null,
      posted_at: j.PublicationStartDate || null,
    };
  });
}

// ── Main Handler ─────────────────────────────────────────────────

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user   = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const {
      user_id     = user.id,
      search_query = 'HR Manager',
      location    = '',
      remote_only = false,
    } = body;

    const JobListing = base44.asServiceRole.entities.JobListing;
    const Resume     = base44.asServiceRole.entities.Resume;

    // ── Rate limit: max 50 new listings per user per day ──
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todaysListings = await JobListing.filter({ user_id }).catch(() => []);
    const todayCount = todaysListings.filter((l: any) => new Date(l.created_at) >= today).length;

    if (todayCount >= 50) {
      return Response.json({
        error: 'Daily discovery limit reached (50 listings/day). Try again tomorrow.',
        discovered: 0, new_listings: 0, duplicates_skipped: 0, below_threshold: 0, high_match: 0,
      }, { status: 429 });
    }

    // ── Load user's master resume for scoring ──
    const resumes = await Resume.filter({ user_id }).catch(() => []);
    const masterResume = resumes.find((r: any) => r.is_master_resume) || resumes[0] || null;
    const resumeText   = masterResume?.parsed_content || masterResume?.optimized_content || '';

    // ── Existing dedup hashes for this user ──
    const existingHashes = new Set<string>(
      todaysListings.map((l: any) => l.dedup_hash).filter(Boolean)
    );

    // ── Query all 3 APIs in parallel, degrade gracefully ──
    console.log(`[discoverJobs] Querying APIs for "${search_query}" in "${location}"`);
    const [jsearchJobs, adzunaJobs, usajobsJobs] = await Promise.all([
      fetchJSearch(search_query, location, remote_only),
      fetchAdzuna(search_query, location, remote_only),
      fetchUSAJobs(search_query, location),
    ]);

    const allJobs: NormalizedJob[] = [...jsearchJobs, ...adzunaJobs, ...usajobsJobs];
    console.log(`[discoverJobs] Raw results — JSearch:${jsearchJobs.length} Adzuna:${adzunaJobs.length} USAJobs:${usajobsJobs.length}`);

    // ── Dedup, score, filter ──
    const remainingSlots  = 50 - todayCount;
    let duplicatesSkipped = 0;
    let belowThreshold    = 0;
    let newListings       = 0;
    let highMatch         = 0;
    const toCreate: any[] = [];
    const seenHashes      = new Set<string>(existingHashes);

    for (const job of allJobs) {
      if (!job.title || !job.company || !job.url) continue;

      const hash = await dedupHash(job.company, job.title, job.location);

      if (seenHashes.has(hash)) {
        duplicatesSkipped++;
        continue;
      }
      seenHashes.add(hash);

      const score = scoreMatch(job, resumeText, search_query);

      if (score < 60) {
        belowThreshold++;
        continue;
      }

      const status = score >= 80 ? 'pending_review' : 'discovered';
      if (score >= 80) highMatch++;

      toCreate.push({
        user_id,
        source:          job.source,
        external_id:     job.external_id,
        title:           job.title,
        company:         job.company,
        location:        job.location,
        remote:          job.remote,
        url:             job.url,
        jd_text:         job.description,
        salary_min:      job.salary_min,
        salary_max:      job.salary_max,
        posted_at:       job.posted_at,
        match_score:     score,
        match_breakdown: {
          title_alignment: Math.round((score / 100) * 30),
          skills_overlap:  Math.round((score / 100) * 35),
          industry_match:  Math.round((score / 100) * 15),
          location_fit:    Math.round((score / 100) * 10),
          seniority_match: Math.round((score / 100) * 10),
        },
        ghost_score:  0,
        simon_summary: '',
        status,
        dedup_hash:   hash,
        created_at:   new Date().toISOString(),
      });

      if (toCreate.length >= remainingSlots) break;
    }

    // ── Bulk create ──
    if (toCreate.length > 0) {
      const BATCH = 50;
      for (let i = 0; i < toCreate.length; i += BATCH) {
        try {
          await JobListing.bulkCreate(toCreate.slice(i, i + BATCH));
          newListings += Math.min(BATCH, toCreate.length - i);
        } catch (e) {
          // fallback: individual creates
          for (const record of toCreate.slice(i, i + BATCH)) {
            try {
              await JobListing.create(record);
              newListings++;
            } catch (_) {
              console.error('[discoverJobs] Failed to create listing:', record.title);
            }
          }
        }
      }
    }

    console.log(`[discoverJobs] Done — new:${newListings} dupes:${duplicatesSkipped} low:${belowThreshold} high:${highMatch}`);

    return Response.json({
      success:           true,
      discovered:        allJobs.length,
      new_listings:      newListings,
      duplicates_skipped: duplicatesSkipped,
      below_threshold:   belowThreshold,
      high_match:        highMatch,
      sources: {
        jsearch:  jsearchJobs.length,
        adzuna:   adzunaJobs.length,
        usajobs:  usajobsJobs.length,
      },
    });

  } catch (error) {
    console.error('[discoverJobs] Unhandled error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});