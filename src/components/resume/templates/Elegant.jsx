import React from "react";
import { parseResumeData, SkillDots, ProfilePhoto } from "./templateUtils";

// Elegant: Right-side highlight panel, clean body, teal/green accent
export default function Elegant({ data }) {
  const d = parseResumeData(data);
  if (!d) return null;
  const { pi, skills, highlights, experience, education, references, summary, profilePhoto, skillLevels } = d;

  return (
    <div className="max-w-[800px] mx-auto bg-white text-slate-800 flex" style={{ minHeight: 1056 }}>
      {/* Main Content (Left) */}
      <div className="flex-1 p-7">
        <div className="mb-5">
          <h1 className="text-2xl font-bold text-slate-900">{pi.name || "Your Name"}</h1>
          <p className="text-sm text-teal-700 font-medium mt-0.5">{pi.title || "Professional"}</p>
        </div>

        {summary && (
          <section className="mb-5">
            <h2 className="text-xs font-bold uppercase tracking-widest text-teal-700 mb-2 flex items-center gap-2">
              <span className="w-4 h-px bg-teal-600" /> About Me
            </h2>
            <p className="text-xs leading-5 text-slate-700">{summary}</p>
          </section>
        )}

        {experience.length > 0 && (
          <section className="mb-5">
            <h2 className="text-xs font-bold uppercase tracking-widest text-teal-700 mb-3 flex items-center gap-2">
              <span className="w-4 h-px bg-teal-600" /> Work Experience
            </h2>
            {experience.map((exp, i) => (
              <div key={i} className="mb-4 relative pl-4 border-l-2 border-teal-200">
                <div className="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-teal-600" />
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-sm font-semibold">{exp.position}</h3>
                    <p className="text-xs text-teal-700">{exp.company}</p>
                  </div>
                  <span className="text-xs text-slate-400 whitespace-nowrap">{exp.duration}</span>
                </div>
                {exp.location && <p className="text-xs text-slate-500">{exp.location}</p>}
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

        {education.length > 0 && (
          <section className="mb-5">
            <h2 className="text-xs font-bold uppercase tracking-widest text-teal-700 mb-2 flex items-center gap-2">
              <span className="w-4 h-px bg-teal-600" /> Education
            </h2>
            {education.map((edu, i) => (
              <div key={i} className="mb-2">
                <div className="flex justify-between">
                  <p className="text-sm font-semibold">{edu.degree}</p>
                  <span className="text-xs text-slate-400">{edu.year}</span>
                </div>
                <p className="text-xs text-slate-500">{edu.institution}</p>
              </div>
            ))}
          </section>
        )}
      </div>

      {/* Right Sidebar */}
      <div className="w-[240px] bg-teal-50 p-5 flex-shrink-0 border-l border-teal-100">
        {profilePhoto && (
          <div className="flex justify-center mb-4">
            <ProfilePhoto src={profilePhoto} size="w-24 h-24" className="border-teal-200" />
          </div>
        )}

        {/* Contact */}
        <div className="mb-5">
          <h2 className="text-xs font-bold uppercase tracking-widest text-teal-800 mb-2">Contact</h2>
          {pi.email && <p className="text-xs mb-1 text-slate-600">✉ {pi.email}</p>}
          {pi.phone && <p className="text-xs mb-1 text-slate-600">☎ {pi.phone}</p>}
          {pi.location && <p className="text-xs mb-1 text-slate-600">📍 {pi.location}</p>}
          {pi.linkedin && <p className="text-xs mb-1 text-slate-600 break-all">{pi.linkedin}</p>}
        </div>

        {/* Skills */}
        {skills.length > 0 && (
          <div className="mb-5">
            <h2 className="text-xs font-bold uppercase tracking-widest text-teal-800 mb-2">Skills</h2>
            {skills.slice(0, 8).map((s, i) => (
              <SkillDots key={i} name={s} level={Math.round((skillLevels[s] || 70 + (i % 3) * 10) / 20)} filledColor="bg-teal-600" />
            ))}
          </div>
        )}

        {/* Highlights in sidebar */}
        {highlights.length > 0 && (
          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest text-teal-800 mb-2">Highlights</h2>
            {highlights.slice(0, 5).map((h, i) => (
              <p key={i} className="text-xs text-slate-600 mb-1.5">▹ {h}</p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}