import React, { useState, useEffect } from "react";
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
import { Loader2, User, Target, MapPin, DollarSign, Bell, FileText, Settings, CheckCircle2, Plus, X } from "lucide-react";
import { motion } from "framer-motion";

export default function UserProfile() {
    const [user, setUser] = useState(null);
    const [preferences, setPreferences] = useState(null);
    const [resumes, setResumes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [newRole, setNewRole] = useState("");
    const [newIndustry, setNewIndustry] = useState("");
    const [newLocation, setNewLocation] = useState("");

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [currentUser, masterResumes] = await Promise.all([
                base44.auth.me(),
                base44.entities.Resume.filter({ is_master_resume: true }, "-created_date", 50)
            ]);
            setUser(currentUser);
            setResumes(masterResumes);

            const existingPrefs = await base44.entities.UserPreferences.filter(
                { created_by: currentUser.email },
                "-created_date",
                1
            );

            if (existingPrefs.length > 0) {
                setPreferences(existingPrefs[0]);
            } else {
                setPreferences({
                    career_goals: "",
                    target_roles: [],
                    target_industries: [],
                    location_preferences: {
                        preferred_locations: [],
                        open_to_relocation: false,
                        remote_preference: "flexible"
                    },
                    salary_preferences: {
                        minimum_salary: null,
                        currency: "USD",
                        salary_type: "annual"
                    },
                    notification_settings: {
                        email_new_matches: true,
                        email_high_score_matches: true,
                        email_frequency: "daily",
                        match_score_threshold: 70
                    },
                    default_resume_id: masterResumes.length > 0 ? masterResumes[0].id : "",
                    analysis_preferences: {
                        auto_analyze_jobs: false,
                        optimize_mode: "two_page",
                        deep_humanize: true,
                        aggressive_match: true
                    },
                    job_search_status: "actively_looking"
                });
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
            if (preferences.id) {
                await base44.entities.UserPreferences.update(preferences.id, preferences);
            } else {
                const created = await base44.entities.UserPreferences.create(preferences);
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

    if (isLoading) {
        return (
            <div className="min-h-screen p-6 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

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
                            </div>
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
                                checked={preferences?.notification_settings?.email_new_matches !== false}
                                onCheckedChange={(val) => updatePreference("notification_settings.email_new_matches", val)}
                            />
                        </div>

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
                            <Select
                                value={preferences?.analysis_preferences?.optimize_mode || "two_page"}
                                onValueChange={(val) => updatePreference("analysis_preferences.optimize_mode", val)}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ats_one_page">ATS 1-Page</SelectItem>
                                    <SelectItem value="two_page">Pro 2-Page</SelectItem>
                                    <SelectItem value="full_cv">Full CV</SelectItem>
                                </SelectContent>
                            </Select>
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