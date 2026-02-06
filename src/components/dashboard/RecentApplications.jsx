
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import { 
    Building, 
    ExternalLink, 
    Clock,
    CheckCircle2,
    AlertCircle,
    Target,
    ArrowRight
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const statusConfig = {
    analyzing: { color: "bg-yellow-100 text-yellow-800 border-yellow-300", icon: Clock, label: "Analyzing" },
    ready: { color: "bg-green-100 text-green-800 border-green-300", icon: CheckCircle2, label: "Ready to Apply" },
    applied: { color: "bg-blue-100 text-blue-800 border-blue-300", icon: Target, label: "Applied" },
    interview: { color: "bg-purple-100 text-purple-800 border-purple-300", icon: CheckCircle2, label: "Interview" },
    rejected: { color: "bg-red-100 text-red-800 border-red-300", icon: AlertCircle, label: "Rejected" },
    offer: { color: "bg-green-100 text-green-800 border-green-300", icon: CheckCircle2, label: "Offer!" }
};

export default function RecentApplications({ applications, isLoading }) {
    if (isLoading) {
        return (
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle className="text-xl font-bold text-slate-800">Recent Applications</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {Array(3).fill(0).map((_, i) => (
                        <div key={i} className="p-4 border border-slate-200 rounded-xl">
                            <Skeleton className="h-5 w-48 mb-2" />
                            <Skeleton className="h-4 w-32 mb-3" />
                            <div className="flex justify-between items-center">
                                <Skeleton className="h-6 w-20" />
                                <Skeleton className="h-4 w-16" />
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-4">
                <div className="flex justify-between items-center">
                    <CardTitle className="text-xl font-bold text-slate-800">Recent Applications</CardTitle>
                    <Link to={createPageUrl("JobAnalysis")}>
                        <Button variant="outline" size="sm" className="gap-2">
                            New Application
                            <ArrowRight className="w-4 h-4" />
                        </Button>
                    </Link>
                </div>
            </CardHeader>
            <CardContent>
                {applications.length === 0 ? (
                    <div className="text-center py-8">
                        <Building className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-slate-600 mb-2">No applications yet</h3>
                        <p className="text-slate-500 mb-4">Start by analyzing your first job posting</p>
                        <Link to={createPageUrl("JobAnalysis")}>
                            <Button className="bg-blue-600 hover:bg-blue-700">
                                Analyze Job Posting
                            </Button>
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {applications.slice(0, 5).map((application) => {
                            const status = statusConfig[application.application_status] || statusConfig.analyzing;
                            const StatusIcon = status.icon;
                            
                            return (
                                <div 
                                    key={application.id} 
                                    className="p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all duration-200 group"
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <h3 className="font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">
                                                {application.job_title}
                                            </h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Building className="w-4 h-4 text-slate-400" />
                                                <span className="text-sm text-slate-600">{application.company_name}</span>
                                            </div>
                                        </div>
                                        {application.job_posting_url && (
                                            <a 
                                                href={application.job_posting_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 hover:text-blue-800"
                                            >
                                                <ExternalLink className="w-4 h-4" />
                                            </a>
                                        )}
                                    </div>
                                    {application.analysis_summary_md && (
                                        <div className="text-sm text-slate-600 line-clamp-2 whitespace-pre-wrap mb-3">
                                            {application.analysis_summary_md}
                                        </div>
                                    )}
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <Badge className={`${status.color} border font-medium px-3 py-1`}>
                                                <StatusIcon className="w-3 h-3 mr-1" />
                                                {status.label}
                                            </Badge>
                                            {application.optimization_score && (
                                                <div className="flex items-center gap-1 text-sm text-slate-600">
                                                    <Target className="w-3 h-3" />
                                                    {application.optimization_score}% match
                                                </div>
                                            )}
                                        </div>
                                        <Link to={createPageUrl(`JobSummary?id=${application.id}`)} className="text-sm text-blue-600 hover:underline">Open Summary →</Link>
                                    </div>
                                </div>
                            );
                        })}
                        
                        {applications.length > 5 && (
                            <div className="text-center pt-4">
                                <Link to={createPageUrl("JobLibrary")}>
                                    <Button variant="outline" className="w-full">
                                        View All Applications
                                        <ArrowRight className="w-4 h-4 ml-2" />
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
