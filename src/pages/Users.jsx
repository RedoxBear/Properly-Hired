import React from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Loader2,
    Users as UsersIcon,
    Search,
    Crown,
    CheckCircle2,
    AlertCircle,
    Filter,
    Shield,
    TrendingUp,
    Activity,
    BarChart3,
    Calendar,
    Download,
    RefreshCw,
    Upload
} from "lucide-react";
import { motion } from "framer-motion";
import { TIERS, TIER_LIMITS, PRICING, ROLES, isAdmin, isSuperAdmin, getRoleDisplayName } from "@/components/utils/accessControl";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function Users() {
    const navigate = useNavigate();
    const [currentUser, setCurrentUser] = React.useState(null);
    const [users, setUsers] = React.useState([]);
    const [filteredUsers, setFilteredUsers] = React.useState([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [error, setError] = React.useState("");
    const [success, setSuccess] = React.useState("");
    const [searchQuery, setSearchQuery] = React.useState("");
    const [tierFilter, setTierFilter] = React.useState("all");
    const [roleFilter, setRoleFilter] = React.useState("all");
    const [activeTab, setActiveTab] = React.useState("users");

    React.useEffect(() => {
        checkAccess();
    }, []);

    React.useEffect(() => {
        filterUsers();
    }, [searchQuery, tierFilter, roleFilter, users]);

    const checkAccess = async () => {
        setIsLoading(true);
        try {
            const user = await base44.auth.me();
            setCurrentUser(user);

            // Check if user is admin
            if (!isAdmin(user)) {
                setError("Access Denied: Admin privileges required");
                setTimeout(() => navigate("/Dashboard"), 2000);
                return;
            }

            await loadUsers();
        } catch (e) {
            console.error("Error checking access:", e);
            setError("Failed to verify access. Redirecting...");
            setTimeout(() => navigate("/Dashboard"), 2000);
        }
    };

    const loadUsers = async () => {
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

        // Filter by role
        if (roleFilter !== "all") {
            filtered = filtered.filter(user =>
                (user.role || ROLES.USER) === roleFilter
            );
        }

        setFilteredUsers(filtered);
    };

    const updateUserTier = async (userId, newTier) => {
        setError("");
        setSuccess("");
        try {
            await base44.entities.User.update(userId, { subscription_tier: newTier });

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

    const updateUserRole = async (userId, newRole) => {
        setError("");
        setSuccess("");

        // Super Admin check for role changes
        if (newRole === ROLES.SUPER_ADMIN && !isSuperAdmin(currentUser)) {
            setError("Only Super Admins can assign Super Admin role");
            return;
        }

        try {
            await base44.entities.User.update(userId, { role: newRole });

            setUsers(prevUsers =>
                prevUsers.map(user =>
                    user.id === userId ? { ...user, role: newRole } : user
                )
            );

            setSuccess(`User role updated to ${getRoleDisplayName(newRole)} successfully!`);
            setTimeout(() => setSuccess(""), 3000);
        } catch (e) {
            console.error("Error updating user role:", e);
            setError(`Failed to update user role: ${e.message}`);
        }
    };

    const getTierBadge = (tier) => {
        const t = tier || TIERS.FREE;
        const colors = {
            [TIERS.FREE]: "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300",
            [TIERS.PRO]: "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/50 dark:text-blue-300",
            [TIERS.PREMIUM]: "bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-900/50 dark:text-purple-300",
            [TIERS.ENTERPRISE]: "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/50 dark:text-amber-300"
        };

        return (
            <Badge variant="outline" className={`${colors[t]} font-semibold`}>
                {t.toUpperCase()}
            </Badge>
        );
    };

    const getRoleBadge = (role) => {
        const r = role || ROLES.USER;
        const colors = {
            [ROLES.USER]: "bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-300",
            [ROLES.ADMIN]: "bg-indigo-100 text-indigo-700 border-indigo-300 dark:bg-indigo-900/50 dark:text-indigo-300",
            [ROLES.SUPER_ADMIN]: "bg-red-100 text-red-700 border-red-300 dark:bg-red-900/50 dark:text-red-300"
        };

        return (
            <Badge variant="outline" className={`${colors[r]} font-semibold`}>
                <Shield className="w-3 h-3 mr-1" />
                {getRoleDisplayName(r)}
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

    const getRoleStats = () => {
        const stats = {
            [ROLES.USER]: 0,
            [ROLES.ADMIN]: 0,
            [ROLES.SUPER_ADMIN]: 0
        };

        users.forEach(user => {
            const role = user.role || ROLES.USER;
            stats[role] = (stats[role] || 0) + 1;
        });

        return stats;
    };

    const getRevenueEstimate = () => {
        let monthlyRevenue = 0;
        users.forEach(user => {
            const tier = user.subscription_tier || TIERS.FREE;
            if (tier === TIERS.PRO) {
                monthlyRevenue += PRICING.pro.price * 4.33; // weeks per month
            } else if (tier === TIERS.PREMIUM) {
                monthlyRevenue += PRICING.premium.price * 4.33;
            }
        });
        return monthlyRevenue.toFixed(2);
    };

    const exportToCSV = () => {
        const csvData = filteredUsers.map(user => ({
            Email: user.email,
            Name: user.full_name || "",
            Tier: user.subscription_tier || TIERS.FREE,
            Role: user.role || ROLES.USER,
            CreatedAt: user.created_at || ""
        }));

        const headers = Object.keys(csvData[0]).join(",");
        const rows = csvData.map(row => Object.values(row).join(",")).join("\n");
        const csv = `${headers}\n${rows}`;

        const blob = new Blob([csv], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `users-export-${new Date().toISOString().split("T")[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);

        setSuccess("Users exported to CSV successfully!");
        setTimeout(() => setSuccess(""), 3000);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen p-6 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600 dark:text-blue-400 mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading admin dashboard...</p>
                </div>
            </div>
        );
    }

    // Access denied screen
    if (error && !currentUser) {
        return (
            <div className="min-h-screen p-6 flex items-center justify-center">
                <Alert variant="destructive" className="max-w-md">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            </div>
        );
    }

    const tierStats = getTierStats();
    const roleStats = getRoleStats();
    const revenue = getRevenueEstimate();

    return (
        <div className="min-h-screen p-4 md:p-8 bg-gray-50 dark:bg-background">
            <div className="max-w-7xl mx-auto space-y-6">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium mb-4">
                                <Shield className="w-4 h-4" />
                                Admin Dashboard
                            </div>
                            <h1 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-slate-100 mb-2">
                                User Management
                            </h1>
                            <p className="text-lg text-slate-600 dark:text-slate-400">
                                Manage users, roles, and subscription tiers
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            {isSuperAdmin(currentUser) && (
                                <Button
                                    variant="outline"
                                    className="gap-2"
                                    onClick={() => navigate(createPageUrl("ONetImport"))}
                                >
                                    <Upload className="w-4 h-4" />
                                    O*NET Import
                                </Button>
                            )}
                            {getRoleBadge(currentUser?.role)}
                        </div>
                    </div>
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

                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full max-w-md grid-cols-2">
                        <TabsTrigger value="users" className="flex items-center gap-2">
                            <UsersIcon className="w-4 h-4" />
                            Users
                        </TabsTrigger>
                        <TabsTrigger value="analytics" className="flex items-center gap-2">
                            <BarChart3 className="w-4 h-4" />
                            Analytics
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="users" className="space-y-6">
                        {/* Stats Cards */}
                        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                            <Card className="border-0 shadow-lg bg-gradient-to-br from-slate-500 to-slate-600 text-white">
                                <CardContent className="p-4">
                                    <div className="text-2xl font-bold">{tierStats[TIERS.FREE]}</div>
                                    <div className="text-sm opacity-90">Free Users</div>
                                </CardContent>
                            </Card>
                            <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-cyan-600 text-white">
                                <CardContent className="p-4">
                                    <div className="text-2xl font-bold">{tierStats[TIERS.PRO]}</div>
                                    <div className="text-sm opacity-90">Pro Users</div>
                                </CardContent>
                            </Card>
                            <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500 to-pink-600 text-white">
                                <CardContent className="p-4">
                                    <div className="text-2xl font-bold">{tierStats[TIERS.PREMIUM]}</div>
                                    <div className="text-sm opacity-90">Premium Users</div>
                                </CardContent>
                            </Card>
                            <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-500 to-orange-600 text-white">
                                <CardContent className="p-4">
                                    <div className="text-2xl font-bold">{tierStats[TIERS.ENTERPRISE]}</div>
                                    <div className="text-sm opacity-90">Enterprise</div>
                                </CardContent>
                            </Card>
                            <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500 to-emerald-600 text-white">
                                <CardContent className="p-4">
                                    <div className="text-2xl font-bold">{users.length}</div>
                                    <div className="text-sm opacity-90">Total Users</div>
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
                                    <div className="md:w-48">
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
                                    <div className="md:w-48">
                                        <Select value={roleFilter} onValueChange={setRoleFilter}>
                                            <SelectTrigger>
                                                <Shield className="w-4 h-4 mr-2" />
                                                <SelectValue placeholder="Filter by role" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Roles</SelectItem>
                                                <SelectItem value={ROLES.USER}>Users Only</SelectItem>
                                                <SelectItem value={ROLES.ADMIN}>Admins Only</SelectItem>
                                                <SelectItem value={ROLES.SUPER_ADMIN}>Super Admins</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <Button onClick={exportToCSV} variant="outline" className="gap-2">
                                        <Download className="w-4 h-4" />
                                        Export CSV
                                    </Button>
                                    <Button onClick={loadUsers} variant="outline" size="icon">
                                        <RefreshCw className="w-4 h-4" />
                                    </Button>
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
                                                    Role
                                                </th>
                                                <th className="text-left p-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
                                                    Tier
                                                </th>
                                                <th className="text-left p-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
                                                    Limits
                                                </th>
                                                <th className="text-left p-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredUsers.length === 0 ? (
                                                <tr>
                                                    <td colSpan="6" className="text-center p-8 text-slate-500 dark:text-slate-400">
                                                        No users found
                                                    </td>
                                                </tr>
                                            ) : (
                                                filteredUsers.map((user) => {
                                                    const tier = user.subscription_tier || TIERS.FREE;
                                                    const role = user.role || ROLES.USER;
                                                    const limits = TIER_LIMITS[tier];

                                                    return (
                                                        <tr
                                                            key={user.id}
                                                            className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
                                                        >
                                                            <td className="p-3 text-sm text-slate-800 dark:text-slate-200">
                                                                {user.email}
                                                                {user.id === currentUser?.id && (
                                                                    <Badge variant="outline" className="ml-2 text-xs">You</Badge>
                                                                )}
                                                            </td>
                                                            <td className="p-3 text-sm text-slate-600 dark:text-slate-400">
                                                                {user.full_name || "—"}
                                                            </td>
                                                            <td className="p-3">
                                                                <Select
                                                                    value={role}
                                                                    onValueChange={(newRole) => updateUserRole(user.id, newRole)}
                                                                    disabled={user.id === currentUser?.id}
                                                                >
                                                                    <SelectTrigger className="w-40">
                                                                        <SelectValue />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value={ROLES.USER}>
                                                                            User
                                                                        </SelectItem>
                                                                        <SelectItem value={ROLES.ADMIN}>
                                                                            Admin
                                                                        </SelectItem>
                                                                        {isSuperAdmin(currentUser) && (
                                                                            <SelectItem value={ROLES.SUPER_ADMIN}>
                                                                                Super Admin
                                                                            </SelectItem>
                                                                        )}
                                                                    </SelectContent>
                                                                </Select>
                                                            </td>
                                                            <td className="p-3">
                                                                {getTierBadge(tier)}
                                                            </td>
                                                            <td className="p-3">
                                                                <div className="text-xs text-slate-600 dark:text-slate-400 space-y-0.5">
                                                                    <div>Resumes: {limits.max_resumes === -1 ? "∞" : limits.max_resumes}</div>
                                                                    <div>Opt: {limits.resume_optimizations_per_week === -1 ? "∞" : `${limits.resume_optimizations_per_week}/wk`}</div>
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
                    </TabsContent>

                    <TabsContent value="analytics" className="space-y-6">
                        {/* Revenue & Analytics */}
                        <div className="grid md:grid-cols-3 gap-6">
                            <Card className="border-0 shadow-lg">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <TrendingUp className="w-5 h-5 text-green-600" />
                                        Est. Monthly Revenue
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                                        ${revenue}
                                    </div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                        From paid subscriptions
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="border-0 shadow-lg">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <Activity className="w-5 h-5 text-blue-600" />
                                        Conversion Rate
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                                        {users.length > 0
                                            ? (((users.length - tierStats[TIERS.FREE]) / users.length) * 100).toFixed(1)
                                            : 0}%
                                    </div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                        Free to paid conversion
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="border-0 shadow-lg">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <Calendar className="w-5 h-5 text-purple-600" />
                                        Active Users
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                                        {users.length}
                                    </div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                        Total registered users
                                    </p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Role Distribution */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Shield className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                    Role Distribution
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid md:grid-cols-3 gap-4">
                                    <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Users</span>
                                            <Badge variant="outline">{roleStats[ROLES.USER]}</Badge>
                                        </div>
                                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                            <div
                                                className="bg-gray-600 h-2 rounded-full"
                                                style={{ width: `${(roleStats[ROLES.USER] / users.length) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                    <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300">Admins</span>
                                            <Badge variant="outline" className="bg-indigo-100 dark:bg-indigo-900/50">{roleStats[ROLES.ADMIN]}</Badge>
                                        </div>
                                        <div className="w-full bg-indigo-200 dark:bg-indigo-900/30 rounded-full h-2">
                                            <div
                                                className="bg-indigo-600 h-2 rounded-full"
                                                style={{ width: `${(roleStats[ROLES.ADMIN] / users.length) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                    <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-medium text-red-700 dark:text-red-300">Super Admins</span>
                                            <Badge variant="outline" className="bg-red-100 dark:bg-red-900/50">{roleStats[ROLES.SUPER_ADMIN]}</Badge>
                                        </div>
                                        <div className="w-full bg-red-200 dark:bg-red-900/30 rounded-full h-2">
                                            <div
                                                className="bg-red-600 h-2 rounded-full"
                                                style={{ width: `${(roleStats[ROLES.SUPER_ADMIN] / users.length) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Tier Reference */}
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
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
