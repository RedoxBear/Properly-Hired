import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Crown, Zap, Lock } from "lucide-react";
import { Link } from "react-router-dom";
import { TIER_LIMITS, TIERS } from "@/components/utils/accessControl";

export default function SubscriptionStatus({ user }) {
    if (!user) return null;

    const tier = user.subscription_tier || TIERS.FREE;
    const limits = TIER_LIMITS[tier] || TIER_LIMITS.free;
    const isPremium = tier !== TIERS.FREE;

    const resumeOptimizations = user.resume_optimizations_this_week ?? user.resumes_this_week ?? 0;
    const jobAnalyses = user.job_analyses_this_week ?? user.applications_this_week ?? 0;
    const coverLetters = user.cover_letters_this_week ?? 0;

    if (isPremium) {
        const tierName = tier === TIERS.ENTERPRISE ? "Enterprise" : tier === TIERS.PREMIUM ? "Premium" : "Pro";
        const tierColor = tier === TIERS.ENTERPRISE ? "from-amber-600 to-orange-700" : tier === TIERS.PREMIUM ? "from-purple-600 to-pink-700" : "from-indigo-600 to-purple-700";
        const isProTier = tier === TIERS.PRO;

        return (
            <Card className={`bg-gradient-to-br ${tierColor} text-white border-0 shadow-lg`}>
                <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <Crown className="w-5 h-5 text-yellow-300" />
                            {tierName} Member
                        </CardTitle>
                        <span className="px-2 py-1 bg-white/20 rounded-full text-xs font-medium">
                            Active
                        </span>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <p className="text-indigo-100 text-sm">
                            {tier === TIERS.ENTERPRISE
                                ? "You have unlimited access to all features with priority support."
                                : tier === TIERS.PREMIUM
                                    ? "You have all Pro services unlocked with unlimited resumes."
                                    : "You have unlimited AI features and premium tools."}
                        </p>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <div className="bg-white/10 rounded-lg p-2 text-center">
                                <div className="text-2xl font-bold mb-1">
                                    {limits.max_resumes === -1 ? '∞' : limits.max_resumes}
                                </div>
                                <div className="text-xs text-indigo-200">Max Resumes</div>
                            </div>
                            <div className="bg-white/10 rounded-lg p-2 text-center">
                                <div className="text-2xl font-bold mb-1">∞</div>
                                <div className="text-xs text-indigo-200">Optimizations</div>
                            </div>
                            <div className="bg-white/10 rounded-lg p-2 text-center">
                                <div className="text-2xl font-bold mb-1">∞</div>
                                <div className="text-xs text-indigo-200">Job analyses</div>
                            </div>
                            <div className="bg-white/10 rounded-lg p-2 text-center">
                                <div className="text-2xl font-bold mb-1">∞</div>
                                <div className="text-xs text-indigo-200">Cover letters</div>
                            </div>
                        </div>

                        {isProTier && (
                            <div className="mt-3 p-3 rounded-lg bg-white/10 border border-white/20">
                                <p className="text-xs font-semibold text-white mb-1">💡 Need more resumes?</p>
                                <p className="text-xs text-indigo-100 mb-2">
                                    Premium offers unlimited resumes (you're capped at 20)
                                </p>
                                <Link to="/Pricing">
                                    <Button variant="secondary" size="sm" className="w-full bg-purple-600 hover:bg-purple-700 text-white border-0">
                                        Upgrade to Premium
                                    </Button>
                                </Link>
                            </div>
                        )}

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
        <Card className="border-border shadow-sm">
            <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                    <CardTitle className="text-base font-semibold text-foreground">
                        Free Plan
                    </CardTitle>
                    <Link to="/Pricing">
                        <Button size="sm" variant="ghost" className="h-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-950/50">
                            Upgrade <Zap className="w-3 h-3 ml-1" />
                        </Button>
                    </Link>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-3">
                    <div className="space-y-1">
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Resume optimizations (weekly)</span>
                            <span>{resumeOptimizations} / {limits.resume_optimizations_per_week}</span>
                        </div>
                        <Progress value={(resumeOptimizations / limits.resume_optimizations_per_week) * 100} className="h-2" />
                    </div>
                    <div className="space-y-1">
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Job analyses (weekly)</span>
                            <span>{jobAnalyses} / {limits.job_analyses_per_week}</span>
                        </div>
                        <Progress value={(jobAnalyses / limits.job_analyses_per_week) * 100} className="h-2" />
                    </div>
                    <div className="space-y-1">
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Cover letters (weekly)</span>
                            <span>{coverLetters} / {limits.cover_letters_per_week}</span>
                        </div>
                        <Progress value={(coverLetters / limits.cover_letters_per_week) * 100} className="h-2" />
                    </div>
                </div>

                <div className="pt-2 border-t border-border space-y-3">
                    <div className="space-y-2">
                        <p className="text-xs font-semibold text-foreground">Upgrade to unlock:</p>
                        <div className="space-y-1.5">
                            <div className="flex items-start gap-2 text-xs">
                                <span className="text-blue-600 dark:text-blue-400">Pro:</span>
                                <span className="text-muted-foreground">20 resumes + unlimited AI</span>
                            </div>
                            <div className="flex items-start gap-2 text-xs">
                                <span className="text-purple-600 dark:text-purple-400">Premium:</span>
                                <span className="text-muted-foreground">Unlimited resumes + all Pro features</span>
                            </div>
                        </div>
                    </div>
                    <Link to="/Pricing">
                        <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-md">
                            <Crown className="w-3 h-3 mr-2" />
                            Compare Plans
                        </Button>
                    </Link>
                </div>
            </CardContent>
        </Card>
    );
}
