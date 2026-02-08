import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Search, Sparkles } from "lucide-react";

export default function MeetYourExperts() {
  return (
    <Card className="border-0 shadow-lg bg-card/90 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          Meet Your Experts
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800">
          <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-sm text-blue-900 dark:text-blue-200">Kyle — CV Expert</p>
            <p className="text-xs text-blue-700 dark:text-blue-300">Resume optimization, cover letters, and interview prep</p>
          </div>
        </div>
        <div className="flex items-start gap-3 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
          <Search className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-sm text-emerald-900 dark:text-emerald-200">Simon — Recruiting Expert</p>
            <p className="text-xs text-emerald-700 dark:text-emerald-300">Industry analysis, company research, and ghost-job detection</p>
          </div>
        </div>
        <div className="flex items-start gap-3 p-3 rounded-lg bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800">
          <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-sm text-purple-900 dark:text-purple-200">CV Assistant — Orchestrator</p>
            <p className="text-xs text-purple-700 dark:text-purple-300">Routes tasks to Kyle or Simon for specialist guidance</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}