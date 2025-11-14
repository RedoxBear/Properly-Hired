import React, { useState } from "react";
import { InvokeLLM } from "@/integrations/Core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
    TrendingUp, 
    TrendingDown, 
    Target, 
    AlertCircle, 
    Lightbulb, 
    BarChart3,
    Loader2,
    CheckCircle2,
    XCircle
} from "lucide-react";
import { motion } from "framer-motion";
import { retryWithBackoff } from "@/components/utils/retry";

export default function ApplicationInsights({ applications }) {
    const [insights, setInsights] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [error, setError] = useState("");

    const analyzeApplications = async () => {
        if (!applications || applications.length === 0) {
            setError("No applications to analyze");
            return;
        }

        setIsAnalyzing(true);
        setError("");

        const analysisData = applications.map(app => ({
            status: app.application_status,
            company: app.company_name,
            role: app.job_title,
            optimization_score: app.optimization_score,
            applied_date: app.applied_at,
            created_date: app.created_date
        }));

        const prompt = `You are an expert career coach analyzing job application patterns. Analyze the following application history and provide actionable insights.

**APPLICATION DATA:**
${JSON.stringify(analysisData, null, 2)}

**Total Applications:** ${applications.length}

**Your Task:**
Analyze patterns and provide data-driven insights to help improve future applications.

Return JSON with:
{
  "success_rate": {
    "percentage": number, // % of applications that led to interview/offer
    "total_applied": number,
    "interviews": number,
    "offers": number,
    "trend": "improving" | "declining" | "stable"
  },
  "status_breakdown": {
    "analyzing": number,
    "ready": number,
    "applied": number,
    "interview": number,
    "rejected": number,
    "offer": number
  },
  "common_patterns": {
    "rejection_reasons": string[], // 3-5 potential reasons based on data patterns
    "successful_patterns": string[], // 3-5 patterns in successful applications
    "weak_areas": string[] // 3-5 areas needing improvement
  },
  "score_analysis": {
    "average_score": number,
    "high_score_success_rate": number, // Success rate for scores 85+
    "low_score_success_rate": number, // Success rate for scores <70
    "recommendation": string // Should they improve resume quality first?
  },
  "timing_insights": {
    "average_days_to_apply": number, // Days from creation to applied
    "recommendation": string // Apply faster? More preparation?
  },
  "personalized_tips": string[], // 5-7 specific, actionable tips based on their data
  "next_steps": string[] // 3-4 immediate actions they should take
}

**Guidelines:**
- Be specific and data-driven
- Identify real patterns, not generic advice
- If sample size is small, acknowledge it
- Focus on actionable improvements
- Be encouraging but honest`;

        try {
            const response = await retryWithBackoff(() =>
                InvokeLLM({
                    prompt,
                    response_json_schema: {
                        type: "object",
                        properties: {
                            success_rate: {
                                type: "object",
                                properties: {
                                    percentage: { type: "number" },
                                    total_applied: { type: "number" },
                                    interviews: { type: "number" },
                                    offers: { type: "number" },
                                    trend: { type: "string" }
                                }
                            },
                            status_breakdown: { type: "object" },
                            common_patterns: {
                                type: "object",
                                properties: {
                                    rejection_reasons: { type: "array", items: { type: "string" } },
                                    successful_patterns: { type: "array", items: { type: "string" } },
                                    weak_areas: { type: "array", items: { type: "string" } }
                                }
                            },
                            score_analysis: {
                                type: "object",
                                properties: {
                                    average_score: { type: "number" },
                                    high_score_success_rate: { type: "number" },
                                    low_score_success_rate: { type: "number" },
                                    recommendation: { type: "string" }
                                }
                            },
                            timing_insights: {
                                type: "object",
                                properties: {
                                    average_days_to_apply: { type: "number" },
                                    recommendation: { type: "string" }
                                }
                            },
                            personalized_tips: { type: "array", items: { type: "string" } },
                            next_steps: { type: "array", items: { type: "string" } }
                        }
                    }
                }),
                { retries: 2, baseDelay: 1000 }
            );

            setInsights(response);
        } catch (e) {
            console.error("Error analyzing applications:", e);
            setError("Failed to analyze applications. Please try again.");
        }

        setIsAnalyzing(false);
    };

    if (applications.length === 0) {
        return (
            <Alert className="border-blue-200 bg-blue-50">
                <AlertDescription className="text-blue-800">
                    Apply to a few jobs first, then we can analyze your application patterns and provide personalized insights.
                </AlertDescription>
            </Alert>
        );
    }

    return (
        <div className="space-y-6">
            {!insights ? (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-purple-600" />
                            Application Insights
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-slate-600 mb-4">
                            Get AI-powered insights on your application success rates, common patterns, and personalized tips for improvement.
                        </p>
                        <Button 
                            onClick={analyzeApplications} 
                            disabled={isAnalyzing}
                            className="bg-purple-600 hover:bg-purple-700"
                        >
                            {isAnalyzing ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Analyzing {applications.length} Applications...
                                </>
                            ) : (
                                <>
                                    <BarChart3 className="w-4 h-4 mr-2" />
                                    Analyze My Applications
                                </>
                            )}
                        </Button>
                        {error && (
                            <Alert variant="destructive" className="mt-4">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}
                    </CardContent>
                </Card>
            ) : (
                <motion.div 
                    initial={{ opacity: 0, y: 20 }} 
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                >
                    {/* Success Rate */}
                    <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white">
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <span className="flex items-center gap-2">
                                    <Target className="w-5 h-5 text-purple-600" />
                                    Success Rate
                                </span>
                                {insights.success_rate.trend === "improving" && (
                                    <Badge className="bg-green-100 text-green-700">
                                        <TrendingUp className="w-3 h-3 mr-1" />
                                        Improving
                                    </Badge>
                                )}
                                {insights.success_rate.trend === "declining" && (
                                    <Badge className="bg-red-100 text-red-700">
                                        <TrendingDown className="w-3 h-3 mr-1" />
                                        Declining
                                    </Badge>
                                )}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="text-center">
                                <div className="text-5xl font-bold text-purple-600 mb-2">
                                    {insights.success_rate.percentage}%
                                </div>
                                <div className="text-sm text-slate-600">
                                    {insights.success_rate.interviews} interviews • {insights.success_rate.offers} offers
                                    <span className="mx-2">•</span>
                                    {insights.success_rate.total_applied} applications
                                </div>
                            </div>
                            <Progress value={insights.success_rate.percentage} className="h-3" />
                        </CardContent>
                    </Card>

                    {/* Status Breakdown */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Application Status Breakdown</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {Object.entries(insights.status_breakdown).map(([status, count]) => (
                                    <div key={status} className="text-center p-3 rounded-lg bg-slate-50 border">
                                        <div className="text-2xl font-bold text-slate-800">{count}</div>
                                        <div className="text-xs text-slate-600 capitalize">{status.replace('_', ' ')}</div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Score Analysis */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-blue-600" />
                                Resume Quality Impact
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-slate-600">Average Optimization Score</span>
                                <span className="text-2xl font-bold text-slate-800">{Math.round(insights.score_analysis.average_score)}</span>
                            </div>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                                    <div className="text-sm text-green-700 mb-1">High Scores (85+)</div>
                                    <div className="text-xl font-bold text-green-800">
                                        {insights.score_analysis.high_score_success_rate}% success
                                    </div>
                                </div>
                                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                                    <div className="text-sm text-amber-700 mb-1">Low Scores (&lt;70)</div>
                                    <div className="text-xl font-bold text-amber-800">
                                        {insights.score_analysis.low_score_success_rate}% success
                                    </div>
                                </div>
                            </div>
                            <Alert className="border-blue-200 bg-blue-50">
                                <AlertDescription className="text-blue-800 text-sm">
                                    <strong>Recommendation:</strong> {insights.score_analysis.recommendation}
                                </AlertDescription>
                            </Alert>
                        </CardContent>
                    </Card>

                    {/* Common Patterns */}
                    <div className="grid md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-red-600">
                                    <XCircle className="w-5 h-5" />
                                    Potential Rejection Reasons
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2">
                                    {insights.common_patterns.rejection_reasons.map((reason, idx) => (
                                        <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                                            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                                            {reason}
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-green-600">
                                    <CheckCircle2 className="w-5 h-5" />
                                    Successful Patterns
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2">
                                    {insights.common_patterns.successful_patterns.map((pattern, idx) => (
                                        <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                                            <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                                            {pattern}
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Timing Insights */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Application Timing</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-slate-600">Average Days from Save to Apply</span>
                                <span className="text-2xl font-bold text-slate-800">
                                    {insights.timing_insights.average_days_to_apply} days
                                </span>
                            </div>
                            <Alert>
                                <AlertDescription className="text-slate-700 text-sm">
                                    <strong>Recommendation:</strong> {insights.timing_insights.recommendation}
                                </AlertDescription>
                            </Alert>
                        </CardContent>
                    </Card>

                    {/* Personalized Tips */}
                    <Card className="border-2 border-blue-200">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-blue-600">
                                <Lightbulb className="w-5 h-5" />
                                Personalized Improvement Tips
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-3">
                                {insights.personalized_tips.map((tip, idx) => (
                                    <li key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-blue-50">
                                        <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold shrink-0">
                                            {idx + 1}
                                        </div>
                                        <span className="text-sm text-slate-700">{tip}</span>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>

                    {/* Next Steps */}
                    <Card className="bg-gradient-to-br from-green-50 to-white border-2 border-green-200">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-green-700">
                                <Target className="w-5 h-5" />
                                Immediate Next Steps
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-2">
                                {insights.next_steps.map((step, idx) => (
                                    <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                                        <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                                        {step}
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>

                    {/* Re-analyze Button */}
                    <div className="flex justify-center">
                        <Button 
                            onClick={analyzeApplications} 
                            variant="outline"
                            disabled={isAnalyzing}
                        >
                            <BarChart3 className="w-4 h-4 mr-2" />
                            Re-analyze
                        </Button>
                    </div>
                </motion.div>
            )}
        </div>
    );
}