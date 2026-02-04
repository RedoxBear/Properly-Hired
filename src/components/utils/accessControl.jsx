/**
 * Access control utilities for feature gating based on subscription tier and user roles
 */

export const TIERS = {
  FREE: "free",
  PRO: "pro",
  PREMIUM: "premium",
  ENTERPRISE: "enterprise"
};

export const ROLES = {
  USER: "user",
  ADMIN: "admin",
  SUPER_ADMIN: "super_admin"
};

export const TIER_LIMITS = {
  free: {
    max_resumes: 3,
    resume_optimizations_per_week: 5,
    job_analyses_per_week: 10,
    cover_letters_per_week: 5,
    cover_letters: false,
    transferable_skills: false,
    insights: false,
    priority_support: false,
    features: ["job_analysis", "resume_upload", "basic_optimization", "cover_letters"]
  },
  pro: {
    max_resumes: 10,
    resume_optimizations_per_week: 40,
    job_analyses_per_week: 100,
    cover_letters_per_week: 40,
    cover_letters: true,
    transferable_skills: true,
    insights: true,
    priority_support: false,
    features: ["job_analysis", "resume_upload", "basic_optimization", "cover_letters", "transferable_skills", "insights", "autofill_vault", "application_qna"]
  },
  premium: {
    max_resumes: -1, // unlimited
    resume_optimizations_per_week: -1,
    job_analyses_per_week: -1,
    cover_letters_per_week: -1,
    cover_letters: true,
    transferable_skills: true,
    insights: true,
    priority_support: false,
    features: ["job_analysis", "resume_upload", "basic_optimization", "cover_letters", "transferable_skills", "insights", "autofill_vault", "application_qna"]
  },
  enterprise: {
    max_resumes: -1, // unlimited
    resume_optimizations_per_week: -1,
    job_analyses_per_week: -1,
    cover_letters_per_week: -1,
    cover_letters: true,
    transferable_skills: true,
    insights: true,
    priority_support: true,
    features: ["*"] // all features
  }
};

export const PRICING = {
  free: {
    price: 0,
    period: "forever",
    description: "Get started with basic job search tools"
  },
  pro: {
    price: 4.99,
    period: "week",
    description: "Full AI-powered career toolkit",
    discounted_price: 2.99,
    discount_note: "Use code CAREER40 for 40% off"
  },
  premium: {
    price: 9.99,
    period: "week",
    description: "All Pro services + unlimited resumes",
    discounted_price: 6.99,
    discount_note: "Use code CAREER40 for 40% off"
  },
  enterprise: {
    price: "Custom",
    period: "contact us",
    description: "Unlimited access + priority support",
    contact_required: true
  }
};

/**
 * Check if user has access to a feature
 */
export function hasAccess(user, feature) {
  if (!user) return false;
  
  const tier = user.subscription_tier || TIERS.FREE;
  const limits = TIER_LIMITS[tier];
  
  if (!limits) return false;
  
  // Enterprise and Premium have access to everything
  if (tier === TIERS.ENTERPRISE || tier === TIERS.PREMIUM) return true;
  
  // Check if feature is in allowed list
  return limits.features.includes(feature) || limits.features.includes("*");
}

/**
 * Check if user can perform an action based on limits
 */
export function canPerformAction(user, action, currentCount) {
  if (!user) return false;
  
  const tier = user.subscription_tier || TIERS.FREE;
  const limits = TIER_LIMITS[tier];
  
  if (!limits) return false;
  
  const actionLimits = {
    create_resume: limits.max_resumes,
    optimize_resume: limits.resume_optimizations_per_week,
    job_analysis: limits.job_analyses_per_week,
    cover_letter: limits.cover_letters_per_week,
    track_application: limits.job_analyses_per_week
  };
  
  const limit = actionLimits[action];
  if (limit === undefined) return true; // No limit for this action
  if (limit === -1) return true; // Unlimited
  
  return currentCount < limit;
}

/**
 * Get remaining quota for an action
 */
export function getRemainingQuota(user, action, currentCount) {
  if (!user) return 0;
  
  const tier = user.subscription_tier || TIERS.FREE;
  const limits = TIER_LIMITS[tier];
  
  if (!limits) return 0;
  
  const actionLimits = {
    create_resume: limits.max_resumes,
    optimize_resume: limits.resume_optimizations_per_week,
    job_analysis: limits.job_analyses_per_week,
    cover_letter: limits.cover_letters_per_week,
    track_application: limits.job_analyses_per_week
  };
  
  const limit = actionLimits[action];
  if (limit === -1) return Infinity;
  
  return Math.max(0, limit - currentCount);
}

/**
 * Get upgrade CTA message based on blocked feature
 */
export function getUpgradeMessage(feature) {
  const messages = {
    cover_letters: "Unlock AI-powered cover letter generation with Pro or Premium",
    transferable_skills: "Discover your transferable skills with Pro or Premium",
    insights: "Get detailed activity insights with Pro or Premium",
    max_resumes: "You've reached your resume limit. Upgrade to Pro (20 resumes) or Premium (unlimited)",
    max_resumes_pro: "You've hit the 20 resume limit on Pro. Upgrade to Premium for unlimited resumes",
    max_applications: "You've reached your weekly job analysis limit. Upgrade to Pro or Premium for unlimited",
    resume_optimizations: "You've reached your weekly resume optimization limit. Upgrade to Pro or Premium for unlimited",
    cover_letters_weekly: "You've reached your weekly cover letter limit. Upgrade to Pro or Premium for unlimited"
  };

  return messages[feature] || "Upgrade to unlock this feature";
}

/**
 * Get tier-specific comparison for upgrades
 */
export function getTierComparison(currentTier) {
  const comparisons = {
    [TIERS.FREE]: {
      title: "Upgrade to unlock full potential",
      options: [
        {
          tier: TIERS.PRO,
          price: PRICING.pro.price,
          period: PRICING.pro.period,
          highlights: ["20 resumes", "Unlimited AI tools", "All Pro features"],
          bestFor: "Active job seekers"
        },
        {
          tier: TIERS.PREMIUM,
          price: PRICING.premium.price,
          period: PRICING.premium.period,
          highlights: ["Unlimited resumes", "All Pro features", "No resume limits"],
          bestFor: "Power users & career changers",
          recommended: true
        }
      ]
    },
    [TIERS.PRO]: {
      title: "Need unlimited resumes?",
      options: [
        {
          tier: TIERS.PREMIUM,
          price: PRICING.premium.price,
          period: PRICING.premium.period,
          highlights: ["Unlimited resumes (vs 20)", "Everything in Pro", "Perfect for career transitions"],
          bestFor: "Managing multiple career paths",
          recommended: true
        }
      ]
    }
  };

  return comparisons[currentTier] || null;
}

/**
 * Check if user is an admin
 */
export function isAdmin(user) {
  if (!user) return false;
  const role = user.role || ROLES.USER;
  return role === ROLES.ADMIN || role === ROLES.SUPER_ADMIN;
}

/**
 * Check if user is a super admin
 */
export function isSuperAdmin(user) {
  if (!user) return false;
  return user.role === ROLES.SUPER_ADMIN;
}

/**
 * Check if user has a specific role
 */
export function hasRole(user, requiredRole) {
  if (!user) return false;
  const userRole = user.role || ROLES.USER;

  // Super admin has access to everything
  if (userRole === ROLES.SUPER_ADMIN) return true;

  // Admin has access to admin and user
  if (userRole === ROLES.ADMIN && requiredRole !== ROLES.SUPER_ADMIN) return true;

  // Check exact role match
  return userRole === requiredRole;
}

/**
 * Get role display name
 */
export function getRoleDisplayName(role) {
  const names = {
    [ROLES.USER]: "User",
    [ROLES.ADMIN]: "Admin",
    [ROLES.SUPER_ADMIN]: "Super Admin"
  };
  return names[role] || "User";
}

/**
 * Get start of current week (Monday 00:00:00)
 */
export function getWeekStart() {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
  const monday = new Date(now.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

/**
 * Get tier limit for a specific action
 */
export function getTierLimit(user, action) {
  const tier = user?.subscription_tier || TIERS.FREE;
  const limits = TIER_LIMITS[tier];

  if (!limits) return 0;

  const actionLimits = {
    create_resume: limits.max_resumes,
    optimize_resume: limits.resume_optimizations_per_week,
    job_analysis: limits.job_analyses_per_week,
    cover_letter: limits.cover_letters_per_week
  };

  return actionLimits[action] ?? -1;
}

/**
 * Format limit display (handles unlimited)
 */
export function formatLimit(limit) {
  return limit === -1 ? "Unlimited" : limit.toString();
}
