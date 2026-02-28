import React from "react";
import { parseResumeData } from "./templateUtils";

// Prime ATS: ATS-friendly with balanced sections, no graphics, clear hierarchy
export default function PrimeATS({ data }) {
  const d = parseResumeData(data);
  if (!d) return null;
  const { pi, skills, highlights, experience, education, references, summary, careerAchievements } = d;

  return (
    <div className="max-w-[800px] mx-auto bg-white text-black p-8" style={{ fontFamily: "Arial, Helvetica, sans-serif", minHeight: 1056 }}>
      {/* Header */}
      <div className="text-center mb-4 pb-3 border-b-2 border-black">
        <h1 className="text-2xl font-bold uppercase tracking-wide">{pi.name || "YOUR NAME"}</h1>
        <p className="text-sm mt-1">
          {[pi.email, pi.phone, pi.location].filter(Boolean).join(" | ")}
        </p>
        {(pi.linkedin || pi.portfolio) && (
          <p className="text-sm text-gray-600">
            {[pi.linkedin, pi.portfolio].filter(Boolean).join(" | ")}
          </p>
        )}
      </div>

      {summary && (
        <section className="mb-4">
          <h2 className="text-sm font-bold uppercase border-b border-gray-400 pb-0.5 mb-2">PROFESSIONAL SUMMARY</h2>
          <p className="text-sm leading-6">{summary}</p>
        </section>
      )}

      {careerAchievements.length > 0 && (
        <section className="mb-4">
          <h2 className="text-sm font-bold uppercase border-b border-gray-400 pb-0.5 mb-2">CAREER ACHIEVEMENTS</h2>
          {careerAchievements.map((pillar, i) => (
            <div key={i} className="mb-3">
              <h3 className="text-sm font-bold uppercase mt-2 mb-1">{pillar.pillar_name}</h3>
              <ul className="space-y-0.5 ml-4">
                {(pillar.items || []).map((item, j) => (
                  <li key={j} className="text-sm list-disc">{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      )}

      {skills.length > 0 && (
        <section className="mb-4">
          <h2 className="text-sm font-bold uppercase border-b border-gray-400 pb-0.5 mb-2">CORE COMPETENCIES</h2>
          <div className="grid grid-cols-3 gap-x-4 gap-y-0.5">
            {skills.map((s, i) => (
              <p key={i} className="text-sm">• {s}</p>
            ))}
          </div>
        </section>
      )}

      {experience.length > 0 && (
        <section className="mb-4">
          <h2 className="text-sm font-bold uppercase border-b border-gray-400 pb-0.5 mb-2">PROFESSIONAL EXPERIENCE</h2>
          {experience.map((exp, i) => (
            <div key={i} className="mb-4">
              <div className="flex justify-between">
                <span className="text-sm font-bold">{exp.position}</span>
                <span className="text-sm">{exp.duration}</span>
              </div>
              <p className="text-sm italic">{exp.company}{exp.location ? `, ${exp.location}` : ""}</p>
              {Array.isArray(exp.achievements) && exp.achievements.length > 0 && (
                <ul className="mt-1 space-y-0.5 ml-4">
                  {exp.achievements.map((a, j) => (
                    <li key={j} className="text-sm list-disc">{a}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </section>
      )}

      {highlights.length > 0 && (
        <section className="mb-4">
          <h2 className="text-sm font-bold uppercase border-b border-gray-400 pb-0.5 mb-2">KEY ACHIEVEMENTS</h2>
          <ul className="space-y-0.5 ml-4">
            {highlights.map((h, i) => (
              <li key={i} className="text-sm list-disc">{h}</li>
            ))}
          </ul>
        </section>
      )}

      {education.length > 0 && (
        <section className="mb-4">
          <h2 className="text-sm font-bold uppercase border-b border-gray-400 pb-0.5 mb-2">EDUCATION</h2>
          {education.map((edu, i) => (
            <div key={i} className="flex justify-between mb-1">
              <span className="text-sm"><strong>{edu.degree}</strong> — {edu.institution}</span>
              <span className="text-sm">{edu.year}</span>
            </div>
          ))}
        </section>
      )}

      {references.length > 0 && (
        <section>
          <h2 className="text-sm font-bold uppercase border-b border-gray-400 pb-0.5 mb-2">REFERENCES</h2>
          {references.map((ref, i) => (
            <p key={i} className="text-sm mb-1">
              <strong>{ref.name}</strong> — {ref.title}{ref.company ? `, ${ref.company}` : ""}
              {(ref.email || ref.phone) && ` — ${[ref.email, ref.phone].filter(Boolean).join(", ")}`}
            </p>
          ))}
        </section>
      )}
    </div>
  );
}