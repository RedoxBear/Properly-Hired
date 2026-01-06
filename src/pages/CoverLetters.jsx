import React from "react";
import { JobApplication } from "@/entities/JobApplication";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mail, Building, ArrowRight, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";

export default function CoverLetters() {
    const [jobApplications, setJobApplications] = React.useState([]);
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        loadJobApplications();
    }, []);

    const loadJobApplications = async () => {
        setIsLoading(true);
        try {
            const applications = await JobApplication.list("-created_date", 50);
            setJobApplications(applications);
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
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 rounded-full text-sm font-medium mb-4">
                        <Mail className="w-4 h-4" />
                        Cover Letter Generator
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">
                        AI-Powered <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">Cover Letters</span>
                    </h1>
                    <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                        Select a job application to generate a personalized cover letter with organization research and De-AI humanization.
                    </p>
                </motion.div>

                {/* Applications List */}
                <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Building className="w-5 h-5 text-purple-600" />
                            Your Job Applications
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="text-center py-8 text-slate-500">Loading applications...</div>
                        ) : jobApplications.length === 0 ? (
                            <div className="text-center py-12">
                                <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-slate-600 mb-2">No applications yet</h3>
                                <p className="text-slate-500 mb-4">Start by analyzing a job posting first</p>
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
                                        <div className="p-4 border border-slate-200 rounded-xl hover:bg-purple-50 hover:border-purple-200 transition-all duration-200 group">
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <h3 className="font-semibold text-slate-800 group-hover:text-purple-700 transition-colors mb-1">
                                                        {app.job_title}
                                                    </h3>
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Building className="w-4 h-4 text-slate-400" />
                                                        <span className="text-sm text-slate-600">{app.company_name}</span>
                                                    </div>
                                                    {app.cover_letter_last_updated_at && (
                                                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
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
                    <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
                        <CardContent className="p-6">
                            <h3 className="font-semibold text-purple-800 mb-3">✨ AI-Powered Generation</h3>
                            <ul className="space-y-2 text-sm text-purple-700">
                                <li>• Comprehensive organization research</li>
                                <li>• 4 different opening styles to choose from</li>
                                <li>• De-AI humanization for authenticity</li>
                                <li>• Combines your resume + job requirements</li>
                            </ul>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
                        <CardContent className="p-6">
                            <h3 className="font-semibold text-blue-800 mb-3">💡 Pro Tips</h3>
                            <ul className="space-y-2 text-sm text-blue-700">
                                <li>• Review and personalize the generated text</li>
                                <li>• Choose an opening style that fits your voice</li>
                                <li>• Save multiple versions for A/B testing</li>
                                <li>• Print or copy to your application portal</li>
                            </ul>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}