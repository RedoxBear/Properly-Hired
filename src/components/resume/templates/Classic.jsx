import React from "react";

export default function Classic({ data }) {
  if (!data) return null;
  const pi = data.personal_info || {};
  const skills = data.skills || [];
  const highlights = data.highlights || [];
  const experience = data.experience || [];
  const education = data.education || [];
  const references = data.references || [];
  const summary = data.executive_summary || data.summary || data.professional_summary;

  return (
    <div className="max-w-[800px] mx-auto bg-white text-slate-800 p-8">
      <div className="text-center border-b pb-4">
        <h1 className="text-3xl font-bold">{pi.name || "Your Name"}</h1>
        <p className="text-sm text-slate-600 mt-2">
          {[pi.email, pi.phone, pi.location, pi.linkedin, pi.portfolio].filter(Boolean).join(" | ")}
        </p>
      </div>

      {summary && (
        <section className="mt-6">
          <h2 className="text-lg font-semibold tracking-wide border-b pb-1">Career Summary</h2>
          <p className="mt-3 leading-7">{summary}</p>
        </section>
      )}

      {highlights.length > 0 && (
        <section className="mt-6">
          <h2 className="text-lg font-semibold tracking-wide border-b pb-1">Career Highlights</h2>
          <ul className="mt-3 list-disc list-inside space-y-1">
            {highlights.map((h, i) => (
              <li key={i}>{h}</li>
            ))}
          </ul>
        </section>
      )}

      {skills.length > 0 && (
        <section className="mt-6">
          <h2 className="text-lg font-semibold tracking-wide border-b pb-1">Core Competencies</h2>
          <ul className="mt-3 grid grid-cols-2 gap-1 list-disc list-inside">
            {skills.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </section>
      )}

      {experience.length > 0 && (
        <section className="mt-6">
          <h2 className="text-lg font-semibold tracking-wide border-b pb-1">Professional Experience</h2>
          <div className="mt-3 space-y-4">
            {experience.map((exp, i) => (
              <div key={i}>
                <div className="flex justify-between">
                  <h3 className="font-semibold">
                    {exp.position || ""} {exp.company ? `• ${exp.company}` : ""}
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
          <h2 className="text-lg font-semibold tracking-wide border-b pb-1">Education</h2>
          <div className="mt-3 space-y-3">
            {education.map((edu, i) => (
              <div key={i} className="flex justify-between">
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
          <h2 className="text-lg font-semibold tracking-wide border-b pb-1">Professional References</h2>
          <div className="mt-3 space-y-3">
            {references.map((ref, i) => (
              <div key={i}>
                <div className="flex justify-between">
                  <div className="font-medium">{ref.name}</div>
                  <div className="text-sm text-slate-500">{ref.title}{ref.company ? ` • ${ref.company}` : ""}</div>
                </div>
                <div className="text-sm text-slate-600">
                  {[ref.email, ref.phone, ref.linkedin, ref.github, ref.website].filter(Boolean).join(" | ")}
                </div>
                {Array.isArray(ref.identifiers) && ref.identifiers.length > 0 && (
                  <ul className="mt-1 list-disc list-inside text-sm">
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