import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, AlertTriangle, CheckCircle2, Building2, Target, Brain } from "lucide-react";

function ScoreBadge({ score, label }) {
  const color = score < 21 ? "bg-green-50 text-green-700 border-green-200"
    : score < 41 ? "bg-yellow-50 text-yellow-700 border-yellow-200"
    : score < 61 ? "bg-orange-50 text-orange-700 border-orange-200"
    : "bg-red-50 text-red-700 border-red-200";
  return <Badge variant="outline" className={`text-sm ${color}`}>{label}: {score}/100</Badge>;
}

export default function SimonIntelBrief({ brief, llmResult }) {
  if (!brief && !llmResult) return null;

  const ghost = brief?.ghost_job_score ?? llmResult?.simon_ghost_score;
  const risk = brief?.risk_level ?? llmResult?.simon_risk_level;
  const rc = brief?.role_classification ?? llmResult?.simon_role_classification ?? {};
  const agency = brief?.agency_detection ?? {
    is_recruitment_agency: llmResult?.is_recruitment_agency,
    agency_confidence: llmResult?.agency_confidence,
    agency_signals: llmResult?.agency_signals,
    agency_name: llmResult?.agency_name
  };
  const onet = brief?.onet_benchmark;
  const strat = brief?.strategy_for_kyle;
  const rec = brief?.overall_recommendation;

  return (
    <div className="space-y-4">
      {/* Ghost-Job & Risk */}
      {ghost !== undefined && (
        <Card className="border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-600" />
              Simon's Ghost-Job & Risk Assessment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2 items-center">
              <ScoreBadge score={ghost} label="Ghost Score" />
              {risk && <Badge variant="outline" className="text-xs">Risk: {risk}</Badge>}
              {rc.tier && <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">{rc.tier}</Badge>}
              {rc.role_type && <Badge variant="outline" className="text-xs">{rc.role_type}</Badge>}
            </div>
            {rc.positive_signals?.length > 0 && (
              <div className="text-sm">
                <span className="font-medium text-green-700">✓ Green flags:</span>{" "}
                <span className="text-slate-600">{rc.positive_signals.join(", ")}</span>
              </div>
            )}
            {rc.indicators?.length > 0 && (
              <div className="text-sm">
                <span className="font-medium text-amber-700">⚠ Risk indicators:</span>{" "}
                <span className="text-slate-600">{rc.indicators.join(", ")}</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Agency Detection */}
      {agency?.is_recruitment_agency && agency.agency_confidence >= 50 && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-amber-800">
              <Building2 className="w-4 h-4" />
              Recruitment Agency Detected
              {agency.agency_name && (
                <Badge variant="outline" className="text-xs bg-amber-100 text-amber-800 border-amber-300 ml-1">
                  {agency.agency_name}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="text-amber-700">This posting appears to be from a recruitment agency, not the direct employer.</p>
            {agency.agency_signals?.length > 0 && (
              <p className="text-xs text-amber-600">Signals: {agency.agency_signals.join(", ")}</p>
            )}
            <p className="text-xs text-amber-500">Confidence: {agency.agency_confidence}%</p>
            <div className="mt-2">
              <p className="font-medium text-amber-800 mb-1">Recommended approach:</p>
              <ul className="list-disc pl-5 space-y-1 text-amber-700 text-xs">
                <li>Connect with the recruiter on LinkedIn first</li>
                <li>Ask: client name, salary range, contract vs permanent, exclusivity</li>
                <li>Send recruiter intro message instead of formal cover letter</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {/* O*NET Benchmark */}
      {onet && onet.occupation && (
        <Card className="border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="w-4 h-4 text-amber-600" />
              O*NET Role Benchmark
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="text-slate-700">{onet.occupation} ({onet.soc_code})</p>
            <div className="flex flex-wrap gap-1">
              {onet.education_level && <Badge variant="outline" className="text-xs">Edu: {onet.education_level}</Badge>}
              {onet.job_zone && <Badge variant="outline" className="text-xs">Zone {onet.job_zone}/5</Badge>}
              {onet.overlap_score !== undefined && <Badge variant="outline" className="text-xs">Overlap: {onet.overlap_score}%</Badge>}
            </div>
            {onet.ghost_indicator && <p className="text-xs text-slate-500">{onet.ghost_indicator}</p>}
            {onet.top_skills?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {onet.top_skills.slice(0, 10).map((s, i) => (
                  <Badge key={i} variant="secondary" className="text-xs bg-amber-50 text-amber-800 border-amber-200">
                    {typeof s === "string" ? s : s.name}
                  </Badge>
                ))}
              </div>
            )}
            {onet.work_values?.length > 0 && (
              <p className="text-xs text-slate-500">Work values: {onet.work_values.join(", ")}</p>
            )}
            {onet.riasec_profile?.length > 0 && (
              <p className="text-xs text-slate-500">RIASEC: {onet.riasec_profile.join(", ")}</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Strategy for Kyle */}
      {strat && (strat.approach || strat.tone || strat.must_win_priorities?.length) && (
        <Card className="border-indigo-200 bg-indigo-50/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-indigo-900">
              <Brain className="w-4 h-4" />
              Simon → Kyle Strategy Brief
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {strat.approach && <p><span className="font-medium">Approach:</span> {strat.approach}</p>}
            {strat.tone && <p><span className="font-medium">Tone:</span> {strat.tone}</p>}
            {strat.must_win_priorities?.length > 0 && (
              <div>
                <span className="font-medium">Must-win priorities:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {strat.must_win_priorities.map((p, i) => (
                    <Badge key={i} variant="outline" className="text-xs bg-indigo-100 text-indigo-700">{p}</Badge>
                  ))}
                </div>
              </div>
            )}
            {strat.avoid?.length > 0 && (
              <p className="text-xs text-red-600">Avoid: {strat.avoid.join(", ")}</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Overall Recommendation */}
      {rec && rec.decision && (
        <Card className="border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              Simon's Overall Recommendation
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-1">
            <p><span className="font-medium">Decision:</span> {rec.decision}</p>
            {rec.confidence !== undefined && <p className="text-xs text-slate-500">Confidence: {rec.confidence}%</p>}
            {rec.reasoning && <p className="text-slate-600">{rec.reasoning}</p>}
          </CardContent>
        </Card>
      )}
    </div>
  );
}