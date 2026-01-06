import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Globe, Calendar, Users, Building2, MapPin, ExternalLink } from "lucide-react";

export default function CompanyResearchCard({ company, orgResearch }) {
    if (!orgResearch) return null;

    return (
        <Card className="bg-slate-50 border-slate-200 mb-6">
            <CardHeader className="pb-3">
                <CardTitle className="text-base font-medium flex items-center gap-2 text-slate-700">
                    <Building2 className="w-4 h-4 text-blue-600" />
                    Company Snapshot: {company}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {orgResearch.overview && (
                    <p className="text-sm text-slate-600 leading-relaxed">
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

                {orgResearch.website && (
                    <div className="pt-2 border-t border-slate-200/60 flex justify-end">
                        <a 
                            href={orgResearch.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1"
                        >
                            Visit Website
                            <ExternalLink className="w-3 h-3" />
                        </a>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}