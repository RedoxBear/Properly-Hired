const STOP = new Set(["and","the","to","for","with","on","of","in","a","an","as","at","by","from","or","into","our","we"]);
const HARD_SKILL_HINTS = ["sql","python","excel","javascript","hris","sap","workday","salesforce","powerbi","tableau","kubernetes","aws","gcp","azure"];
const SOFT_SKILL_HINTS = ["leadership","communication","stakeholder","cross-functional","collaboration","ownership","analytical","problem-solving","mentorship","strategic"];

const tokenize = (s) =>
  (s || "").toLowerCase().replace(/[^a-z0-9+/#&.\s-]/g, " ")
  .split(/\s+/).filter((t) => t && !STOP.has(t));

export function extractATSKeywords(jdText, resumeText, max = 30) {
  const jd = tokenize(jdText);
  const cv = new Set(tokenize(resumeText));
  const freq = {};
  for (const t of jd) freq[t] = (freq[t] || 0) + 1;
  for (const k of [...HARD_SKILL_HINTS, ...SOFT_SKILL_HINTS]) if (freq[k]) freq[k] += 2;
  const present = Object.entries(freq).filter(([t]) => cv.has(t)).sort((a, b) => b[1] - a[1]).map(([t]) => t);
  const missing = Object.entries(freq).filter(([t]) => !cv.has(t)).sort((a, b) => b[1] - a[1]).map(([t]) => t);
  return [...present.slice(0, Math.ceil(max * 0.6)), ...missing.slice(0, Math.floor(max * 0.4))];
}

export function diffRoleVsCV(jdText, resumeText) {
  const jdLines = (jdText || "").split(/\n+/).filter(Boolean);
  const musts = jdLines.filter(l => /responsibilit|require|you will|you’ll|what you'll/i.test(l) || /•|- /.test(l));
  const cvTokens = new Set(tokenize(resumeText));
  const lacks = musts.filter(line => tokenize(line).some(t => !cvTokens.has(t)));
  const overlaps = musts.filter(line => tokenize(line).every(t => cvTokens.has(t)));
  return { lacks, overlaps };
}

export function idealCandidateFromJD(jdText) {
  const lines = (jdText || "").split(/\n+/).map(l => l.trim()).filter(Boolean);
  
  // Find sections that describe ideal candidate / qualifications / requirements
  const sectionHeaders = /^(\*{0,2})(ideal candidate|we're looking for|you have|qualifications|requirements|what you.ll bring|who you are|minimum qualifications|preferred qualifications|what we.re looking for|about you|your background)/i;
  const bulletOrContent = /^[-•*]\s+.{8,}|^\d+[.)]\s+.{8,}|^[A-Z].{15,}/;
  const isSectionHeader = (l) => sectionHeaders.test(l.replace(/^\*+\s*/, '').replace(/\*+$/, ''));
  const isJustHeader = (l) => {
    const cleaned = l.replace(/\*+/g, '').replace(/:/g, '').trim();
    return cleaned.split(/\s+/).length <= 3; // Very short lines are likely headers
  };
  
  const items = [];
  let inSection = false;
  
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    
    if (isSectionHeader(l)) {
      inSection = true;
      // Don't add the header itself if it's just a label
      if (!isJustHeader(l)) items.push(l);
      continue;
    }
    
    // End section on next major heading or blank-ish line
    if (inSection && /^#{1,3}\s|^\*{2}[A-Z]/.test(l) && !bulletOrContent.test(l)) {
      inSection = false;
      continue;
    }
    
    if (inSection) {
      const cleaned = l.replace(/^[-•*]\s+/, '').replace(/^\d+[.)]\s+/, '').trim();
      // Skip empty or very short lines (sub-headers like "Skills:", "Education:")
      if (cleaned.length > 8 && !isJustHeader(cleaned)) {
        items.push(cleaned);
      }
    }
  }
  
  // Fallback: grab bullet lines from anywhere if nothing found
  if (!items.length) {
    for (const l of lines) {
      if (/^[-•*]\s+.{10,}/.test(l)) {
        const cleaned = l.replace(/^[-•*]\s+/, '').trim();
        if (cleaned.length > 8 && !isJustHeader(cleaned)) items.push(cleaned);
      }
    }
  }
  
  // De-duplicate
  const seen = new Set();
  const unique = [];
  for (const item of items) {
    const k = item.toLowerCase();
    if (!seen.has(k)) { seen.add(k); unique.push(item); }
  }
  
  return unique.slice(0, 10);
}

export function mapCandidateMatches(cvText, ideal) {
  const cv = tokenize(cvText);
  const set = new Set(cv);
  return (ideal || []).filter(line => tokenize(line).some(t => set.has(t)));
}

export function interviewerTips(jdText, company) {
  const themes = [...new Set(tokenize(jdText))].slice(0, 6).join(", ");
  return [
    `Open with a 30-second map: how your last 1–2 projects tie to ${company || "the team"}’s priorities (${themes}).`,
    "Use STAR for impact: Situation → Task → Action → Result. Keep answers 60–90s; include one metric.",
    "Ask two strong questions: 90-day definition of success; how performance is measured.",
    "Follow-up in 24h with a 3-bullet recap linking your experience to their roadmap."
  ];
}

export function extractResponsibilities(jdText) {
  const lines = (jdText || "").split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const resp = [];
  let inRespSection = false;

  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];

    // Detect responsibilities sections
    if (/\b(responsibilit|what you'll do|you will|duties|role)\b/i.test(l)) {
      inRespSection = true;
      continue;
    }
    // If we're in a section and encounter an empty line, assume section ends
    if (inRespSection && /^\s*$/i.test(l)) {
      inRespSection = false;
    }

    // Capture bullet-like lines or lines in a responsibilities section
    const isBullet = /^[-•*]\s+/.test(l);
    if (isBullet || inRespSection) {
      const clean = l.replace(/^[-•*]\s+/, "").replace(/\s{2,}/g, " ").trim();
      if (clean && clean.length > 3) resp.push(clean);
    }
  }

  // Fallback: take generic bullet lines anywhere if nothing found
  if (!resp.length) {
    for (const l of lines) {
      if (/^[-•*]\s+/.test(l)) {
        const clean = l.replace(/^[-•*]\s+/, "").trim();
        if (clean && clean.length > 3) resp.push(clean);
      }
    }
  }

  // De-duplicate (case-insensitive)
  const seen = new Set();
  const uniq = [];
  for (const r of resp) {
    const k = r.toLowerCase();
    if (!seen.has(k)) {
      seen.add(k);
      uniq.push(r);
    }
  }
  return uniq;
}

export function prioritizeResponsibilities(jdText, resumeText, limit = 8) {
  const items = extractResponsibilities(jdText);
  if (!items.length) return [];

  const cvTokens = new Set(tokenize(resumeText));
  const scored = items.map(line => {
    const t = tokenize(line);
    if (!t.length) return { line, score: 0, covered: false };
    let hits = 0;
    for (const tok of t) if (cvTokens.has(tok)) hits++;
    const ratio = hits / t.length; // 0..1
    return { line, score: ratio, covered: ratio >= 0.65 }; // covered if ~2/3 tokens present
  });

  // Sort: gaps first (lower score), then by length (shorter clearer first)
  scored.sort((a, b) => (a.covered === b.covered ? a.score - b.score : (a.covered ? 1 : -1)) || a.line.length - b.line.length);

  // Format with indicators
  const formatted = scored.slice(0, limit).map(s => `${s.covered ? "✅" : "⚠️"} ${s.line}`);
  return formatted;
}

export function buildCandidateMatches(idealLines, cvText, max = 8) {
  const ideal = (idealLines || []).map(s => String(s).trim()).filter(Boolean);
  const cvLines = (cvText || "").split(/\r?\n/).map(s => s.trim()).filter(Boolean);

  const scorePair = (a, b) => {
    const A = new Set(tokenize(a));
    const B = new Set(tokenize(b));
    if (!A.size || !B.size) return 0;
    let inter = 0;
    A.forEach(t => { if (B.has(t)) inter++; });
    // normalized overlap
    // Using Jaccard similarity for better context: intersection / union
    // Or, for a measure of how much of A is in B: intersection / size(A)
    // The current sqrt(A.size * B.size) is more like cosine similarity for sets.
    // Let's stick to the prompt's implementation which is a variant of cosine similarity.
    return inter / Math.sqrt(A.size * B.size);
  };

  const pairs = [];
  for (const line of ideal) {
    let best = { s: 0, text: "" };
    for (const cv of cvLines) {
      const s = scorePair(line, cv);
      if (s > best.s) best = { s, text: cv };
    }
    // Only include if there's a significant match (score > 0.15) and some matching text was found
    if (best.s > 0.15 && best.text) {
      // Shorten lines for display if they are too long
      const shortIdeal = line.length > 140 ? line.slice(0, 137) + "…" : line;
      const shortCv = best.text.length > 160 ? best.text.slice(0, 157) + "…" : best.text;
      pairs.push(`✔ ${shortIdeal} — e.g., "${shortCv}"`);
    }
  }

  // De-duplicate and cap
  const seen = new Set();
  const out = [];
  for (const p of pairs) {
    const k = p.toLowerCase(); // Case-insensitive deduplication of the formatted string
    if (!seen.has(k)) {
      seen.add(k);
      out.push(p);
    }
    if (out.length >= max) break;
  }

  // Fallback to simple mapping if nothing found
  if (!out.length) {
    // If no good matches, just return the ideal candidate lines as bullet points
    return ideal.slice(0, max).map(x => `• ${x}`);
  }
  return out;
}