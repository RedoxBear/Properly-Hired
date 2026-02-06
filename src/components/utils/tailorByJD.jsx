
/* JD-aware tailoring: summary, highlights, competencies, and used-bullets tagging for de-dup in work history. */

const STOP = new Set(["and","the","to","for","with","on","of","in","a","an","as","at","by","from","or","not","into","over","via","our"]);

function tokenize(s) {
  return (s || "")
    .toLowerCase()
    .replace(/[^a-z0-9+/#&.\s-]/g, " ")
    .split(/\s+/)
    .filter((t) => t && !STOP.has(t));
}

function score(text, jdTokens) {
  const t = tokenize(text);
  if (!t.length) return 0;
  let hits = 0;
  const set = new Set(t);
  for (const j of jdTokens) if (set.has(j)) hits++;
  const metric = /\b(\d+%|\$\d+|[0-9]+ (days|hours|users|customers|projects))\b/i.test(text) ? 0.15 : 0;
  return hits / (Math.sqrt(t.length) + 1) + metric;
}

function extractTerms(txt, k = 60) {
  const counts = (txt || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s+.#-]/g, " ")
    .split(/\s+/)
    .filter(w => w && w.length > 2)
    .slice(0, 200)
    .reduce((m, w) => ((m[w] = (m[w] || 0) + 1), m), {});
  // keep top-k by freq
  return Object.fromEntries(
    Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, k)
  );
}

function relevance(s, terms) {
  const w = String(s || "").toLowerCase();
  return Object.keys(terms || {}).reduce((sum, t) => sum + (w.includes(t) ? terms[t] : 0), 0);
}

function uniq() {
  const seen = new Set();
  return (v) => {
    const k = nrm(v);
    if (!k || seen.has(k)) return false;
    seen.add(k);
    return true;
  };
}

function nrm(s) {
  return String(s || "").trim().toLowerCase().replace(/\s+/g, " ");
}

function parseYear(s) {
  const m = String(s || "").match(/(19|20)\d{2}/);
  return m ? Number(m[0]) : null;
}

function selectCompetencies(skills, terms, cap) {
  const scored = (skills || []).map((x) => ({
    label: String(x),
    score: relevance(String(x), terms),
  }));
  const primary = scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((s) => s.label);
  const rest = scored.filter((s) => s.score === 0).map((s) => s.label);
  return [...primary, ...rest].filter(uniq()).slice(0, cap);
}

function mostRelevantTitle(roles, terms) {
  const scored = (roles || []).map((r) => ({
    t: r.title || "",
    s: relevance(r.title || "", terms) + relevance(r.company || "", terms),
  }));
  return scored.sort((a, b) => b.s - a.s)[0]?.t || (roles?.[0]?.title || "");
}

function topDomains(master, k) {
  const cos = (master.roles || []).map((r) => r.company).filter(Boolean);
  return [...new Set(cos)].slice(0, k).join(", ");
}

function topAchievements(roles, terms, k) {
  const arr = (roles || []).flatMap((r) =>
    (r.bullets || []).map((b) => ({ b, s: relevance(b, terms) }))
  );
  return arr
    .sort((a, b) => b.s - a.s)
    .map((x) => x.b)
    .filter(uniq())
    .slice(0, k);
}

function lineIf(prefix, body, suffix) {
  const val = Array.isArray(body) ? body.join("") : body;
  const t = String(val || "").trim();
  if (!t) return "";
  return `${prefix}${t}${suffix}`;
}

function buildCareerSummary(master, terms) {
  const title = mostRelevantTitle(master.roles || [], terms) || "Experienced Professional";
  const l1 = `${title} aligning people systems with mission-driven outcomes.`;
  const l2 = lineIf("Proven impact in ", topDomains(master, 3), ".");
  const l3 = lineIf("Strengths: ", selectCompetencies(master.skills || [], terms, 4).join(" • "), "");
  const l4 = lineIf("Noted for ", topAchievements(master.roles || [], terms, 1).join("; "), ".");
  return [l1, l3, l2, l4].filter(Boolean); // Reordered for better flow
}

export function tailorByJD(master, jdText = "") {
  const jdTokens = tokenize(jdText); // For roles/skills scoring (original)
  const jdTerms = extractTerms(String(jdText || ""), 60); // For new summary/highlights/competencies

  // 1. Process and score roles (similar to original logic)
  const roles = (master.roles || []).map((r) => {
    const bullets = Array.isArray(r.bullets) ? r.bullets : [];
    // Use original 'score' function with 'jdTokens' for bullet sorting within roles
    const bulletScores = bullets.map((b) => ({ b, s: score(b, jdTokens) }));
    const sortedBullets = bulletScores.sort((a, b) => b.s - a.s).map((x) => x.b);
    const head = [r.title, r.company, r.location].filter(Boolean).join(" ");
    // Use original 'score' function with 'jdTokens' for role score
    const roleScore = score(head, jdTokens) + bulletScores.slice(0, 3).reduce((sum, x) => sum + x.s, 0);
    return { ...r, bullets: sortedBullets, __score: roleScore };
  });

  // Sort roles (similar to original logic)
  const sortedRoles = roles
    .slice()
    .sort((a, b) => (b.__score || 0) - (a.__score || 0))
    .map(({ __score, ...rest }) => rest); // Remove __score from final output roles

  // Sort skills (similar to original logic)
  const sortedSkills = (master.skills || [])
    .slice()
    .sort((a, b) => score(b, jdTokens) - score(a, jdTokens));

  // Now, calculate the new JD-framed components using jdTerms
  // Use the original master.roles and master.skills for these calculations
  // to avoid issues with already sorted bullets or added __score property.

  // 1) JD-framed Career Summary (3–5 lines)
  const summary = buildCareerSummary(master, jdTerms);

  // 2) Highlights & Achievements (recent + >10yrs)
  const nowYear = new Date().getFullYear();
  const originalRoles = Array.isArray(master.roles) ? master.roles : [];
  const parsedRolesForHighlights = originalRoles.map((r) => ({
    ...r,
    startYear: parseYear(r.start),
    endYear: parseYear(r.end) || nowYear,
  }));

  const older = parsedRolesForHighlights.filter((r) => nowYear - (r.endYear || nowYear) >= 10);
  const recent = parsedRolesForHighlights.filter((r) => nowYear - (r.endYear || nowYear) < 10);

  const pickTopBullets = (rs, max = 6) =>
    rs
      .flatMap((r) =>
        (r.bullets || []).map((b) => ({ role: r, bullet: b, score: relevance(b, jdTerms) }))
      )
      .sort((a, b) => b.score - a.score)
      .map((x) => x.bullet)
      .filter(uniq())
      .slice(0, max);

  const highlights = [...pickTopBullets(recent, 5), ...pickTopBullets(older, 3)].filter(uniq());

  // 3) Core Competencies (<=8, JD-aligned)
  const competencies = selectCompetencies(master.skills || [], jdTerms, 8);

  // 4) Mark used bullets and summary lines to avoid repetition in Work History
  const usedBullets = new Set(highlights.map(nrm));
  summary.forEach((line) => usedBullets.add(nrm(line)));

  return {
    ...master,
    __jd: { jdTerms, usedBullets },
    summary, // array of lines
    competencies, // array of strings (<=8)
    highlights, // array of strings (recent + >10yrs)
    roles: sortedRoles, // Use the newly sorted roles
    skills: sortedSkills, // Use the newly sorted skills
  };
}
