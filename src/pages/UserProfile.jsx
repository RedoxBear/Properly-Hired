import React from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader2, User, Target, MapPin, DollarSign, Bell, FileText, Settings, CheckCircle2, Plus, X, Crown } from "lucide-react";
import { motion } from "framer-motion";
import { TIERS, TIER_LIMITS, PRICING, isAdmin } from "@/components/utils/accessControl";

export default function UserProfile() {
    const [user, setUser] = React.useState(null);
    const [preferences, setPreferences] = React.useState(null);
    const [resumes, setResumes] = React.useState([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [isSaving, setIsSaving] = React.useState(false);
    const [error, setError] = React.useState("");
    const [success, setSuccess] = React.useState(false);
    const [newRole, setNewRole] = React.useState("");
    const [newIndustry, setNewIndustry] = React.useState("");
    const [newLocation, setNewLocation] = React.useState("");
    const [isLocating, setIsLocating] = React.useState(false);
    const [gpsError, setGpsError] = React.useState("");

    React.useEffect(() => {
        loadData();
    }, []);

    const getBillingStatus = (currentUser) =>
        currentUser?.subscription_status || currentUser?.payment_status || currentUser?.billing_status || "";

    const getBillingTier = (currentUser) => {
        const tier =
            currentUser?.paid_tier ||
            currentUser?.billing_tier ||
            currentUser?.plan_tier ||
            currentUser?.subscription_plan ||
            "";
        return Object.values(TIERS).includes(tier) ? tier : "";
    };

    const normalizePreferences = (prefs, tier) => {
        const normalized = { ...prefs };
        normalized.analysis_preferences = {
            ...normalized.analysis_preferences,
            optimize_mode: "resume_optimizer"
        };
        if (tier === TIERS.FREE) {
            normalized.notification_settings = {
                ...normalized.notification_settings,
                email_new_matches: false
            };
        }
        return normalized;
    };

    const syncTierFromBilling = async (currentUser) => {
        if (!currentUser || isAdmin(currentUser)) return currentUser;

        const status = getBillingStatus(currentUser).toLowerCase();
        const billingTier = getBillingTier(currentUser);
        const currentTier = currentUser.subscription_tier || TIERS.FREE;
        let nextTier = null;

        if (["active", "paid", "trialing"].includes(status) && billingTier) {
            nextTier = billingTier;
        } else if (["canceled", "cancelled", "expired", "past_due", "unpaid", "inactive"].includes(status)) {
            nextTier = TIERS.FREE;
        }

        if (nextTier && nextTier !== currentTier) {
            await base44.entities.User.update(currentUser.id, { subscription_tier: nextTier });
            return { ...currentUser, subscription_tier: nextTier };
        }

        return currentUser;
    };

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [rawUser, masterResumes] = await Promise.all([
                base44.auth.me(),
                base44.entities.Resume.filter({ is_master_resume: true }, "-created_date", 50)
            ]);
            const currentUser = await syncTierFromBilling(rawUser);
            setUser(currentUser);
            setResumes(masterResumes);
            const currentTier = currentUser?.subscription_tier || TIERS.FREE;

            const existingPrefs = await base44.entities.UserPreferences.filter(
                { created_by: currentUser.email },
                "-created_date",
                1
            );

            if (existingPrefs.length > 0) {
                setPreferences(normalizePreferences(existingPrefs[0], currentTier));
            } else {
                setPreferences(normalizePreferences({
                    career_goals: "",
                    target_roles: [],
                    target_industries: [],
                    location_preferences: {
                        preferred_locations: [],
                        gps_location: null,
                        open_to_relocation: false,
                        remote_preference: "flexible"
                    },
                    salary_preferences: {
                        minimum_salary: null,
                        currency: "USD",
                        salary_type: "annual"
                    },
                    notification_settings: {
                        email_new_matches: currentTier !== TIERS.FREE,
                        email_high_score_matches: true,
                        email_frequency: "daily",
                        match_score_threshold: 70
                    },
                    default_resume_id: masterResumes.length > 0 ? masterResumes[0].id : "",
                    analysis_preferences: {
                        auto_analyze_jobs: false,
                        optimize_mode: "resume_optimizer",
                        deep_humanize: true,
                        aggressive_match: true
                    },
                    job_search_status: "actively_looking"
                }, currentTier));
            }
        } catch (e) {
            console.error("Error loading data:", e);
            setError("Failed to load profile data");
        }
        setIsLoading(false);
    };

    const updatePreference = (path, value) => {
        setPreferences(prev => {
            const newPrefs = { ...prev };
            const keys = path.split('.');
            let current = newPrefs;
            for (let i = 0; i < keys.length - 1; i++) {
                if (!current[keys[i]]) current[keys[i]] = {};
                current = current[keys[i]];
            }
            current[keys[keys.length - 1]] = value;
            return newPrefs;
        });
    };

    const addItem = (arrayPath, item) => {
        if (!item.trim()) return;
        setPreferences(prev => {
            const newPrefs = { ...prev };
            const keys = arrayPath.split('.');
            let current = newPrefs;
            for (let i = 0; i < keys.length - 1; i++) {
                current = current[keys[i]];
            }
            const arr = current[keys[keys.length - 1]] || [];
            current[keys[keys.length - 1]] = [...arr, item.trim()];
            return newPrefs;
        });
    };

    const removeItem = (arrayPath, index) => {
        setPreferences(prev => {
            const newPrefs = { ...prev };
            const keys = arrayPath.split('.');
            let current = newPrefs;
            for (let i = 0; i < keys.length - 1; i++) {
                current = current[keys[i]];
            }
            const arr = current[keys[keys.length - 1]] || [];
            current[keys[keys.length - 1]] = arr.filter((_, i) => i !== index);
            return newPrefs;
        });
    };

    const savePreferences = async () => {
        setIsSaving(true);
        setError("");
        setSuccess(false);

        try {
            const currentTier = user?.subscription_tier || TIERS.FREE;
            const normalized = normalizePreferences(preferences, currentTier);
            if (preferences.id) {
                await base44.entities.UserPreferences.update(preferences.id, normalized);
                setPreferences(normalized);
            } else {
                const created = await base44.entities.UserPreferences.create(normalized);
                setPreferences(created);
            }
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (e) {
            console.error("Error saving preferences:", e);
            setError("Failed to save preferences. Please try again.");
        }

        setIsSaving(false);
    };

    const updateSubscriptionTier = async (newTier) => {
        try {
            if (!isAdmin(user)) {
                setError("Only admins can modify subscription tiers.");
                return;
            }
            // Update user object with new subscription tier
            const updatedUser = { ...user, subscription_tier: newTier };
            await base44.entities.User.update(user.id, { subscription_tier: newTier });
            setUser(updatedUser);
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (e) {
            console.error("Error updating subscription tier:", e);
            setError("Failed to update subscription tier. Please try again.");
        }
    };

    const handleUseGps = () => {
        setGpsError("");
        if (!navigator.geolocation) {
            setGpsError("Geolocation is not supported by your browser.");
            return;
        }
        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                const label = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
                updatePreference("location_preferences.gps_location", {
                    latitude,
                    longitude,
                    label,
                    captured_at: new Date().toISOString()
                });
                setNewLocation(label);
                setIsLocating(false);
            },
            (err) => {
                console.error("Geolocation error:", err);
                setGpsError("Unable to access GPS. Please enable location permissions.");
                setIsLocating(false);
            }
        );
    };

    if (isLoading) {
        return (
            <div className="min-h-screen p-6 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    const currentTier = user?.subscription_tier || TIERS.FREE;
    const isTierAdmin = isAdmin(user);
    const canEmailNewMatches = currentTier !== TIERS.FREE;

    return (
        <div className="min-h-screen p-4 md:p-8 bg-gray-50">
            <div className="max-w-5xl mx-auto space-y-6">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-medium mb-4">
                        <User className="w-4 h-4" />
                        Profile & Preferences
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-2">My Profile</h1>
                    <p className="text-lg text-slate-600">
                        Personalize your job search experience and matching preferences
                    </p>
                </motion.div>

                {error && (
                    <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {success && (
                    <Alert className="border-green-200 bg-green-50">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-800">
                            Preferences saved successfully!
                        </AlertDescription>
                    </Alert>
                )}

                {/* User Info */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="w-5 h-5 text-blue-600" />
                            Account Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div>
                            <Label className="text-sm text-slate-600">Name</Label>
                            <p className="text-slate-800 font-medium">{user?.full_name || "Not set"}</p>
                        </div>
                        <div>
                            <Label className="text-sm text-slate-600">Email</Label>
                            <p className="text-slate-800 font-medium">{user?.email}</p>
                        </div>
                        <div>
                            <Label className="text-sm text-slate-600 flex items-center gap-2">
                                <Crown className="w-4 h-4 text-amber-500" />
                                Subscription Tier
                            </Label>
                            <Select
                                value={currentTier}
                                onValueChange={isTierAdmin ? updateSubscriptionTier : undefined}
                                disabled={!isTierAdmin}
                            >
                                <SelectTrigger className="w-full md:w-64">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={TIERS.FREE}>
                                        <div className="flex items-center gap-2">
                                            <span>Free</span>
                                            <Badge variant="outline" className="text-xs">
                                                ${PRICING.free.price}
                                            </Badge>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value={TIERS.PRO}>
                                        <div className="flex items-center gap-2">
                                            <span>Pro</span>
                                            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                                ${PRICING.pro.price}/{PRICING.pro.period}
                                            </Badge>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value={TIERS.PREMIUM}>
                                        <div className="flex items-center gap-2">
                                            <span>Premium</span>
                                            <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                                                ${PRICING.premium.price}/{PRICING.premium.period}
                                            </Badge>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value={TIERS.ENTERPRISE}>
                                        <div className="flex items-center gap-2">
                                            <span>Enterprise</span>
                                            <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                                                {PRICING.enterprise.price}
                                            </Badge>
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                            {!isTierAdmin && (
                                <p className="text-xs text-slate-500 mt-1">Admin-only setting. Contact support to change tiers.</p>
                            )}
                            <div className="mt-2 p-3 rounded-lg bg-slate-50 border border-slate-200">
                                <p className="text-xs text-slate-600 font-medium mb-1">Current Plan Benefits:</p>
                                <ul className="text-xs text-slate-700 space-y-1">
                                    {(() => {
                                        const tier = currentTier;
                                        const limits = TIER_LIMITS[tier];
                                        return (
                                            <>
                                                <li>• Max Resumes: {limits.max_resumes === -1 ? '∞ Unlimited' : limits.max_resumes}</li>
                                                <li>• Resume Optimizations: {limits.resume_optimizations_per_week === -1 ? '∞ Unlimited/week' : `${limits.resume_optimizations_per_week}/week`}</li>
                                                <li>• Job Analyses: {limits.job_analyses_per_week === -1 ? '∞ Unlimited/week' : `${limits.job_analyses_per_week}/week`}</li>
                                                <li>• Cover Letters: {limits.cover_letters ? (limits.cover_letters_per_week === -1 ? '✓ Unlimited' : `${limits.cover_letters_per_week}/week`) : '✗ Unavailable'}</li>
                                                <li>• Transferable Skills: {limits.transferable_skills ? '✓ Available' : '✗ Unavailable'}</li>
                                                <li>• Insights: {limits.insights ? '✓ Available' : '✗ Unavailable'}</li>
                                                <li>• Priority Support: {limits.priority_support ? '✓ Available' : '✗ Unavailable'}</li>
                                            </>
                                        );
                                    })()}
                                </ul>
                            </div>
                        </div>
                        <div>
                            <Label className="text-sm text-slate-600">Job Search Status</Label>
                            <Select
                                value={preferences?.job_search_status || "actively_looking"}
                                onValueChange={(val) => updatePreference("job_search_status", val)}
                            >
                                <SelectTrigger className="w-full md:w-64">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="actively_looking">Actively Looking</SelectItem>
                                    <SelectItem value="passively_looking">Passively Looking</SelectItem>
                                    <SelectItem value="not_looking">Not Looking</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* Career Goals */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Target className="w-5 h-5 text-purple-600" />
                            Career Goals & Targets
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Label>Career Goals</Label>
                            <Textarea
                                value={preferences?.career_goals || ""}
                                onChange={(e) => updatePreference("career_goals", e.target.value)}
                                placeholder="Describe your career aspirations, what you're looking for in your next role..."
                                className="min-h-[100px]"
                            />
                        </div>

                        <div>
                            <Label>Target Roles</Label>
                            <div className="flex gap-2 mb-2">
                                <Input
                                    value={newRole}
                                    onChange={(e) => setNewRole(e.target.value)}
                                    placeholder="e.g. Senior Software Engineer"
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                            addItem("target_roles", newRole);
                                            setNewRole("");
                                        }
                                    }}
                                />
                                <Button
                                    onClick={() => {
                                        addItem("target_roles", newRole);
                                        setNewRole("");
                                    }}
                                    size="icon"
                                >
                                    <Plus className="w-4 h-4" />
                                </Button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {(preferences?.target_roles || []).map((role, idx) => (
                                    <Badge key={idx} variant="secondary" className="gap-1">
                                        {role}
                                        <X
                                            className="w-3 h-3 cursor-pointer hover:text-red-600"
                                            onClick={() => removeItem("target_roles", idx)}
                                        />
                                    </Badge>
                                ))}
                            </div>
                        </div>

                        <div>
                            <Label>Target Industries</Label>
                            <div className="flex gap-2 mb-2">
                                <Input
                                    value={newIndustry}
                                    onChange={(e) => setNewIndustry(e.target.value)}
                                    placeholder="e.g. Technology, Healthcare, Finance"
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                            addItem("target_industries", newIndustry);
                                            setNewIndustry("");
                                        }
                                    }}
                                />
                                <Button
                                    onClick={() => {
                                        addItem("target_industries", newIndustry);
                                        setNewIndustry("");
                                    }}
                                    size="icon"
                                >
                                    <Plus className="w-4 h-4" />
                                </Button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {(preferences?.target_industries || []).map((industry, idx) => (
                                    <Badge key={idx} variant="secondary" className="gap-1">
                                        {industry}
                                        <X
                                            className="w-3 h-3 cursor-pointer hover:text-red-600"
                                            onClick={() => removeItem("target_industries", idx)}
                                        />
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Location Preferences */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-green-600" />
                            Location Preferences
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Label>Preferred Locations</Label>
                            <div className="flex gap-2 mb-2">
                                <Input
                                    value={newLocation}
                                    onChange={(e) => setNewLocation(e.target.value)}
                                    placeholder="e.g. San Francisco, CA"
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                            addItem("location_preferences.preferred_locations", newLocation);
                                            setNewLocation("");
                                        }
                                    }}
                                />
                                <Button
                                    onClick={() => {
                                        addItem("location_preferences.preferred_locations", newLocation);
                                        setNewLocation("");
                                    }}
                                    size="icon"
                                >
                                    <Plus className="w-4 h-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={handleUseGps}
                                    disabled={isLocating}
                                >
                                    {isLocating ? "Locating..." : "Use GPS"}
                                </Button>
                            </div>
                            {gpsError && <p className="text-xs text-red-600">{gpsError}</p>}
                            {preferences?.location_preferences?.gps_location?.label && (
                                <p className="text-xs text-slate-500">
                                    GPS detected: {preferences.location_preferences.gps_location.label}
                                </p>
                            )}
                            <div className="flex flex-wrap gap-2">
                                {(preferences?.location_preferences?.preferred_locations || []).map((loc, idx) => (
                                    <Badge key={idx} variant="secondary" className="gap-1">
                                        {loc}
                                        <X
                                            className="w-3 h-3 cursor-pointer hover:text-red-600"
                                            onClick={() => removeItem("location_preferences.preferred_locations", idx)}
                                        />
                                    </Badge>
                                ))}
                            </div>
                        </div>

                        <div>
                            <Label>Remote Work Preference</Label>
                            <Select
                                value={preferences?.location_preferences?.remote_preference || "flexible"}
                                onValueChange={(val) => updatePreference("location_preferences.remote_preference", val)}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="remote_only">Remote Only</SelectItem>
                                    <SelectItem value="hybrid">Hybrid</SelectItem>
                                    <SelectItem value="onsite">On-site</SelectItem>
                                    <SelectItem value="flexible">Flexible</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-center justify-between rounded-lg border p-3 bg-slate-50">
                            <div>
                                <div className="font-medium text-slate-800">Open to Relocation</div>
                                <p className="text-sm text-slate-600">Willing to move for the right opportunity</p>
                            </div>
                            <Switch
                                checked={preferences?.location_preferences?.open_to_relocation || false}
                                onCheckedChange={(val) => updatePreference("location_preferences.open_to_relocation", val)}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Salary Preferences */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <DollarSign className="w-5 h-5 text-emerald-600" />
                            Salary Preferences
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid md:grid-cols-3 gap-4">
                            <div>
                                <Label>Minimum Salary</Label>
                                <Input
                                    type="number"
                                    value={preferences?.salary_preferences?.minimum_salary || ""}
                                    onChange={(e) => updatePreference("salary_preferences.minimum_salary", e.target.value ? Number(e.target.value) : null)}
                                    placeholder="e.g. 100000"
                                />
                            </div>
                            <div>
                                <Label>Currency</Label>
                                <Select
                                    value={preferences?.salary_preferences?.currency || "USD"}
                                    onValueChange={(val) => updatePreference("salary_preferences.currency", val)}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="USD">USD</SelectItem>
                                        <SelectItem value="EUR">EUR</SelectItem>
                                        <SelectItem value="GBP">GBP</SelectItem>
                                        <SelectItem value="CAD">CAD</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Type</Label>
                                <Select
                                    value={preferences?.salary_preferences?.salary_type || "annual"}
                                    onValueChange={(val) => updatePreference("salary_preferences.salary_type", val)}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="annual">Annual</SelectItem>
                                        <SelectItem value="hourly">Hourly</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Notification Settings */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Bell className="w-5 h-5 text-amber-600" />
                            Notification Settings
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between rounded-lg border p-3 bg-slate-50">
                            <div>
                                <div className="font-medium text-slate-800">Email for New Matches</div>
                                <p className="text-sm text-slate-600">Get notified when new job matches are found</p>
                            </div>
                            <Switch
                                checked={canEmailNewMatches ? preferences?.notification_settings?.email_new_matches !== false : false}
                                onCheckedChange={(val) => {
                                    if (canEmailNewMatches) {
                                        updatePreference("notification_settings.email_new_matches", val);
                                    }
                                }}
                                disabled={!canEmailNewMatches}
                            />
                        </div>
                        {!canEmailNewMatches && (
                            <p className="text-xs text-slate-500">Available on Pro and above.</p>
                        )}

                        <div className="flex items-center justify-between rounded-lg border p-3 bg-slate-50">
                            <div>
                                <div className="font-medium text-slate-800">High Score Matches (85+)</div>
                                <p className="text-sm text-slate-600">Get notified for excellent matches</p>
                            </div>
                            <Switch
                                checked={preferences?.notification_settings?.email_high_score_matches !== false}
                                onCheckedChange={(val) => updatePreference("notification_settings.email_high_score_matches", val)}
                            />
                        </div>

                        <div>
                            <Label>Email Frequency</Label>
                            <Select
                                value={preferences?.notification_settings?.email_frequency || "daily"}
                                onValueChange={(val) => updatePreference("notification_settings.email_frequency", val)}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="immediate">Immediate</SelectItem>
                                    <SelectItem value="daily">Daily Digest</SelectItem>
                                    <SelectItem value="weekly">Weekly Summary</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label>Match Score Threshold</Label>
                            <Input
                                type="number"
                                min="0"
                                max="100"
                                value={preferences?.notification_settings?.match_score_threshold || 70}
                                onChange={(e) => updatePreference("notification_settings.match_score_threshold", Number(e.target.value))}
                            />
                            <p className="text-xs text-slate-500 mt-1">Only notify for matches scoring above this threshold</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Resume & Analysis Settings */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Settings className="w-5 h-5 text-slate-600" />
                            Resume & Analysis Preferences
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Label>Default Master Resume</Label>
                            <Select
                                value={preferences?.default_resume_id || ""}
                                onValueChange={(val) => updatePreference("default_resume_id", val)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select default resume..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {resumes.map(r => (
                                        <SelectItem key={r.id} value={r.id}>
                                            {r.version_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label>Default Optimization Mode</Label>
                            <Input value="Resume Optimizer" disabled />
                            <p className="text-xs text-slate-500 mt-1">Locked default mode.</p>
                        </div>

                        <div className="flex items-center justify-between rounded-lg border p-3 bg-slate-50">
                            <div>
                                <div className="font-medium text-slate-800">Auto-Analyze Jobs</div>
                                <p className="text-sm text-slate-600">Automatically analyze saved jobs against your resume</p>
                            </div>
                            <Switch
                                checked={preferences?.analysis_preferences?.auto_analyze_jobs || false}
                                onCheckedChange={(val) => updatePreference("analysis_preferences.auto_analyze_jobs", val)}
                            />
                        </div>

                        <div className="flex items-center justify-between rounded-lg border p-3 bg-slate-50">
                            <div>
                                <div className="font-medium text-slate-800">Deep Humanization</div>
                                <p className="text-sm text-slate-600">Bypass ATS AI-detection with human-like writing</p>
                            </div>
                            <Switch
                                checked={preferences?.analysis_preferences?.deep_humanize !== false}
                                onCheckedChange={(val) => updatePreference("analysis_preferences.deep_humanize", val)}
                            />
                        </div>

                        <div className="flex items-center justify-between rounded-lg border p-3 bg-slate-50">
                            <div>
                                <div className="font-medium text-slate-800">Aggressive Keyword Matching</div>
                                <p className="text-sm text-slate-600">Aim for 95-100% keyword coverage</p>
                            </div>
                            <Switch
                                checked={preferences?.analysis_preferences?.aggressive_match !== false}
                                onCheckedChange={(val) => updatePreference("analysis_preferences.aggressive_match", val)}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Save Button */}
                <div className="flex justify-end gap-3 sticky bottom-4">
                    <Button
                        onClick={savePreferences}
                        disabled={isSaving}
                        className="bg-blue-600 hover:bg-blue-700 shadow-lg"
                        size="lg"
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                Save Preferences
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
