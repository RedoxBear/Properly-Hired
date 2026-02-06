import React from "react";

export default function Modern({ data }) {
  if (!data) return null;
  const pi = data.personal_info || {};
  const skills = data.skills || [];
  const highlights = data.highlights || [];
  const experience = data.experience || [];
  const education = data.education || [];
  const references = data.references || [];
  const summary = data.executive_summary || data.summary || data.professional_summary;

  return (
    <div className="max-w-[800px] mx-auto bg-white text-slate-900">
      <div className="p-8 bg-gradient-to-r from-blue-600 to-cyan-600 text-white">
        <h1 className="text-3xl font-extrabold tracking-tight">{pi.name || "Your Name"}</h1>
        <p className="text-sm mt-2 opacity-90">
          {[pi.email, pi.phone, pi.location, pi.linkedin, pi.portfolio].filter(Boolean).join(" • ")}
        </p>
      </div>

      <div className="p-8">
        {summary && (
          <section className="mt-2">
            <h2 className="text-base font-semibold uppercase tracking-wider text-blue-700">Career Summary</h2>
            <p className="mt-2 leading-7">{summary}</p>
          </section>
        )}

        {highlights.length > 0 && (
          <section className="mt-6">
            <h2 className="text-base font-semibold uppercase tracking-wider text-blue-700">Career Highlights</h2>
            <ul className="mt-3 space-y-2">
              {highlights.map((h, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>{h}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {skills.length > 0 && (
          <section className="mt-6">
            <h2 className="text-base font-semibold uppercase tracking-wider text-blue-700">Core Competencies</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {skills.map((s, i) => (
                <span key={i} className="px-2 py-1 rounded-full bg-blue-50 text-blue-800 text-xs border border-blue-200">
                  {s}
                </span>
              ))}
            </div>
          </section>
        )}

        {experience.length > 0 && (
          <section className="mt-6">
            <h2 className="text-base font-semibold uppercase tracking-wider text-blue-700">Professional Experience</h2>
            <div className="mt-3 space-y-5">
              {experience.map((exp, i) => (
                <div key={i} className="p-4 rounded-lg border border-slate-200">
                  <div className="flex justify-between">
                    <h3 className="font-semibold">
                      {exp.position || ""} {exp.company ? <span className="text-slate-500">• {exp.company}</span> : ""}
                    </h3>
                    <span className="text-sm text-slate-500">{exp.duration}</span>
                  </div>
                  {exp.location && <p className="text-sm text-slate-600">{exp.location}</p>}
                  {Array.isArray(exp.achievements) && exp.achievements.length > 0 && (
                    <ul className="mt-2 list-disc list-inside space-y-1">
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
            <h2 className="text-base font-semibold uppercase tracking-wider text-blue-700">Education</h2>
            <div className="mt-3 space-y-3">
              {education.map((edu, i) => (
                <div key={i} className="flex justify-between border-b pb-2">
                  <div>
                    <p className="font-medium">{edu.degree}</p>
                    <p className="text-sm text-slate-600">{edu.institution}</p>
                  </div>
                  <div className="text-sm text-slate-500">{edu.year}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {references.length > 0 && (
          <section className="mt-6">
            <h2 className="text-base font-semibold uppercase tracking-wider text-blue-700">Professional References</h2>
            <div className="mt-3 space-y-3">
              {references.map((ref, i) => (
                <div key={i} className="p-3 rounded-lg border border-slate-200">
                  <div className="flex justify-between">
                    <div className="font-medium">{ref.name}</div>
                    <span className="text-sm text-slate-500">
                      {ref.title}{ref.company ? <span className="text-slate-400"> • {ref.company}</span> : ""}
                    </span>
                  </div>
                  <div className="text-sm text-slate-600">
                    {[ref.email, ref.phone, ref.linkedin, ref.github, ref.website].filter(Boolean).join(" • ")}
                  </div>
                  {Array.isArray(ref.identifiers) && ref.identifiers.length > 0 && (
                    <ul className="mt-2 list-disc list-inside text-sm">
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
    </div>
  );
}