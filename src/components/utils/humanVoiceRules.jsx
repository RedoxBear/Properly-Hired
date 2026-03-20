/**
 * Human Voice Engine — Banned words, replacements, structural checks, scoring.
 * Single source of truth for AI Detection Scanner + Resume/Cover Letter generators.
 */

// ── Banned Verbs ──
export const BANNED_VERBS = {
  architected: "built",
  orchestrated: "led",
  spearheaded: "led",
  catalyzed: "started",
  championed: "supported",
  leveraged: "used",
  synergized: "combined",
  operationalized: "put in place",
  pioneered: "created",
  revolutionized: "changed",
  elevated: "improved",
  empowered: "helped",
  engineered: "built",
  curated: "selected",
  streamlined: "simplified",
  galvanized: "motivated",
  propelled: "helped grow",
  amplified: "increased",
  supercharged: "improved",
  marshaled: "organized",
  quarterbacked: "led",
  helmed: "led",
  forged: "built",
  cultivated: "built",
  steered: "guided"
};

// ── Banned Modifiers ──
export const BANNED_MODIFIERS = {
  "high-change environment": "(remove or be specific)",
  "operations-intensive": "(remove or be specific)",
  "mission-critical setting": "(remove or be specific)",
  "high-ambiguity": "(remove or be specific)",
  "results-driven": "(remove)",
  "cutting-edge": "(remove)",
  "best-in-class": "(remove)",
  "world-class": "(remove)",
  "state-of-the-art": "(remove)",
  "game-changing": "(remove)",
  "transformative": "(remove)",
  "holistic": "(remove)"
};

// ── Banned Framing Phrases ──
export const BANNED_PHRASES = {
  "rare combination of": "(remove)",
  "uniquely positioned to": "(remove)",
  "proven track record of": "(remove)",
  "passion for": "(remove)",
  "deep expertise in": "(remove)",
  "thought leader": "(remove)",
  "at the intersection of": "(remove)",
  "driving x through y": "(remove or rewrite plainly)",
  "delivering measurable impact": "(remove)",
  "ensuring seamless": "(remove)",
  "fostering a culture of": "(remove)",
  "committed to excellence": "(remove)",
  "instrumental in driving": "(remove)",
  "poised to deliver": "(remove)"
};

// ── Banned Filler ──
export const BANNED_FILLER = {
  effectively: "(remove)",
  successfully: "(remove unless outcome follows)",
  strategically: "(be specific)",
  comprehensively: "(remove)",
  proactively: "(be specific)",
  collaboratively: "with",
  seamlessly: "(remove)",
  robustly: "(remove)",
  holistically: "(remove)",
  significantly: "(use a number)",
  dramatically: "(use a number)",
  exponentially: "(use a number)"
};

// ── Cover Letter Specific Bans ──
export const BANNED_COVER_LETTER = {
  "at the intersection of": "(remove)",
  "navigate ambiguity": "deal with uncertainty",
  "navigate complexity": "handle complex situations",
  "practitioner of": "I use / I work with"
};

// ── Preferred Verbs (for reference) ──
export const PREFERRED_VERBS = [
  "built", "led", "managed", "ran", "set up", "handled", "created",
  "designed", "reduced", "improved", "fixed", "hired", "coached",
  "supported", "worked with", "helped", "kept", "put in place",
  "oversaw", "took over", "owned"
];

// ── All rules merged for scanning ──
export function getAllBannedRules() {
  const rules = [];
  const add = (map, category) => {
    Object.entries(map).forEach(([word, replacement]) => {
      rules.push({ word, category, replacement, is_active: true });
    });
  };
  add(BANNED_VERBS, "verb");
  add(BANNED_MODIFIERS, "modifier");
  add(BANNED_PHRASES, "phrase");
  add(BANNED_FILLER, "filler");
  add(BANNED_COVER_LETTER, "cover_letter");
  return rules;
}

// ── Scan text for violations ──
export function scanText(text, customRules = null) {
  const rules = customRules || getAllBannedRules();
  const activeRules = rules.filter(r => r.is_active !== false);
  const lower = text.toLowerCase();
  const findings = [];

  // Word/phrase scanning
  for (const rule of activeRules) {
    if (rule.category === "structural") continue;
    const pattern = rule.word.toLowerCase();
    let idx = lower.indexOf(pattern);
    while (idx !== -1) {
      // Check word boundary (avoid matching inside longer words)
      const before = idx > 0 ? lower[idx - 1] : " ";
      const after = idx + pattern.length < lower.length ? lower[idx + pattern.length] : " ";
      const isBoundary = /[\s,.\-;:!?("']/.test(before) || idx === 0;
      const isEndBoundary = /[\s,.\-;:!?)"']/.test(after) || (idx + pattern.length === lower.length);
      
      if (isBoundary && isEndBoundary) {
        const original = text.substring(idx, idx + pattern.length);
        findings.push({
          word: original,
          category: rule.category,
          replacement: rule.replacement,
          position: idx
        });
      }
      idx = lower.indexOf(pattern, idx + 1);
    }
  }

  // Structural checks
  const structuralFindings = runStructuralChecks(text);
  findings.push(...structuralFindings);

  // De-duplicate by position
  const unique = [];
  const seen = new Set();
  for (const f of findings) {
    const key = `${f.position}-${f.word.toLowerCase()}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(f);
    }
  }

  // Sort by position
  unique.sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

  // Score: start at 100, subtract 3 per finding, min 0
  const score = Math.max(0, 100 - unique.length * 3);

  return { findings: unique, score, totalViolations: unique.length };
}

// ── Structural pattern checks ──
function runStructuralChecks(text) {
  const findings = [];
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);

  // 1. Verb cycling — if 4+ consecutive bullets all start with unique verbs
  const bulletLines = lines.filter(l => /^[•\-–—]/.test(l) || /^\d+[\.\)]/.test(l));
  if (bulletLines.length >= 4) {
    const openers = bulletLines.map(b => {
      const cleaned = b.replace(/^[•\-–—\d.)\s]+/, "").trim();
      return cleaned.split(/\s+/)[0]?.toLowerCase();
    }).filter(Boolean);

    const uniqueOpeners = new Set(openers);
    if (openers.length >= 4 && uniqueOpeners.size === openers.length) {
      findings.push({
        word: "[verb cycling detected]",
        category: "structural",
        replacement: "Repeat some verbs naturally — humans reuse led, managed, handled",
        position: null
      });
    }
  }

  // 2. All-metric bullets — every bullet has a number/percent/dollar
  if (bulletLines.length >= 3) {
    const metricBullets = bulletLines.filter(b => /[\d$%]/.test(b));
    if (metricBullets.length === bulletLines.length) {
      findings.push({
        word: "[all-metric bullets]",
        category: "structural",
        replacement: "At least 2 bullets per role should be plain scope with no metric",
        position: null
      });
    }
  }

  // 3. No contractions — 500+ words, zero contractions
  const wordCount = text.split(/\s+/).length;
  if (wordCount >= 500) {
    const contractionPattern = /\b(I'm|I've|I'd|I'll|don't|doesn't|didn't|won't|wouldn't|can't|couldn't|shouldn't|isn't|aren't|wasn't|weren't|haven't|hasn't|hadn't|they're|we're|you're|it's|that's|there's|here's|what's|who's|let's)\b/i;
    if (!contractionPattern.test(text)) {
      findings.push({
        word: "[no contractions in 500+ words]",
        category: "structural",
        replacement: "Add natural contractions — I'm, don't, it's — humans use them",
        position: null
      });
    }
  }

  return findings;
}

// ── Category labels ──
export const CATEGORY_LABELS = {
  verb: "Banned Verb",
  modifier: "Banned Modifier",
  phrase: "Banned Phrase",
  filler: "Filler Word",
  cover_letter: "Cover Letter Ban",
  structural: "Structural Pattern"
};

// ── Category colors ──
export const CATEGORY_COLORS = {
  verb: "bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300",
  modifier: "bg-orange-100 text-orange-800 dark:bg-orange-950/50 dark:text-orange-300",
  phrase: "bg-purple-100 text-purple-800 dark:bg-purple-950/50 dark:text-purple-300",
  filler: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950/50 dark:text-yellow-300",
  cover_letter: "bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300",
  structural: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300"
};