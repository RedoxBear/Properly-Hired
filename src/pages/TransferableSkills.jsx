import React from "react";
import { base44 } from "@/api/base44Client";
import { Resume } from "@/entities/Resume";
import { InvokeLLM } from "@/integrations/Core";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, Sparkles, Target, Loader2, ArrowRight, Award, Database } from "lucide-react";
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

      // Query live O*NET API for real-time occupation data
      let liveOnetData = null;
      try {
        if (targetRole) {
          const onetSearchResponse = await base44.functions.invoke('queryONetAPI', {
            endpoint: '/online/search',
            params: { keyword: targetRole }
          });
          liveOnetData = onetSearchResponse;
        }
      } catch (e) {
        console.log("O*NET API unavailable, using local data only", e);
      }

      const prompt = `You are Kyle, a Career Transition Expert specializing in identifying transferable skills for career pivots.

CAREER TRANSITION METHODOLOGY:
${knowledgeContext}

CANDIDATE'S CURRENT EXPERIENCE:
${JSON.stringify(payload)}

TARGET CAREER DIRECTION:
- Target Role: ${targetRole || "Open to exploration"}
- Target Industry: ${targetIndustry || "Open to exploration"}

YOUR TASK - Career Change Analysis Based on Target:

${targetRole || targetIndustry ? `
FOCUSED ANALYSIS (Target Specified):
1. Extract transferable skills from candidate's CV that match the TARGET ROLE: "${targetRole}" and TARGET INDUSTRY: "${targetIndustry}"
2. Calculate a PRIMARY alignment score (0-100) for how well their current experience matches "${targetRole}" in "${targetIndustry}"
3. List 3-5 alternate career paths based on their skills (if target role isn't perfect match)
4. For each career path including the primary target, provide O*NET codes and realistic match scores
5. Suggest how to reframe their CV specifically for "${targetRole}"
` : `
EXPLORATORY ANALYSIS (No Target):
1. Extract ALL transferable skills from the candidate's experience
2. Identify 3-5 realistic career paths based on their skills
3. For each career path, provide O*NET occupation codes and match scores
4. Calculate realistic alignment scores (0-100) based on skill overlap
5. Suggest how to reframe their experience for each target role
`}

SCORING METHODOLOGY:
- 90-100: Direct skill match, minimal retraining needed
- 75-89: Strong transferable skills, some upskilling required
- 60-74: Moderate overlap, significant retraining needed
- Below 60: Major pivot, extensive retraining required

${targetRole ? `
CRITICAL: The FIRST role mapping MUST be the target role "${targetRole}" with its alignment score based on the candidate's actual CV.
` : ''}

OUTPUT REQUIREMENTS:
Return JSON with ACTUAL NUMERIC SCORES (not placeholders):

{
  "top_transferable_skills": ["Project Management", "Data Analysis", "Team Leadership"],
  "role_mappings": [
    {
      "role": "${targetRole || 'Product Manager'}",
      "onet_code": "11-2021.00",
      "alignment_score": 82,
      "why": "Your program management and stakeholder coordination directly transfer. Need to develop product strategy skills."
    }
  ],
  "suggested_bullets": [
    "Led cross-functional teams of 12 to deliver $2M projects, demonstrating product lifecycle management",
    "Analyzed user requirements and market trends to inform strategic decisions"
  ],
  "onet_occupations": [
    {
      "code": "11-2021.00",
      "title": "${targetRole || 'Marketing Managers'}",
      "match_score": 78
    }
  ]
}

CRITICAL REQUIREMENTS:
1. Every alignment_score and match_score MUST be a realistic NUMBER 0-100 based on the candidate's actual CV
2. If target role is specified, it MUST appear as the FIRST role_mapping with a score reflecting actual skill overlap
3. Scores must be HONEST - don't inflate scores, calculate based on actual skill matches
4. Never use strings like "TBD" or "%" in numeric fields`;

      const response = await retryWithBackoff(() => base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            top_transferable_skills: { type: "array", items: { type: "string" } },
            role_mappings: { 
              type: "array", 
              items: { 
                type: "object",
                properties: {
                  role: { type: "string" },
                  onet_code: { type: "string" },
                  alignment_score: { type: "number" },
                  why: { type: "string" }
                },
                required: ["role", "alignment_score", "why"]
              }
            },
            suggested_bullets: { type: "array", items: { type: "string" } },
            onet_occupations: { 
              type: "array", 
              items: { 
                type: "object",
                properties: {
                  code: { type: "string" },
                  title: { type: "string" },
                  match_score: { type: "number" }
                },
                required: ["title", "match_score"]
              }
            }
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
          <h1 className="text-3xl md:text-4xl font-bold text-slate-800">Career Change Explorer</h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">Discover transferable skills and explore new career paths using O*NET occupation data</p>
          
          <Card className="mt-6 bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                <Lightbulb className="w-4 h-4" />
                How to Use This Tool
              </h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• <strong>Leave Target Role/Industry blank</strong> to explore all possible career paths based on your skills</li>
                <li>• <strong>Specify a Target Role</strong> (e.g., "Data Analyst") to see how well your skills match that specific career</li>
                <li>• <strong>Use O*NET codes</strong> from results to research detailed job requirements at onetcenter.org</li>
                <li>• <strong>Review alignment scores</strong> to understand retraining needs: 90+ = ready now, 75-89 = minor upskilling, 60-74 = significant training</li>
              </ul>
            </CardContent>
          </Card>
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
                  <Input 
                   placeholder="Target role (e.g., 'Product Manager' or leave blank to explore)" 
                   value={targetRole} 
                   onChange={e => setTargetRole(e.target.value)} 
                  />
                  <Input 
                   placeholder="Target industry (e.g., 'Technology' or leave blank)" 
                   value={targetIndustry} 
                   onChange={e => setTargetIndustry(e.target.value)} 
                  />
                </div>

                <Button onClick={analyze} disabled={loading || !selectedId} className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-700">
                  {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Analyzing Career Options...</> : <><Target className="w-4 h-4 mr-2" />Analyze Career Transition Potential</>}
                </Button>
                <p className="text-xs text-slate-500 mt-2">
                  {targetRole ? `Analyzing fit for: ${targetRole}` : "Exploring all career options based on your skills"}
                </p>
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
                               {occ.title || "Occupation Title"}
                               {occ.code && <Badge className="ml-2 bg-blue-600">{occ.code}</Badge>}
                               <span className="ml-2 text-blue-600">
                                 {typeof occ.match_score === 'number' ? `${occ.match_score}%` : 'N/A'} match
                               </span>
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
                              {m.role || "Role"}
                              {m.onet_code && <Badge variant="outline" className="ml-2">{m.onet_code}</Badge>}
                              {" — "}
                              <span className="text-emerald-600">
                                {typeof m.alignment_score === 'number' ? `${m.alignment_score}%` : 'N/A'}
                              </span>
                            </div>
                            <p className="text-sm text-slate-700 mt-1">{m.why || "Alignment explanation"}</p>
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