import React from "react";
import { parseResumeData } from "./templateUtils";

// Timeline: Reverse-chronological focus with visual timeline milestones
export default function Timeline({ data }) {
  const d = parseResumeData(data);
  if (!d) return null;
  const { pi, skills, highlights, experience, education, references, summary } = d;

  return (
    <div className="max-w-[800px] mx-auto bg-white text-slate-800 p-8" style={{ minHeight: 1056 }}>
      {/* Header */}
      <div className="border-b-4 border-indigo-600 pb-4 mb-6">
        <h1 className="text-3xl font-bold text-indigo-900">{pi.name || "Your Name"}</h1>
        <p className="text-sm text-slate-500 mt-1">
          {[pi.email, pi.phone, pi.location, pi.linkedin].filter(Boolean).join("  •  ")}
        </p>
      </div>

      {summary && (
        <section className="mb-6 bg-indigo-50 rounded-lg p-4">
          <p className="text-sm leading-6 text-slate-700">{summary}</p>
        </section>
      )}

      {skills.length > 0 && (
        <section className="mb-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-indigo-800 mb-2">Core Competencies</h2>
          <div className="flex flex-wrap gap-1.5">
            {skills.map((s, i) => (
              <span key={i} className="px-2 py-0.5 bg-indigo-100 text-indigo-800 text-xs rounded-full">{s}</span>
            ))}
          </div>
        </section>
      )}

      {/* Timeline Experience */}
      {experience.length > 0 && (
        <section className="mb-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-indigo-800 mb-4">Career Timeline</h2>
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-indigo-200" />
            {experience.map((exp, i) => (
              <div key={i} className="relative pl-8 mb-5 last:mb-0">
                {/* Dot */}
                <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full bg-indigo-600 border-2 border-white shadow" />
                {/* Year badge */}
                <span className="inline-block text-xs bg-indigo-600 text-white px-2 py-0.5 rounded mb-1">{exp.duration}</span>
                <h3 className="text-sm font-bold">{exp.position}</h3>
                <p className="text-xs text-indigo-700 font-medium">{exp.company}{exp.location ? ` — ${exp.location}` : ""}</p>
                {Array.isArray(exp.achievements) && exp.achievements.length > 0 && (
                  <ul className="mt-1.5 space-y-0.5">
                    {exp.achievements.map((a, j) => (
                      <li key={j} className="text-xs text-slate-600">• {a}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {highlights.length > 0 && (
        <section className="mb-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-indigo-800 mb-2">Key Achievements</h2>
          <ul className="space-y-1">
            {highlights.map((h, i) => (
              <li key={i} className="text-xs flex items-start gap-2">
                <span className="text-indigo-500">◆</span> {h}
              </li>
            ))}
          </ul>
        </section>
      )}

      {education.length > 0 && (
        <section className="mb-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-indigo-800 mb-2">Education</h2>
          {education.map((edu, i) => (
            <div key={i} className="flex justify-between mb-2">
              <div>
                <p className="text-sm font-semibold">{edu.degree}</p>
                <p className="text-xs text-slate-500">{edu.institution}</p>
              </div>
              <span className="text-xs text-indigo-600 font-medium">{edu.year}</span>
            </div>
          ))}
        </section>
      )}

      {references.length > 0 && (
        <section>
          <h2 className="text-sm font-bold uppercase tracking-wider text-indigo-800 mb-2">References</h2>
          {references.map((ref, i) => (
            <p key={i} className="text-xs mb-1">
              <span className="font-semibold">{ref.name}</span> — {ref.title}{ref.company ? `, ${ref.company}` : ""}
              {ref.email && <span className="text-slate-400 ml-2">{ref.email}</span>}
            </p>
          ))}
        </section>
      )}
    </div>
  );
}