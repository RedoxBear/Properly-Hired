
function nrm(s) { return String(s || "").trim().toLowerCase().replace(/\s+/g, " "); }
function rel(s, terms) {
  const w = String(s || "").toLowerCase();
  return Object.keys(terms || {}).reduce((sum, t) => sum + (w.includes(t) ? terms[t] : 0), 0);
}

function capsForMode(mode) {
  if (mode === "ats_one_page") {
    return { summaryLines: 3, competencies: 6, highlights: 5, maxRoles: 4, maxBulletsPerRole: 3, education: 3 };
  }
  if (mode === "two_page") {
    return { summaryLines: 4, competencies: 8, highlights: 6, maxRoles: 8, maxBulletsPerRole: 5, education: 5 };
  }
  // full_cv
  return { summaryLines: 5, competencies: 8, highlights: 8, maxRoles: Infinity, maxBulletsPerRole: 8, education: Infinity };
}

function deriveCompetencies(tailored, caps) {
  // Prefer JD-aligned competencies
  const comp = Array.isArray(tailored?.competencies) ? tailored.competencies.filter(Boolean) : [];
  if (comp.length) return comp.slice(0, Math.min(8, caps.competencies || 8));

  // Fallback 1: use provided skills list (top capped)
  const skills = Array.isArray(tailored?.skills) ? tailored.skills.filter(Boolean) : [];
  if (skills.length) return skills.slice(0, Math.min(8, caps.competencies || 8));

  // Fallback 2: extract common tokens from role bullets/headings
  const terms = tailored?.__jd?.jdTerms || {};
  const freq = {};
  const push = (s) => {
    String(s || "")
      .toLowerCase()
      .replace(/[^a-z0-9+.#\s-]/g, " ")
      .split(/\s+/)
      .filter((w) => w && w.length > 2)
      .forEach((w) => (freq[w] = (freq[w] || 0) + (terms[w] ? 2 : 1)));
  };
  (tailored?.roles || []).forEach((r) => {
    push([r.title, r.company].filter(Boolean).join(" "));
    (r.bullets || []).forEach(push);
  });
  const top = Object.entries(freq).sort((a, b) => b[1] - a[1]).map(([w]) => w);
  return top.slice(0, Math.min(8, caps.competencies || 8));
}

function deriveHighlights(tailored, caps) {
  // Prefer JD-aligned highlights
  const hi = Array.isArray(tailored?.highlights) ? tailored.highlights.filter(Boolean) : [];
  if (hi.length) return hi.slice(0, caps.highlights || 6);

  // Fallback: choose top bullet lines across roles by JD relevance
  const terms = tailored?.__jd?.jdTerms || {};
  const lines = (tailored?.roles || []).flatMap((r) => (r.bullets || []).map((b) => ({ b, s: rel(b, terms) })));
  const sorted = lines.sort((a, b) => b.s - a.s).map((x) => x.b);
  // If still empty, extract any non-empty lines from roles/headings
  const fallback = sorted.length ? sorted : (tailored?.roles || [])
    .flatMap((r) => (r.bullets && r.bullets.length ? r.bullets : [ [r.title, r.company].filter(Boolean).join(" — ") ]));
  // De-dup similar lines
  const used = new Set();
  const out = [];
  for (const l of fallback) {
    const k = nrm(l);
    if (!k || used.has(k)) continue;
    used.add(k);
    out.push(l);
    if (out.length >= (caps.highlights || 6)) break;
  }
  return out;
}

export function composeResume(tailored, opts = {}) {
  const mode = opts.mode || "two_page";
  const caps = capsForMode(mode);
  const used = new Set(tailored?.__jd?.usedBullets || []);
  const terms = tailored?.__jd?.jdTerms || {};

  const dedupe = (arr) =>
    (arr || []).filter((line) => {
      const k = nrm(line);
      if (!k || used.has(k)) return false;
      used.add(k);
      return true;
    });

  // 1) Career Summary (JD-framed)
  const summary = (tailored.summary || []).slice(0, caps.summaryLines);

  // 2) Core Competencies (≤8)
  const competencies = deriveCompetencies(tailored, caps);
  const skills = competencies.slice(0, Math.min(8, caps.competencies)); // mapped to cv.skills for preview

  // 3) Career Highlights & Achievements
  const highlightsRaw = deriveHighlights(tailored, caps);
  const highlights = dedupe(highlightsRaw).slice(0, caps.highlights);
  const extra = highlights.length ? [{ heading: "Career Highlights & Achievements", lines: highlights }] : undefined;

  // 4) Chronological Work History (skip repeated bullets and prefer JD relevance)
  const experience = (tailored.roles || [])
    .slice(0, caps.maxRoles)
    .map((r) => {
      const heading = [r.title, r.company].filter(Boolean).join(" — ");
      const meta = [r.location, [r.start, r.end].filter(Boolean).join(" – ")].filter(Boolean).join(" • ");
      const sortedLines = (r.bullets || []).slice().sort((a, b) => rel(b, terms) - rel(a, terms));
      const lines = dedupe(sortedLines).slice(0, caps.maxBulletsPerRole);
      const block = { heading: heading || meta, lines };
      return block;
    })
    .filter((block) => (block.lines && block.lines.length) || block.heading);

  return {
    header: [tailored.name, tailored.contact].filter(Boolean),
    summary,
    skills,       // "Core Competencies" in preview
    extra,        // "Career Highlights & Achievements"
    experience,
    education: (tailored.education || []).slice(0, caps.education)
  };
}
