import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye } from "lucide-react";
import { normalizeAchievementItem } from "@/components/utils/achievementItemUtils";
import { cleanResumeText } from "@/components/utils/cleanResumeText";

const clean = (s) => cleanResumeText(s);

export default function AchievementPreview({ draft }) {
  if (!draft) return null;
  const pi = draft.personal_info || {};
  const summary = draft.executive_summary || draft.summary || "";
  const pillars = draft.career_achievements || [];
  const experience = draft.experience || [];
  const education = draft.education || [];
  const skills = draft.skills || [];

  return (
    <Card className="border-0 shadow-lg bg-white">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Eye className="w-4 h-4 text-amber-600" />
          Achievement-Based Preview
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

          {/* Executive Summary */}
          {summary && (
            <div>
              <h2 className="font-bold text-slate-800 uppercase tracking-wide text-xs border-b border-slate-300 pb-1 mb-2">Executive Summary</h2>
              <p className="text-slate-700 leading-relaxed">{clean(typeof summary === "string" ? summary : summary.join(" "))}</p>
            </div>
          )}

          {/* Career Achievements */}
          {pillars.length > 0 && (
            <div>
              <h2 className="font-bold text-slate-800 uppercase tracking-wide text-xs border-b border-slate-300 pb-1 mb-3">Career Achievements</h2>
              {pillars.map((pillar, pIdx) => (
                <div key={pIdx} className="mb-3">
                  <h3 className="font-semibold text-amber-800 uppercase text-xs tracking-wide mb-1">{clean(pillar.pillar_name || "")}</h3>
                  <ul className="space-y-1 ml-1">
                    {(pillar.items || []).map((item, iIdx) => {
                      const n = normalizeAchievementItem(item);
                      return (
                        <li key={iIdx} className="flex items-start gap-2 text-slate-700">
                          <span className="text-amber-500 mt-0.5 flex-shrink-0">▸</span>
                          <span>{clean(n.text)}</span>
                          {n.formula && (
                            <Badge className="bg-slate-100 text-slate-500 text-[9px] px-1 py-0 ml-1 flex-shrink-0">{n.formula}</Badge>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {/* Skills */}
          {skills.length > 0 && (
            <div>
              <h2 className="font-bold text-slate-800 uppercase tracking-wide text-xs border-b border-slate-300 pb-1 mb-2">Core Competencies</h2>
              <p className="text-slate-700">{skills.join(" • ")}</p>
            </div>
          )}

          {/* Lightweight Experience */}
          {experience.length > 0 && (
            <div>
              <h2 className="font-bold text-slate-800 uppercase tracking-wide text-xs border-b border-slate-300 pb-1 mb-2">Professional Experience</h2>
              {experience.map((exp, i) => (
                <div key={i} className="mb-1.5 flex items-baseline justify-between flex-wrap gap-x-3">
                  <div>
                    <span className="font-medium text-slate-800">{exp.position}</span>
                    {exp.company && <span className="text-slate-600"> | {exp.company}</span>}
                    {exp.location && <span className="text-slate-500 text-xs"> — {exp.location}</span>}
                  </div>
                  {exp.duration && <span className="text-xs text-slate-500">{exp.duration}</span>}
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