import React from "react";
import DOMPurify from "dompurify";
import { base44 } from "@/api/base44Client";
import { JobApplication } from "@/entities/JobApplication";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { hasAccess } from "@/components/utils/accessControl";
import { MessageSquare } from "lucide-react";

export default function JobSummary() {
  const [app, setApp] = React.useState(null);
  const [currentUser, setCurrentUser] = React.useState(null);

  React.useEffect(() => {
    const qp = new URLSearchParams(window.location.search);
    const id = qp.get("id");
    (async () => {
      try { setCurrentUser(await base44.auth.me()); } catch (_) {}
      if (id) setApp(await JobApplication.get(id));
    })();
  }, []);

  if (!app) return null;

  const S = app.summary || {};
  const List = ({ items }) => items && items.length ? (
    <ul className="list-disc pl-5 space-y-1">
      {items.map((i, idx) => <li key={idx}>{i}</li>)}
    </ul>
  ) : <div className="text-slate-500 text-sm">No data yet.</div>;

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-4">
      <Card className="bg-white/90 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>{app.job_title} @ {app.company_name}</CardTitle>
        </CardHeader>
        <CardContent className="prose max-w-none">
          {app.analysis_summary_html ? (
            <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(app.analysis_summary_html) }} />
          ) : (
            <div className="whitespace-pre-wrap text-sm font-sans text-slate-700 leading-relaxed">{app.analysis_summary_md || "No summary available."}</div>
          )}
        </CardContent>
      </Card>

      {/* NEW: Structured Summary Sections */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="bg-white/90 backdrop-blur-sm">
          <CardHeader><CardTitle>ATS Keywords</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {(S.ats_keywords || []).length ? (
              (S.ats_keywords || []).map((k, i) => (
                <span key={i} className="text-xs px-2 py-1 rounded-full border">{k}</span>
              ))
            ) : (
              <div className="text-slate-500 text-sm">No keywords found.</div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white/90 backdrop-blur-sm">
          <CardHeader><CardTitle>Company Overview</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <p className="text-slate-700">{S.company_overview || "Overview not available yet."}</p>
            {S.research_snapshot && (
              <div className="text-sm text-slate-600">
                {S.research_snapshot.website && <>Website: {S.research_snapshot.website}<br/></>}
                {S.research_snapshot.industry && <>Industry: {S.research_snapshot.industry}<br/></>}
                {S.research_snapshot.size && <>Size: {S.research_snapshot.size}<br/></>}
                {S.research_snapshot.headquarters && <>HQ: {S.research_snapshot.headquarters}<br/></>}
                {S.research_snapshot.founded && <>Founded: {S.research_snapshot.founded}</>}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white/90 backdrop-blur-sm">
          <CardHeader><CardTitle>Role — Key Differences vs Your CV</CardTitle></CardHeader>
          <CardContent><List items={S.role_differences} /></CardContent>
        </Card>

        <Card className="bg-white/90 backdrop-blur-sm">
          <CardHeader><CardTitle>Key Responsibilities to Demonstrate</CardTitle></CardHeader>
          <CardContent><List items={S.key_responsibilities} /></CardContent>
        </Card>

        <Card className="bg-white/90 backdrop-blur-sm md:col-span-2">
          <CardHeader><CardTitle>Ideal Candidate → Your Matches</CardTitle></CardHeader>
          <CardContent>
            <div className="mb-2 text-sm text-slate-500">Ideal Candidate Profile</div>
            <List items={S.ideal_candidate_profile} />
            <div className="mt-4 mb-2 text-sm text-slate-500">Matches in Your Skill Set</div>
            <List items={S.candidate_matches} />
          </CardContent>
        </Card>

        <Card className="bg-white/90 backdrop-blur-sm md:col-span-2">
          <CardHeader><CardTitle>Interview Prep: Likely Questions & Interactions</CardTitle></CardHeader>
          <CardContent><List items={S.interviewer_tips} /></CardContent>
        </Card>
      </div>

      {/* Simon → Kyle CTA */}
      {S.simon_brief && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="font-semibold text-blue-900">Simon's brief is ready for Kyle</p>
            <p className="text-sm text-blue-700">
              Strategy: {S.simon_brief.strategy_for_kyle?.approach || "Available"} ·
              Tone: {S.simon_brief.strategy_for_kyle?.tone || "N/A"}
            </p>
          </div>
          <Link to={createPageUrl(`ResumeOptimizer?id=${app.id}`)}>
            <Button>Optimize Resume →</Button>
          </Link>
        </div>
      )}

      {/* Handover Brief (Premium) */}
      {hasAccess(currentUser, "interview_prep") && S.simon_brief && (
        <Card className="border-purple-200 bg-purple-50/50">
          <CardHeader>
            <CardTitle className="text-purple-900 text-base flex items-center gap-2">
              Simon → Kyle Handover Brief
              <Badge className="bg-purple-100 text-purple-700">Premium</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            {S.simon_brief.ghost_job_score !== undefined && (
              <p><span className="font-medium">Ghost Score:</span>{" "}
                {S.simon_brief.ghost_job_score}/100 · {S.simon_brief.risk_level}
              </p>
            )}
            {S.simon_brief.strategy_for_kyle?.must_win_priorities && (
              <p><span className="font-medium">Must-Win Keywords:</span>{" "}
                {S.simon_brief.strategy_for_kyle.must_win_priorities.join(", ")}
              </p>
            )}
            {S.simon_brief.strategy_for_kyle?.tone && (
              <p><span className="font-medium">Tone:</span>{" "}
                {S.simon_brief.strategy_for_kyle.tone}
              </p>
            )}
            {S.simon_brief.overall_recommendation?.decision && (
              <p><span className="font-medium">Recommendation:</span>{" "}
                {S.simon_brief.overall_recommendation.decision}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <div className="flex gap-2 flex-wrap">
        <Link to={createPageUrl(`OptimizeResume?id=${app.id}`)}><Button>Optimize Resume</Button></Link>
        <Link to={createPageUrl(`CoverLetter?id=${app.id}`)}><Button variant="outline">Cover Letter</Button></Link>
        <Link to={createPageUrl(`InterviewPrep?id=${app.id}`)}>
          <Button variant="outline" className="text-purple-600 border-purple-300 hover:bg-purple-50">
            <MessageSquare className="h-4 w-4 mr-2" />
            Interview Prep
          </Button>
        </Link>
        <Link to={createPageUrl("Dashboard")}><Button variant="ghost">Back to Dashboard</Button></Link>
      </div>
    </div>
  );
}