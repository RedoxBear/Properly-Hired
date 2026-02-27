import React from "react";
import { parseResumeData, SkillBar, ProfilePhoto } from "./templateUtils";

// Double Column with Logos: Brand-forward experience with company logos area
export default function DoubleColumnLogos({ data }) {
  const d = parseResumeData(data);
  if (!d) return null;
  const { pi, skills, highlights, experience, education, references, summary, profilePhoto, skillLevels } = d;

  return (
    <div className="max-w-[800px] mx-auto bg-white text-slate-800 flex" style={{ minHeight: 1056 }}>
      {/* Left sidebar - warm gray */}
      <div className="w-[260px] bg-stone-100 p-5 flex-shrink-0 border-r border-stone-200">
        {profilePhoto && (
          <div className="flex justify-center mb-4">
            <ProfilePhoto src={profilePhoto} size="w-24 h-24" className="border-stone-300" />
          </div>
        )}

        <h1 className="text-lg font-bold text-stone-900 text-center">{pi.name || "Your Name"}</h1>
        <p className="text-xs text-stone-500 text-center mb-5">{pi.title || ""}</p>

        <div className="mb-5">
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-stone-600 mb-2 border-b border-stone-300 pb-1">Contact</h2>
          <div className="space-y-1 text-xs text-stone-600">
            {pi.email && <p>{pi.email}</p>}
            {pi.phone && <p>{pi.phone}</p>}
            {pi.location && <p>{pi.location}</p>}
            {pi.linkedin && <p className="break-all">{pi.linkedin}</p>}
          </div>
        </div>

        {skills.length > 0 && (
          <div className="mb-5">
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-stone-600 mb-2 border-b border-stone-300 pb-1">Skills</h2>
            {skills.slice(0, 8).map((s, i) => (
              <SkillBar key={i} name={s} level={skillLevels[s] || 65 + (i % 5) * 7} color="bg-rose-500" />
            ))}
          </div>
        )}

        {education.length > 0 && (
          <div>
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-stone-600 mb-2 border-b border-stone-300 pb-1">Education</h2>
            {education.map((edu, i) => (
              <div key={i} className="mb-2">
                <p className="text-xs font-semibold text-stone-800">{edu.degree}</p>
                <p className="text-xs text-stone-500">{edu.institution}, {edu.year}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right content */}
      <div className="flex-1 p-6">
        {summary && (
          <section className="mb-5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-stone-700 border-b-2 border-rose-500 pb-1 mb-2">Profile</h2>
            <p className="text-xs leading-5 text-slate-700">{summary}</p>
          </section>
        )}

        {experience.length > 0 && (
          <section className="mb-5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-stone-700 border-b-2 border-rose-500 pb-1 mb-3">Work Experience</h2>
            {experience.map((exp, i) => (
              <div key={i} className="mb-4 flex gap-3">
                {/* Company logo placeholder */}
                <div className="w-10 h-10 rounded bg-stone-200 flex items-center justify-center text-stone-500 text-xs font-bold flex-shrink-0 mt-0.5">
                  {(exp.company || "").charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-sm font-bold">{exp.position}</h3>
                      <p className="text-xs text-rose-600 font-medium">{exp.company}</p>
                    </div>
                    <span className="text-xs text-slate-400 whitespace-nowrap">{exp.duration}</span>
                  </div>
                  {Array.isArray(exp.achievements) && exp.achievements.length > 0 && (
                    <ul className="mt-1 space-y-0.5">
                      {exp.achievements.map((a, j) => (
                        <li key={j} className="text-xs text-slate-600">• {a}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ))}
          </section>
        )}

        {highlights.length > 0 && (
          <section className="mb-5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-stone-700 border-b-2 border-rose-500 pb-1 mb-2">Achievements</h2>
            {highlights.map((h, i) => (
              <p key={i} className="text-xs mb-1 text-slate-700">▸ {h}</p>
            ))}
          </section>
        )}

        {references.length > 0 && (
          <section>
            <h2 className="text-xs font-bold uppercase tracking-wider text-stone-700 border-b-2 border-rose-500 pb-1 mb-2">References</h2>
            {references.map((ref, i) => (
              <p key={i} className="text-xs mb-1">
                <span className="font-semibold">{ref.name}</span> — {ref.title}
                {ref.company && `, ${ref.company}`}
              </p>
            ))}
          </section>
        )}
      </div>
    </div>
  );
}