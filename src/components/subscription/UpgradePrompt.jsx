import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Crown, Lock, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { TIERS, getUpgradeMessage } from "@/components/utils/accessControl";

export default function UpgradePrompt({ feature, currentTier, variant = "card" }) {
    const message = getUpgradeMessage(feature);
    
    if (variant === "alert") {
        return (
            <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30">
                <Lock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <AlertDescription className="flex items-center justify-between">
                    <span className="text-amber-800 dark:text-amber-200">{message}</span>
                    <Link to={createPageUrl("Pricing")}>
                        <Button size="sm" className="bg-amber-600 hover:bg-amber-700 ml-4">
                            <Crown className="w-4 h-4 mr-2" />
                            Upgrade
                        </Button>
                    </Link>
                </AlertDescription>
            </Alert>
        );
    }

    return (
        <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-900 dark:text-amber-100">
                    <Crown className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    Upgrade to Pro
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <p className="text-sm text-amber-800 dark:text-amber-200">{message}</p>
                <div className="flex items-center justify-between pt-2">
                    <div className="text-xs text-amber-700 dark:text-amber-300">
                        Current: <span className="font-bold uppercase">{currentTier || TIERS.FREE}</span>
                    </div>
                    <Link to={createPageUrl("Pricing")}>
                        <Button className="bg-amber-600 hover:bg-amber-700">
                            <TrendingUp className="w-4 h-4 mr-2" />
                            View Plans
                        </Button>
                    </Link>
                </div>
            </CardContent>
        </Card>
    );
}