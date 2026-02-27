import React from "react";
import { parseResumeData, SkillBar, ProfilePhoto } from "./templateUtils";

// Polished: Presentation-first with strong left sidebar in deep blue
export default function Polished({ data }) {
  const d = parseResumeData(data);
  if (!d) return null;
  const { pi, skills, highlights, experience, education, references, summary, profilePhoto, skillLevels } = d;

  return (
    <div className="max-w-[800px] mx-auto bg-white text-slate-800 flex" style={{ minHeight: 1056 }}>
      {/* Left sidebar - deep blue */}
      <div className="w-[260px] bg-blue-900 text-white p-6 flex-shrink-0">
        {profilePhoto && (
          <div className="flex justify-center mb-5">
            <ProfilePhoto src={profilePhoto} size="w-28 h-28" className="border-blue-700" />
          </div>
        )}

        <h1 className="text-xl font-bold text-center mb-1">{pi.name || "Your Name"}</h1>
        <p className="text-xs text-blue-300 text-center mb-5">{pi.title || ""}</p>

        {/* Contact */}
        <div className="mb-5">
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-blue-300 mb-2">Contact</h2>
          <div className="space-y-1.5 text-xs">
            {pi.email && <p className="text-blue-100">✉ {pi.email}</p>}
            {pi.phone && <p className="text-blue-100">☎ {pi.phone}</p>}
            {pi.location && <p className="text-blue-100">📍 {pi.location}</p>}
            {pi.linkedin && <p className="text-blue-100 break-all">{pi.linkedin}</p>}
          </div>
        </div>

        {/* Skills */}
        {skills.length > 0 && (
          <div className="mb-5">
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-blue-300 mb-2">Expertise</h2>
            {skills.slice(0, 8).map((s, i) => (
              <SkillBar key={i} name={s} level={skillLevels[s] || 65 + (i % 5) * 7} color="bg-amber-400" />
            ))}
          </div>
        )}

        {/* Education */}
        {education.length > 0 && (
          <div>
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-blue-300 mb-2">Education</h2>
            {education.map((edu, i) => (
              <div key={i} className="mb-2">
                <p className="text-xs font-semibold text-white">{edu.degree}</p>
                <p className="text-xs text-blue-300">{edu.institution}</p>
                <p className="text-xs text-blue-400">{edu.year}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right content */}
      <div className="flex-1 p-7">
        {summary && (
          <section className="mb-5 bg-blue-50 rounded-lg p-4 border border-blue-100">
            <h2 className="text-xs font-bold uppercase tracking-wider text-blue-800 mb-1">About</h2>
            <p className="text-xs leading-5 text-slate-700">{summary}</p>
          </section>
        )}

        {highlights.length > 0 && (
          <section className="mb-5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-blue-900 border-b-2 border-blue-800 pb-1 mb-2">Key Achievements</h2>
            <div className="grid grid-cols-2 gap-2">
              {highlights.map((h, i) => (
                <div key={i} className="flex items-start gap-1.5 text-xs text-slate-700">
                  <span className="text-amber-500">★</span> {h}
                </div>
              ))}
            </div>
          </section>
        )}

        {experience.length > 0 && (
          <section className="mb-5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-blue-900 border-b-2 border-blue-800 pb-1 mb-3">Professional Experience</h2>
            {experience.map((exp, i) => (
              <div key={i} className="mb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{exp.position}</h3>
                    <p className="text-xs text-blue-700 font-medium">{exp.company}</p>
                  </div>
                  <span className="text-xs text-slate-400">{exp.duration}</span>
                </div>
                {Array.isArray(exp.achievements) && exp.achievements.length > 0 && (
                  <ul className="mt-1.5 space-y-0.5">
                    {exp.achievements.map((a, j) => (
                      <li key={j} className="text-xs text-slate-600">• {a}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </section>
        )}

        {references.length > 0 && (
          <section>
            <h2 className="text-xs font-bold uppercase tracking-wider text-blue-900 border-b-2 border-blue-800 pb-1 mb-2">References</h2>
            {references.map((ref, i) => (
              <div key={i} className="mb-2 text-xs">
                <span className="font-semibold">{ref.name}</span> — {ref.title}{ref.company ? `, ${ref.company}` : ""}
                <span className="text-slate-400 ml-2">{[ref.email, ref.phone].filter(Boolean).join(" | ")}</span>
              </div>
            ))}
          </section>
        )}
      </div>
    </div>
  );
}