import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, FileText, AlertTriangle, Bot } from "lucide-react";

export default function KyleDecisionContext({ llmResult, optimizationScore, aiLikelihood }) {
  if (!llmResult) return null;

  const strat = llmResult.application_strategy;
  const keywords = llmResult.important_keywords || [];
  const niceToHave = llmResult.nice_to_have_skills || [];
  const seniority = llmResult.seniority_level;
  const humanTips = llmResult.humanization_tips;
  const aiSignals = llmResult.ai_signals || [];

  return (
    <div className="space-y-4">
      {/* Optimization Score + AI Detection */}
      <Card className="border-slate-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600" />
            Kyle's Analysis Context
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {optimizationScore !== undefined && (
              <Badge variant="outline" className="text-sm bg-blue-50 text-blue-700 border-blue-200">
                Optimization Score: {optimizationScore}/100
              </Badge>
            )}
            {seniority && (
              <Badge variant="outline" className="text-xs">{seniority}</Badge>
            )}
          </div>

          {strat && (
            <div className="text-sm">
              <span className="font-medium text-slate-700">Application Strategy:</span>
              <p className="text-slate-600 mt-1 bg-green-50 rounded-lg p-3 border border-green-200">{strat}</p>
            </div>
          )}

          {keywords.length > 0 && (
            <div>
              <span className="font-medium text-sm text-slate-700">Priority Keywords for Resume:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {keywords.map((kw, i) => (
                  <Badge key={i} variant="secondary" className="text-xs bg-blue-50 text-blue-800 border-blue-200">{kw}</Badge>
                ))}
              </div>
            </div>
          )}

          {niceToHave.length > 0 && (
            <div>
              <span className="font-medium text-sm text-slate-700">Nice-to-Have Skills:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {niceToHave.map((s, i) => (
                  <Badge key={i} variant="outline" className="text-xs">{s}</Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Generation Detection */}
      {(aiLikelihood > 30 || aiSignals.length > 0) && (
        <Card className="border-amber-200 bg-amber-50/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-amber-800">
              <Bot className="w-4 h-4" />
              AI-Generated Posting Detection
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {aiLikelihood !== undefined && (
              <Badge variant="outline" className={`text-xs ${aiLikelihood > 60 ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"}`}>
                AI Likelihood: {aiLikelihood}%
              </Badge>
            )}
            {aiSignals.length > 0 && (
              <ul className="list-disc pl-5 space-y-1 text-amber-700 text-xs">
                {aiSignals.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            )}
            {humanTips && (
              <div className="mt-2">
                <span className="font-medium text-amber-800">Humanization Tips:</span>
                <p className="text-amber-700 mt-1 bg-white/60 rounded p-2 border border-amber-200 text-xs">{humanTips}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}