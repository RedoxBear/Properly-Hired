import React from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Users as UsersIcon, Search, Crown, CheckCircle2, AlertCircle, Filter } from "lucide-react";
import { motion } from "framer-motion";
import { TIERS, TIER_LIMITS, PRICING } from "@/components/utils/accessControl";

export default function Users() {
    const [users, setUsers] = React.useState([]);
    const [filteredUsers, setFilteredUsers] = React.useState([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [error, setError] = React.useState("");
    const [success, setSuccess] = React.useState("");
    const [searchQuery, setSearchQuery] = React.useState("");
    const [tierFilter, setTierFilter] = React.useState("all");

    React.useEffect(() => {
        loadUsers();
    }, []);

    React.useEffect(() => {
        filterUsers();
    }, [searchQuery, tierFilter, users]);

    const loadUsers = async () => {
        setIsLoading(true);
        setError("");
        try {
            const userList = await base44.entities.User.list();
            setUsers(userList || []);
        } catch (e) {
            console.error("Error loading users:", e);
            setError("Failed to load users. Please try again.");
        }
        setIsLoading(false);
    };

    const filterUsers = () => {
        let filtered = [...users];

        // Filter by search query
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(user =>
                user.email?.toLowerCase().includes(query) ||
                user.full_name?.toLowerCase().includes(query)
            );
        }

        // Filter by tier
        if (tierFilter !== "all") {
            filtered = filtered.filter(user =>
                (user.subscription_tier || TIERS.FREE) === tierFilter
            );
        }

        setFilteredUsers(filtered);
    };

    const updateUserTier = async (userId, newTier) => {
        setError("");
        setSuccess("");
        try {
            await base44.entities.User.update(userId, { subscription_tier: newTier });

            // Update local state
            setUsers(prevUsers =>
                prevUsers.map(user =>
                    user.id === userId ? { ...user, subscription_tier: newTier } : user
                )
            );

            setSuccess(`User tier updated to ${newTier.toUpperCase()} successfully!`);
            setTimeout(() => setSuccess(""), 3000);
        } catch (e) {
            console.error("Error updating user tier:", e);
            setError(`Failed to update user tier: ${e.message}`);
        }
    };

    const getTierBadge = (tier) => {
        const t = tier || TIERS.FREE;
        const colors = {
            [TIERS.FREE]: "bg-slate-100 text-slate-700 border-slate-300",
            [TIERS.PRO]: "bg-blue-100 text-blue-700 border-blue-300",
            [TIERS.PREMIUM]: "bg-purple-100 text-purple-700 border-purple-300",
            [TIERS.ENTERPRISE]: "bg-amber-100 text-amber-700 border-amber-300"
        };

        return (
            <Badge variant="outline" className={`${colors[t]} font-semibold`}>
                {t.toUpperCase()}
            </Badge>
        );
    };

    const getTierStats = () => {
        const stats = {
            [TIERS.FREE]: 0,
            [TIERS.PRO]: 0,
            [TIERS.PREMIUM]: 0,
            [TIERS.ENTERPRISE]: 0
        };

        users.forEach(user => {
            const tier = user.subscription_tier || TIERS.FREE;
            stats[tier] = (stats[tier] || 0) + 1;
        });

        return stats;
    };

    if (isLoading) {
        return (
            <div className="min-h-screen p-6 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading users...</p>
                </div>
            </div>
        );
    }

    const stats = getTierStats();

    return (
        <div className="min-h-screen p-4 md:p-8 bg-gray-50 dark:bg-background">
            <div className="max-w-7xl mx-auto space-y-6">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium mb-4">
                        <UsersIcon className="w-4 h-4" />
                        User Management
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-slate-100 mb-2">
                        All Users
                    </h1>
                    <p className="text-lg text-slate-600 dark:text-slate-400">
                        View and manage user subscription tiers
                    </p>
                </motion.div>

                {error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {success && (
                    <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30">
                        <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                        <AlertDescription className="text-green-800 dark:text-green-200">
                            {success}
                        </AlertDescription>
                    </Alert>
                )}

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="border-0 shadow-lg bg-gradient-to-br from-slate-500 to-slate-600 text-white">
                        <CardContent className="p-4">
                            <div className="text-2xl font-bold">{stats[TIERS.FREE]}</div>
                            <div className="text-sm opacity-90">Free Users</div>
                        </CardContent>
                    </Card>
                    <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-cyan-600 text-white">
                        <CardContent className="p-4">
                            <div className="text-2xl font-bold">{stats[TIERS.PRO]}</div>
                            <div className="text-sm opacity-90">Pro Users</div>
                        </CardContent>
                    </Card>
                    <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500 to-pink-600 text-white">
                        <CardContent className="p-4">
                            <div className="text-2xl font-bold">{stats[TIERS.PREMIUM]}</div>
                            <div className="text-sm opacity-90">Premium Users</div>
                        </CardContent>
                    </Card>
                    <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-500 to-orange-600 text-white">
                        <CardContent className="p-4">
                            <div className="text-2xl font-bold">{stats[TIERS.ENTERPRISE]}</div>
                            <div className="text-sm opacity-90">Enterprise Users</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <Card>
                    <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                                    <Input
                                        placeholder="Search by email or name..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                            </div>
                            <div className="md:w-64">
                                <Select value={tierFilter} onValueChange={setTierFilter}>
                                    <SelectTrigger>
                                        <Filter className="w-4 h-4 mr-2" />
                                        <SelectValue placeholder="Filter by tier" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Tiers</SelectItem>
                                        <SelectItem value={TIERS.FREE}>Free Only</SelectItem>
                                        <SelectItem value={TIERS.PRO}>Pro Only</SelectItem>
                                        <SelectItem value={TIERS.PREMIUM}>Premium Only</SelectItem>
                                        <SelectItem value={TIERS.ENTERPRISE}>Enterprise Only</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                            Showing {filteredUsers.length} of {users.length} users
                        </div>
                    </CardContent>
                </Card>

                {/* Users Table */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <UsersIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            User List
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-200 dark:border-slate-700">
                                        <th className="text-left p-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
                                            Email
                                        </th>
                                        <th className="text-left p-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
                                            Name
                                        </th>
                                        <th className="text-left p-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
                                            Current Tier
                                        </th>
                                        <th className="text-left p-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
                                            Tier Limits
                                        </th>
                                        <th className="text-left p-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredUsers.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="text-center p-8 text-slate-500 dark:text-slate-400">
                                                No users found
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredUsers.map((user) => {
                                            const tier = user.subscription_tier || TIERS.FREE;
                                            const limits = TIER_LIMITS[tier];

                                            return (
                                                <tr
                                                    key={user.id}
                                                    className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
                                                >
                                                    <td className="p-3 text-sm text-slate-800 dark:text-slate-200">
                                                        {user.email}
                                                    </td>
                                                    <td className="p-3 text-sm text-slate-600 dark:text-slate-400">
                                                        {user.full_name || "—"}
                                                    </td>
                                                    <td className="p-3">
                                                        {getTierBadge(tier)}
                                                    </td>
                                                    <td className="p-3">
                                                        <div className="text-xs text-slate-600 dark:text-slate-400 space-y-0.5">
                                                            <div>Resumes: {limits.max_resumes === -1 ? "∞" : limits.max_resumes}</div>
                                                            <div>Optimizations: {limits.resume_optimizations_per_week === -1 ? "∞" : `${limits.resume_optimizations_per_week}/wk`}</div>
                                                        </div>
                                                    </td>
                                                    <td className="p-3">
                                                        <Select
                                                            value={tier}
                                                            onValueChange={(newTier) => updateUserTier(user.id, newTier)}
                                                        >
                                                            <SelectTrigger className="w-40">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value={TIERS.FREE}>
                                                                    Free
                                                                </SelectItem>
                                                                <SelectItem value={TIERS.PRO}>
                                                                    Pro - ${PRICING.pro.price}/wk
                                                                </SelectItem>
                                                                <SelectItem value={TIERS.PREMIUM}>
                                                                    Premium - ${PRICING.premium.price}/wk
                                                                </SelectItem>
                                                                <SelectItem value={TIERS.ENTERPRISE}>
                                                                    Enterprise
                                                                </SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {/* Tier Information */}
                <Card className="bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Crown className="w-5 h-5 text-amber-500" />
                            Subscription Tier Reference
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                                <div className="font-semibold text-slate-700 dark:text-slate-300 mb-2">Free</div>
                                <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                                    <li>• 3 resumes max</li>
                                    <li>• 5 optimizations/week</li>
                                    <li>• 10 job analyses/week</li>
                                    <li>• 5 cover letters/week</li>
                                </ul>
                            </div>
                            <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-blue-200 dark:border-blue-800">
                                <div className="font-semibold text-blue-700 dark:text-blue-300 mb-2">
                                    Pro - ${PRICING.pro.price}/week
                                </div>
                                <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                                    <li>• 20 resumes max</li>
                                    <li>• Unlimited optimizations</li>
                                    <li>• Unlimited job analyses</li>
                                    <li>• All Pro features</li>
                                </ul>
                            </div>
                            <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-purple-200 dark:border-purple-800">
                                <div className="font-semibold text-purple-700 dark:text-purple-300 mb-2">
                                    Premium - ${PRICING.premium.price}/week
                                </div>
                                <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                                    <li>• Unlimited resumes</li>
                                    <li>• Unlimited optimizations</li>
                                    <li>• All Pro services</li>
                                    <li>• Unlimited processes</li>
                                </ul>
                            </div>
                            <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-amber-200 dark:border-amber-800">
                                <div className="font-semibold text-amber-700 dark:text-amber-300 mb-2">Enterprise</div>
                                <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                                    <li>• Everything unlimited</li>
                                    <li>• Priority support</li>
                                    <li>• Custom integrations</li>
                                    <li>• Account manager</li>
                                </ul>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
