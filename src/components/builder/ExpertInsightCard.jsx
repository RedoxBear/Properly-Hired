import React from "react";
import { FileText, Search, Lightbulb, ChevronRight } from "lucide-react";

export default function ExpertInsightCard({ insight }) {
  if (!insight) return null;

  const isKyle = insight.expert === "kyle";
  const name = isKyle ? "Kyle" : "Simon";
  const Icon = isKyle ? FileText : Search;
  const bgClass = isKyle
    ? "bg-blue-50 border-blue-200 dark:bg-blue-950/40 dark:border-blue-800"
    : "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800";
  const nameColor = isKyle
    ? "text-blue-700 dark:text-blue-300"
    : "text-emerald-700 dark:text-emerald-300";
  const textColor = isKyle
    ? "text-blue-900 dark:text-blue-100"
    : "text-emerald-900 dark:text-emerald-100";

  return (
    <div className={`rounded-xl border p-3 space-y-2 ${bgClass}`}>
      <div className="flex items-center gap-2">
        <Icon className={`w-4 h-4 ${nameColor}`} />
        <span className={`text-xs font-semibold uppercase tracking-wide ${nameColor}`}>
          {name}'s Insight
        </span>
      </div>

      {insight.summary && (
        <p className={`text-sm ${textColor}`}>{insight.summary}</p>
      )}

      {insight.action_items?.length > 0 && (
        <ul className="space-y-1">
          {insight.action_items.map((item, i) => (
            <li key={i} className={`flex items-start gap-1.5 text-xs ${textColor}`}>
              <ChevronRight className="w-3 h-3 mt-0.5 shrink-0 opacity-60" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}

      {insight.rewrite_suggestion && (
        <div className={`flex items-start gap-1.5 text-xs italic ${textColor} opacity-80 pt-1 border-t border-current/10`}>
          <Lightbulb className="w-3 h-3 mt-0.5 shrink-0" />
          <span>{insight.rewrite_suggestion}</span>
        </div>
      )}
    </div>
  );
}