import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowRight, Search, FileText } from "lucide-react";

/**
 * Reusable handoff card between agents / pages.
 * variant: "simon" | "kyle" | "editor"
 */
export default function AgentHandoffCard({ variant = "simon" }) {
  if (variant === "simon") {
    return (
      <Card className="bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Search className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="font-semibold text-sm text-emerald-900 dark:text-emerald-200">Need deeper coaching?</p>
              <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1">
                Simon can add industry and company context. If you're unsure how to answer, open Kyle for a second opinion.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (variant === "kyle") {
    return (
      <Card className="bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="font-semibold text-sm text-blue-900 dark:text-blue-200">Kyle — CV Expert</p>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                Get improvements for clarity, ATS alignment, and impact.
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Simon can add industry and company context when needed.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (variant === "editor") {
    return (
      <Card className="bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800">
        <CardContent className="p-4">
          <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
            Finish your Q&A → build resume → refine in Resume Editor with Kyle.
          </p>
          <Link to={createPageUrl("ResumeEditor")}>
            <Button size="sm" variant="outline" className="gap-2 border-blue-300 text-blue-700 hover:bg-blue-100 dark:border-blue-700 dark:text-blue-300">
              Open Resume Editor
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return null;
}