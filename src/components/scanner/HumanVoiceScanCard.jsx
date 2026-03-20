import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Scan, CheckCircle2, AlertTriangle, ArrowRight, ChevronDown, ChevronUp } from "lucide-react";
import { scanText, CATEGORY_LABELS, CATEGORY_COLORS } from "@/components/utils/humanVoiceRules";

/**
 * HumanVoiceScanCard — Drop-in component that scans any text for AI-sounding patterns.
 * Shows score, violation count, and expandable details.
 *
 * Props:
 *   text: string — The text to scan
 *   label?: string — Card title (default: "Human Voice Scan")
 *   autoScan?: boolean — Auto-scan on mount/text change (default: false)
 */
export default function HumanVoiceScanCard({ text, label = "Human Voice Scan", autoScan = false }) {
  const [results, setResults] = useState(null);
  const [expanded, setExpanded] = useState(false);

  // Auto-scan when text changes (if enabled)
  React.useEffect(() => {
    if (autoScan && text?.trim()) {
      setResults(scanText(text.trim()));
    } else if (autoScan && !text?.trim()) {
      setResults(null);
    }
  }, [text, autoScan]);

  const handleScan = () => {
    if (!text?.trim()) return;
    setResults(scanText(text.trim()));
  };

  if (!results && !autoScan) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Scan className="w-4 h-4" />
            <span className="text-sm font-medium">{label}</span>
          </div>
          <Button size="sm" variant="outline" onClick={handleScan} disabled={!text?.trim()}>
            <Scan className="w-3.5 h-3.5 mr-1.5" />
            Scan Now
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!results) return null;

  const { findings, score, totalViolations } = results;
  const scoreColor = score >= 80 ? "text-green-600" : score >= 50 ? "text-amber-600" : "text-red-600";
  const scoreBg = score >= 80
    ? "bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800"
    : score >= 50
    ? "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800"
    : "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800";

  // Group findings by category
  const grouped = {};
  for (const f of findings) {
    if (!grouped[f.category]) grouped[f.category] = [];
    grouped[f.category].push(f);
  }

  return (
    <Card className={`border ${scoreBg}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            {score >= 80 ? (
              <CheckCircle2 className="w-4 h-4 text-green-500" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            )}
            {label}
          </CardTitle>
          <div className="flex items-center gap-3">
            <span className={`text-2xl font-bold ${scoreColor}`}>{score}</span>
            <span className="text-sm text-muted-foreground">/ 100</span>
            {totalViolations > 0 && (
              <Badge variant="secondary" className="text-xs">
                {totalViolations} issue{totalViolations !== 1 ? "s" : ""}
              </Badge>
            )}
          </div>
        </div>
        {/* Score bar */}
        <div className="h-2 bg-muted rounded-full overflow-hidden mt-2">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              score >= 80 ? "bg-green-500" : score >= 50 ? "bg-amber-500" : "bg-red-500"
            }`}
            style={{ width: `${score}%` }}
          />
        </div>
      </CardHeader>

      {totalViolations > 0 && (
        <CardContent className="pt-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-muted-foreground w-full justify-between"
          >
            <span>{expanded ? "Hide" : "Show"} violations</span>
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </Button>

          {expanded && (
            <div className="mt-3 space-y-3">
              {Object.entries(grouped).map(([category, items]) => (
                <div key={category}>
                  <div className="text-xs font-semibold text-muted-foreground mb-1.5">
                    {CATEGORY_LABELS[category] || category} ({items.length})
                  </div>
                  <div className="space-y-1.5">
                    {items.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 p-2 rounded-md bg-background/50 border border-border text-sm"
                      >
                        <Badge className={`text-[10px] ${CATEGORY_COLORS[item.category] || ""}`}>
                          {item.category}
                        </Badge>
                        <span className="font-medium text-foreground truncate">"{item.word}"</span>
                        <ArrowRight className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                        <span className="text-muted-foreground text-xs truncate">{item.replacement}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {!autoScan && (
            <div className="mt-3 flex justify-end">
              <Button size="sm" variant="outline" onClick={handleScan}>
                <Scan className="w-3.5 h-3.5 mr-1.5" />
                Re-scan
              </Button>
            </div>
          )}
        </CardContent>
      )}

      {totalViolations === 0 && (
        <CardContent className="pt-0">
          <p className="text-xs text-green-700 dark:text-green-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            No AI-sounding patterns detected. Your text passes all human voice checks.
          </p>
        </CardContent>
      )}
    </Card>
  );
}