import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * getONetProfile — Looks up an O*NET occupation profile by SOC code or role title.
 *
 * Strategy:
 *   1. Check local ONetProfile entity (pre-aggregated, fast)
 *   2. Fuzzy-match against local ONetOccupation titles
 *   3. Fall back to live O*NET Web Services API (search + detail fetch)
 *
 * Returns { profile, source } or { profile: null, source: "not_found" }
 *
 * Payload: { soc_code?: string, role_title?: string }
 */

const ONET_BASE = 'https://api-v2.onetcenter.org';

async function fetchONetAPI(apiKey, path, params = {}) {
  const url = new URL(`${ONET_BASE}${path}`);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
  }
  const res = await fetch(url.toString(), {
    headers: { 'X-API-Key': apiKey, 'Accept': 'application/json' }
  });
  if (!res.ok) return null;
  return res.json();
}

/**
 * Build a profile-shaped object from live API occupation detail + summaries
 */
async function buildProfileFromAPI(apiKey, socCode) {
  const [occ, skills, knowledge, abilities, activities, tasks, interests, tech] = await Promise.all([
    fetchONetAPI(apiKey, `/online/occupations/${socCode}`),
    fetchONetAPI(apiKey, `/online/occupations/${socCode}/summary/skills`),
    fetchONetAPI(apiKey, `/online/occupations/${socCode}/summary/knowledge`),
    fetchONetAPI(apiKey, `/online/occupations/${socCode}/summary/abilities`),
    fetchONetAPI(apiKey, `/online/occupations/${socCode}/summary/work_activities`),
    fetchONetAPI(apiKey, `/online/occupations/${socCode}/summary/tasks`),
    fetchONetAPI(apiKey, `/online/occupations/${socCode}/summary/interests`),
    fetchONetAPI(apiKey, `/online/occupations/${socCode}/summary/technology_skills`),
  ]);

  if (!occ) return null;

  const extractNames = (res, key = 'element') => {
    const arr = res?.[key];
    if (!Array.isArray(arr)) return [];
    return arr.map(e => e.name || e.title || '').filter(Boolean);
  };

  const extractTaskNames = (res) => {
    const arr = res?.task;
    if (!Array.isArray(arr)) return [];
    return arr.map(t => t.statement || t.name || '').filter(Boolean);
  };

  // Parse interests for RIASEC and work values
  const interestElements = interests?.element || [];
  const riasec = interestElements
    .filter(e => e.id && /^1\.B\.1\./.test(e.id))
    .sort((a, b) => (b.score?.value || 0) - (a.score?.value || 0))
    .slice(0, 3)
    .map(e => e.name)
    .filter(Boolean);

  const workValues = interestElements
    .filter(e => e.id && /^1\.B\.2\./.test(e.id))
    .sort((a, b) => (b.score?.value || 0) - (a.score?.value || 0))
    .slice(0, 3)
    .map(e => e.name)
    .filter(Boolean);

  return {
    onet_soc_code: socCode,
    title: occ.title || '',
    description: occ.description || '',
    job_zone: occ.job_zone || null,
    education_level: occ.education?.category || null,
    skills: extractNames(skills),
    knowledge: extractNames(knowledge),
    abilities: extractNames(abilities),
    work_activities: extractNames(activities),
    tasks: extractTaskNames(tasks),
    work_values: workValues,
    riasec_profile: riasec,
    work_styles: [],
    emerging_tasks: [],
    tech: extractNames(tech, 'category') .length
      ? extractNames(tech, 'category')
      : (tech?.category || []).flatMap(c => (c.example || []).map(e => e.name || '')).filter(Boolean),
    related_socs: [],
    alternate_titles: occ.alternate_titles || [],
  };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { soc_code, role_title } = await req.json();

    if (!soc_code && !role_title) {
      return Response.json({ error: 'soc_code or role_title required' }, { status: 400 });
    }

    const apiKey = Deno.env.get("ONET_API_KEY");

    // ── Strategy 1: Direct SOC code lookup in local DB ──
    if (soc_code) {
      try {
        const results = await base44.asServiceRole.entities.ONetProfile.filter(
          { onet_soc_code: soc_code }, '-created_date', 1
        );
        if (results && results.length > 0) {
          return Response.json({ profile: results[0], source: 'local_soc' });
        }
      } catch (_) { /* continue */ }

      // Fallback: fetch from live API by SOC code
      if (apiKey) {
        const profile = await buildProfileFromAPI(apiKey, soc_code);
        if (profile) {
          return Response.json({ profile, source: 'api_soc' });
        }
      }
    }

    // ── Strategy 2: Title match ──
    if (role_title) {
      const normalizedTitle = role_title.trim();

      // 2a. Check local ONetProfile by exact title
      try {
        const titleResults = await base44.asServiceRole.entities.ONetProfile.filter(
          { title: normalizedTitle }, '-created_date', 1
        );
        if (titleResults && titleResults.length > 0) {
          return Response.json({ profile: titleResults[0], source: 'local_title' });
        }
      } catch (_) { /* continue */ }

      // 2b. Fuzzy-match against local ONetOccupation titles to get SOC code
      try {
        const occupations = await base44.asServiceRole.entities.ONetOccupation.list('title', 200);
        const titleLower = normalizedTitle.toLowerCase();
        const titleWords = titleLower.split(/\s+/).filter(w => w.length > 2);

        let bestMatch = null;
        let bestScore = 0;

        for (const occ of occupations) {
          const occTitle = (occ.title || '').toLowerCase();
          let score = 0;
          if (occTitle.includes(titleLower) || titleLower.includes(occTitle)) score += 10;
          for (const word of titleWords) {
            if (occTitle.includes(word)) score += 2;
          }
          if (score > bestScore) {
            bestScore = score;
            bestMatch = occ;
          }
        }

        if (bestMatch && bestScore >= 4) {
          const matchedCode = bestMatch.code || bestMatch.onet_soc_code;
          if (matchedCode) {
            // Check local ONetProfile with this code
            try {
              const profileResults = await base44.asServiceRole.entities.ONetProfile.filter(
                { onet_soc_code: matchedCode }, '-created_date', 1
              );
              if (profileResults && profileResults.length > 0) {
                return Response.json({
                  profile: profileResults[0],
                  source: 'local_fuzzy',
                  matched_occupation: bestMatch.title,
                  match_score: bestScore
                });
              }
            } catch (_) { /* continue */ }

            // Fallback: fetch from live API with matched SOC code
            if (apiKey) {
              const profile = await buildProfileFromAPI(apiKey, matchedCode);
              if (profile) {
                return Response.json({
                  profile,
                  source: 'api_fuzzy',
                  matched_occupation: bestMatch.title,
                  match_score: bestScore
                });
              }
            }
          }
        }
      } catch (_) { /* continue */ }

      // 2c. Search live O*NET API by keyword as final fallback
      if (apiKey) {
        const searchResult = await fetchONetAPI(apiKey, '/online/search', { keyword: normalizedTitle });
        const occupations = searchResult?.occupation;
        if (Array.isArray(occupations) && occupations.length > 0) {
          const topMatch = occupations[0];
          const profile = await buildProfileFromAPI(apiKey, topMatch.code);
          if (profile) {
            return Response.json({
              profile,
              source: 'api_search',
              matched_occupation: topMatch.title,
              search_keyword: normalizedTitle
            });
          }
        }
      }
    }

    // No match found
    return Response.json({ profile: null, source: 'not_found' });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});