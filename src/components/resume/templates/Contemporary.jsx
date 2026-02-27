import React from "react";
import { parseResumeData, ProfilePhoto } from "./templateUtils";

// Contemporary: Bold shapes with modern accents, dark header, orange accent
export default function Contemporary({ data }) {
  const d = parseResumeData(data);
  if (!d) return null;
  const { pi, skills, highlights, experience, education, references, summary, profilePhoto } = d;

  return (
    <div className="max-w-[800px] mx-auto bg-white text-slate-800" style={{ minHeight: 1056 }}>
      {/* Header with bold shape */}
      <div className="bg-slate-900 text-white p-8 relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500 opacity-20" style={{ clipPath: "polygon(100% 0, 0 0, 100% 100%)" }} />
        <div className="flex items-center gap-5">
          {profilePhoto && <ProfilePhoto src={profilePhoto} size="w-20 h-20" className="border-orange-400" />}
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">{pi.name || "Your Name"}</h1>
            <p className="text-orange-400 font-medium text-sm mt-1">{pi.title || ""}</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-300">
          {pi.email && <span>✉ {pi.email}</span>}
          {pi.phone && <span>☎ {pi.phone}</span>}
          {pi.location && <span>📍 {pi.location}</span>}
          {pi.linkedin && <span>{pi.linkedin}</span>}
        </div>
      </div>

      <div className="p-7">
        {summary && (
          <section className="mb-6">
            <h2 className="text-sm font-bold uppercase tracking-wider text-orange-600 mb-2">Professional Profile</h2>
            <p className="text-sm leading-6 text-slate-700">{summary}</p>
          </section>
        )}

        {/* Two column layout for skills + highlights */}
        {(skills.length > 0 || highlights.length > 0) && (
          <div className="grid grid-cols-2 gap-6 mb-6">
            {skills.length > 0 && (
              <section>
                <h2 className="text-sm font-bold uppercase tracking-wider text-orange-600 mb-2">Core Skills</h2>
                <div className="flex flex-wrap gap-1.5">
                  {skills.map((s, i) => (
                    <span key={i} className="px-2 py-0.5 bg-orange-50 text-orange-800 text-xs rounded border border-orange-200">{s}</span>
                  ))}
                </div>
              </section>
            )}
            {highlights.length > 0 && (
              <section>
                <h2 className="text-sm font-bold uppercase tracking-wider text-orange-600 mb-2">Highlights</h2>
                {highlights.map((h, i) => (
                  <p key={i} className="text-xs text-slate-700 mb-1">▪ {h}</p>
                ))}
              </section>
            )}
          </div>
        )}

        {experience.length > 0 && (
          <section className="mb-6">
            <h2 className="text-sm font-bold uppercase tracking-wider text-orange-600 mb-3">Work Experience</h2>
            {experience.map((exp, i) => (
              <div key={i} className="mb-4 pb-4 border-b border-slate-100 last:border-0">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-sm font-bold">{exp.position}</h3>
                    <p className="text-xs text-orange-700 font-medium">{exp.company}</p>
                  </div>
                  <span className="text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-500">{exp.duration}</span>
                </div>
                {exp.location && <p className="text-xs text-slate-500 mt-0.5">{exp.location}</p>}
                {Array.isArray(exp.achievements) && exp.achievements.length > 0 && (
                  <ul className="mt-2 space-y-0.5">
                    {exp.achievements.map((a, j) => (
                      <li key={j} className="text-xs text-slate-600 flex items-start gap-1.5">
                        <span className="text-orange-500 mt-0.5">›</span> {a}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </section>
        )}

        {education.length > 0 && (
          <section className="mb-6">
            <h2 className="text-sm font-bold uppercase tracking-wider text-orange-600 mb-2">Education</h2>
            {education.map((edu, i) => (
              <div key={i} className="flex justify-between mb-2">
                <div>
                  <p className="text-sm font-medium">{edu.degree}</p>
                  <p className="text-xs text-slate-500">{edu.institution}</p>
                </div>
                <span className="text-xs text-slate-400">{edu.year}</span>
              </div>
            ))}
          </section>
        )}

        {references.length > 0 && (
          <section>
            <h2 className="text-sm font-bold uppercase tracking-wider text-orange-600 mb-2">References</h2>
            <div className="grid grid-cols-2 gap-3">
              {references.map((ref, i) => (
                <div key={i} className="text-xs">
                  <p className="font-semibold">{ref.name}</p>
                  <p className="text-slate-500">{ref.title}{ref.company ? `, ${ref.company}` : ""}</p>
                  <p className="text-slate-400">{[ref.email, ref.phone].filter(Boolean).join(" | ")}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}