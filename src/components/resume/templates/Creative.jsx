import React from "react";
import { parseResumeData, ProfilePhoto, SkillBar } from "./templateUtils";

// Creative: Inviting, storytelling feel, left sidebar purple/gradient, playful icons
export default function Creative({ data }) {
  const d = parseResumeData(data);
  if (!d) return null;
  const { pi, skills, highlights, experience, education, references, summary, profilePhoto, skillLevels } = d;

  return (
    <div className="max-w-[800px] mx-auto bg-white text-slate-800 flex" style={{ minHeight: 1056 }}>
      {/* Left sidebar - purple gradient */}
      <div className="w-[250px] flex-shrink-0 text-white p-5" style={{ background: "linear-gradient(180deg, #7c3aed 0%, #4f46e5 50%, #3730a3 100%)" }}>
        {profilePhoto && (
          <div className="flex justify-center mb-4">
            <ProfilePhoto src={profilePhoto} size="w-24 h-24" className="border-purple-300" />
          </div>
        )}
        <h1 className="text-lg font-bold text-center">{pi.name || "Your Name"}</h1>
        <p className="text-xs text-purple-200 text-center mb-5">{pi.title || ""}</p>

        <div className="mb-5">
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-purple-200 mb-2">📬 Contact</h2>
          <div className="space-y-1 text-xs text-purple-100">
            {pi.email && <p>{pi.email}</p>}
            {pi.phone && <p>{pi.phone}</p>}
            {pi.location && <p>{pi.location}</p>}
            {pi.linkedin && <p className="break-all">{pi.linkedin}</p>}
          </div>
        </div>

        {skills.length > 0 && (
          <div className="mb-5">
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-purple-200 mb-2">🎯 Skills</h2>
            {skills.slice(0, 8).map((s, i) => (
              <SkillBar key={i} name={s} level={skillLevels[s] || 60 + (i % 5) * 8} color="bg-yellow-400" />
            ))}
          </div>
        )}

        {education.length > 0 && (
          <div className="mb-5">
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-purple-200 mb-2">🎓 Education</h2>
            {education.map((edu, i) => (
              <div key={i} className="mb-2">
                <p className="text-xs font-semibold">{edu.degree}</p>
                <p className="text-xs text-purple-200">{edu.institution}</p>
                <p className="text-xs text-purple-300">{edu.year}</p>
              </div>
            ))}
          </div>
        )}

        {highlights.length > 0 && (
          <div>
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-purple-200 mb-2">✨ Highlights</h2>
            {highlights.slice(0, 4).map((h, i) => (
              <p key={i} className="text-xs text-purple-100 mb-1">› {h}</p>
            ))}
          </div>
        )}
      </div>

      {/* Right main */}
      <div className="flex-1 p-7">
        {summary && (
          <section className="mb-5">
            <h2 className="text-sm font-bold text-purple-800 mb-2">🧭 My Story</h2>
            <p className="text-xs leading-5 text-slate-700 italic">{summary}</p>
          </section>
        )}

        {experience.length > 0 && (
          <section className="mb-5">
            <h2 className="text-sm font-bold text-purple-800 mb-3">💼 Experience</h2>
            {experience.map((exp, i) => (
              <div key={i} className="mb-4 p-3 rounded-lg bg-purple-50 border border-purple-100">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-sm font-bold text-purple-900">{exp.position}</h3>
                    <p className="text-xs text-purple-700">{exp.company}</p>
                  </div>
                  <span className="text-xs text-purple-400">{exp.duration}</span>
                </div>
                {Array.isArray(exp.achievements) && exp.achievements.length > 0 && (
                  <ul className="mt-2 space-y-0.5">
                    {exp.achievements.map((a, j) => (
                      <li key={j} className="text-xs text-slate-600">✦ {a}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </section>
        )}

        {references.length > 0 && (
          <section>
            <h2 className="text-sm font-bold text-purple-800 mb-2">🤝 References</h2>
            {references.map((ref, i) => (
              <div key={i} className="mb-2 text-xs">
                <span className="font-semibold">{ref.name}</span> — {ref.title}{ref.company ? `, ${ref.company}` : ""}
                <p className="text-slate-400">{[ref.email, ref.phone].filter(Boolean).join(" | ")}</p>
              </div>
            ))}
          </section>
        )}
      </div>
    </div>
  );
}