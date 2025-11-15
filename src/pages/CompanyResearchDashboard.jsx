import React, { useState, useEffect } from "react";
import { CompanyResearch } from "@/entities/CompanyResearch";
import { JobApplication } from "@/entities/JobApplication";
import { UserPreferences } from "@/entities/UserPreferences";
import { InvokeLLM } from "@/integrations/Core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
    Building2, 
    Plus, 
    Search, 
    Loader2, 
    TrendingUp,
    Briefcase,
    Filter,
    Target
} from "lucide-react";
import { motion } from "framer-motion";
import { retryWithBackoff } from "@/components/utils/retry";
import CompanyResearchCard from "@/components/company/CompanyResearchCard";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function CompanyResearchDashboard() {
    const [companies, setCompanies] = useState([]);
    const [applications, setApplications] = useState([]);
    const [selectedCompany, setSelectedCompany] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isResearching, setIsResearching] = useState(false);
    const [error, setError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [fitFilter, setFitFilter] = useState("all");
    const [newCompanyName, setNewCompanyName] = useState("");
    const [newCompanyWebsite, setNewCompanyWebsite] = useState("");

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [fetchedCompanies, fetchedApps] = await Promise.all([
                CompanyResearch.list("-created_date"),
                JobApplication.list("-created_date")
            ]);
            setCompanies(fetchedCompanies);
            setApplications(fetchedApps);
        } catch (e) {
            console.error("Error loading data:", e);
            setError("Failed to load company research");
        }
        setIsLoading(false);
    };

    const researchCompany = async (companyName, website = "") => {
        setIsResearching(true);
        setError("");

        try {
            const [prefs] = await UserPreferences.list("-created_date", 1);
            const userPrefs = prefs || {};

            const researchPrompt = `You are an expert company researcher. Research ${companyName} and provide comprehensive insights.
${website ? `\nCompany website: ${website}` : ''}

**User's Career Preferences (for fit analysis):**
${JSON.stringify({
    target_roles: userPrefs.target_roles || [],
    target_industries: userPrefs.target_industries || [],
    career_goals: userPrefs.career_goals || "",
    location_preferences: userPrefs.location_preferences || {},
    job_search_status: userPrefs.job_search_status || "actively_looking"
}, null, 2)}

**Your Task:**
Research the company and provide actionable insights including recent news, funding, culture, and calculate a personalized fit score.

Return JSON with:
{
  "company_info": {
    "website": string,
    "industry": string,
    "size": string,
    "headquarters": string,
    "founded": string
  },
  "overview": string, // 2-3 sentences about the company
  "recent_news": [
    {
      "title": string,
      "summary": string,
      "date": string // recent date
    }
  ], // 3-5 recent news items
  "funding_info": {
    "stage": string, // e.g., "Series B", "Public", "Bootstrapped"
    "total_raised": string,
    "last_round": string
  },
  "culture_insights": string[], // 5-7 insights about culture, values, work environment
  "tech_stack": string[], // 8-12 technologies they use
  "glassdoor_highlights": {
    "rating": string,
    "pros": string[], // 3-5 pros from reviews
    "cons": string[] // 3-5 cons from reviews
  },
  "fit_analysis": {
    "overall_fit": string, // "excellent" | "good" | "fair" | "poor"
    "fit_score": number, // 0-100 based on user preferences
    "culture_fit": number, // 0-100
    "values_alignment": number, // 0-100
    "growth_potential": number, // 0-100
    "work_life_balance": number, // 0-100
    "reasoning": string, // 2-3 sentences explaining the fit score
    "green_flags": string[], // 3-5 positive aspects for this user
    "red_flags": string[] // 2-4 concerns or warnings
  }
}

**Guidelines:**
- Use current, real information when possible
- If information is unavailable, indicate that clearly
- For fit analysis, consider user's specific preferences
- Be honest about red flags - help them make informed decisions
- Focus on actionable insights`;

            const response = await retryWithBackoff(() =>
                InvokeLLM({
                    prompt: researchPrompt,
                    add_context_from_internet: true,
                    response_json_schema: {
                        type: "object",
                        properties: {
                            company_info: { type: "object" },
                            overview: { type: "string" },
                            recent_news: { type: "array" },
                            funding_info: { type: "object" },
                            culture_insights: { type: "array", items: { type: "string" } },
                            tech_stack: { type: "array", items: { type: "string" } },
                            glassdoor_highlights: { type: "object" },
                            fit_analysis: { type: "object" }
                        }
                    }
                }),
                { retries: 2, baseDelay: 1000 }
            );

            const companyData = {
                company_name: companyName,
                website: response.company_info?.website || website,
                industry: response.company_info?.industry || "",
                size: response.company_info?.size || "",
                headquarters: response.company_info?.headquarters || "",
                founded: response.company_info?.founded || "",
                auto_research: {
                    overview: response.overview,
                    recent_news: response.recent_news || [],
                    funding_info: response.funding_info || {},
                    culture_insights: response.culture_insights || [],
                    tech_stack: response.tech_stack || [],
                    glassdoor_highlights: response.glassdoor_highlights || {}
                },
                fit_score: response.fit_analysis?.fit_score || 0,
                fit_analysis: response.fit_analysis || {},
                research_status: "completed",
                last_researched_at: new Date().toISOString()
            };

            const existing = companies.find(c => c.company_name.toLowerCase() === companyName.toLowerCase());
            if (existing) {
                await CompanyResearch.update(existing.id, companyData);
            } else {
                await CompanyResearch.create(companyData);
            }

            await loadData();
            setShowAddDialog(false);
            setNewCompanyName("");
            setNewCompanyWebsite("");
        } catch (e) {
            console.error("Error researching company:", e);
            setError("Failed to research company. Please try again.");
        }

        setIsResearching(false);
    };

    const handleAddCompany = async () => {
        if (!newCompanyName.trim()) {
            setError("Company name is required");
            return;
        }

        await researchCompany(newCompanyName.trim(), newCompanyWebsite.trim());
    };

    const handleUpdateCompany = async (companyId, updates) => {
        try {
            await CompanyResearch.update(companyId, updates);
            await loadData();
            if (selectedCompany?.id === companyId) {
                const updated = await CompanyResearch.get(companyId);
                setSelectedCompany(updated);
            }
        } catch (e) {
            console.error("Error updating company:", e);
            setError("Failed to update company");
        }
    };

    const handleRefreshResearch = async (company) => {
        await researchCompany(company.company_name, company.website);
        const updated = await CompanyResearch.get(company.id);
        setSelectedCompany(updated);
    };

    const getLinkedApps = (companyName) => {
        return applications.filter(app => 
            app.company_name?.toLowerCase() === companyName.toLowerCase()
        );
    };

    const filteredCompanies = companies.filter(company => {
        const matchesSearch = company.company_name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFit = 
            fitFilter === "all" ||
            (fitFilter === "excellent" && company.fit_score >= 80) ||
            (fitFilter === "good" && company.fit_score >= 60 && company.fit_score < 80) ||
            (fitFilter === "fair" && company.fit_score >= 40 && company.fit_score < 60) ||
            (fitFilter === "poor" && company.fit_score < 40);
        return matchesSearch && matchesFit;
    });

    const stats = {
        total: companies.length,
        excellent: companies.filter(c => c.fit_score >= 80).length,
        researching: companies.filter(c => c.research_status === "researching").length
    };

    return (
        <div className="min-h-screen p-4 md:p-8 bg-background">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 rounded-full text-sm font-medium mb-4">
                        <Building2 className="w-4 h-4" />
                        Company Research
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">Company Research Dashboard</h1>
                    <p className="text-lg text-muted-foreground">
                        Research companies, track culture insights, and calculate personalized fit scores.
                    </p>
                </motion.div>

                {error && (
                    <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                    <Card>
                        <CardContent className="p-4">
                            <div className="text-2xl font-bold text-foreground">{stats.total}</div>
                            <div className="text-sm text-muted-foreground">Companies Researched</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-green-50 border-green-200">
                        <CardContent className="p-4">
                            <div className="text-2xl font-bold text-green-700">{stats.excellent}</div>
                            <div className="text-sm text-green-600">Excellent Fits (80+)</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-amber-50 border-amber-200">
                        <CardContent className="p-4">
                            <div className="text-2xl font-bold text-amber-700">{stats.researching}</div>
                            <div className="text-sm text-amber-600">In Progress</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Controls */}
                <Card>
                    <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="relative flex-1">
                                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                                <Input
                                    placeholder="Search companies..."
                                    className="pl-10"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <Select value={fitFilter} onValueChange={setFitFilter}>
                                <SelectTrigger className="w-full md:w-[180px]">
                                    <Filter className="w-4 h-4 mr-2" />
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Fit Scores</SelectItem>
                                    <SelectItem value="excellent">Excellent (80+)</SelectItem>
                                    <SelectItem value="good">Good (60-79)</SelectItem>
                                    <SelectItem value="fair">Fair (40-59)</SelectItem>
                                    <SelectItem value="poor">Poor (&lt;40)</SelectItem>
                                </SelectContent>
                            </Select>
                            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                                <DialogTrigger asChild>
                                    <Button className="bg-blue-600 hover:bg-blue-700">
                                        <Plus className="w-4 h-4 mr-2" />
                                        Research Company
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Research New Company</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4 py-4">
                                        <div>
                                            <label className="text-sm font-medium mb-2 block">Company Name *</label>
                                            <Input
                                                value={newCompanyName}
                                                onChange={(e) => setNewCompanyName(e.target.value)}
                                                placeholder="e.g. Google, Microsoft"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium mb-2 block">Website (optional)</label>
                                            <Input
                                                value={newCompanyWebsite}
                                                onChange={(e) => setNewCompanyWebsite(e.target.value)}
                                                placeholder="https://..."
                                            />
                                        </div>
                                        <Alert className="border-blue-200 bg-blue-50">
                                            <AlertDescription className="text-blue-800 text-sm">
                                                AI will research the company and calculate a personalized fit score based on your career preferences.
                                            </AlertDescription>
                                        </Alert>
                                        <div className="flex gap-3">
                                            <Button 
                                                onClick={handleAddCompany} 
                                                disabled={isResearching}
                                                className="flex-1 bg-blue-600 hover:bg-blue-700"
                                            >
                                                {isResearching ? (
                                                    <>
                                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                        Researching...
                                                    </>
                                                ) : (
                                                    <>
                                                        <TrendingUp className="w-4 h-4 mr-2" />
                                                        Start Research
                                                    </>
                                                )}
                                            </Button>
                                            <Button 
                                                variant="outline" 
                                                onClick={() => setShowAddDialog(false)}
                                                disabled={isResearching}
                                            >
                                                Cancel
                                            </Button>
                                        </div>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </CardContent>
                </Card>

                {/* Company List / Details View */}
                {isLoading ? (
                    <div className="text-center py-12 text-muted-foreground">Loading companies...</div>
                ) : filteredCompanies.length === 0 ? (
                    <Card>
                        <CardContent className="py-16 text-center">
                            <Building2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                            <h3 className="text-xl font-medium text-foreground mb-2">No companies researched yet</h3>
                            <p className="text-muted-foreground mb-6">Start researching companies to track insights and calculate fit scores.</p>
                            <Button onClick={() => setShowAddDialog(true)} className="bg-blue-600 hover:bg-blue-700">
                                <Plus className="w-4 h-4 mr-2" />
                                Research Your First Company
                            </Button>
                        </CardContent>
                    </Card>
                ) : selectedCompany ? (
                    <div>
                        <Button onClick={() => setSelectedCompany(null)} variant="outline" className="mb-4">
                            ← Back to List
                        </Button>
                        <CompanyResearchCard 
                            research={selectedCompany}
                            onUpdate={(updates) => handleUpdateCompany(selectedCompany.id, updates)}
                            onRefresh={() => handleRefreshResearch(selectedCompany)}
                        />
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredCompanies.map(company => {
                            const linkedApps = getLinkedApps(company.company_name);
                            const fitColor = 
                                company.fit_score >= 80 ? "text-green-600" :
                                company.fit_score >= 60 ? "text-blue-600" :
                                company.fit_score >= 40 ? "text-amber-600" : "text-red-600";

                            return (
                                <motion.div key={company.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                                    <Card className="hover:shadow-lg transition-all cursor-pointer" onClick={() => setSelectedCompany(company)}>
                                        <CardHeader>
                                            <div className="flex items-start justify-between gap-3 mb-2">
                                                <CardTitle className="text-lg">{company.company_name}</CardTitle>
                                                {typeof company.fit_score === "number" && (
                                                    <span className={`text-2xl font-bold ${fitColor}`}>
                                                        {company.fit_score}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="space-y-1 text-xs text-muted-foreground">
                                                {company.industry && <div>📊 {company.industry}</div>}
                                                {company.headquarters && <div>📍 {company.headquarters}</div>}
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            {linkedApps.length > 0 && (
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                                                    <Briefcase className="w-4 h-4" />
                                                    {linkedApps.length} linked application{linkedApps.length !== 1 ? 's' : ''}
                                                </div>
                                            )}
                                            <Button variant="outline" size="sm" className="w-full">
                                                View Research
                                            </Button>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}