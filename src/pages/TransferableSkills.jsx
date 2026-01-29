import React, { useEffect, useState } from "react";
import PremiumGate from "@/components/PremiumGate";
import { Resume } from "@/api/entities";
import { InvokeLLM } from "@/api/integrations";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, Sparkles, Target, Loader2, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { retryWithBackoff } from "@/components/utils/retry";

export default function TransferableSkills() {
  const [resumes, setResumes] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [targetIndustry, setTargetIndustry] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const init = async () => {
      try {
        const list = await Resume.list("-created_date", 50);
        setResumes(list);
        if (list.length) setSelectedId(list[0].id);
      } catch (e) {
        console.error(e);
        setError("Failed to load your resumes.");
      }
    };
    init();
  }, []);

  const analyze = async () => {
    if (!selectedId) return;
    setLoading(true);
    setError("");
    try {
      const resume = await Resume.get(selectedId);
      const payload = resume.optimized_content || resume.parsed_content;

      const prompt = `Extract transferable skills from the following resume JSON and map them to other roles/industries.
Return concise, human-usable bullets.

RESUME_JSON:
${payload}

TARGET_ROLE: ${targetRole || "None specified"}
TARGET_INDUSTRY: ${targetIndustry || "None specified"}

Output JSON:
{
  "top_transferable_skills": string[],
  "role_mappings": [ { "role": string, "alignment_score": number, "why": string } ],
  "suggested_bullets": string[]
}`;

      const response = await retryWithBackoff(() => InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            top_transferable_skills: { type: "array", items: { type: "string" } },
            role_mappings: { type: "array", items: { type: "object" } },
            suggested_bullets: { type: "array", items: { type: "string" } }
          }
        }
      }), { retries: 3, baseDelay: 1200 });

      setResult(response);
    } catch (e) {
      console.error(e);
      setError("Service is busy. Please try again soon.");
    }
    setLoading(false);
  };

  return (
    <PremiumGate feature="transferable_skills">
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-800 rounded-full text-sm font-medium mb-4">
              <Sparkles className="w-4 h-4" /> AI Transferable Skills
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-800">Transferable Skills</h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">Discover how your experience maps to other roles and industries.</p>
          </div>

          {error && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="text-red-700 py-3">{error}</CardContent>
            </Card>
          )}

          {resumes.length === 0 ? (
            <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>No resumes found</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p>Build a master resume to get started with Transferable Skills.</p>
                <div className="flex gap-3">
                  <Link to={createPageUrl("ResumeBuilder")}>
                    <Button className="bg-blue-600 hover:bg-blue-700 gap-2">
                      Build Resume
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Link to={createPageUrl("MyResumes")}>
                    <Button variant="outline">Go to My Resumes</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Select Resume & Target</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="md:col-span-1">
                      <Select value={selectedId} onValueChange={setSelectedId}>
                        <SelectTrigger><SelectValue placeholder="Choose a resume" /></SelectTrigger>
                        <SelectContent>
                          {resumes.map(r => <SelectItem key={r.id} value={r.id}>{r.version_name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <Input placeholder="Target role (optional)" value={targetRole} onChange={e => setTargetRole(e.target.value)} />
                    <Input placeholder="Target industry (optional)" value={targetIndustry} onChange={e => setTargetIndustry(e.target.value)} />
                  </div>

                  <Button onClick={analyze} disabled={loading || !selectedId} className="w-full md:w-auto">
                    {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Analyzing...</> : <><Target className="w-4 h-4 mr-2" />Extract Transferable Skills</>}
                  </Button>
                </CardContent>
              </Card>

              {result && (
                <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle>Results</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h3 className="font-semibold text-slate-800 mb-2">Top Transferable Skills</h3>
                      <div className="flex flex-wrap gap-2">
                        {result.top_transferable_skills?.map((s, i) => (
                          <Badge key={i} className="bg-blue-50 text-blue-800 border-blue-200">{s}</Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800 mb-2">Role Mappings</h3>
                      <div className="space-y-3">
                        {result.role_mappings?.map((m, i) => (
                          <div key={i} className="p-3 rounded-lg border bg-slate-50">
                            <div className="font-medium">{m.role} — <span className="text-emerald-600">{m.alignment_score}%</span></div>
                            <p className="text-sm text-slate-700 mt-1">{m.why}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800 mb-2">Suggested Bullets</h3>
                      <ul className="list-disc list-inside space-y-1">
                        {result.suggested_bullets?.map((b, i) => <li key={i} className="text-slate-700">{b}</li>)}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </PremiumGate>
  );
}