import React from "react";
import { parseResumeData, ProfilePhoto, SkillDots } from "./templateUtils";

// Stylish: Modern design with professional readability, mint/emerald accent, minimal sidebar
export default function Stylish({ data }) {
  const d = parseResumeData(data);
  if (!d) return null;
  const { pi, skills, highlights, experience, education, references, summary, profilePhoto, skillLevels } = d;

  return (
    <div className="max-w-[800px] mx-auto bg-white text-slate-800" style={{ minHeight: 1056 }}>
      {/* Top bar accent */}
      <div className="h-2 bg-gradient-to-r from-emerald-500 to-teal-400" />

      <div className="p-8">
        {/* Header */}
        <div className="flex items-center gap-5 mb-6">
          {profilePhoto && <ProfilePhoto src={profilePhoto} size="w-20 h-20" className="border-emerald-300" />}
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{pi.name || "Your Name"}</h1>
            <p className="text-sm text-emerald-700 font-medium">{pi.title || ""}</p>
            <p className="text-xs text-slate-500 mt-1">
              {[pi.email, pi.phone, pi.location].filter(Boolean).join(" · ")}
            </p>
            {(pi.linkedin || pi.portfolio) && (
              <p className="text-xs text-slate-400 mt-0.5">
                {[pi.linkedin, pi.portfolio].filter(Boolean).join(" · ")}
              </p>
            )}
          </div>
        </div>

        {summary && (
          <section className="mb-5">
            <p className="text-sm leading-6 text-slate-600 border-l-3 border-emerald-400 pl-4">{summary}</p>
          </section>
        )}

        <div className="flex gap-6">
          {/* Main column */}
          <div className="flex-1">
            {experience.length > 0 && (
              <section className="mb-5">
                <h2 className="text-xs font-bold uppercase tracking-widest text-emerald-700 mb-3">Experience</h2>
                {experience.map((exp, i) => (
                  <div key={i} className="mb-4">
                    <div className="flex justify-between">
                      <h3 className="text-sm font-semibold">{exp.position}</h3>
                      <span className="text-xs text-slate-400">{exp.duration}</span>
                    </div>
                    <p className="text-xs text-emerald-700">{exp.company}{exp.location ? ` · ${exp.location}` : ""}</p>
                    {Array.isArray(exp.achievements) && exp.achievements.length > 0 && (
                      <ul className="mt-1 space-y-0.5">
                        {exp.achievements.map((a, j) => (
                          <li key={j} className="text-xs text-slate-600">– {a}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </section>
            )}

            {highlights.length > 0 && (
              <section className="mb-5">
                <h2 className="text-xs font-bold uppercase tracking-widest text-emerald-700 mb-2">Highlights</h2>
                {highlights.map((h, i) => (
                  <p key={i} className="text-xs text-slate-700 mb-1">✓ {h}</p>
                ))}
              </section>
            )}
          </div>

          {/* Side column */}
          <div className="w-[200px] flex-shrink-0">
            {skills.length > 0 && (
              <section className="mb-5">
                <h2 className="text-xs font-bold uppercase tracking-widest text-emerald-700 mb-2">Skills</h2>
                {skills.slice(0, 8).map((s, i) => (
                  <SkillDots key={i} name={s} level={Math.round((skillLevels[s] || 60 + (i % 4) * 10) / 20)} filledColor="bg-emerald-500" />
                ))}
              </section>
            )}

            {education.length > 0 && (
              <section className="mb-5">
                <h2 className="text-xs font-bold uppercase tracking-widest text-emerald-700 mb-2">Education</h2>
                {education.map((edu, i) => (
                  <div key={i} className="mb-2">
                    <p className="text-xs font-semibold">{edu.degree}</p>
                    <p className="text-xs text-slate-500">{edu.institution}</p>
                    <p className="text-xs text-slate-400">{edu.year}</p>
                  </div>
                ))}
              </section>
            )}

            {references.length > 0 && (
              <section>
                <h2 className="text-xs font-bold uppercase tracking-widest text-emerald-700 mb-2">References</h2>
                {references.map((ref, i) => (
                  <div key={i} className="mb-2">
                    <p className="text-xs font-semibold">{ref.name}</p>
                    <p className="text-xs text-slate-400">{ref.title}</p>
                  </div>
                ))}
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}