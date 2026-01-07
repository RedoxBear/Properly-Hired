import React from "react";

export default function ResumeLengthControls({ value, onChange }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <label className="text-sm text-slate-600">Length Mode:</label>
      <button
        onClick={() => onChange("ats_one_page")}
        className={`px-3 py-1 rounded border ${value==="ats_one_page"?"bg-blue-600 text-white border-blue-600":"bg-white"}`}
      >1-Page ATS</button>
      <button
        onClick={() => onChange("two_page")}
        className={`px-3 py-1 rounded border ${value==="two_page"?"bg-blue-600 text-white border-blue-600":"bg-white"}`}
      >2-Page Pro</button>
      <button
        onClick={() => onChange("full_cv")}
        className={`px-3 py-1 rounded border ${value==="full_cv"?"bg-blue-600 text-white border-blue-600":"bg-white"}`}
      >Full CV</button>
    </div>
  );
}