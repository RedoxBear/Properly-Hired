import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * getONetProfile — Builds an occupation profile from internal O*NET DB first,
 * falls back to live API only if internal DB has no match.
 *
 * Strategy:
 *   1. Resolve SOC code: direct lookup or fuzzy title match in ONetOccupation
 *   2. Aggregate profile from internal granular tables (Skills, Abilities, Knowledge, Tasks, etc.)
 *   3. Fall back to live O*NET API ONLY if no internal occupation match found
 *
 * Payload: { soc_code?: string, role_title?: string }
 */

const ONET_BASE = 'https://api-v2.onetcenter.org';

// ── Helpers for internal DB aggregation ──

/**
 * Merge duplicate rows (importance row + level row) into one per name,
 * keeping the max importance score. Return sorted by importance desc.
 */
function dedupeByName(rows, nameField) {
  const map = {};
  for (const r of rows) {
    const name = r[nameField];
    if (!name) continue;
    if (!map[name]) {
      map[name] = { name, importance: 0, level: 0 };
    }
    map[name].importance = Math.max(map[name].importance, r.importance || 0);
    map[name].level = Math.max(map[name].level, r.level || 0);
  }
  return Object.values(map).sort((a, b) => b.importance - a.importance);
}

/**
 * Merge task rows (importance + frequency are separate rows per task),
 * dedup by task_name, keep max importance.
 */
function dedupeTasks(rows) {
  const map = {};
  for (const r of rows) {
    const name = r.task_name;
    if (!name) continue;
    if (!map[name]) {
      map[name] = { name, importance: 0, frequency: 0 };
    }
    map[name].importance = Math.max(map[name].importance, r.importance || 0);
    map[name].frequency = Math.max(map[name].frequency, r.frequency || 0);
  }
  return Object.values(map).sort((a, b) => b.importance - a.importance);
}

/**
 * Parse RIASEC and Work Values from ONetReference records.
 * Interests are stored with notes='Interests' and reference_key like 'Interests::SOC'
 * Work Values are stored with notes='Work_Values' and reference_key like 'Work_Values::SOC'
 */
function parseInterests(refs) {
  const riasecMap = {
    '1.B.1.a': 'Realistic',
    '1.B.1.b': 'Investigative',
    '1.B.1.c': 'Artistic',
    '1.B.1.d': 'Social',
    '1.B.1.e': 'Enterprising',
    '1.B.1.f': 'Conventional'
  };
  const entries = [];
  for (const r of refs) {
    const meta = r.metadata || {};
    const elementId = meta['Element ID'] || '';
    const value = parseFloat(meta['Data Value']) || 0;
    if (riasecMap[elementId]) {
      entries.push({ name: riasecMap[elementId], value });
    }
  }
  return entries.sort((a, b) => b.value - a.value).slice(0, 3).map(e => e.name);
}

function parseWorkValues(refs) {
  const wvMap = {
    '1.B.2.a': 'Achievement',
    '1.B.2.b': 'Working Conditions',
    '1.B.2.c': 'Recognition',
    '1.B.2.d': 'Relationships',
    '1.B.2.e': 'Support',
    '1.B.2.f': 'Independence'
  };
  const entries = [];
  for (const r of refs) {
    const meta = r.metadata || {};
    const elementId = meta['Element ID'] || '';
    const scaleName = meta['Scale Name'] || '';
    const value = parseFloat(meta['Data Value']) || 0;
    if (wvMap[elementId] && scaleName === 'Extent') {
      entries.push({ name: wvMap[elementId], value });
    }
  }
  return entries.sort((a, b) => b.value - a.value).slice(0, 3).map(e => e.name);
}

function parseTechSkills(refs) {
  const categories = new Set();
  for (const r of refs) {
    const meta = r.metadata || {};
    const commodityTitle = meta['Commodity Title'] || '';
    if (commodityTitle) categories.add(commodityTitle);
  }
  return [...categories].slice(0, 15);
}

// ── Live API fallback ──

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
  const interestElements = interests?.element || [];
  const riasec = interestElements
    .filter(e => e.id && /^1\.B\.1\./.test(e.id))
    .sort((a, b) => (b.score?.value || 0) - (a.score?.value || 0))
    .slice(0, 3).map(e => e.name).filter(Boolean);
  const workValues = interestElements
    .filter(e => e.id && /^1\.B\.2\./.test(e.id))
    .sort((a, b) => (b.score?.value || 0) - (a.score?.value || 0))
    .slice(0, 3).map(e => e.name).filter(Boolean);

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
    tech: extractNames(tech, 'category').length
      ? extractNames(tech, 'category')
      : (tech?.category || []).flatMap(c => (c.example || []).map(e => e.name || '')).filter(Boolean),
    related_socs: [],
    alternate_titles: occ.alternate_titles || [],
  };
}

// ── Main handler ──

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
    const db = base44.asServiceRole.entities;

    // ── Step 1: Resolve SOC code from internal ONetOccupation ──
    let resolvedCode = soc_code || null;
    let resolvedTitle = '';
    let matchSource = '';

    if (resolvedCode) {
      // Direct SOC code lookup
      const occResults = await db.ONetOccupation.filter({ code: resolvedCode }, '-created_date', 1);
      if (occResults?.length > 0) {
        resolvedTitle = occResults[0].title || '';
        matchSource = 'local_soc';
      }
    }

    if (!resolvedCode && role_title) {
      const normalizedTitle = role_title.trim();

      // Try exact title match first
      const occupations = await db.ONetOccupation.list('title', 1000);

      const titleLower = normalizedTitle.toLowerCase();
      const titleWords = titleLower.split(/\s+/).filter(w => w.length > 2);

      // Score all occupations
      let bestMatch = null;
      let bestScore = 0;

      for (const occ of occupations) {
        const occTitle = (occ.title || '').toLowerCase();
        let score = 0;

        // Exact match
        if (occTitle === titleLower) { score += 100; }
        // Contains match
        else if (occTitle.includes(titleLower) || titleLower.includes(occTitle)) { score += 15; }
        // Word overlap
        for (const word of titleWords) {
          if (occTitle.includes(word)) score += 3;
        }

        if (score > bestScore) {
          bestScore = score;
          bestMatch = occ;
        }
      }

      if (bestMatch && bestScore >= 4) {
        resolvedCode = bestMatch.code;
        resolvedTitle = bestMatch.title;
        matchSource = bestScore >= 100 ? 'local_exact' : 'local_fuzzy';
      }
    }

    // ── Step 2: Build profile from internal granular tables ──
    if (resolvedCode) {
      // Fetch all granular data in parallel
      const [skillRows, abilityRows, knowledgeRows, taskRows, activityRows, contextRows, interestRefs, workValueRefs, techRefs] = await Promise.all([
        db.ONetSkill.filter({ occupation_code: resolvedCode }, '-importance', 200).catch(() => []),
        db.ONetAbility.filter({ occupation_code: resolvedCode }, '-importance', 200).catch(() => []),
        db.ONetKnowledge.filter({ occupation_code: resolvedCode }, '-importance', 200).catch(() => []),
        db.ONetTask.filter({ occupation_code: resolvedCode }, '-importance', 200).catch(() => []),
        db.ONetWorkActivity.filter({ occupation_code: resolvedCode }, '-importance', 200).catch(() => []),
        db.ONetWorkContext.filter({ occupation_code: resolvedCode }, '-value', 200).catch(() => []),
        db.ONetReference.filter({ reference_key: `Interests::${resolvedCode}` }, '-created_date', 50).catch(() => []),
        db.ONetReference.filter({ reference_key: `Work_Values::${resolvedCode}` }, '-created_date', 50).catch(() => []),
        db.ONetReference.filter({ reference_key: `Technology_Skills::${resolvedCode}` }, '-created_date', 200).catch(() => []),
      ]);

      // Check if we have meaningful data (at least skills or tasks)
      const hasData = skillRows.length > 0 || taskRows.length > 0 || abilityRows.length > 0;

      if (hasData) {
        const skills = dedupeByName(skillRows, 'skill_name');
        const abilities = dedupeByName(abilityRows, 'ability_name');
        const knowledge = dedupeByName(knowledgeRows, 'knowledge_name');
        const tasks = dedupeTasks(taskRows);
        const activities = dedupeByName(activityRows, 'activity_name');
        const riasec = parseInterests(interestRefs);
        const workValues = parseWorkValues(workValueRefs);
        const tech = parseTechSkills(techRefs);

        // Get occupation-level data (job_zone etc.)
        const occResults = await db.ONetOccupation.filter({ code: resolvedCode }, '-created_date', 1).catch(() => []);
        const occ = occResults?.[0] || {};

        const profile = {
          onet_soc_code: resolvedCode,
          title: resolvedTitle || occ.title || '',
          description: occ.description || '',
          job_zone: occ.job_zone || null,
          education_level: null, // Not in local DB occupation table
          skills: skills.filter(s => s.importance > 1.5).map(s => s.name).slice(0, 20),
          knowledge: knowledge.filter(k => k.importance > 1.5).map(k => k.name).slice(0, 15),
          abilities: abilities.filter(a => a.importance > 1.5).map(a => a.name).slice(0, 15),
          work_activities: activities.filter(a => a.importance > 2.0).map(a => a.name).slice(0, 15),
          tasks: tasks.filter(t => t.importance > 2.0).map(t => t.name).slice(0, 15),
          work_values: workValues,
          riasec_profile: riasec,
          work_styles: [],
          emerging_tasks: [],
          tech,
          related_socs: [],
          alternate_titles: [],
        };

        return Response.json({
          profile,
          source: matchSource,
          matched_occupation: resolvedTitle,
          data_tables_used: {
            skills: skillRows.length,
            abilities: abilityRows.length,
            knowledge: knowledgeRows.length,
            tasks: taskRows.length,
            activities: activityRows.length,
            context: contextRows.length,
            interests: interestRefs.length,
            work_values: workValueRefs.length,
            tech: techRefs.length,
          }
        });
      }
    }

    // ── Step 3: Fall back to live API ONLY if no internal data ──
    if (apiKey) {
      // If we have a resolved code but no granular data, try API with that code
      if (resolvedCode) {
        const profile = await buildProfileFromAPI(apiKey, resolvedCode);
        if (profile) {
          return Response.json({
            profile,
            source: 'api_fallback_no_data',
            matched_occupation: resolvedTitle || profile.title,
            reason: 'Internal DB had occupation match but no granular data'
          });
        }
      }

      // Search API by title as last resort
      if (role_title) {
        const searchResult = await fetchONetAPI(apiKey, '/online/search', { keyword: role_title.trim() });
        const occupations = searchResult?.occupation;
        if (Array.isArray(occupations) && occupations.length > 0) {
          const topMatch = occupations[0];
          const profile = await buildProfileFromAPI(apiKey, topMatch.code);
          if (profile) {
            return Response.json({
              profile,
              source: 'api_search_fallback',
              matched_occupation: topMatch.title,
              search_keyword: role_title,
              reason: 'No internal DB occupation match found'
            });
          }
        }
      }
    }

    return Response.json({ profile: null, source: 'not_found' });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});