import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Globe, Calendar, Users, Building2, MapPin, ExternalLink, UserRoundSearch, UsersRound, Map } from "lucide-react";

export default function CompanyResearchCard({ company, orgResearch }) {
    if (!orgResearch) return null;

    return (
        <Card className="bg-slate-50 border-slate-200 mb-6">
            <CardHeader className="pb-3">
                <CardTitle className="text-base font-medium flex items-center gap-2 text-slate-700">
                    <Building2 className="w-4 h-4 text-blue-600" />
                    Company Strategy Brief: {company}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Deep Dive Sections */}
                {(orgResearch.viability || orgResearch.trigger || orgResearch.dna || orgResearch.hook) && (
                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                        {orgResearch.viability && (
                            <div className="bg-white p-3 rounded-md border border-slate-100 shadow-sm">
                                <div className="text-xs font-bold text-slate-500 uppercase mb-1">👻 Viability Check</div>
                                <div className="text-sm text-slate-800">{orgResearch.viability}</div>
                            </div>
                        )}
                        {orgResearch.trigger && (
                            <div className="bg-white p-3 rounded-md border border-slate-100 shadow-sm">
                                <div className="text-xs font-bold text-green-600 uppercase mb-1">💰 The Trigger (Why Now?)</div>
                                <div className="text-sm text-slate-800">{orgResearch.trigger}</div>
                            </div>
                        )}
                        {orgResearch.dna && (
                            <div className="bg-white p-3 rounded-md border border-slate-100 shadow-sm">
                                <div className="text-xs font-bold text-purple-600 uppercase mb-1">🧬 Leadership DNA</div>
                                <div className="text-sm text-slate-800">{orgResearch.dna}</div>
                            </div>
                        )}
                        {orgResearch.hook && (
                            <div className="bg-white p-3 rounded-md border border-slate-100 shadow-sm">
                                <div className="text-xs font-bold text-blue-600 uppercase mb-1">⚓ The Hook (Active Project)</div>
                                <div className="text-sm text-slate-800">{orgResearch.hook}</div>
                            </div>
                        )}
                    </div>
                )}

                {(orgResearch.likely_manager_titles || orgResearch.leadership_team_summary || orgResearch.geographic_activity_summary) && (
                    <div className="grid md:grid-cols-3 gap-4 mb-2">
                        {orgResearch.likely_manager_titles && (
                            <div className="bg-white p-3 rounded-md border border-slate-100 shadow-sm">
                                <div className="text-xs font-bold text-slate-500 uppercase mb-1 flex items-center gap-1">
                                    <UserRoundSearch className="w-3 h-3" />
                                    Likely Manager Titles
                                </div>
                                <div className="text-sm text-slate-800">{orgResearch.likely_manager_titles}</div>
                            </div>
                        )}
                        {orgResearch.leadership_team_summary && (
                            <div className="bg-white p-3 rounded-md border border-slate-100 shadow-sm">
                                <div className="text-xs font-bold text-slate-500 uppercase mb-1 flex items-center gap-1">
                                    <UsersRound className="w-3 h-3" />
                                    Leadership Team
                                </div>
                                <div className="text-sm text-slate-800">{orgResearch.leadership_team_summary}</div>
                            </div>
                        )}
                        {orgResearch.geographic_activity_summary && (
                            <div className="bg-white p-3 rounded-md border border-slate-100 shadow-sm">
                                <div className="text-xs font-bold text-slate-500 uppercase mb-1 flex items-center gap-1">
                                    <Map className="w-3 h-3" />
                                    Geographic Activity
                                </div>
                                <div className="text-sm text-slate-800">{orgResearch.geographic_activity_summary}</div>
                            </div>
                        )}
                    </div>
                )}

                {orgResearch.overview && (
                    <p className="text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                        <span className="font-semibold text-slate-700">Overview: </span>
                        {orgResearch.overview}
                    </p>
                )}
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                    {orgResearch.industry && (
                        <div className="space-y-1">
                            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Industry</div>
                            <div className="text-sm font-medium text-slate-800">{orgResearch.industry}</div>
                        </div>
                    )}
                    
                    {orgResearch.size && (
                        <div className="space-y-1">
                            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Size</div>
                            <div className="flex items-center gap-1.5 text-sm font-medium text-slate-800">
                                <Users className="w-3.5 h-3.5 text-slate-400" />
                                {orgResearch.size}
                            </div>
                        </div>
                    )}
                    
                    {orgResearch.founded && (
                        <div className="space-y-1">
                            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Founded</div>
                            <div className="flex items-center gap-1.5 text-sm font-medium text-slate-800">
                                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                {orgResearch.founded}
                            </div>
                        </div>
                    )}
                    
                    {orgResearch.headquarters && (
                        <div className="space-y-1">
                            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">HQ</div>
                            <div className="flex items-center gap-1.5 text-sm font-medium text-slate-800">
                                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                {orgResearch.headquarters}
                            </div>
                        </div>
                    )}
                </div>

                {(orgResearch.website || orgResearch.linkedin_company_url || orgResearch.linkedin_people_url) && (
                    <div className="pt-2 border-t border-slate-200/60 flex flex-wrap gap-3 justify-end">
                        {orgResearch.website && (
                            <a 
                                href={orgResearch.website} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1"
                            >
                                Visit Website
                                <ExternalLink className="w-3 h-3" />
                            </a>
                        )}
                        {orgResearch.linkedin_company_url && (
                            <a
                                href={orgResearch.linkedin_company_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1"
                            >
                                LinkedIn Company
                                <ExternalLink className="w-3 h-3" />
                            </a>
                        )}
                        {orgResearch.linkedin_people_url && (
                            <a
                                href={orgResearch.linkedin_people_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1"
                            >
                                LinkedIn People Search
                                <ExternalLink className="w-3 h-3" />
                            </a>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
