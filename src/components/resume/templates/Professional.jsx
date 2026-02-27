import React from "react";
import { parseResumeData, SkillBar, ProfilePhoto } from "./templateUtils";

// Professional: Organized with a strong sidebar color band, navy blue sidebar
export default function Professional({ data }) {
  const d = parseResumeData(data);
  if (!d) return null;
  const { pi, skills, highlights, experience, education, references, summary, profilePhoto, skillLevels } = d;

  return (
    <div className="max-w-[800px] mx-auto bg-white text-slate-800 flex" style={{ minHeight: 1056 }}>
      {/* Left sidebar - navy */}
      <div className="w-[240px] flex-shrink-0 p-5 text-white" style={{ backgroundColor: "#1e3a5f" }}>
        {profilePhoto && (
          <div className="flex justify-center mb-4">
            <ProfilePhoto src={profilePhoto} size="w-24 h-24" className="border-[#1e3a5f]" />
          </div>
        )}

        <div className="mb-5">
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-slate-300 mb-2 border-b border-slate-500 pb-1">Contact</h2>
          <div className="space-y-1.5 text-xs">
            {pi.email && <p className="text-slate-200">{pi.email}</p>}
            {pi.phone && <p className="text-slate-200">{pi.phone}</p>}
            {pi.location && <p className="text-slate-200">{pi.location}</p>}
            {pi.linkedin && <p className="text-slate-200 break-all">{pi.linkedin}</p>}
          </div>
        </div>

        {skills.length > 0 && (
          <div className="mb-5">
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-slate-300 mb-2 border-b border-slate-500 pb-1">Skills</h2>
            {skills.slice(0, 8).map((s, i) => (
              <SkillBar key={i} name={s} level={skillLevels[s] || 60 + (i % 5) * 8} color="bg-sky-400" />
            ))}
          </div>
        )}

        {education.length > 0 && (
          <div className="mb-5">
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-slate-300 mb-2 border-b border-slate-500 pb-1">Education</h2>
            {education.map((edu, i) => (
              <div key={i} className="mb-2">
                <p className="text-xs font-semibold">{edu.degree}</p>
                <p className="text-xs text-slate-300">{edu.institution}</p>
                <p className="text-xs text-slate-400">{edu.year}</p>
              </div>
            ))}
          </div>
        )}

        {references.length > 0 && (
          <div>
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-slate-300 mb-2 border-b border-slate-500 pb-1">References</h2>
            {references.map((ref, i) => (
              <div key={i} className="mb-2">
                <p className="text-xs font-semibold">{ref.name}</p>
                <p className="text-xs text-slate-400">{ref.title}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right content */}
      <div className="flex-1 p-6">
        <div className="mb-5">
          <h1 className="text-2xl font-bold text-slate-900">{pi.name || "Your Name"}</h1>
          <p className="text-sm font-medium" style={{ color: "#1e3a5f" }}>{pi.title || ""}</p>
        </div>

        {summary && (
          <section className="mb-5">
            <h2 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "#1e3a5f" }}>About Me</h2>
            <p className="text-xs leading-5 text-slate-700">{summary}</p>
          </section>
        )}

        {highlights.length > 0 && (
          <section className="mb-5">
            <h2 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "#1e3a5f" }}>Key Achievements</h2>
            {highlights.map((h, i) => (
              <p key={i} className="text-xs text-slate-700 mb-1">✦ {h}</p>
            ))}
          </section>
        )}

        {experience.length > 0 && (
          <section>
            <h2 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "#1e3a5f" }}>Professional Experience</h2>
            {experience.map((exp, i) => (
              <div key={i} className="mb-4 pb-3 border-b border-slate-100 last:border-0">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-sm font-bold">{exp.position}</h3>
                    <p className="text-xs font-medium" style={{ color: "#1e3a5f" }}>{exp.company}</p>
                  </div>
                  <span className="text-xs text-slate-400">{exp.duration}</span>
                </div>
                {Array.isArray(exp.achievements) && exp.achievements.length > 0 && (
                  <ul className="mt-1 space-y-0.5">
                    {exp.achievements.map((a, j) => (
                      <li key={j} className="text-xs text-slate-600">• {a}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </section>
        )}
      </div>
    </div>
  );
}