import React from "react";
import { cleanMarkdown, parseReportSections } from "@/components/utils/cleanReportText";

/**
 * Renders report text as a clean, professional document.
 * Strips all markdown artifacts and formats with proper typography.
 */
export default function ProfessionalReportRenderer({ text, accentColor = "slate" }) {
  if (!text) return null;

  const sections = parseReportSections(text);

  // If parsing produced nothing useful, fall back to cleaned plain text
  if (sections.length === 0) {
    return (
      <div className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
        {cleanMarkdown(text)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {sections.map((section, idx) => (
        <div key={idx}>
          {section.title && (
            <h3
              className={`text-sm font-semibold uppercase tracking-widest text-${accentColor}-600 dark:text-${accentColor}-400 border-b border-border pb-2 mb-3`}
            >
              {section.title}
            </h3>
          )}
          <div className="text-sm text-foreground leading-[1.75] whitespace-pre-wrap">
            {section.body}
          </div>
        </div>
      ))}
    </div>
  );
}