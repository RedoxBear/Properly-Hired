/**
 * Strip markdown formatting characters (asterisks, hashes, underscores used for bold/italic/headers)
 * from resume text to produce clean, professional output.
 */
export function cleanResumeText(text) {
  if (!text || typeof text !== "string") return text || "";
  return text
    .replace(/\*{1,3}/g, "")        // Remove *, **, ***
    .replace(/_{1,3}/g, " ")         // Remove _, __, ___ (replace with space to avoid merging words)
    .replace(/^#{1,6}\s*/gm, "")     // Remove markdown headers (# ## ### etc.)
    .replace(/~~(.*?)~~/g, "$1")     // Remove strikethrough markers
    .replace(/`{1,3}/g, "")          // Remove backticks
    .replace(/\s{2,}/g, " ")         // Collapse multiple spaces
    .trim();
}

/**
 * Recursively clean all string values in a resume data object.
 * Handles nested objects and arrays.
 */
export function cleanResumeData(data) {
  if (!data) return data;
  if (typeof data === "string") return cleanResumeText(data);
  if (Array.isArray(data)) return data.map(cleanResumeData);
  if (typeof data === "object") {
    const cleaned = {};
    for (const [key, value] of Object.entries(data)) {
      cleaned[key] = cleanResumeData(value);
    }
    return cleaned;
  }
  return data;
}