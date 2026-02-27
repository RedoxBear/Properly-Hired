import React from "react";
import { parseResumeData, ProfilePhoto } from "./templateUtils";

// High Performer: Data-driven sections with visual highlights, red/dark accent
export default function HighPerformer({ data }) {
  const d = parseResumeData(data);
  if (!d) return null;
  const { pi, skills, highlights, experience, education, references, summary, profilePhoto } = d;

  return (
    <div className="max-w-[800px] mx-auto bg-white text-slate-800 p-8" style={{ minHeight: 1056 }}>
      {/* Header */}
      <div className="flex items-center gap-5 pb-4 border-b-4 border-red-600 mb-5">
        {profilePhoto && <ProfilePhoto src={profilePhoto} size="w-18 h-18" className="border-red-400" />}
        <div>
          <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">{pi.name || "Your Name"}</h1>
          <p className="text-sm text-red-600 font-bold uppercase tracking-wider">{pi.title || ""}</p>
          <p className="text-xs text-slate-500 mt-1">
            {[pi.email, pi.phone, pi.location, pi.linkedin].filter(Boolean).join(" | ")}
          </p>
        </div>
      </div>

      {summary && (
        <section className="mb-5">
          <p className="text-sm leading-6 text-slate-700">{summary}</p>
        </section>
      )}

      {/* Highlights as metric cards */}
      {highlights.length > 0 && (
        <section className="mb-5">
          <h2 className="text-xs font-black uppercase tracking-wider text-red-700 mb-2">Key Accomplishments</h2>
          <div className="grid grid-cols-2 gap-2">
            {highlights.map((h, i) => (
              <div key={i} className="bg-red-50 border border-red-100 rounded p-2.5">
                <p className="text-xs text-slate-700 font-medium">▪ {h}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Two column: Experience + Skills/Education */}
      <div className="flex gap-6">
        <div className="flex-1">
          {experience.length > 0 && (
            <section className="mb-5">
              <h2 className="text-xs font-black uppercase tracking-wider text-red-700 border-b-2 border-red-600 pb-1 mb-3">Experience</h2>
              {experience.map((exp, i) => (
                <div key={i} className="mb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-sm font-bold">{exp.position}</h3>
                      <p className="text-xs text-red-700 font-semibold">{exp.company}</p>
                    </div>
                    <span className="text-xs text-slate-400 bg-slate-50 px-2 py-0.5 rounded">{exp.duration}</span>
                  </div>
                  {Array.isArray(exp.achievements) && exp.achievements.length > 0 && (
                    <ul className="mt-1 space-y-0.5">
                      {exp.achievements.map((a, j) => (
                        <li key={j} className="text-xs text-slate-600">→ {a}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </section>
          )}
        </div>

        <div className="w-[220px] flex-shrink-0">
          {skills.length > 0 && (
            <section className="mb-5">
              <h2 className="text-xs font-black uppercase tracking-wider text-red-700 border-b-2 border-red-600 pb-1 mb-2">Core Skills</h2>
              <div className="flex flex-wrap gap-1">
                {skills.map((s, i) => (
                  <span key={i} className="px-2 py-0.5 bg-slate-900 text-white text-[10px] rounded">{s}</span>
                ))}
              </div>
            </section>
          )}

          {education.length > 0 && (
            <section className="mb-5">
              <h2 className="text-xs font-black uppercase tracking-wider text-red-700 border-b-2 border-red-600 pb-1 mb-2">Education</h2>
              {education.map((edu, i) => (
                <div key={i} className="mb-2">
                  <p className="text-xs font-bold">{edu.degree}</p>
                  <p className="text-xs text-slate-500">{edu.institution}</p>
                  <p className="text-xs text-slate-400">{edu.year}</p>
                </div>
              ))}
            </section>
          )}

          {references.length > 0 && (
            <section>
              <h2 className="text-xs font-black uppercase tracking-wider text-red-700 border-b-2 border-red-600 pb-1 mb-2">References</h2>
              {references.map((ref, i) => (
                <div key={i} className="mb-1.5">
                  <p className="text-xs font-semibold">{ref.name}</p>
                  <p className="text-[10px] text-slate-500">{ref.title}</p>
                </div>
              ))}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}