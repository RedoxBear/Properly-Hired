import React from "react";

export default function Minimal({ data }) {
  if (!data) return null;
  const pi = data.personal_info || {};
  const skills = data.skills || [];
  const highlights = data.highlights || [];
  const experience = data.experience || [];
  const education = data.education || [];
  const references = data.references || [];
  const summary = data.executive_summary || data.summary || data.professional_summary;

  return (
    <div className="max-w-[800px] mx-auto bg-white text-slate-900 p-10">
      <header>
        <h1 className="text-3xl font-light tracking-tight">{pi.name || "Your Name"}</h1>
        <p className="text-xs text-slate-500 mt-2">
          {[pi.email, pi.phone, pi.location, pi.linkedin, pi.portfolio].filter(Boolean).join(" · ")}
        </p>
      </header>

      {summary && (
        <section className="mt-6">
          <h2 className="text-sm font-semibold tracking-wide text-slate-700">Career Summary</h2>
          <p className="mt-2 leading-7">{summary}</p>
        </section>
      )}

      {highlights.length > 0 && (
        <section className="mt-6">
          <h2 className="text-sm font-semibold tracking-wide text-slate-700">Career Highlights</h2>
          <ul className="mt-2 space-y-1">
            {highlights.map((h, i) => (
              <li key={i} className="text-sm">• {h}</li>
            ))}
          </ul>
        </section>
      )}

      {skills.length > 0 && (
        <section className="mt-6">
          <h2 className="text-sm font-semibold tracking-wide text-slate-700">Core Competencies</h2>
          <p className="mt-2">{skills.join(" • ")}</p>
        </section>
      )}

      {experience.length > 0 && (
        <section className="mt-6">
          <h2 className="text-sm font-semibold tracking-wide text-slate-700">Professional Experience</h2>
          <div className="mt-2 space-y-4">
            {experience.map((exp, i) => (
              <div key={i}>
                <div className="flex justify-between">
                  <span>{exp.position}</span>
                  <span className="text-xs text-slate-500">{exp.duration}</span>
                </div>
                <div className="text-sm text-slate-600">{exp.company}{exp.location ? `, ${exp.location}` : ""}</div>
                {Array.isArray(exp.achievements) && exp.achievements.length > 0 && (
                  <ul className="mt-1 list-disc list-inside space-y-1">
                    {exp.achievements.map((a, j) => (
                      <li key={j}>{a}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {education.length > 0 && (
        <section className="mt-6">
          <h2 className="text-sm font-semibold tracking-wide text-slate-700">Education</h2>
          <div className="mt-2 space-y-2">
            {education.map((edu, i) => (
              <div key={i} className="flex justify-between">
                <span>{edu.degree}, {edu.institution}</span>
                <span className="text-xs text-slate-500">{edu.year}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {references.length > 0 && (
        <section className="mt-6">
          <h2 className="text-sm font-semibold tracking-wide text-slate-700">Professional References</h2>
          <div className="mt-2 space-y-2">
            {references.map((ref, i) => (
              <div key={i} className="text-sm">
                <div className="flex justify-between">
                  <span className="font-medium">{ref.name}</span>
                  <span className="text-xs text-slate-500">{ref.title}{ref.company ? ` • ${ref.company}` : ""}</span>
                </div>
                <div className="text-xs text-slate-600">
                  {[ref.email, ref.phone, ref.linkedin, ref.github, ref.website].filter(Boolean).join(" · ")}
                </div>
                {Array.isArray(ref.identifiers) && ref.identifiers.length > 0 && (
                  <ul className="list-disc list-inside text-xs mt-1">
                    {ref.identifiers.map((id, j) => (
                      <li key={j}>{id.type ? `${id.type}: ` : ""}{id.value}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}