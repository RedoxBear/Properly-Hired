import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader2, Briefcase, Search, Building2, MessageCircleQuestion } from "lucide-react";

export default function JobSelectionPicker() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const load = async () => {
      const apps = await base44.entities.JobApplication.list("-created_date", 100);
      setApplications(apps);
      setLoading(false);
    };
    load();
  }, []);

  const filtered = applications.filter(app => {
    const q = search.toLowerCase();
    return (
      (app.job_title || "").toLowerCase().includes(q) ||
      (app.company_name || "").toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <MessageCircleQuestion className="h-6 w-6 text-purple-600" />
            Interview Prep
          </CardTitle>
          <p className="text-muted-foreground mt-1">
            Select a job to prepare for your interview
          </p>
        </CardHeader>
        <CardContent>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by job title or company..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {filtered.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center py-12 gap-3">
            <Briefcase className="h-12 w-12 text-muted-foreground/40" />
            <p className="text-muted-foreground text-center">
              {applications.length === 0
                ? "No job applications found. Analyze a job posting first to get started."
                : "No matches found for your search."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map((app) => {
            const hasPrep = !!app.summary?.interview_prep || !!app.interview_prep_report_text;
            return (
              <Link
                key={app.id}
                to={createPageUrl(`InterviewPrep?id=${app.id}`)}
                className="block"
              >
                <Card className="hover:shadow-md hover:border-purple-300 transition-all cursor-pointer">
                  <CardContent className="flex items-center gap-4 py-4">
                    <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                      <Building2 className="h-5 w-5 text-purple-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground truncate">{app.job_title}</p>
                      <p className="text-sm text-muted-foreground truncate">{app.company_name}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {hasPrep ? (
                        <Badge className="bg-green-100 text-green-700">Prep Ready</Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">Not Prepped</Badge>
                      )}
                      {app.application_status && (
                        <Badge variant="outline" className="capitalize text-xs">
                          {app.application_status.replace(/_/g, " ")}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}