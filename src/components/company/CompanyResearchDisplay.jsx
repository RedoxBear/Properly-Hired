import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Loader2, TrendingUp, Globe, MapPin, Calendar, Users, Newspaper } from "lucide-react";
import { fetchOrgResearch } from "@/components/utils/orgResearch";
import { base44 } from "@/api/base44Client";

export default function CompanyResearchDisplay({ company, jobApplication }) {
    const [research, setResearch] = useState(null);
    const [news, setNews] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!company) return;

        // Check if we already have research in job application
        if (jobApplication?.summary?.company_overview || jobApplication?.summary?.research_snapshot) {
            setResearch({
                overview: jobApplication.summary.company_overview,
                ...jobApplication.summary.research_snapshot
            });
            return;
        }

        // Fetch fresh research
        const fetchResearch = async () => {
            setIsLoading(true);
            setError("");
            try {
                const orgData = await fetchOrgResearch(company);
                setResearch(orgData);

                // Fetch recent news/insights about the company
                try {
                    const newsPrompt = `Find the most recent and relevant news, announcements, or insights about ${company}. Return a JSON array of up to 3 items with: title (string), summary (string), date (string), source (string)`;
                    const newsResponse = await base44.integrations.Core.InvokeLLM({
                        prompt: newsPrompt,
                        add_context_from_internet: true,
                        response_json_schema: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    title: { type: "string" },
                                    summary: { type: "string" },
                                    date: { type: "string" },
                                    source: { type: "string" }
                                }
                            }
                        }
                    });
                    setNews(newsResponse || []);
                } catch (newsError) {
                    console.error("Failed to fetch news:", newsError);
                }
            } catch (err) {
                console.error("Failed to fetch company research:", err);
                setError("Could not load company information");
            }
            setIsLoading(false);
        };

        fetchResearch();
    }, [company, jobApplication]);

    if (isLoading) {
        return (
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                <CardContent className="p-6 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-600 mr-2" />
                    <span className="text-blue-800">Researching {company}...</span>
                </CardContent>
            </Card>
        );
    }

    if (error || !research) return null;

    return (
        <div className="space-y-4">
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2 text-blue-900">
                        <Building2 className="w-5 h-5 text-blue-600" />
                        Company Intelligence: {company}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {research.overview && (
                        <div>
                            <h4 className="text-sm font-semibold text-blue-800 mb-2">Overview</h4>
                            <p className="text-sm text-blue-900 leading-relaxed">
                                {research.overview}
                            </p>
                        </div>
                    )}
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {research.industry && (
                            <div className="space-y-1">
                                <div className="text-xs font-medium text-blue-700 uppercase tracking-wider flex items-center gap-1">
                                    <TrendingUp className="w-3 h-3" />
                                    Industry
                                </div>
                                <div className="text-sm font-medium text-blue-900">{research.industry}</div>
                            </div>
                        )}
                        
                        {research.size && (
                            <div className="space-y-1">
                                <div className="text-xs font-medium text-blue-700 uppercase tracking-wider flex items-center gap-1">
                                    <Users className="w-3 h-3" />
                                    Size
                                </div>
                                <div className="text-sm font-medium text-blue-900">{research.size}</div>
                            </div>
                        )}
                        
                        {research.founded && (
                            <div className="space-y-1">
                                <div className="text-xs font-medium text-blue-700 uppercase tracking-wider flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    Founded
                                </div>
                                <div className="text-sm font-medium text-blue-900">{research.founded}</div>
                            </div>
                        )}
                        
                        {research.headquarters && (
                            <div className="space-y-1">
                                <div className="text-xs font-medium text-blue-700 uppercase tracking-wider flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    HQ
                                </div>
                                <div className="text-sm font-medium text-blue-900">{research.headquarters}</div>
                            </div>
                        )}
                    </div>

                    {research.website && (
                        <div className="pt-2 border-t border-blue-200/60">
                            <a 
                                href={research.website} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1"
                            >
                                <Globe className="w-4 h-4" />
                                Visit Website
                            </a>
                        </div>
                    )}
                </CardContent>
            </Card>

            {news.length > 0 && (
                <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base font-semibold flex items-center gap-2 text-purple-900">
                            <Newspaper className="w-5 h-5 text-purple-600" />
                            Recent News & Insights
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {news.map((item, idx) => (
                            <div key={idx} className="bg-white/70 rounded-lg p-3 border border-purple-100">
                                <h4 className="font-medium text-sm text-purple-900 mb-1">{item.title}</h4>
                                <p className="text-xs text-purple-800 mb-2">{item.summary}</p>
                                <div className="flex items-center justify-between text-xs text-purple-600">
                                    <span>{item.source}</span>
                                    <span>{item.date}</span>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}