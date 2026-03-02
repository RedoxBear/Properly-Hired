import React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, CheckCircle2, ArrowRight } from "lucide-react";
import { CATEGORY_LABELS, CATEGORY_COLORS } from "@/components/utils/humanVoiceRules";

export default function ScanResults({ results }) {
  if (!results) return null;

  const { findings, score, totalViolations } = results;

  const scoreColor = score >= 80 ? "text-green-600" : score >= 50 ? "text-amber-600" : "text-red-600";
  const scoreLabel = score >= 80 ? "Strong Human Voice" : score >= 50 ? "Needs Work" : "High AI Signal";
  const scoreBg = score >= 80 ? "bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800" 
    : score >= 50 ? "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800" 
    : "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800";

  // Group findings by category
  const grouped = {};
  for (const f of findings) {
    if (!grouped[f.category]) grouped[f.category] = [];
    grouped[f.category].push(f);
  }

  return (
    <div className="space-y-4">
      {/* Score Card */}
      <Card className={`border ${scoreBg}`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Human Voice Score</p>
              <div className="flex items-baseline gap-2">
                <span className={`text-5xl font-bold ${scoreColor}`}>{score}</span>
                <span className="text-lg text-muted-foreground">/ 100</span>
              </div>
              <p className={`text-sm font-medium mt-1 ${scoreColor}`}>{scoreLabel}</p>
            </div>
            <div className="text-right">
              {score >= 80 ? (
                <CheckCircle2 className="w-12 h-12 text-green-500" />
              ) : (
                <AlertTriangle className="w-12 h-12 text-amber-500" />
              )}
              <p className="text-sm text-muted-foreground mt-2">
                {totalViolations} violation{totalViolations !== 1 ? "s" : ""} found
              </p>
            </div>
          </div>
          {/* Score bar */}
          <div className="mt-4 h-3 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                score >= 80 ? "bg-green-500" : score >= 50 ? "bg-amber-500" : "bg-red-500"
              }`}
              style={{ width: `${score}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Violations by Category */}
      {totalViolations === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-3" />
            <p className="font-medium text-foreground">No violations found</p>
            <p className="text-sm text-muted-foreground">Your text passes all human voice checks.</p>
          </CardContent>
        </Card>
      ) : (
        Object.entries(grouped).map(([category, items]) => (
          <Card key={category}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center justify-between">
                <span>{CATEGORY_LABELS[category] || category}</span>
                <Badge variant="secondary">{items.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border"
                  >
                    <Badge className={`text-xs ${CATEGORY_COLORS[item.category] || ""}`}>
                      {item.category}
                    </Badge>
                    <span className="font-medium text-foreground text-sm flex-shrink-0">
                      "{item.word}"
                    </span>
                    <ArrowRight className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm text-muted-foreground truncate">
                      {item.replacement}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}