/**
 * CV Style Auto-Detection: resolves "auto" into a concrete style.
 * 
 * IF senior-level signal OR 10+ years experience → "both" (user picks)
 * ELSE → "chronological" (auto-generated, no prompt)
 */

const SENIOR_TITLE_SIGNALS = [
  "senior", "sr.", "sr ", "lead", "principal", "staff",
  "director", "head of", "vp", "vice president",
  "c-suite", "ceo", "coo", "cfo", "cto", "cpo", "chro",
  "distinguished", "fellow", "partner", "managing"
];

/**
 * Estimate years of experience from resume text by scanning for 4-digit years.
 */
function estimateYearsExperience(resumeText) {
  if (!resumeText) return 0;
  const matches = resumeText.match(/\b(19[89]\d|20[012]\d)\b/g);
  if (!matches || matches.length < 2) return 0;
  const years = matches.map(Number);
  return Math.max(...years) - Math.min(...years);
}

/**
 * Resolve cv_style preference into a concrete style.
 * 
 * @param {string} cvStylePreference - "auto" | "chronological" | "achievement" | "both"
 * @param {string} jobTitle - The target job title
 * @param {object} roleClassification - Simon's role classification (may have seniority_level, tier)
 * @param {string} resumeText - Raw resume text for year scanning
 * @returns {"chronological" | "achievement" | "both"}
 */
export function resolveCvStyle(cvStylePreference, jobTitle, roleClassification, resumeText) {
  // Respect explicit user choice
  if (cvStylePreference && cvStylePreference !== "auto") {
    return cvStylePreference;
  }

  // Signal 1: Job title seniority
  const titleLower = (jobTitle || "").toLowerCase();
  const isSeniorTitle = SENIOR_TITLE_SIGNALS.some(sig => titleLower.includes(sig));

  // Signal 2: Simon's role classification
  const level = (roleClassification?.seniority_level || roleClassification?.tier || "").toLowerCase();
  const isSeniorLevel = ["senior", "director", "executive", "vp", "c-suite"].includes(level);

  // Signal 3: Years of experience from resume
  const years = estimateYearsExperience(resumeText);
  const isExperienced = years >= 10;

  if (isSeniorTitle || isSeniorLevel || isExperienced) {
    return "both";
  }
  return "chronological";
}

export { SENIOR_TITLE_SIGNALS, estimateYearsExperience };