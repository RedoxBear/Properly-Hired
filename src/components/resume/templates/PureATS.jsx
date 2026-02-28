import React from "react";
import { parseResumeData } from "./templateUtils";

// Pure ATS: Minimalist and fully ATS-optimized, zero styling, plain text feel
export default function PureATS({ data }) {
  const d = parseResumeData(data);
  if (!d) return null;
  const { pi, skills, highlights, experience, education, references, summary, careerAchievements } = d;

  return (
    <div className="max-w-[800px] mx-auto bg-white text-black p-8" style={{ fontFamily: "'Courier New', Courier, monospace", minHeight: 1056 }}>
      {/* Header - left aligned, plain */}
      <div className="mb-4">
        <h1 className="text-xl font-bold">{pi.name || "YOUR NAME"}</h1>
        <p className="text-xs">
          {[pi.email, pi.phone, pi.location].filter(Boolean).join(" | ")}
        </p>
        {(pi.linkedin || pi.portfolio) && (
          <p className="text-xs">{[pi.linkedin, pi.portfolio].filter(Boolean).join(" | ")}</p>
        )}
      </div>

      <hr className="border-black mb-3" />

      {summary && (
        <section className="mb-4">
          <h2 className="text-xs font-bold uppercase mb-1">SUMMARY</h2>
          <p className="text-xs leading-5">{summary}</p>
        </section>
      )}

      {careerAchievements.length > 0 && (
        <section className="mb-4">
          <h2 className="text-xs font-bold uppercase mb-1">CAREER ACHIEVEMENTS</h2>
          {careerAchievements.map((pillar, i) => (
            <div key={i} className="mb-2">
              <p className="text-xs font-bold uppercase">{pillar.pillar_name}</p>
              {(pillar.items || []).map((item, j) => (
                <p key={j} className="text-xs ml-2">- {item}</p>
              ))}
            </div>
          ))}
        </section>
      )}

      {skills.length > 0 && (
        <section className="mb-4">
          <h2 className="text-xs font-bold uppercase mb-1">SKILLS</h2>
          <p className="text-xs">{skills.join(", ")}</p>
        </section>
      )}

      {experience.length > 0 && (
        <section className="mb-4">
          <h2 className="text-xs font-bold uppercase mb-2">EXPERIENCE</h2>
          {experience.map((exp, i) => (
            <div key={i} className="mb-3">
              <p className="text-xs">
                <strong>{exp.position}</strong> | {exp.company}{exp.location ? ` | ${exp.location}` : ""} | {exp.duration}
              </p>
              {Array.isArray(exp.achievements) && exp.achievements.length > 0 && (
                <div className="mt-0.5 ml-2">
                  {exp.achievements.map((a, j) => (
                    <p key={j} className="text-xs">- {a}</p>
                  ))}
                </div>
              )}
            </div>
          ))}
        </section>
      )}

      {highlights.length > 0 && (
        <section className="mb-4">
          <h2 className="text-xs font-bold uppercase mb-1">ACHIEVEMENTS</h2>
          {highlights.map((h, i) => (
            <p key={i} className="text-xs">- {h}</p>
          ))}
        </section>
      )}

      {education.length > 0 && (
        <section className="mb-4">
          <h2 className="text-xs font-bold uppercase mb-1">EDUCATION</h2>
          {education.map((edu, i) => (
            <p key={i} className="text-xs">
              {edu.degree} | {edu.institution} | {edu.year}
            </p>
          ))}
        </section>
      )}

      {references.length > 0 && (
        <section>
          <h2 className="text-xs font-bold uppercase mb-1">REFERENCES</h2>
          {references.map((ref, i) => (
            <p key={i} className="text-xs">
              {ref.name} | {ref.title}{ref.company ? ` | ${ref.company}` : ""}
              {(ref.email || ref.phone) && ` | ${[ref.email, ref.phone].filter(Boolean).join(" | ")}`}
            </p>
          ))}
        </section>
      )}
    </div>
  );
}