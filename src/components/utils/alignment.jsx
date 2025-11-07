/* Alignment engine: compares JD ↔ Optimized ↔ Master CV with seasoned boost */
const VAGUE = /\b(responsible for|worked on|helped with|assisted|various|several)\b/i;

const clamp01_100 = (n) => Math.max(1, Math.min(100, Math.round(n)));

function tokens(s) {
  return (s || "")
    .toLowerCase()
    .replace(/[^a-z0-9+/#&.\s-]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}
function wtJaccard(a, b) {
  const A = tokens(a), B = tokens(b);
  const fa = {}, fb = {};
  for (const t of A) fa[t] = (fa[t] || 0) + 1;
  for (const t of B) fb[t] = (fb[t] || 0) + 1;
  const all = new Set([...Object.keys(fa), ...Object.keys(fb)]);
  let minSum = 0, maxSum = 0;
  all.forEach(t => {
    const x = fa[t] || 0, y = fb[t] || 0;
    minSum += Math.min(x, y);
    maxSum += Math.max(x, y);
  });
  return maxSum ? clamp01_100((100 * minSum) / maxSum) : 1;
}
function redundancyScore(text) {
  const lines = (text || "").split(/\n+/).filter(Boolean).map(l => l.trim().toLowerCase());
  if (!lines.length) return 1;
  const uniq = new Set(lines);
  const dupRate = 1 - (uniq.size / lines.length);
  return clamp01_100(100 - dupRate * 100);
}
function clarityScore(text) {
  const sentences = (text || "").split(/[.!?]\s/).filter(Boolean);
  const avgLen = sentences.length ? sentences.join(" ").split(/\s+/).length / sentences.length : 0;
  const vagueHits = (text.match(VAGUE) || []).length;
  const lenPenalty = Math.min(35, Math.max(0, (avgLen - 22) * 2)); // gentle guidance
  const vaguePenalty = Math.min(40, vagueHits * 8);
  return clamp01_100(100 - (lenPenalty + vaguePenalty));
}
function seasonedExperienceBoost(master, optimized) {
  // modest bonus when older experience is present but well-articulated
  const hasOldYears = /20(0\d|1[0-6])|199\d/.test(optimized || "");
  if (!hasOldYears) return 0;
  const metricHint = /\b(\d+%|\$\d+|[0-9]+ (days|hours|users|customers|projects))\b/i.test(optimized || "");
  const impactWords = /\b(reduced|improved|increased|saved|grew|launched|led|scaled|automated)\b/i.test(optimized || "");
  return metricHint || impactWords ? 6 : 3;
}

export function scoreAlignment(jd, optimized, master) {
  const jdOverlap = wtJaccard(jd || "", optimized || "");          // JD ↔ Optimized
  const masterRetention = wtJaccard(master || "", optimized || ""); // Master ↔ Optimized
  const redundancy = redundancyScore(optimized || "");              // higher is better
  const clarity = clarityScore(optimized || "");                    // higher is better
  const seasonedBoost = seasonedExperienceBoost(master, optimized);

  let raw = jdOverlap * 0.45 + masterRetention * 0.30 + clarity * 0.15 + redundancy * 0.08 + seasonedBoost;
  const overall = clamp01_100(raw);

  return { jdOverlap, masterRetention, redundancy, clarity, seasonedBoost, overall };
}