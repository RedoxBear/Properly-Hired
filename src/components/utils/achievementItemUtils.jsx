/**
 * Normalize achievement items which can be either:
 * - Plain strings (legacy format)
 * - Objects with { text, formula } (new format)
 * 
 * Always returns { text: string, formula: string|null }
 */
export function normalizeAchievementItem(item) {
  if (!item) return { text: "", formula: null };
  if (typeof item === "string") return { text: item, formula: null };
  if (typeof item === "object") {
    return {
      text: item.text || item.content || "",
      formula: item.formula || null
    };
  }
  return { text: String(item), formula: null };
}

/**
 * Extract just the text from an achievement item (for display/export).
 */
export function getItemText(item) {
  return normalizeAchievementItem(item).text;
}

/**
 * Extract the formula tag from an achievement item.
 */
export function getItemFormula(item) {
  return normalizeAchievementItem(item).formula;
}

/**
 * Normalize an entire career_achievements array.
 * Each pillar's items become { text, formula } objects.
 */
export function normalizeCareerAchievements(careerAchievements) {
  if (!Array.isArray(careerAchievements)) return [];
  return careerAchievements.map(pillar => ({
    ...pillar,
    items: (pillar.items || []).map(normalizeAchievementItem)
  }));
}

/**
 * Flatten career_achievements items to plain strings (for text export/templates that don't support formulas).
 */
export function flattenItemsToStrings(items) {
  return (items || []).map(getItemText);
}