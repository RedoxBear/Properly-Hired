import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function Pricing() {
    const navigate = useNavigate();

    return (
        <section id="pricing" className="container py-24 sm:py-32">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
                Choose Your Plan
            </h2>
            <p className="text-xl text-muted-foreground text-center mb-8">
                Start for free, upgrade to Pro, or contact us for Enterprise solutions
            </p>
            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                <Card>
                    <CardHeader>
                        <CardTitle>Free</CardTitle>
                        <CardDescription>
                            For individuals starting their job search
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex">
                            <h3 className="text-4xl font-bold">$0</h3>
                            <span className="flex flex-col justify-end text-sm mb-1">/forever</span>
                        </div>
                        <ul className="space-y-2">
                            <li className="flex items-center"><Check className="mr-2 h-4 w-4" />5 resumes / week</li>
                            <li className="flex items-center"><Check className="mr-2 h-4 w-4" />10 job applications / week</li>
                            <li className="flex items-center"><Check className="mr-2 h-4 w-4" />Basic job analysis</li>
                            <li className="flex items-center"><Check className="mr-2 h-4 w-4" />Resume builder</li>
                        </ul>
                    </CardContent>
                    <CardFooter>
                        <Button className="w-full" onClick={() => navigate('/auth')}>Get Started</Button>
                    </CardFooter>
                </Card>

                <Card className="border-primary border-2 relative">
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold">
                        Most Popular
                    </div>
                    <CardHeader>
                        <CardTitle>Pro</CardTitle>
                        <CardDescription>
                            For professionals who want to stand out
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-baseline gap-1">
                            <h3 className="text-4xl font-bold">$4.99</h3>
                            <span className="text-sm text-muted-foreground">/week</span>
                        </div>
                        <p className="text-sm text-green-600 font-semibold">
                            🎉 $2.99/week with referral code!
                        </p>
                        <ul className="space-y-2">
                            <li className="flex items-center"><Check className="mr-2 h-4 w-4" />Unlimited resumes</li>
                            <li className="flex items-center"><Check className="mr-2 h-4 w-4" />Unlimited applications</li>
                            <li className="flex items-center"><Check className="mr-2 h-4 w-4" />AI resume optimization (Kyle)</li>
                            <li className="flex items-center"><Check className="mr-2 h-4 w-4" />AI job analysis (Simon)</li>
                            <li className="flex items-center"><Check className="mr-2 h-4 w-4" />AI cover letters</li>
                            <li className="flex items-center"><Check className="mr-2 h-4 w-4" />Interview prep assistant</li>
                            <li className="flex items-center"><Check className="mr-2 h-4 w-4" />Browser extension</li>
                            <li className="flex items-center"><Check className="mr-2 h-4 w-4" />Priority support</li>
                        </ul>
                    </CardContent>
                    <CardFooter>
                        <Button className="w-full" onClick={() => navigate('/auth')}>Go Pro</Button>
                    </CardFooter>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Enterprise</CardTitle>
                        <CardDescription>
                            For teams and organizations
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex">
                            <h3 className="text-4xl font-bold">Custom</h3>
                        </div>
                        <ul className="space-y-2">
                            <li className="flex items-center"><Check className="mr-2 h-4 w-4" />Everything in Pro</li>
                            <li className="flex items-center"><Check className="mr-2 h-4 w-4" />Team management</li>
                            <li className="flex items-center"><Check className="mr-2 h-4 w-4" />Custom integrations</li>
                            <li className="flex items-center"><Check className="mr-2 h-4 w-4" />Dedicated support</li>
                            <li className="flex items-center"><Check className="mr-2 h-4 w-4" />SLA guarantee</li>
                            <li className="flex items-center"><Check className="mr-2 h-4 w-4" />Custom AI training</li>
                        </ul>
                    </CardContent>
                    <CardFooter>
                        <Button variant="outline" className="w-full" onClick={() => window.location.href = 'mailto:contact@pragueday.com?subject=Enterprise Plan Inquiry'}>
                            Contact Us
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </section>
    )
}
