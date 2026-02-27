import React from "react";
import { parseResumeData, SkillBar, ProfilePhoto } from "./templateUtils";

// Double Column: Left sidebar (dark) with contact/skills, Right main with experience
export default function DoubleColumn({ data }) {
  const d = parseResumeData(data);
  if (!d) return null;
  const { pi, skills, highlights, experience, education, references, summary, profilePhoto, skillLevels } = d;

  return (
    <div className="max-w-[800px] mx-auto bg-white text-slate-800 flex" style={{ minHeight: 1056 }}>
      {/* Left Sidebar */}
      <div className="w-[280px] bg-slate-800 text-white p-6 flex-shrink-0">
        {/* Photo */}
        <div className="flex justify-center mb-5">
          <ProfilePhoto src={profilePhoto} size="w-28 h-28" className="border-slate-600" />
        </div>

        {/* Contact */}
        <div className="mb-6">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-300 border-b border-slate-600 pb-1 mb-3">Contact</h2>
          {pi.email && <p className="text-xs mb-1.5">✉ {pi.email}</p>}
          {pi.phone && <p className="text-xs mb-1.5">☎ {pi.phone}</p>}
          {pi.location && <p className="text-xs mb-1.5">📍 {pi.location}</p>}
          {pi.linkedin && <p className="text-xs mb-1.5 break-all">in {pi.linkedin}</p>}
          {pi.portfolio && <p className="text-xs mb-1.5 break-all">🔗 {pi.portfolio}</p>}
        </div>

        {/* Skills with bars */}
        {skills.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-300 border-b border-slate-600 pb-1 mb-3">Skills</h2>
            {skills.slice(0, 10).map((s, i) => (
              <SkillBar key={i} name={s} level={skillLevels[s] || 70 + (i % 4) * 8} color="bg-cyan-400" />
            ))}
          </div>
        )}

        {/* Education in sidebar */}
        {education.length > 0 && (
          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-300 border-b border-slate-600 pb-1 mb-3">Education</h2>
            {education.map((edu, i) => (
              <div key={i} className="mb-3">
                <p className="text-xs font-semibold">{edu.degree}</p>
                <p className="text-xs text-slate-400">{edu.institution}</p>
                <p className="text-xs text-slate-500">{edu.year}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right Main Content */}
      <div className="flex-1 p-6">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-slate-900">{pi.name || "Your Name"}</h1>
          {summary && <p className="text-xs text-slate-500 mt-1 italic">{pi.title || ""}</p>}
        </div>

        {summary && (
          <section className="mb-5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 border-b-2 border-slate-200 pb-1 mb-2">Profile</h2>
            <p className="text-xs leading-5 text-slate-700">{summary}</p>
          </section>
        )}

        {highlights.length > 0 && (
          <section className="mb-5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 border-b-2 border-slate-200 pb-1 mb-2">Key Achievements</h2>
            <ul className="space-y-1">
              {highlights.map((h, i) => (
                <li key={i} className="text-xs text-slate-700 flex items-start gap-1.5">
                  <span className="text-cyan-600 mt-0.5">▸</span> {h}
                </li>
              ))}
            </ul>
          </section>
        )}

        {experience.length > 0 && (
          <section className="mb-5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 border-b-2 border-slate-200 pb-1 mb-2">Experience</h2>
            {experience.map((exp, i) => (
              <div key={i} className="mb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-sm font-semibold">{exp.position}</h3>
                    <p className="text-xs text-slate-500">{exp.company}{exp.location ? `, ${exp.location}` : ""}</p>
                  </div>
                  <span className="text-xs text-slate-400 whitespace-nowrap">{exp.duration}</span>
                </div>
                {Array.isArray(exp.achievements) && exp.achievements.length > 0 && (
                  <ul className="mt-1.5 space-y-0.5">
                    {exp.achievements.map((a, j) => (
                      <li key={j} className="text-xs text-slate-600 flex items-start gap-1.5">
                        <span className="text-slate-400">•</span> {a}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </section>
        )}

        {references.length > 0 && (
          <section>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 border-b-2 border-slate-200 pb-1 mb-2">References</h2>
            {references.map((ref, i) => (
              <div key={i} className="mb-2">
                <p className="text-xs font-semibold">{ref.name} — {ref.title}{ref.company ? `, ${ref.company}` : ""}</p>
                <p className="text-xs text-slate-500">{[ref.email, ref.phone].filter(Boolean).join(" | ")}</p>
              </div>
            ))}
          </section>
        )}
      </div>
    </div>
  );
}