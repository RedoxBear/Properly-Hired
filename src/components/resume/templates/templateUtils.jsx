// Shared utilities for all resume templates

export function parseResumeData(data) {
  if (!data) return null;
  const pi = data.personal_info || {};
  const skills = data.skills || [];
  const rawHighlights = data.highlights || [];
  const highlights = Array.isArray(rawHighlights)
    ? rawHighlights
    : typeof rawHighlights === "string" && rawHighlights.trim()
      ? rawHighlights.split(/•|\n/).map(s => s.trim()).filter(Boolean)
      : [];
  const experience = data.experience || [];
  const education = data.education || [];
  const references = data.references || [];
  const summary = data.executive_summary || data.summary || data.professional_summary || "";
  const profilePhoto = data.profile_photo || pi.photo || "";
  const skillLevels = data.skill_levels || {};
  const careerAchievements = Array.isArray(data.career_achievements) ? data.career_achievements : [];

  return { pi, skills, highlights, experience, education, references, summary, profilePhoto, skillLevels, careerAchievements };
}

export function SkillBar({ name, level = 70, color = "bg-blue-600" }) {
  return (
    <div className="mb-2">
      <div className="flex justify-between text-xs mb-1">
        <span>{name}</span>
        <span>{level}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-1.5">
        <div className={`${color} h-1.5 rounded-full`} style={{ width: `${level}%` }} />
      </div>
    </div>
  );
}

export function SkillDots({ name, level = 3, maxDots = 5, filledColor = "bg-blue-600", emptyColor = "bg-gray-300" }) {
  return (
    <div className="flex items-center justify-between mb-1.5">
      <span className="text-xs">{name}</span>
      <div className="flex gap-1">
        {Array.from({ length: maxDots }, (_, i) => (
          <div key={i} className={`w-2 h-2 rounded-full ${i < level ? filledColor : emptyColor}`} />
        ))}
      </div>
    </div>
  );
}

export function ContactIcon({ type }) {
  const icons = {
    email: "✉",
    phone: "☎",
    location: "📍",
    linkedin: "in",
    portfolio: "🔗"
  };
  return <span className="mr-1 text-xs">{icons[type] || "•"}</span>;
}

export function ContactList({ pi, separator = " | ", className = "text-sm text-slate-600" }) {
  const items = [
    { type: "email", value: pi.email },
    { type: "phone", value: pi.phone },
    { type: "location", value: pi.location },
    { type: "linkedin", value: pi.linkedin },
    { type: "portfolio", value: pi.portfolio }
  ].filter(item => item.value);

  return (
    <p className={className}>
      {items.map((item, i) => (
        <span key={i}>
          {i > 0 && separator}
          {item.value}
        </span>
      ))}
    </p>
  );
}

export function ProfilePhoto({ src, size = "w-24 h-24", className = "" }) {
  if (!src) return null;
  return (
    <img
      src={src}
      alt="Profile"
      className={`${size} rounded-full object-cover border-2 border-white shadow-lg ${className}`}
    />
  );
}