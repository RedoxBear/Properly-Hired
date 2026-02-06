import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Crown, Zap, Lock } from "lucide-react";
import { Link } from "react-router-dom";

export default function SubscriptionStatus({ user }) {
    if (!user) return null;

    // Default to free limits if not set
    const RESUME_LIMIT = 5;
    const APP_LIMIT = 10;
    
    const isPremium = user.is_premium;
    const resumeCount = user.resumes_this_week || 0;
    const appCount = user.applications_this_week || 0;

    if (isPremium) {
        return (
            <Card className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white border-0 shadow-lg">
                <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <Crown className="w-5 h-5 text-yellow-300" />
                            Premium Member
                        </CardTitle>
                        <span className="px-2 py-1 bg-white/20 rounded-full text-xs font-medium">
                            Active
                        </span>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <p className="text-indigo-100 text-sm">
                            You have unlimited access to all AI features.
                        </p>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <div className="bg-white/10 rounded-lg p-2 text-center">
                                <div className="text-2xl font-bold mb-1">∞</div>
                                <div className="text-xs text-indigo-200">Resumes</div>
                            </div>
                            <div className="bg-white/10 rounded-lg p-2 text-center">
                                <div className="text-2xl font-bold mb-1">∞</div>
                                <div className="text-xs text-indigo-200">Applications</div>
                            </div>
                        </div>
                        <Link to="/UserProfile">
                            <Button variant="secondary" className="w-full text-indigo-700 hover:text-indigo-800 bg-white">
                                Manage Subscription
                            </Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                    <CardTitle className="text-base font-semibold text-slate-800">
                        Free Plan
                    </CardTitle>
                    <Link to="/Pricing">
                        <Button size="sm" variant="ghost" className="h-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                            Upgrade <Zap className="w-3 h-3 ml-1" />
                        </Button>
                    </Link>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-3">
                    <div className="space-y-1">
                        <div className="flex justify-between text-xs text-slate-600">
                            <span>Resumes this week</span>
                            <span>{resumeCount} / {RESUME_LIMIT}</span>
                        </div>
                        <Progress value={(resumeCount / RESUME_LIMIT) * 100} className="h-2" />
                    </div>
                    <div className="space-y-1">
                        <div className="flex justify-between text-xs text-slate-600">
                            <span>Applications this week</span>
                            <span>{appCount} / {APP_LIMIT}</span>
                        </div>
                        <Progress value={(appCount / APP_LIMIT) * 100} className="h-2" />
                    </div>
                </div>

                <div className="pt-2 border-t border-slate-100">
                    <p className="text-xs text-slate-500 mb-3">
                        Unlock unlimited AI usage and premium features.
                    </p>
                    <Link to="/Pricing">
                        <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md">
                            <Lock className="w-3 h-3 mr-2 opacity-70" />
                            Upgrade to Premium
                        </Button>
                    </Link>
                </div>
            </CardContent>
        </Card>
    );
}