import React from "react";
import { wordDiff } from "@/components/utils/diff";

export default function ResumeDiff({ previousText, optimizedText }) {
  const tokens = wordDiff(previousText || "", optimizedText || "");
  return (
    <div className="text-sm leading-7">
      {tokens.map((t, i) => {
        if (t.add) return <mark key={i} className="bg-green-100 text-green-900 rounded px-1 mr-1">{t.text}</mark>;
        if (t.del) return <del key={i} className="bg-rose-50 text-rose-700 rounded px-1 mr-1">{t.text}</del>;
        return <span key={i} className="mr-1">{t.text}</span>;
      })}
    </div>
  );
}