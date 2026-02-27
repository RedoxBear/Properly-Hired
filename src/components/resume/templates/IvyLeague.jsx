import React from "react";
import { parseResumeData } from "./templateUtils";

// Ivy League: Traditional academic style, single column, serif-like feel, clean borders
export default function IvyLeague({ data }) {
  const d = parseResumeData(data);
  if (!d) return null;
  const { pi, skills, highlights, experience, education, references, summary } = d;

  return (
    <div className="max-w-[800px] mx-auto bg-white text-slate-900 p-10" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
      {/* Header - centered, elegant */}
      <div className="text-center border-b-2 border-slate-900 pb-4 mb-6">
        <h1 className="text-3xl font-bold tracking-wide uppercase">{pi.name || "Your Name"}</h1>
        <p className="text-sm text-slate-600 mt-2 tracking-wide">
          {[pi.email, pi.phone, pi.location].filter(Boolean).join("  •  ")}
        </p>
        {(pi.linkedin || pi.portfolio) && (
          <p className="text-xs text-slate-500 mt-1">
            {[pi.linkedin, pi.portfolio].filter(Boolean).join("  |  ")}
          </p>
        )}
      </div>

      {summary && (
        <section className="mb-6">
          <h2 className="text-sm font-bold uppercase tracking-[0.2em] border-b border-slate-400 pb-1 mb-3">Professional Summary</h2>
          <p className="text-sm leading-6">{summary}</p>
        </section>
      )}

      {education.length > 0 && (
        <section className="mb-6">
          <h2 className="text-sm font-bold uppercase tracking-[0.2em] border-b border-slate-400 pb-1 mb-3">Education</h2>
          {education.map((edu, i) => (
            <div key={i} className="flex justify-between mb-2">
              <div>
                <p className="text-sm font-semibold">{edu.degree}</p>
                <p className="text-sm text-slate-600 italic">{edu.institution}</p>
              </div>
              <span className="text-sm text-slate-500">{edu.year}</span>
            </div>
          ))}
        </section>
      )}

      {experience.length > 0 && (
        <section className="mb-6">
          <h2 className="text-sm font-bold uppercase tracking-[0.2em] border-b border-slate-400 pb-1 mb-3">Professional Experience</h2>
          {experience.map((exp, i) => (
            <div key={i} className="mb-5">
              <div className="flex justify-between">
                <div>
                  <h3 className="text-sm font-bold">{exp.position}</h3>
                  <p className="text-sm italic text-slate-600">{exp.company}{exp.location ? `, ${exp.location}` : ""}</p>
                </div>
                <span className="text-sm text-slate-500">{exp.duration}</span>
              </div>
              {Array.isArray(exp.achievements) && exp.achievements.length > 0 && (
                <ul className="mt-2 space-y-1 ml-4">
                  {exp.achievements.map((a, j) => (
                    <li key={j} className="text-sm text-slate-700 list-disc">{a}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </section>
      )}

      {highlights.length > 0 && (
        <section className="mb-6">
          <h2 className="text-sm font-bold uppercase tracking-[0.2em] border-b border-slate-400 pb-1 mb-3">Key Achievements</h2>
          <ul className="space-y-1 ml-4">
            {highlights.map((h, i) => (
              <li key={i} className="text-sm list-disc">{h}</li>
            ))}
          </ul>
        </section>
      )}

      {skills.length > 0 && (
        <section className="mb-6">
          <h2 className="text-sm font-bold uppercase tracking-[0.2em] border-b border-slate-400 pb-1 mb-3">Skills & Competencies</h2>
          <p className="text-sm leading-6">{skills.join("  •  ")}</p>
        </section>
      )}

      {references.length > 0 && (
        <section>
          <h2 className="text-sm font-bold uppercase tracking-[0.2em] border-b border-slate-400 pb-1 mb-3">References</h2>
          <div className="grid grid-cols-2 gap-4">
            {references.map((ref, i) => (
              <div key={i}>
                <p className="text-sm font-semibold">{ref.name}</p>
                <p className="text-xs text-slate-600">{ref.title}{ref.company ? `, ${ref.company}` : ""}</p>
                <p className="text-xs text-slate-500">{[ref.email, ref.phone].filter(Boolean).join(" | ")}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}