import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useNavigate } from 'react-router-dom';
import { Sparkles, FileText, Briefcase, MessageSquare, TrendingUp, Gift } from 'lucide-react';

export default function PlanBadge({ plan = 'free', usage = {} }) {
  const navigate = useNavigate();
  const isFree = plan === 'free';
  const isPro = plan === 'pro' || plan === 'premium';

  const defaultUsage = {
    resumesCreated: usage.resumesCreated || 0,
    resumesLimit: isFree ? 5 : null,
    jobApplications: usage.jobApplications || 0,
    jobApplicationsLimit: isFree ? 10 : null,
    coverLetters: usage.coverLetters || 0,
    coverLettersLimit: isFree ? 3 : null,
  };

  const premiumFeatures = [
    { icon: Sparkles, text: 'AI Resume Optimization', available: isPro },
    { icon: FileText, text: 'Unlimited Cover Letters', available: isPro },
    { icon: Briefcase, text: 'Unlimited Job Tracking', available: isPro },
    { icon: MessageSquare, text: 'Interview Prep Assistant', available: isPro },
    { icon: TrendingUp, text: 'Advanced Analytics', available: isPro },
  ];

  if (isPro) {
    return (
      <Card className="border-primary bg-gradient-to-br from-primary/5 to-primary/10">
        <CardHeader>
          <div className="flex items-center justify-between">
            <Badge className="bg-primary text-primary-foreground">
              ✨ Premium Member
            </Badge>
            <Button variant="outline" size="sm" onClick={() => navigate('/pricing')}>
              Manage Subscription
            </Button>
          </div>
          <CardTitle className="text-2xl mt-4">Unlimited Access</CardTitle>
          <CardDescription>
            You have full access to all Prague Day features
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {premiumFeatures.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <div key={idx} className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-primary" />
                  <span className="text-sm">{feature.text}</span>
                </div>
              );
            })}
          </div>
          
          <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Gift className="h-5 w-5 text-green-600" />
                <CardTitle className="text-lg text-green-900">Refer a Friend</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-green-800 mb-3">
                Share Prague Day and earn rewards! Your friends get a discount, and you get perks.
              </p>
              <Button 
                className="w-full bg-green-600 hover:bg-green-700" 
                onClick={() => navigate('/referral')}
              >
                Get Your Referral Link
              </Button>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="border-orange-400 text-orange-700">
            Free Plan
          </Badge>
        </div>
        <CardTitle className="text-2xl mt-4">Your Weekly Usage</CardTitle>
        <CardDescription>
          Track your free tier limits and upgrade for unlimited access
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="font-medium">Resumes Created</span>
              <span className="text-muted-foreground">
                {defaultUsage.resumesCreated}/{defaultUsage.resumesLimit}
              </span>
            </div>
            <Progress 
              value={(defaultUsage.resumesCreated / defaultUsage.resumesLimit) * 100} 
              className="h-2"
            />
          </div>

          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="font-medium">Job Applications</span>
              <span className="text-muted-foreground">
                {defaultUsage.jobApplications}/{defaultUsage.jobApplicationsLimit}
              </span>
            </div>
            <Progress 
              value={(defaultUsage.jobApplications / defaultUsage.jobApplicationsLimit) * 100} 
              className="h-2"
            />
          </div>

          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="font-medium">Cover Letters</span>
              <span className="text-muted-foreground">
                {defaultUsage.coverLetters}/{defaultUsage.coverLettersLimit}
              </span>
            </div>
            <Progress 
              value={(defaultUsage.coverLetters / defaultUsage.coverLettersLimit) * 100} 
              className="h-2"
            />
          </div>
        </div>

        <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Unlock More Features!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <ul className="space-y-2 text-sm">
              {premiumFeatures.slice(0, 3).map((feature, idx) => {
                const Icon = feature.icon;
                return (
                  <li key={idx} className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-primary" />
                    <span>{feature.text}</span>
                  </li>
                );
              })}
              <li className="text-muted-foreground">...and much more!</li>
            </ul>
            <Button 
              className="w-full" 
              onClick={() => navigate('/pricing')}
            >
              Upgrade to Premium - $4.99/week
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              💰 Use a referral code for $2.99/week!
            </p>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
}
