
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Search, FileText, Target, Sparkles, ArrowRight } from "lucide-react";
import { JobApplication } from "@/api/entities";

export default function QuickActions() {
  const [lastAppId, setLastAppId] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const apps = await JobApplication.list("-created_date", 1);
        if (apps?.[0]?.id) setLastAppId(apps[0].id);
      } catch {
        // no-op
      }
    })();
  }, []);

  const optimizeHref = lastAppId
    ? createPageUrl(`ResumeOptimizer?id=${lastAppId}`)
    : createPageUrl("JobAnalysis"); // if no app yet, start with analysis

  return (
    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-xl font-bold text-slate-800">
          <Sparkles className="w-5 h-5 text-blue-600" /> Quick Actions
        </CardTitle>
      </CardHeader>

      <CardContent className="grid gap-4">
        <Action
          title="Upload Resume"
          desc="Add or update your Master CV"
          icon={FileText}
          to={createPageUrl("MyResumes")}
          gradient="from-violet-500 to-fuchsia-600"
        />
        <Action
          title="Analyze Job Posting"
          desc="Paste a job URL or description"
          icon={Search}
          to={createPageUrl("JobAnalysis")}
          gradient="from-blue-500 to-cyan-600"
        />
        <Action
          title="Generate Materials"
          desc="Open the Resume Optimizer"
          icon={Target}
          to={optimizeHref}
          gradient="from-emerald-500 to-teal-600"
        />
      </CardContent>
    </Card>
  );
}

function Action({ title, desc, icon: Icon, to, gradient }) {
  return (
    <div className="flex items-center justify-between p-4 rounded-xl border bg-white/70">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg text-white bg-gradient-to-r ${gradient}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <div className="font-semibold text-slate-800">{title}</div>
          <div className="text-sm text-slate-500">{desc}</div>
        </div>
      </div>
      <Link to={to}>
        <Button variant="outline" className="flex items-center gap-1">
          Open <ArrowRight className="w-4 h-4" />
        </Button>
      </Link>
    </div>
  );
}
