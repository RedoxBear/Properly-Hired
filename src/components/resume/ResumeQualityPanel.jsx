import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle2, Info, TrendingUp } from "lucide-react";

function ScoreMeter({ label, value, color = "teal" }) {
  const colorMap = {
    teal: "bg-teal-600",
    blue: "bg-blue-600",
    green: "bg-green-600",
    amber: "bg-amber-600",
  };
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-slate-700 font-medium">{label}</span>
        <span className="text-slate-600 font-semibold">{value}/100</span>
      </div>
      <div className="w-full bg-slate-200 rounded-full h-2.5">
        <div
          className={`h-2.5 rounded-full ${colorMap[color] || colorMap.teal}`}
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
    </div>
  );
}

function FlagBadge({ severity }) {
  const config = {
    critical: { icon: AlertTriangle, color: "bg-rose-50 text-rose-700 border-rose-200" },
    warn: { icon: AlertTriangle, color: "bg-amber-50 text-amber-800 border-amber-200" },
    info: { icon: Info, color: "bg-sky-50 text-sky-700 border-sky-200" },
  };
  const { icon: Icon, color } = config[severity] || config.info;
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded border ${color}`}>
      <Icon className="w-3 h-3" />
      {severity}
    </span>
  );
}

export default function ResumeQualityPanel({ scores, flags, onResolve }) {
  const overall = scores?.overall || 0;
  const hasFlags = Array.isArray(flags) && flags.length > 0;

  return (
    <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-teal-600" />
          Resume Quality Analysis
        </CardTitle>
        <p className="text-sm text-slate-600">
          Independent assessment of your CV strength (no job posting needed)
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Score */}
        <div className="p-4 rounded-xl border bg-gradient-to-br from-teal-50 to-cyan-50 border-teal-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-teal-800">Overall Quality Score</span>
            <span className="text-3xl font-bold text-teal-700">{overall}</span>
          </div>
          <div className="w-full bg-white/60 rounded-full h-3">
            <div
              className="h-3 rounded-full bg-gradient-to-r from-teal-600 to-cyan-600"
              style={{ width: `${Math.min(100, Math.max(0, overall))}%` }}
            />
          </div>
          <p className="text-xs text-teal-700 mt-2">
            {overall >= 85 ? "Excellent - Ready to compete" : overall >= 70 ? "Good - Minor improvements recommended" : overall >= 55 ? "Fair - Needs strengthening" : "Needs work - Address critical items"}
          </p>
        </div>

        {/* Dimension Scores */}
        {scores && (
          <div className="grid md:grid-cols-2 gap-4">
            <ScoreMeter label="Evidence & Metrics" value={scores.evidence || 0} color="blue" />
            <ScoreMeter label="Coherence & Clarity" value={scores.coherence || 0} color="green" />
            <ScoreMeter label="Career Growth" value={scores.growth || 0} color="teal" />
            <ScoreMeter label="Freshness & Relevance" value={scores.freshness || 0} color="amber" />
          </div>
        )}

        {/* Flags */}
        {hasFlags ? (
          <div className="space-y-3">
            <h4 className="font-semibold text-slate-800">Actionable Improvements</h4>
            {flags.map((flag, idx) => (
              <div key={idx} className="p-4 rounded-lg border bg-white">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <FlagBadge severity={flag.severity} />
                    <span className="font-medium text-slate-800">{flag.title}</span>
                  </div>
                  {onResolve && (
                    <Button size="sm" variant="outline" onClick={() => onResolve(flag.id)}>
                      Mark Fixed
                    </Button>
                  )}
                </div>
                <p className="text-sm text-slate-600 mb-2">{flag.detail}</p>
                <div className="text-sm">
                  <span className="text-slate-500">Suggestion: </span>
                  <span className="font-medium text-slate-700">{flag.suggestion}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 p-3 rounded-lg">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-sm font-medium">No issues detected. Your resume looks strong!</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}