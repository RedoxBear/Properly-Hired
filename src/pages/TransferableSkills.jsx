import React from "react";
import { base44 } from "@/api/base44Client";
import { Resume } from "@/entities/Resume";
import { InvokeLLM } from "@/integrations/Core";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, Sparkles, Target, Loader2, ArrowRight, Award } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { retryWithBackoff } from "@/components/utils/retry";
import AgentChat from "@/components/agents/AgentChat";
import ONetAttribution from "@/components/onet/ONetAttribution";
import ONetContentModel from "@/components/onet/ONetContentModel";

// Kyle's Transferable Skills Expertise
const KYLE_SKILLS_EXPERTISE = [
  { name: "Skill Mapping Framework", icon: "🗺️", color: "blue" },
  { name: "Achievement Extraction", icon: "🏆", color: "gold" },
  { name: "Industry Crossover", icon: "🔄", color: "green" },
  { name: "Quantification Strategies", icon: "📊", color: "purple" },
  { name: "Impact Framing", icon: "⚡", color: "orange" },
  { name: "Career Narrative", icon: "📖", color: "red" }
];

export default function TransferableSkills() {
  const [resumes, setResumes] = React.useState([]);
  const [selectedId, setSelectedId] = React.useState("");
  const [targetRole, setTargetRole] = React.useState("");
  const [targetIndustry, setTargetIndustry] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState(null);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
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

      // Query Kyle's KnowledgeBase for transferable skills methodology
      const kyleKnowledge = await base44.entities.KnowledgeBase.filter({
        agent_access: "kyle",
        category: "H01_CV_CoverLetters",
        is_active: true
      });

      const knowledgeContext = kyleKnowledge
        .map(k => `[${k.subcategory}]\n${k.content}`)
        .join("\n\n");

      // Query O*NET local database for occupation matches
      const onetSkills = await base44.entities.ONetSkill.list("-importance", 100);

      const prompt = `You are Kyle, a CV Expert with deep knowledge of career transitions and transferable skills.

KNOWLEDGE BASE (Your Expert Methodology):
${knowledgeContext}

O*NET OCCUPATION DATABASE (for reference):
${JSON.stringify(onetSkills.slice(0, 20))}

CANDIDATE'S RESUME:
${JSON.stringify(payload)}

TARGET_ROLE: ${targetRole || "None specified"}
TARGET_INDUSTRY: ${targetIndustry || "None specified"}

TASK: Extract transferable skills and map them to O*NET occupations and target roles.
- Use your knowledge base methodology for identifying transferable skills
- Cross-reference with O*NET occupation data for accuracy
- Provide O*NET occupation codes where applicable
- Use web search if needed for current market trends

Output JSON:
{
  "top_transferable_skills": string[],
  "role_mappings": [ { "role": string, "onet_code": string, "alignment_score": number, "why": string } ],
  "suggested_bullets": string[],
  "onet_occupations": [ { "code": string, "title": string, "match_score": number } ]
}`;

      const response = await retryWithBackoff(() => InvokeLLM({
        prompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            top_transferable_skills: { type: "array", items: { type: "string" } },
            role_mappings: { type: "array", items: { type: "object" } },
            suggested_bullets: { type: "array", items: { type: "string" } },
            onet_occupations: { type: "array", items: { type: "object" } }
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
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-800 rounded-full text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" /> AI Transferable Skills
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-800">Transferable Skills</h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">Discover how your experience maps to other roles and industries.</p>
        </div>

        {/* Kyle's Expertise Display */}
        <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200 mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-emerald-900">
              <Award className="w-5 h-5 text-emerald-600" />
              Kyle's Transferable Skills Expertise
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {KYLE_SKILLS_EXPERTISE.map((domain, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 bg-white/60 rounded-lg border border-emerald-100 hover:bg-white transition-colors">
                  <span className="text-2xl">{domain.icon}</span>
                  <span className="text-sm font-medium text-emerald-900">{domain.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

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
              <>
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

                    {result.onet_occupations && result.onet_occupations.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
                          <Database className="w-4 h-4 text-blue-600" />
                          O*NET Occupation Matches
                        </h3>
                        <div className="space-y-2">
                          {result.onet_occupations.map((occ, i) => (
                            <div key={i} className="p-3 rounded-lg border bg-blue-50 border-blue-200">
                              <div className="font-medium text-slate-800">
                                {occ.title}
                                <Badge className="ml-2 bg-blue-600">{occ.code}</Badge>
                                <span className="ml-2 text-blue-600">{occ.match_score}% match</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <h3 className="font-semibold text-slate-800 mb-2">Role Mappings</h3>
                      <div className="space-y-3">
                        {result.role_mappings?.map((m, i) => (
                          <div key={i} className="p-3 rounded-lg border bg-slate-50">
                            <div className="font-medium">
                              {m.role}
                              {m.onet_code && <Badge variant="outline" className="ml-2">{m.onet_code}</Badge>}
                              {" — "}
                              <span className="text-emerald-600">{m.alignment_score}%</span>
                            </div>
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

                <ONetAttribution />
              </>
            )}
          </>
        )}

        <ONetContentModel />
      </div>

      {/* Kyle AI Agent Chat */}
      <AgentChat
        agentName="kyle"
        agentTitle="Kyle - CV Expert"
        context={{
          selectedResume: selectedId ? resumes.find(r => r.id === selectedId)?.version_name : "",
          targetRole: targetRole || "Not specified",
          targetIndustry: targetIndustry || "Not specified",
          hasResults: !!result
        }}
      />
    </div>
  );
}