import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, BookOpen, Building2 } from "lucide-react";

export default function MarketSignals() {
  return (
    <Card className="border-0 shadow-lg bg-card/90 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          Market Signals
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span className="text-xs font-semibold text-amber-800 dark:text-amber-200 uppercase tracking-wide">BLS Trend (Weekly)</span>
          </div>
          <p className="text-sm text-amber-900 dark:text-amber-100">
            Check back — weekly labor market summary will be posted here.
          </p>
        </div>
        <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 mb-1">
            <Building2 className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">DOL Program Note (Monthly)</span>
          </div>
          <p className="text-sm text-slate-700 dark:text-slate-300">
            No policy updates this month. Check back for DOL program summaries.
          </p>
        </div>
        <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2 mb-1">
            <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-xs font-semibold text-blue-800 dark:text-blue-200 uppercase tracking-wide">LOC Reference</span>
          </div>
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <a
              href="https://www.loc.gov/search/?q=talent+management"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-blue-600"
            >
              Library of Congress — Talent Management Research →
            </a>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}