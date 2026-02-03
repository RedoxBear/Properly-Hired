import React from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles, Crown, Zap, Mail, Gift } from "lucide-react";
import { motion } from "framer-motion";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Referral } from "@/entities/Referral";
import { TIERS, TIER_LIMITS, PRICING } from "@/components/utils/accessControl";

export default function Pricing() {
    const [user, setUser] = React.useState(null);
    const [isLoading, setIsLoading] = React.useState(true);
    const [referralCode, setReferralCode] = React.useState("");
    const [discountApplied, setDiscountApplied] = React.useState(false);
    const [discountPercentage] = React.useState(20);

    React.useEffect(() => {
        loadUser();
        checkReferralCode();
    }, []);

    const checkReferralCode = () => {
        const params = new URLSearchParams(window.location.search);
        const refCode = params.get("ref");
        if (refCode) {
            setReferralCode(refCode);
            setDiscountApplied(true);
        }
    };

    const loadUser = async () => {
        try {
            const currentUser = await base44.auth.me();
            setUser(currentUser);
        } catch (error) {
            console.error("Error loading user:", error);
        }
        setIsLoading(false);
    };

    const handleUpgrade = async (tier) => {
        if (tier === TIERS.ENTERPRISE) {
            // Open email client for enterprise inquiries
            window.location.href = "mailto:contact@pragueday.com?subject=Enterprise Plan Inquiry&body=Hi, I'm interested in learning more about the Enterprise plan.";
            return;
        }

        // TODO: Integrate with Stripe or payment provider
        alert(`Payment integration needed!\n\nSelected: ${tier.toUpperCase()} - $${PRICING[tier].price}/${PRICING[tier].period}\n\nTo implement:\n1. Set up Stripe/Paddle account\n2. Create Checkout session with price_id\n3. Handle webhook to update user.subscription_tier\n\nFor now, this is a placeholder.`);
    };

    const tiers = [
        {
            id: TIERS.FREE,
            name: "Free",
            icon: Zap,
            color: "text-slate-600",
            gradient: "from-slate-500 to-slate-600",
            features: [
                "3 master resumes",
                "Optimize resume: 5/week",
                "Job analysis: 10/week",
                "Cover letters: 5/week",
                "Resume upload & parsing"
            ]
        },
        {
            id: TIERS.PRO,
            name: "Pro",
            icon: Sparkles,
            color: "text-blue-600",
            gradient: "from-blue-500 to-cyan-600",
            popular: true,
            features: [
                "20 master resumes",
                "Unlimited resume optimizations",
                "Unlimited job analysis",
                "Unlimited cover letters",
                "AI cover letter generator",
                "Transferable skills analysis",
                "Activity insights & analytics",
                "Autofill vault",
                "Application Q&A assistant"
            ]
        },
        {
            id: TIERS.ENTERPRISE,
            name: "Enterprise",
            icon: Crown,
            color: "text-purple-600",
            gradient: "from-purple-500 to-pink-600",
            features: [
                "Unlimited resumes",
                "Unlimited applications",
                "Unlimited AI usage",
                "All Pro features",
                "Priority support",
                "Custom integrations",
                "Dedicated account manager",
                "Team collaboration"
            ]
        }
    ];

    return (
        <div className="min-h-screen p-3 md:p-6 lg:p-8 bg-gradient-to-br from-background to-muted">
            <div className="max-w-7xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-8 md:mb-12 px-4"
                >
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-3 md:mb-4">
                        Choose Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-cyan-500 dark:from-blue-400 dark:to-cyan-400">Career Plan</span>
                    </h1>
                    <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
                        Start free and upgrade as your job search accelerates
                    </p>
                    {user && (
                        <Badge className="mt-3 md:mt-4" variant="outline">
                            Current plan: {user.subscription_tier || "free"}
                        </Badge>
                    )}
                </motion.div>

                {discountApplied && (
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6 px-2">
                        <Alert className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/30">
                            <AlertDescription className="flex items-center gap-2 text-green-800 dark:text-green-200">
                                <Gift className="w-5 h-5 text-green-600 dark:text-green-400" />
                                <div>
                                    <strong>🎉 Referral discount applied!</strong> You'll get <strong>{discountPercentage}% off</strong> your first month.
                                    <span className="text-xs ml-2">(Code: {referralCode})</span>
                                </div>
                            </AlertDescription>
                        </Alert>
                    </motion.div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-8 md:mb-12 px-2">
                    {tiers.map((tier, index) => {
                        const Icon = tier.icon;
                        const pricing = PRICING[tier.id];
                        const isCurrentTier = user?.subscription_tier === tier.id;
                        const isEnterprise = tier.id === TIERS.ENTERPRISE;

                        return (
                            <motion.div
                                key={tier.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <Card className={`relative h-full ${tier.popular ? 'border-2 border-blue-500 dark:border-blue-400 shadow-2xl' : 'shadow-lg'} bg-card/90 backdrop-blur-sm`}>
                                    {tier.popular && (
                                        <div className="absolute -top-3 md:-top-4 left-0 right-0 flex justify-center">
                                            <Badge className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-3 md:px-4 py-1 text-xs md:text-sm">
                                                Most Popular
                                            </Badge>
                                        </div>
                                    )}

                                    <CardHeader className="text-center pb-6 md:pb-8 pt-6 md:pt-8 px-4">
                                        <div className={`mx-auto p-2.5 md:p-3 rounded-xl bg-gradient-to-br ${tier.gradient} w-fit mb-3 md:mb-4`}>
                                            <Icon className="w-7 h-7 md:w-8 md:h-8 text-white" />
                                        </div>
                                        <CardTitle className="text-xl md:text-2xl mb-2">{tier.name}</CardTitle>

                                        {isEnterprise ? (
                                            <div className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                                                Contact Us
                                            </div>
                                        ) : discountApplied && tier.id !== TIERS.FREE ? (
                                            <div>
                                                <div className="text-xl md:text-2xl font-bold text-muted-foreground line-through">
                                                    ${pricing.price}
                                                </div>
                                                <div className="text-3xl md:text-4xl font-bold text-green-600 dark:text-green-400">
                                                    ${(pricing.price * (1 - discountPercentage / 100)).toFixed(2)}
                                                    <span className="text-base md:text-lg font-normal text-muted-foreground">
                                                        /{pricing.period}
                                                    </span>
                                                </div>
                                                <Badge className="mt-1 bg-green-600 text-white text-xs">
                                                    -{discountPercentage}% First Month
                                                </Badge>
                                            </div>
                                        ) : (
                                            <div className="text-3xl md:text-4xl font-bold text-foreground">
                                                ${pricing.price}
                                                <span className="text-base md:text-lg font-normal text-muted-foreground">
                                                    /{pricing.period}
                                                </span>
                                            </div>
                                        )}

                                        <p className="text-xs md:text-sm text-muted-foreground mt-2">{pricing.description}</p>
                                    </CardHeader>

                                    <CardContent className="space-y-6 px-4 md:px-6">
                                        <ul className="space-y-2.5 md:space-y-3">
                                            {tier.features.map((feature, idx) => (
                                                <li key={idx} className="flex items-start gap-2">
                                                    <Check className="w-4 h-4 md:w-5 md:h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                                                    <span className="text-foreground text-sm md:text-base">{feature}</span>
                                                </li>
                                            ))}
                                        </ul>

                                        <Button
                                            onClick={() => handleUpgrade(tier.id)}
                                            disabled={isCurrentTier || isLoading}
                                            className={`w-full h-11 md:h-12 text-sm md:text-base ${
                                                tier.popular 
                                                    ? 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700' 
                                                    : tier.id === TIERS.FREE
                                                    ? 'bg-slate-600 hover:bg-slate-700'
                                                    : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
                                            } active:scale-95 transition-transform`}
                                        >
                                            {isCurrentTier ? (
                                                "Current Plan"
                                            ) : tier.id === TIERS.FREE ? (
                                                "Get Started Free"
                                            ) : isEnterprise ? (
                                                <>
                                                    <Mail className="w-4 h-4 mr-2" />
                                                    Contact Sales
                                                </>
                                            ) : (
                                                `Upgrade to ${tier.name}`
                                            )}
                                        </Button>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        );
                    })}
                </div>

                {/* FAQ Section */}
                <Card className="shadow-lg border-0 bg-card/90 backdrop-blur-sm mx-2">
                    <CardHeader className="px-4 md:px-6">
                        <CardTitle className="text-lg md:text-xl">Frequently Asked Questions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 px-4 md:px-6">
                        <div>
                            <h4 className="font-semibold text-foreground mb-2 text-sm md:text-base">How do AI credits work?</h4>
                            <p className="text-muted-foreground text-xs md:text-sm">
                                Free users receive weekly limits for resume optimization, job analysis, and cover letters. Pro and Enterprise unlock unlimited AI usage.
                            </p>
                        </div>
                        <div>
                            <h4 className="font-semibold text-foreground mb-2 text-sm md:text-base">Can I cancel anytime?</h4>
                            <p className="text-muted-foreground text-xs md:text-sm">
                                Yes! Cancel anytime. Your subscription remains active until the end of your billing period, then you'll be downgraded to Free.
                            </p>
                        </div>
                        <div>
                            <h4 className="font-semibold text-foreground mb-2 text-sm md:text-base">What payment methods do you accept?</h4>
                            <p className="text-muted-foreground text-xs md:text-sm">
                                We accept all major credit cards through Stripe. Enterprise customers can arrange invoicing.
                            </p>
                        </div>
                        <div>
                            <h4 className="font-semibold text-foreground mb-2 text-sm md:text-base">Do you offer refunds?</h4>
                            <p className="text-muted-foreground text-xs md:text-sm">
                                We offer a 7-day money-back guarantee on all paid plans. Contact support for assistance.
                            </p>
                        </div>
                        <div>
                            <h4 className="font-semibold text-foreground mb-2 text-sm md:text-base">How do I get the Enterprise plan?</h4>
                            <p className="text-muted-foreground text-xs md:text-sm">
                                Click "Contact Sales" on the Enterprise card to email us. We'll schedule a call to discuss your needs and provide custom pricing.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
