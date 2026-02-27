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
import { MessageSquare, FileText, Sparkles, ArrowLeft, Loader2 } from "lucide-react";
import SimonIntelBrief from "@/components/jobsummary/SimonIntelBrief";
import KyleDecisionContext from "@/components/jobsummary/KyleDecisionContext";

export default function JobSummary() {
  const [app, setApp] = React.useState(null);
  const [currentUser, setCurrentUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const qp = new URLSearchParams(window.location.search);
    const id = qp.get("id");
    (async () => {
      try { setCurrentUser(await base44.auth.me()); } catch (_) {}
      if (id) setApp(await JobApplication.get(id));
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!app) return (
    <div className="min-h-screen flex items-center justify-center text-slate-500">
      Application not found.
    </div>
  );

  const S = app.summary || {};
  const llm = app.llm_analysis_result || {};
  const simonBrief = S.simon_brief || null;

  const List = ({ items }) => items && items.length ? (
    <ul className="list-disc pl-5 space-y-1">
      {items.map((i, idx) => <li key={idx} className="text-slate-700">{i}</li>)}
    </ul>
  ) : <div className="text-slate-500 text-sm">No data yet.</div>;

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{app.job_title} @ {app.company_name}</h1>
          <p className="text-sm text-slate-500 mt-1">
            Analyzed {app.last_analysis_at ? new Date(app.last_analysis_at).toLocaleDateString() : "—"}
          </p>
        </div>
        <Link to={createPageUrl("ApplicationTracker")}>
          <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-1" /> Back to Tracker</Button>
        </Link>
      </div>

      {/* Analysis Summary (top card) */}
      <Card className="bg-white/90 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Analysis Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="prose max-w-none">
          {app.analysis_summary_html ? (
            <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(app.analysis_summary_html) }} />
          ) : (
            <div className="whitespace-pre-wrap text-sm font-sans text-slate-700 leading-relaxed">{app.analysis_summary_md || "No summary available."}</div>
          )}
        </CardContent>
      </Card>

      {/* === SIMON'S INTELLIGENCE SECTION === */}
      <div>
        <h2 className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
          💼 Simon's Intelligence Report
        </h2>
        <SimonIntelBrief brief={simonBrief} llmResult={llm} />
      </div>

      {/* === KYLE'S DECISION CONTEXT === */}
      <div>
        <h2 className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
          🎯 Kyle's Decision Context
        </h2>
        <KyleDecisionContext 
          llmResult={llm} 
          optimizationScore={app.optimization_score}
          aiLikelihood={app.ai_generated_likelihood}
        />
      </div>

      {/* === STRUCTURED SUMMARY SECTIONS === */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="bg-white/90 backdrop-blur-sm">
          <CardHeader><CardTitle>ATS Keywords</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {(S.ats_keywords || []).length ? (
              S.ats_keywords.map((k, i) => (
                <span key={i} className="text-xs px-2 py-1 rounded-full border bg-blue-50 text-blue-800 border-blue-200">{k}</span>
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
              <div className="text-sm text-slate-600 space-y-0.5">
                {S.research_snapshot.website && <div>Website: <a href={S.research_snapshot.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{S.research_snapshot.website}</a></div>}
                {S.research_snapshot.industry && <div>Industry: {S.research_snapshot.industry}</div>}
                {S.research_snapshot.size && <div>Size: {S.research_snapshot.size}</div>}
                {S.research_snapshot.headquarters && <div>HQ: {S.research_snapshot.headquarters}</div>}
                {S.research_snapshot.founded && <div>Founded: {S.research_snapshot.founded}</div>}
                {S.research_snapshot.viability && <div>Viability: {S.research_snapshot.viability}</div>}
                {S.research_snapshot.trigger && <div>Hiring Trigger: {S.research_snapshot.trigger}</div>}
                {S.research_snapshot.dna && <div>Company DNA: {S.research_snapshot.dna}</div>}
                {S.research_snapshot.hook && <div>Personalization Hook: {S.research_snapshot.hook}</div>}
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
      </div>

      {/* Notes */}
      {S.notes && (
        <Card className="bg-white/90 backdrop-blur-sm">
          <CardHeader><CardTitle>Notes</CardTitle></CardHeader>
          <CardContent>
            <p className="text-slate-700 whitespace-pre-wrap">{S.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2 flex-wrap">
        <Link to={createPageUrl(`ResumeOptimizer?id=${app.id}`)}><Button>Optimize Resume</Button></Link>
        <Link to={createPageUrl(`CoverLetter?id=${app.id}`)}><Button variant="outline">Cover Letter</Button></Link>
        <Link to={createPageUrl(`InterviewPrep?id=${app.id}`)}>
          <Button variant="outline" className="text-purple-600 border-purple-300 hover:bg-purple-50">
            <MessageSquare className="h-4 w-4 mr-2" />
            Interview Prep
          </Button>
        </Link>
        <Link to={createPageUrl("ApplicationTracker")}><Button variant="ghost">Back to Tracker</Button></Link>
      </div>
    </div>
  );
}