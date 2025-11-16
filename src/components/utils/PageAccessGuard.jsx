import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Lock, Crown, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { hasAccess, getUpgradeMessage, TIERS } from "./accessControl";

export default function PageAccessGuard({ children, requiredFeature, featureName }) {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadUser();
    }, []);

    const loadUser = async () => {
        try {
            const currentUser = await base44.auth.me();
            setUser(currentUser);
        } catch (error) {
            console.error("Error loading user:", error);
        }
        setIsLoading(false);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-slate-600">Loading...</p>
                </div>
            </div>
        );
    }

    const hasFeatureAccess = hasAccess(user, requiredFeature);

    if (!hasFeatureAccess) {
        return (
            <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-2xl w-full"
                >
                    <Card className="shadow-2xl border-2 border-blue-200">
                        <CardHeader className="text-center pb-4">
                            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
                                <Lock className="w-8 h-8 text-white" />
                            </div>
                            <CardTitle className="text-2xl md:text-3xl">
                                {featureName || "Premium Feature"}
                            </CardTitle>
                            <Badge className="mt-3 bg-amber-100 text-amber-800 border-amber-300">
                                {user?.subscription_tier === TIERS.FREE ? "Free Plan" : "Requires Upgrade"}
                            </Badge>
                        </CardHeader>
                        <CardContent className="space-y-6 text-center">
                            <p className="text-lg text-slate-700">
                                {getUpgradeMessage(requiredFeature)}
                            </p>
                            
                            <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                                <h3 className="font-semibold text-blue-800 mb-3 flex items-center justify-center gap-2">
                                    <Sparkles className="w-5 h-5" />
                                    Pro Plan Benefits
                                </h3>
                                <ul className="text-sm text-blue-700 space-y-2 text-left max-w-md mx-auto">
                                    <li>✓ Unlimited AI-powered resume optimization</li>
                                    <li>✓ Cover letter generator</li>
                                    <li>✓ Transferable skills analysis</li>
                                    <li>✓ Application Q&A assistant</li>
                                    <li>✓ Activity insights & analytics</li>
                                    <li>✓ Autofill vault</li>
                                    <li>✓ 100 applications/month</li>
                                </ul>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3 pt-4">
                                <Link to={createPageUrl("Pricing")} className="flex-1">
                                    <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 h-12">
                                        <Crown className="w-5 h-5 mr-2" />
                                        View Plans & Upgrade
                                    </Button>
                                </Link>
                                <Link to={createPageUrl("Dashboard")} className="flex-1">
                                    <Button variant="outline" className="w-full h-12">
                                        Back to Dashboard
                                    </Button>
                                </Link>
                            </div>

                            <p className="text-xs text-slate-500 mt-4">
                                Starting at just $4.99/week • Cancel anytime
                            </p>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        );
    }

    return <>{children}</>;
}