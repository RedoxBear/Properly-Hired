import React from 'react';
import { AlertTriangle, AlertCircle, Crown, Lock, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TIERS } from '../utils/accessControl';

/**
 * Warning dialog for when user hits tier limits
 */
export function TierLimitWarningDialog({ isOpen, onClose, limitInfo }) {
  const { current, limit, tier } = limitInfo || {};

  const isAtLimit = current >= limit;
  const isProTier = tier === TIERS.PRO;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-6 h-6 text-amber-600" />
            <DialogTitle className="text-xl">
              {isAtLimit ? 'Resume Limit Reached' : 'Approaching Resume Limit'}
            </DialogTitle>
          </div>
          <DialogDescription className="text-base">
            {isAtLimit ? (
              <>
                You've reached your <span className="font-semibold">{tier}</span> tier limit of{' '}
                <span className="font-semibold">{limit} master resume{limit !== 1 ? 's' : ''}</span>.
              </>
            ) : (
              <>
                You're using <span className="font-semibold">{current} of {limit}</span> master resumes on the{' '}
                <span className="font-semibold">{tier}</span> tier.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {isAtLimit && (
            <Alert variant="destructive" className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-red-800">
                To upload a new resume, please delete an existing one or upgrade to a higher tier.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-3">
            <p className="text-sm font-semibold text-slate-700">Upgrade to unlock more resumes:</p>

            {tier === TIERS.FREE && (
              <>
                <div className="flex items-start gap-3 p-3 rounded-lg border border-blue-200 bg-blue-50">
                  <Crown className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-blue-800">Pro Tier</p>
                    <p className="text-xs text-blue-700">20 master resumes + unlimited AI optimizations</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg border border-purple-200 bg-purple-50">
                  <Crown className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-purple-800">Premium Tier</p>
                    <p className="text-xs text-purple-700">Unlimited master resumes + all Pro features</p>
                    <div className="mt-1">
                      <span className="text-xs font-semibold text-purple-900 bg-purple-200 px-2 py-0.5 rounded">
                        Best Value
                      </span>
                    </div>
                  </div>
                </div>
              </>
            )}

            {isProTier && (
              <div className="flex items-start gap-3 p-3 rounded-lg border border-purple-200 bg-purple-50">
                <Crown className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-purple-800">Premium Tier</p>
                  <p className="text-xs text-purple-700">
                    Upgrade to <strong>unlimited master resumes</strong> (you're capped at 20)
                  </p>
                  <p className="text-xs text-purple-700 mt-1">Plus all Pro features included</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex gap-2 sm:gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Link to={createPageUrl('Pricing')} className="flex-1">
            <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
              <Crown className="w-4 h-4 mr-2" />
              Compare Plans
            </Button>
          </Link>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Warning dialog for duplicate resume detection
 */
export function DuplicateResumeWarningDialog({ isOpen, onClose, onProceed, similarity }) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-6 h-6 text-red-600" />
            <DialogTitle className="text-xl text-red-700">Duplicate Resume Detected</DialogTitle>
          </div>
          <DialogDescription className="text-base">
            This resume appears to have been uploaded in a different profile.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <Alert variant="destructive" className="border-red-200 bg-red-50">
            <Lock className="h-4 w-4" />
            <AlertDescription className="text-red-800 text-sm">
              <strong>Important:</strong> This resume was uploaded in a different profile. Please don't sign up for
              different accounts and upgrade to Pro or Premium instead.
            </AlertDescription>
          </Alert>

          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
            <p className="text-sm text-slate-700 mb-3">
              <strong>Why this matters:</strong>
            </p>
            <ul className="text-xs text-slate-600 space-y-1.5">
              <li className="flex items-start gap-2">
                <span className="text-slate-400">•</span>
                <span>Creating multiple accounts violates our terms of service</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-slate-400">•</span>
                <span>It's more cost-effective to upgrade to a higher tier</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-slate-400">•</span>
                <span>You'll get more features and support with a paid plan</span>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-semibold text-slate-700">Consider upgrading instead:</p>

            <div className="flex items-start gap-3 p-3 rounded-lg border border-blue-200 bg-blue-50">
              <Crown className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-blue-800">Pro Tier - $4.99/week</p>
                <p className="text-xs text-blue-700">20 resumes + unlimited AI features</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg border border-purple-200 bg-purple-50">
              <Crown className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-purple-800">Premium Tier - $9.99/week</p>
                <p className="text-xs text-purple-700">Unlimited resumes + all Pro features</p>
                <div className="mt-1">
                  <span className="text-xs font-semibold text-purple-900 bg-purple-200 px-2 py-0.5 rounded">
                    Best Value
                  </span>
                </div>
              </div>
            </div>
          </div>

          {similarity && (
            <div className="text-xs text-slate-500 text-center pt-2 border-t">
              Content similarity: {similarity}%
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2 sm:gap-2">
          <Button variant="outline" onClick={onProceed} className="flex-1">
            Continue Anyway
          </Button>
          <Link to={createPageUrl('Pricing')} className="flex-1">
            <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
              <Crown className="w-4 h-4 mr-2" />
              View Plans
            </Button>
          </Link>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
