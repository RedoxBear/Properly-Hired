
import React from "react";

export default function ResumePreview({ cv }) {
  return (
    <div className="space-y-6 print:space-y-0">
      <div className="bg-white p-6 rounded-2xl border shadow-sm print:shadow-none print:p-0">
        <Header lines={cv.header || []} />
        {cv.summary && <Section title="Career Summary" lines={cv.summary} />}

        {/* Career Highlights & Achievements (cv.extra) moved before Core Competencies */}
        {cv.extra && cv.extra.map((x, i) => (
          <Section key={i} title={x.heading || "Career Highlights & Achievements"} lines={x.lines || []} />
        ))}

        {/* Core Competencies (cv.skills) now appears after Career Highlights */}
        {cv.skills && <Section title="Core Competencies" lines={cv.skills} />}

        <Experience items={cv.experience || []} />

        {cv.education && <Section title="Education" lines={cv.education} />}
      </div>
    </div>
  );
}

function Header({ lines }) {
  return (
    <div className="border-b pb-3 mb-3">
      <div className="text-2xl font-bold">{lines[0] || ""}</div>
      <div className="text-sm text-slate-600">{(lines || []).slice(1).join("  |  ")}</div>
    </div>
  );
}

function Section({ title, lines }) {
  return (
    <section className="mb-4 break-inside-avoid">
      <h3 className="font-semibold text-slate-800 mb-1">{title}</h3>
      <ul className="list-disc pl-5 text-sm leading-6">
        {lines.map((l, i) => <li key={i}>{l}</li>)}
      </ul>
    </section>
  );
}

function Experience({ items }) {
  return (
    <section className="mb-2 break-inside-avoid">
      <h3 className="font-semibold text-slate-800 mb-1">Experience</h3>
      {items.map((it, i) => (
        <div key={i} className="mb-3 break-inside-avoid">
          <div className="text-[15px] font-medium">{it.heading}</div>
          <ul className="list-disc pl-5 text-sm leading-6">
            {(it.lines || []).map((l, j) => <li key={j}>{l}</li>)}
          </ul>
        </div>
      ))}
    </section>
  );
}
