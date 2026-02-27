import React from "react";
import { parseResumeData, SkillBar, ProfilePhoto } from "./templateUtils";

// Multicolumn: Three-column layout for dense content
export default function Multicolumn({ data }) {
  const d = parseResumeData(data);
  if (!d) return null;
  const { pi, skills, highlights, experience, education, references, summary, profilePhoto, skillLevels } = d;

  return (
    <div className="max-w-[800px] mx-auto bg-white text-slate-800" style={{ minHeight: 1056 }}>
      {/* Full-width header */}
      <div className="bg-gray-900 text-white p-6">
        <div className="flex items-center gap-4">
          {profilePhoto && <ProfilePhoto src={profilePhoto} size="w-16 h-16" className="border-gray-700" />}
          <div>
            <h1 className="text-2xl font-bold">{pi.name || "Your Name"}</h1>
            <p className="text-gray-300 text-xs mt-1">
              {[pi.email, pi.phone, pi.location, pi.linkedin].filter(Boolean).join("  |  ")}
            </p>
          </div>
        </div>
        {summary && <p className="text-xs text-gray-300 mt-3 leading-5">{summary}</p>}
      </div>

      {/* Three columns */}
      <div className="flex">
        {/* Column 1 - Skills & Education */}
        <div className="w-[200px] flex-shrink-0 bg-gray-50 p-4 border-r border-gray-200">
          {skills.length > 0 && (
            <section className="mb-4">
              <h2 className="text-[10px] font-bold uppercase tracking-widest text-gray-600 border-b border-gray-300 pb-1 mb-2">Skills</h2>
              {skills.slice(0, 10).map((s, i) => (
                <SkillBar key={i} name={s} level={skillLevels[s] || 55 + (i % 6) * 8} color="bg-gray-700" />
              ))}
            </section>
          )}

          {education.length > 0 && (
            <section>
              <h2 className="text-[10px] font-bold uppercase tracking-widest text-gray-600 border-b border-gray-300 pb-1 mb-2">Education</h2>
              {education.map((edu, i) => (
                <div key={i} className="mb-2">
                  <p className="text-xs font-semibold">{edu.degree}</p>
                  <p className="text-xs text-gray-500">{edu.institution}</p>
                  <p className="text-xs text-gray-400">{edu.year}</p>
                </div>
              ))}
            </section>
          )}
        </div>

        {/* Column 2 - Experience */}
        <div className="flex-1 p-4 border-r border-gray-200">
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-gray-600 border-b border-gray-300 pb-1 mb-3">Experience</h2>
          {experience.map((exp, i) => (
            <div key={i} className="mb-3">
              <h3 className="text-xs font-bold">{exp.position}</h3>
              <p className="text-[10px] text-gray-500">{exp.company} · {exp.duration}</p>
              {Array.isArray(exp.achievements) && (
                <ul className="mt-1 space-y-0.5">
                  {exp.achievements.slice(0, 3).map((a, j) => (
                    <li key={j} className="text-[10px] text-gray-600">• {a}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>

        {/* Column 3 - Highlights & References */}
        <div className="w-[200px] flex-shrink-0 p-4">
          {highlights.length > 0 && (
            <section className="mb-4">
              <h2 className="text-[10px] font-bold uppercase tracking-widest text-gray-600 border-b border-gray-300 pb-1 mb-2">Highlights</h2>
              {highlights.map((h, i) => (
                <p key={i} className="text-[10px] text-gray-700 mb-1">▸ {h}</p>
              ))}
            </section>
          )}

          {references.length > 0 && (
            <section>
              <h2 className="text-[10px] font-bold uppercase tracking-widest text-gray-600 border-b border-gray-300 pb-1 mb-2">References</h2>
              {references.map((ref, i) => (
                <div key={i} className="mb-2">
                  <p className="text-[10px] font-semibold">{ref.name}</p>
                  <p className="text-[10px] text-gray-500">{ref.title}</p>
                  <p className="text-[10px] text-gray-400">{ref.email}</p>
                </div>
              ))}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}