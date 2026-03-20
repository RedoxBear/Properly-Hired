import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye } from "lucide-react";
import { cleanResumeText } from "@/components/utils/cleanResumeText";

const clean = (s) => cleanResumeText(s);

export default function ChronologicalPreview({ draft }) {
  if (!draft) return null;
  const pi = draft.personal_info || {};
  const summary = draft.executive_summary || draft.summary || "";
  const experience = draft.experience || [];
  const education = draft.education || [];
  const skills = draft.skills || [];

  return (
    <Card className="border-0 shadow-lg bg-white">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Eye className="w-4 h-4 text-blue-600" />
          Chronological Preview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg p-6 bg-white space-y-4 text-sm max-h-[600px] overflow-auto print:max-h-none">
          {/* Header */}
          {pi.name && <h1 className="text-xl font-bold text-slate-900 text-center">{clean(pi.name)}</h1>}
          {(pi.email || pi.phone || pi.location) && (
            <p className="text-center text-xs text-slate-600">
              {[pi.email, pi.phone, pi.location, pi.linkedin].filter(Boolean).join(" | ")}
            </p>
          )}

          {/* Summary */}
          {summary && (
            <div>
              <h2 className="font-bold text-slate-800 uppercase tracking-wide text-xs border-b border-slate-300 pb-1 mb-2">Professional Summary</h2>
              <p className="text-slate-700 leading-relaxed">{clean(typeof summary === "string" ? summary : summary.join(" "))}</p>
            </div>
          )}

          {/* Skills */}
          {skills.length > 0 && (
            <div>
              <h2 className="font-bold text-slate-800 uppercase tracking-wide text-xs border-b border-slate-300 pb-1 mb-2">Core Competencies</h2>
              <p className="text-slate-700">{skills.join(" • ")}</p>
            </div>
          )}

          {/* Experience with bullets */}
          {experience.length > 0 && (
            <div>
              <h2 className="font-bold text-slate-800 uppercase tracking-wide text-xs border-b border-slate-300 pb-1 mb-2">Professional Experience</h2>
              {experience.map((exp, i) => (
                <div key={i} className="mb-4">
                  <div className="flex items-baseline justify-between flex-wrap gap-x-3">
                    <div>
                      <span className="font-semibold text-slate-800">{exp.position}</span>
                      {exp.company && <span className="text-slate-600"> | {exp.company}</span>}
                      {exp.location && <span className="text-slate-500 text-xs"> — {exp.location}</span>}
                    </div>
                    {exp.duration && <span className="text-xs text-slate-500">{exp.duration}</span>}
                  </div>
                  {(exp.achievements || []).length > 0 && (
                    <ul className="mt-1.5 space-y-1 ml-1">
                      {exp.achievements.map((a, j) => (
                        <li key={j} className="flex items-start gap-2 text-slate-700">
                          <span className="text-blue-400 mt-0.5 flex-shrink-0">▸</span>
                          <span>{clean(a)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Education */}
          {education.length > 0 && (
            <div>
              <h2 className="font-bold text-slate-800 uppercase tracking-wide text-xs border-b border-slate-300 pb-1 mb-2">Education</h2>
              {education.map((edu, i) => (
                <div key={i} className="text-slate-700">
                  {edu.degree}{edu.institution && `, ${edu.institution}`}{edu.year && ` (${edu.year})`}
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}