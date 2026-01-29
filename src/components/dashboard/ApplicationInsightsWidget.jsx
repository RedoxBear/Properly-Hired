import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
    TrendingUp, 
    TrendingDown, 
    Target, 
    BarChart3,
    ArrowRight,
    Minus
} from "lucide-react";

export default function ApplicationInsightsWidget({ applications }) {
    if (!applications || applications.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <BarChart3 className="w-5 h-5 text-purple-600" />
                        Application Insights
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-slate-600 mb-3">
                        Apply to jobs to see AI-powered insights on your success rates and patterns.
                    </p>
                    <Link to={createPageUrl("ApplicationTracker")}>
                        <Button variant="outline" size="sm" className="w-full">
                            Go to Tracker
                        </Button>
                    </Link>
                </CardContent>
            </Card>
        );
    }

    // Calculate quick stats
    const totalApps = applications.length;
    const applied = applications.filter(a => a.application_status === "applied").length;
    const interviews = applications.filter(a => a.application_status === "interview").length;
    const offers = applications.filter(a => a.application_status === "offer").length;
    const rejected = applications.filter(a => a.application_status === "rejected").length;
    
    const successRate = applied > 0 ? Math.round(((interviews + offers) / applied) * 100) : 0;
    
    const avgScore = applications
        .filter(a => a.optimization_score)
        .reduce((sum, a) => sum + a.optimization_score, 0) / 
        (applications.filter(a => a.optimization_score).length || 1);

    const recentApps = applications.filter(a => {
        const daysSince = (Date.now() - new Date(a.created_date).getTime()) / (1000 * 60 * 60 * 24);
        return daysSince <= 30;
    }).length;

    const prevApps = applications.filter(a => {
        const daysSince = (Date.now() - new Date(a.created_date).getTime()) / (1000 * 60 * 60 * 24);
        return daysSince > 30 && daysSince <= 60;
    }).length;

    const trend = recentApps > prevApps ? "up" : recentApps < prevApps ? "down" : "stable";

    return (
        <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-white">
            <CardHeader>
                <CardTitle className="flex items-center justify-between text-lg">
                    <span className="flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-purple-600" />
                        Application Insights
                    </span>
                    {trend === "up" && (
                        <Badge className="bg-green-100 text-green-700 text-xs">
                            <TrendingUp className="w-3 h-3 mr-1" />
                            Active
                        </Badge>
                    )}
                    {trend === "down" && (
                        <Badge className="bg-amber-100 text-amber-700 text-xs">
                            <TrendingDown className="w-3 h-3 mr-1" />
                            Slower
                        </Badge>
                    )}
                    {trend === "stable" && (
                        <Badge variant="outline" className="text-xs">
                            <Minus className="w-3 h-3 mr-1" />
                            Steady
                        </Badge>
                    )}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Success Rate */}
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-slate-600">Success Rate</span>
                        <span className="text-2xl font-bold text-purple-600">{successRate}%</span>
                    </div>
                    <Progress value={successRate} className="h-2 mb-1" />
                    <div className="text-xs text-slate-500">
                        {interviews} interviews • {offers} offers from {applied} applied
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-2">
                    <div className="text-center p-2 rounded-lg bg-white border">
                        <div className="text-lg font-bold text-slate-800">{totalApps}</div>
                        <div className="text-xs text-slate-600">Total</div>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-white border">
                        <div className="text-lg font-bold text-slate-800">{Math.round(avgScore)}</div>
                        <div className="text-xs text-slate-600">Avg Score</div>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-white border">
                        <div className="text-lg font-bold text-red-600">{rejected}</div>
                        <div className="text-xs text-slate-600">Rejected</div>
                    </div>
                </div>

                {/* Activity */}
                <div className="text-xs text-slate-600">
                    <strong>{recentApps}</strong> applications in last 30 days
                </div>

                {/* CTA */}
                <Link to={createPageUrl("ApplicationTracker")}>
                    <Button variant="outline" size="sm" className="w-full group">
                        View Full Insights
                        <ArrowRight className="w-3 h-3 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                </Link>
            </CardContent>
        </Card>
    );
}