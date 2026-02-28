export function resumeJsonToPlainText(jsonData) {
  if (!jsonData || typeof jsonData !== "object") return "";
  const pi = jsonData.personal_info || {};
  const header = [
    pi.name || "",
    [pi.email, pi.phone, pi.location].filter(Boolean).join(" | "),
    [pi.linkedin, pi.portfolio].filter(Boolean).join(" | ")
  ].filter(Boolean).join("\n");

  const summary = jsonData.executive_summary || jsonData.summary || "";

  // Career Achievements (pillar format from Achievement-Based CV)
  const careerAchievements = Array.isArray(jsonData.career_achievements) && jsonData.career_achievements.length > 0
    ? jsonData.career_achievements.map(pillar => {
        const heading = (pillar.pillar_name || '').toUpperCase();
        const items = Array.isArray(pillar.items) ? pillar.items.map((item, i) => `  ${i + 1}. ${item}`).join("\n") : "";
        return [heading, items].filter(Boolean).join("\n");
      }).join("\n\n")
    : "";

  const skills = Array.isArray(jsonData.skills) ? jsonData.skills.map(s => `• ${s}`).join("\n") : "";

  const experience = Array.isArray(jsonData.experience) ? jsonData.experience.map(exp => {
    const line1 = [exp.position, exp.company].filter(Boolean).join(" at ");
    const line2 = [exp.duration, exp.location].filter(Boolean).join(" • ");
    const bullets = Array.isArray(exp.achievements) ? exp.achievements.map(a => `- ${a}`).join("\n") : "";
    return [line1, line2, bullets].filter(Boolean).join("\n");
  }).join("\n\n") : "";

  const education = Array.isArray(jsonData.education) ? jsonData.education.map(edu => {
    return [edu.degree, edu.institution, edu.year].filter(Boolean).join(", ");
  }).join("\n") : "";

  const refs = Array.isArray(jsonData.references) ? jsonData.references.map(ref => {
    const header = [ref.name, ref.title, ref.company].filter(Boolean).join(" • ");
    const contacts = [ref.email, ref.phone, ref.linkedin, ref.github, ref.website].filter(Boolean).join(" | ");
    return [header, contacts].filter(Boolean).join("\n");
  }).join("\n\n") : "";

  return [header, summary, careerAchievements, skills, experience, education, refs].filter(Boolean).join("\n\n").trim();
}