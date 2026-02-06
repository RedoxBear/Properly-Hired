import React from "react";
import { Referral } from "@/entities/Referral";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Gift, Copy, Check, Users, Percent, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

export default function ReferralProgram() {
    const [user, setUser] = React.useState(null);
    const [referralCode, setReferralCode] = React.useState("");
    const [referrals, setReferrals] = React.useState([]);
    const [copied, setCopied] = React.useState(false);
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const currentUser = await base44.auth.me();
            setUser(currentUser);
            
            const code = generateReferralCode(currentUser.email);
            setReferralCode(code);
            
            const userReferrals = await Referral.filter({ referrer_email: currentUser.email }, "-created_date", 50);
            setReferrals(userReferrals);
        } catch (e) {
            console.error("Error loading referral data:", e);
        }
        setIsLoading(false);
    };

    const generateReferralCode = (email) => {
        const hash = email.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return `PD${hash.toString(36).toUpperCase().slice(0, 8)}`;
    };

    const copyReferralLink = () => {
        const link = `${window.location.origin}/Pricing?ref=${referralCode}`;
        navigator.clipboard.writeText(link);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const stats = {
        total: referrals.length,
        completed: referrals.filter(r => r.status === "completed").length,
        pending: referrals.filter(r => r.status === "pending").length,
        totalRewards: referrals.reduce((sum, r) => sum + (r.referrer_reward || 0), 0)
    };

    return (
        <div className="min-h-screen p-4 md:p-8 bg-background">
            <div className="max-w-5xl mx-auto space-y-6">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 rounded-full text-sm font-medium mb-4">
                        <Gift className="w-4 h-4" />
                        Referral Program
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">Refer Friends, Get Rewards</h1>
                    <p className="text-lg text-muted-foreground">
                        Share Prague Day with friends and both get 20% off your subscription.
                    </p>
                </motion.div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="p-4">
                            <div className="text-2xl font-bold text-foreground">{stats.total}</div>
                            <div className="text-sm text-muted-foreground">Total Referrals</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-green-50 border-green-200">
                        <CardContent className="p-4">
                            <div className="text-2xl font-bold text-green-700">{stats.completed}</div>
                            <div className="text-sm text-green-600">Completed</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-amber-50 border-amber-200">
                        <CardContent className="p-4">
                            <div className="text-2xl font-bold text-amber-700">{stats.pending}</div>
                            <div className="text-sm text-amber-600">Pending</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-blue-50 border-blue-200">
                        <CardContent className="p-4">
                            <div className="text-2xl font-bold text-blue-700">${stats.totalRewards}</div>
                            <div className="text-sm text-blue-600">Total Rewards</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Your Referral Link */}
                <Card className="shadow-lg border-2 border-purple-200">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Gift className="w-5 h-5 text-purple-600" />
                            Your Referral Link
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex gap-3">
                            <Input
                                value={`${window.location.origin}/Pricing?ref=${referralCode}`}
                                readOnly
                                className="font-mono text-sm"
                            />
                            <Button onClick={copyReferralLink} variant="outline" className="shrink-0">
                                {copied ? <Check className="w-4 h-4 mr-2 text-green-600" /> : <Copy className="w-4 h-4 mr-2" />}
                                {copied ? "Copied!" : "Copy"}
                            </Button>
                        </div>
                        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                            <p className="text-sm text-purple-800">
                                <strong>How it works:</strong> Share your link with friends. When they sign up and subscribe, 
                                you both get <strong>20% off</strong> your next billing cycle!
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Referral History */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="w-5 h-5" />
                            Your Referrals
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="text-center py-8 text-muted-foreground">Loading...</div>
                        ) : referrals.length === 0 ? (
                            <div className="text-center py-12">
                                <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                                <h3 className="text-xl font-medium text-slate-600 mb-2">No referrals yet</h3>
                                <p className="text-slate-500">Share your link to get started!</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {referrals.map(referral => (
                                    <div key={referral.id} className="flex items-center justify-between p-3 border rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                                                <Users className="w-5 h-5 text-purple-600" />
                                            </div>
                                            <div>
                                                <div className="font-medium">
                                                    {referral.referred_email || "Pending signup"}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    Code: {referral.referral_code}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {referral.referrer_reward && (
                                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                                    +${referral.referrer_reward}
                                                </Badge>
                                            )}
                                            <Badge variant={
                                                referral.status === "completed" ? "default" :
                                                referral.status === "pending" ? "secondary" : "outline"
                                            }>
                                                {referral.status}
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Benefits */}
                <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
                    <CardContent className="p-6">
                        <h3 className="font-semibold text-blue-800 mb-4 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5" />
                            Referral Benefits
                        </h3>
                        <div className="grid md:grid-cols-3 gap-4">
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold shrink-0">
                                    1
                                </div>
                                <div>
                                    <div className="font-semibold text-blue-800">Share Your Link</div>
                                    <div className="text-sm text-blue-700">Send your unique referral link to friends</div>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold shrink-0">
                                    2
                                </div>
                                <div>
                                    <div className="font-semibold text-blue-800">They Subscribe</div>
                                    <div className="text-sm text-blue-700">Friend signs up and gets 20% off first month</div>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold shrink-0">
                                    3
                                </div>
                                <div>
                                    <div className="font-semibold text-blue-800">You Get Rewarded</div>
                                    <div className="text-sm text-blue-700">Receive 20% off your next billing cycle</div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}