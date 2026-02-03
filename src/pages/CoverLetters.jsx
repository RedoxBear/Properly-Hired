import React from "react";
import { JobApplication } from "@/entities/JobApplication";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mail, Building, ArrowRight, FileText, Award } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import AgentChat from "@/components/agents/AgentChat";
import { hasAccess, TIERS } from "@/components/utils/accessControl";
import UpgradePrompt from "@/components/subscription/UpgradePrompt";

// Kyle's Cover Letter Expertise
const KYLE_CL_EXPERTISE = [
  { name: "Opening Strategies", icon: "🎣", color: "blue" },
  { name: "Storytelling Framework", icon: "📖", color: "purple" },
  { name: "Company Research", icon: "🔍", color: "green" },
  { name: "Value Proposition", icon: "💎", color: "red" },
  { name: "Call-to-Action", icon: "🎯", color: "orange" },
  { name: "De-AI Humanization", icon: "👤", color: "pink" }
];

export default function CoverLetters() {
    const [jobApplications, setJobApplications] = React.useState([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [currentUser, setCurrentUser] = React.useState(null);

    React.useEffect(() => {
        loadJobApplications();
    }, []);

    const loadJobApplications = async () => {
        setIsLoading(true);
        try {
            const [applications, user] = await Promise.all([
                JobApplication.list("-created_date", 50),
                base44.auth.me()
            ]);
            setJobApplications(applications);
            setCurrentUser(user);
        } catch (error) {
            console.error("Error loading job applications:", error);
        }
        setIsLoading(false);
    };

    return (
        <div className="min-h-screen p-4 md:p-8">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-8"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 rounded-full text-sm font-medium mb-4">
                        <Mail className="w-4 h-4" />
                        Cover Letter Generator
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                        AI-Powered <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500 dark:from-purple-400 dark:to-pink-400">Cover Letters</span>
                    </h1>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        Select a job application to generate a personalized cover letter with organization research and De-AI humanization.
                    </p>
                </motion.div>

                {/* Access Check */}
                {currentUser && !hasAccess(currentUser, "cover_letters") && (
                    <UpgradePrompt 
                        feature="cover_letters" 
                        currentTier={currentUser.subscription_tier || TIERS.FREE}
                    />
                )}

                {/* Kyle's Cover Letter Expertise */}
                <Card className="mb-6 border-pink-200 dark:border-pink-800 bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-950/30 dark:to-purple-950/30">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-purple-900 dark:text-purple-200">
                      <Award className="w-5 h-5 text-pink-600 dark:text-pink-400" />
                      Kyle's Cover Letter Expertise
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {KYLE_CL_EXPERTISE.map((domain, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-3 bg-card/60 rounded-lg border border-pink-100 dark:border-pink-800 hover:bg-card transition-colors">
                          <span className="text-2xl">{domain.icon}</span>
                          <span className="text-sm font-medium text-purple-900 dark:text-purple-200">{domain.name}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Applications List */}
                <Card className="shadow-xl border-0 bg-card/90 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Building className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                            Your Job Applications
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="text-center py-8 text-muted-foreground">Loading applications...</div>
                        ) : jobApplications.length === 0 ? (
                            <div className="text-center py-12">
                                <FileText className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-muted-foreground mb-2">No applications yet</h3>
                                <p className="text-muted-foreground mb-4">Start by analyzing a job posting first</p>
                                <Link to={createPageUrl("JobAnalysis")}>
                                    <Button className="bg-purple-600 hover:bg-purple-700">
                                        Analyze Job Posting
                                    </Button>
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {jobApplications.map((app) => (
                                    <Link
                                        key={app.id}
                                        to={createPageUrl(`CoverLetter?id=${app.id}`)}
                                        className="block"
                                    >
                                        <div className="p-4 border border-border rounded-xl hover:bg-purple-50 dark:hover:bg-purple-950/30 hover:border-purple-200 dark:hover:border-purple-800 transition-all duration-200 group">
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <h3 className="font-semibold text-foreground group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors mb-1">
                                                        {app.job_title}
                                                    </h3>
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Building className="w-4 h-4 text-muted-foreground" />
                                                        <span className="text-sm text-muted-foreground">{app.company_name}</span>
                                                    </div>
                                                    {app.cover_letter_last_updated_at && (
                                                        <Badge variant="outline" className="bg-green-50 dark:bg-green-950/50 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800">
                                                            Cover letter saved
                                                        </Badge>
                                                    )}
                                                </div>
                                                <Button variant="ghost" size="sm" className="gap-2">
                                                    Generate
                                                    <ArrowRight className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Info Cards */}
                <div className="grid md:grid-cols-2 gap-6 mt-8">
                    <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border-purple-200 dark:border-purple-800">
                        <CardContent className="p-6">
                            <h3 className="font-semibold text-purple-800 dark:text-purple-200 mb-3">✨ AI-Powered Generation</h3>
                            <ul className="space-y-2 text-sm text-purple-700 dark:text-purple-300">
                                <li>• Comprehensive organization research</li>
                                <li>• 4 different opening styles to choose from</li>
                                <li>• De-AI humanization for authenticity</li>
                                <li>• Combines your resume + job requirements</li>
                            </ul>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 border-blue-200 dark:border-blue-800">
                        <CardContent className="p-6">
                            <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-3">💡 Pro Tips</h3>
                            <ul className="space-y-2 text-sm text-blue-700 dark:text-blue-300">
                                <li>• Review and personalize the generated text</li>
                                <li>• Choose an opening style that fits your voice</li>
                                <li>• Save multiple versions for A/B testing</li>
                                <li>• Print or copy to your application portal</li>
                            </ul>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Kyle AI Agent Chat */}
            <AgentChat
                agentName="kyle"
                agentTitle="Kyle - CV Expert"
                context={{
                    page: "Cover Letters",
                    applicationsCount: jobApplications.length,
                    hasApplications: jobApplications.length > 0
                }}
            />
        </div>
    );
}