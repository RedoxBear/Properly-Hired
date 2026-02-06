
import React, { useMemo, useState } from "react";
import { analyzeResumeAgainstJD } from "@/components/utils/articulation";
import { AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { scoreAlignment } from "@/components/utils/alignment";

function Badge({ severity }) {
  const map = {
    info: "bg-sky-50 text-sky-700 border-sky-200",
    warn: "bg-amber-50 text-amber-800 border-amber-200",
    critical: "bg-rose-50 text-rose-700 border-rose-200",
  };
  const Icon = severity === "critical" ? AlertTriangle : severity === "warn" ? AlertTriangle : Info;
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded border ${map[severity]}`}>
      <Icon className="w-4 h-4" />
      {severity}
    </span>
  );
}

function Score({ label, v }) {
  return (
    <div className="rounded-lg border p-2">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="flex items-center gap-2 mt-1">
        <div className="w-full bg-slate-200 rounded h-2 overflow-hidden">
          <div className="h-2 bg-teal-600" style={{ width: `${v}%` }} />
        </div>
        <div className="text-xs w-8 text-right">{v}</div>
      </div>
    </div>
  );
}

export default function CareerArticulationPanel({
  resumeText,
  jdText,
  onResolveFlag,
  blockApplyOnCritical = true,
  masterText,         // NEW: full master CV (plain text)
  optimizedText       // NEW: optimized/plain text for current mode
}) {
  const [resolved, setResolved] = useState({});
  const result = useMemo(() => analyzeResumeAgainstJD(resumeText, jdText), [resumeText, jdText]);

  // NEW: Alignment breakdown using Master ↔ Optimized ↔ JD
  const alignment = useMemo(() => {
    // Only calculate if all necessary texts are provided, to avoid errors or partial calculations
    // and ensure the component doesn't try to score alignment with missing inputs.
    if (!masterText || !optimizedText || !jdText) return null;
    return scoreAlignment(jdText, optimizedText, masterText);
  }, [jdText, optimizedText, masterText]);

  const unresolved = result.flags.filter(f => !resolved[f.id]);
  const hasCritical = unresolved.some(f => f.severity === "critical");
  const canApply = !blockApplyOnCritical || !hasCritical;

  return (
    <div className="rounded-2xl border p-4 bg-white">
      <div className="flex items-center justify-between mb-3">
        <div className="font-semibold">Career Review</div>
        <div className="text-xs text-slate-500">Articulation score: <b>{result.scores.overall}</b> / 100</div>
      </div>

      {/* NEW: Alignment meters */}
      {alignment && (
        <div className="grid md:grid-cols-5 gap-3 mb-4 text-sm">
          <Meter label="JD Overlap" v={alignment.jdOverlap} />
          <Meter label="Master Retention" v={alignment.masterRetention} />
          <Meter label="Clarity" v={alignment.clarity} />
          <Meter label="Redundancy" v={alignment.redundancy} />
          <Meter label="Overall" v={alignment.overall} />
        </div>
      )}

      <div className="grid md:grid-cols-4 gap-3 mb-4 text-sm">
        <Score label="Coherence" v={result.scores.coherence} />
        <Score label="Growth" v={result.scores.growth} />
        <Score label="Evidence" v={result.scores.evidence} />
        <Score label="Freshness" v={result.scores.freshness} />
      </div>

      {unresolved.length === 0 ? (
        <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 p-3 rounded">
          <CheckCircle2 className="w-4 h-4" />
          All set. No issues detected.
        </div>
      ) : (
        <ul className="space-y-3">
          {unresolved.map(flag => (
            <li key={flag.id} className="rounded-lg border p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge severity={flag.severity} />
                    <div className="font-medium">{flag.title}</div>
                  </div>
                  <div className="text-sm text-slate-600 mt-1">{flag.detail}</div>
                  <div className="text-sm mt-2">
                    <span className="text-slate-500">Suggestion: </span>
                    <span className="font-medium">{flag.suggestion}</span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    setResolved(prev => ({ ...prev, [flag.id]: true }));
                    onResolveFlag && onResolveFlag(flag.id);
                    window.dispatchEvent(new CustomEvent("pd_click", { detail: { name: "resolve_flag", flagId: flag.id } }));
                  }}
                >
                  Mark Resolved
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {blockApplyOnCritical && hasCritical && (
        <div className="mt-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 p-2 rounded">
          Resolve critical items to enable Apply. You can override in settings.
        </div>
      )}

      {/* Expose a simple flag for other components (optional gating) */}
      <input type="hidden" id="pd_can_apply" value={canApply ? "1" : "0"} />
    </div>
  );
}

function Meter({ label, v }) {
  return (
    <div className="rounded-lg border p-2">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="flex items-center gap-2 mt-1">
        <div className="w-full bg-slate-200 rounded h-2 overflow-hidden">
          <div className="h-2 bg-teal-600" style={{ width: `${v}%` }} />
        </div>
        <div className="text-xs w-8 text-right">{v}</div>
      </div>
    </div>
  );
}
