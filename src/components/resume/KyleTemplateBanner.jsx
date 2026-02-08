import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Sparkles, ArrowRight, Briefcase } from "lucide-react";

export function KyleOptimizeBanner({ resumeId }) {
  return (
    <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border-blue-200 dark:border-blue-800">
      <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
          <p className="text-sm text-blue-800 dark:text-blue-200">
            Is there anything you'd like to change or optimize further? Kyle can help refine your resume.
          </p>
        </div>
        {resumeId && (
          <Link to={`${createPageUrl("ResumeEditor")}?resumeId=${resumeId}`}>
            <Button size="sm" className="gap-2 bg-blue-600 hover:bg-blue-700 whitespace-nowrap">
              Open Editor
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        )}
      </CardContent>
    </Card>
  );
}

export function ProjectBasedCVHint() {
  return (
    <Card className="bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Briefcase className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-sm text-amber-900 dark:text-amber-200">Short Tenure? Consider a Project-Based CV</p>
            <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
              If your roles were short or fragmented, Kyle can help highlight impact and outcomes as projects.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function TemplateHelperHint() {
  return (
    <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
      Click a template to apply. Use Download buttons to save PNG/JPG samples.
    </p>
  );
}