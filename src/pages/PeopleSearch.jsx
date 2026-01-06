import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Loader2, Plus, ExternalLink, Linkedin, Mail } from "lucide-react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";

export default function PeopleSearch() {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [company, setCompany] = React.useState("");
  const [industry, setIndustry] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [results, setResults] = React.useState([]);
  const [error, setError] = React.useState("");

  const searchPeople = async () => {
    if (!searchQuery && !company && !industry) {
      setError("Please enter at least one search criteria");
      return;
    }

    setLoading(true);
    setError("");
    setResults([]);

    try {
      const prompt = `Find professionals matching these criteria:
${searchQuery ? `Role/Title: ${searchQuery}` : ""}
${company ? `Company: ${company}` : ""}
${industry ? `Industry: ${industry}` : ""}

Return a list of 10 realistic professional profiles with LinkedIn-style data.

Return JSON:
{
  "profiles": [
    {
      "name": string,
      "title": string,
      "company": string,
      "location": string,
      "industry": string,
      "linkedin_url": string (use format: https://www.linkedin.com/in/firstname-lastname),
      "summary": string (2-3 sentences about their experience),
      "skills": string[] (3-5 skills)
    }
  ]
}`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            profiles: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  title: { type: "string" },
                  company: { type: "string" },
                  location: { type: "string" },
                  industry: { type: "string" },
                  linkedin_url: { type: "string" },
                  summary: { type: "string" },
                  skills: { type: "array", items: { type: "string" } }
                }
              }
            }
          }
        }
      });

      setResults(response.profiles || []);
    } catch (err) {
      console.error(err);
      setError("Search failed. Please try again.");
    }

    setLoading(false);
  };

  const addToNetwork = async (profile) => {
    try {
      await base44.entities.NetworkContact.create({
        full_name: profile.name,
        job_title: profile.title,
        company: profile.company,
        location: profile.location,
        industry: profile.industry,
        linkedin_url: profile.linkedin_url,
        connection_status: "prospect",
        source: "People Search",
        notes: profile.summary
      });
      alert(`${profile.name} added to your network!`);
    } catch (err) {
      console.error(err);
      alert("Failed to add contact");
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-medium mb-4">
            <Search className="w-4 h-4" />
            People Search
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-2">
            Find Professionals
          </h1>
          <p className="text-lg text-slate-600">
            Search for people in your target companies and industries
          </p>
        </motion.div>

        <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm mb-6">
          <CardHeader>
            <CardTitle>Search Criteria</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Input
                placeholder="Job title or role (e.g., 'Software Engineer', 'Marketing Manager')"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && searchPeople()}
              />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <Input
                placeholder="Company (e.g., 'Google', 'Microsoft')"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && searchPeople()}
              />
              <Input
                placeholder="Industry (e.g., 'Technology', 'Healthcare')"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && searchPeople()}
              />
            </div>
            <Button
              onClick={searchPeople}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Search LinkedIn Network
                </>
              )}
            </Button>
            {error && <p className="text-sm text-red-600">{error}</p>}
          </CardContent>
        </Card>

        {results.length > 0 && (
          <div className="space-y-4">
            {results.map((profile, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-start gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                            {profile.name.charAt(0)}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg text-slate-800">{profile.name}</h3>
                            <p className="text-slate-600">{profile.title}</p>
                            <p className="text-sm text-slate-500">{profile.company} • {profile.location}</p>
                            <p className="text-sm text-slate-600 mt-2">{profile.summary}</p>
                            <div className="flex flex-wrap gap-2 mt-3">
                              {profile.skills?.map((skill, i) => (
                                <Badge key={i} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(profile.linkedin_url, "_blank")}
                        >
                          <Linkedin className="w-4 h-4 mr-2" />
                          View Profile
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => addToNetwork(profile)}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add to Network
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}