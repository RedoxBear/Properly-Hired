import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * getONetProfile — JavaScript replacement for the Python _get_onet_profile helper.
 * Looks up a pre-aggregated ONetProfile by SOC code or role title.
 * Returns the full profile or {} if not found.
 *
 * Payload:
 *   { soc_code?: string, role_title?: string }
 */

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

    // Strategy 1: Direct SOC code lookup
    if (soc_code) {
      const results = await base44.asServiceRole.entities.ONetProfile.filter(
        { onet_soc_code: soc_code }, '-created_date', 1
      );
      if (results && results.length > 0) {
        return Response.json({ profile: results[0], source: 'soc_code' });
      }
    }

    // Strategy 2: Title search — try exact title match first
    if (role_title) {
      const normalizedTitle = role_title.trim();

      // Try exact title match
      const titleResults = await base44.asServiceRole.entities.ONetProfile.filter(
        { title: normalizedTitle }, '-created_date', 1
      );
      if (titleResults && titleResults.length > 0) {
        return Response.json({ profile: titleResults[0], source: 'title_exact' });
      }

      // Strategy 3: Search ONetOccupation for SOC code by title keywords,
      // then look up ONetProfile by that SOC code
      const occupations = await base44.asServiceRole.entities.ONetOccupation.list('title', 200);
      const titleLower = normalizedTitle.toLowerCase();
      const titleWords = titleLower.split(/\s+/).filter(w => w.length > 2);

      // Score each occupation by keyword overlap
      let bestMatch = null;
      let bestScore = 0;

      for (const occ of occupations) {
        const occTitle = (occ.title || '').toLowerCase();
        let score = 0;

        // Exact substring match is strongest
        if (occTitle.includes(titleLower) || titleLower.includes(occTitle)) {
          score += 10;
        }

        // Word overlap scoring
        for (const word of titleWords) {
          if (occTitle.includes(word)) score += 2;
        }

        if (score > bestScore) {
          bestScore = score;
          bestMatch = occ;
        }
      }

      if (bestMatch && bestScore >= 4) {
        const socCode = bestMatch.code || bestMatch.onet_soc_code;
        if (socCode) {
          const profileResults = await base44.asServiceRole.entities.ONetProfile.filter(
            { onet_soc_code: socCode }, '-created_date', 1
          );
          if (profileResults && profileResults.length > 0) {
            return Response.json({
              profile: profileResults[0],
              source: 'title_fuzzy',
              matched_occupation: bestMatch.title,
              match_score: bestScore
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