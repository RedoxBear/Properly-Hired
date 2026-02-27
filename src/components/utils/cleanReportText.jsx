/**
 * Cleans markdown artifacts (**, ###, ##, #, ---, ```) from report text
 * and returns an array of structured sections for professional rendering.
 */

export function cleanMarkdown(text) {
  if (!text) return "";
  return text
    // Remove bold markers
    .replace(/\*\*(.+?)\*\*/g, "$1")
    // Remove italic markers
    .replace(/\*(.+?)\*/g, "$1")
    // Remove heading markers
    .replace(/^#{1,6}\s*/gm, "")
    // Remove inline code
    .replace(/`([^`]+)`/g, "$1")
    // Remove code blocks
    .replace(/```[\s\S]*?```/g, "")
    // Remove horizontal rules (--- or ***)
    .replace(/^[\-\*]{3,}\s*$/gm, "")
    // Clean up excess blank lines (3+ → 2)
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Parses cleaned report text into structured sections for rendering.
 * Sections are split by ===... dividers.
 */
export function parseReportSections(text) {
  if (!text) return [];
  
  const cleaned = cleanMarkdown(text);
  // Split on "========" divider lines
  const rawSections = cleaned.split(/^={4,}\s*$/m);
  
  const sections = [];
  for (let i = 0; i < rawSections.length; i++) {
    const block = rawSections[i].trim();
    if (!block) continue;
    
    // Check if this block is a section title (short, all caps or title case, no periods)
    const lines = block.split("\n").map(l => l.trim()).filter(Boolean);
    
    if (lines.length <= 2 && lines[0].length < 120 && !lines[0].includes(".")) {
      // This is a section title — pair it with the next block
      const title = lines.join(" — ");
      const nextBlock = rawSections[i + 1]?.trim() || "";
      sections.push({ title, body: cleanMarkdown(nextBlock) });
      i++; // skip the next block since we consumed it
    } else {
      // This is a content block without a clear title
      sections.push({ title: null, body: block });
    }
  }
  
  return sections;
}