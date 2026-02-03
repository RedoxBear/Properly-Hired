import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Users, Settings, CheckCircle2, Lock } from "lucide-react";
import { ROLES, getRoleDisplayName, isAdmin, isSuperAdmin } from "@/components/utils/accessControl";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function RBACInfoCard({ user }) {
    if (!user) return null;

    const userRole = user.role || ROLES.USER;
    const isUserAdmin = isAdmin(user);
    const isUserSuperAdmin = isSuperAdmin(user);

    const roleConfig = {
        [ROLES.USER]: {
            color: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
            icon: Users,
            iconColor: "text-slate-600 dark:text-slate-400",
            permissions: [
                "Access all core features",
                "Manage your own resumes",
                "Track your applications",
                "Use AI optimization tools"
            ]
        },
        [ROLES.ADMIN]: {
            color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300",
            icon: Shield,
            iconColor: "text-indigo-600 dark:text-indigo-400",
            permissions: [
                "All User permissions",
                "Access admin dashboard",
                "Manage user accounts",
                "Assign User & Admin roles",
                "Change subscription tiers"
            ]
        },
        [ROLES.SUPER_ADMIN]: {
            color: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
            icon: Shield,
            iconColor: "text-red-600 dark:text-red-400",
            permissions: [
                "All Admin permissions",
                "Full system access",
                "Assign Super Admin role",
                "Access all analytics",
                "Platform-wide control"
            ]
        }
    };

    const config = roleConfig[userRole] || roleConfig[ROLES.USER];
    const RoleIcon = config.icon;

    return (
        <Card className="shadow-lg border-0 bg-card/90 backdrop-blur-sm">
            <CardHeader>
                <CardTitle className="flex items-center justify-between gap-2 text-base sm:text-lg">
                    <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-lg ${config.color}`}>
                            <RoleIcon className={`w-4 h-4 sm:w-5 sm:h-5 ${config.iconColor}`} />
                        </div>
                        <span className="text-foreground">Your Access Level</span>
                    </div>
                    <Badge className={config.color}>
                        {getRoleDisplayName(userRole)}
                    </Badge>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Permissions List */}
                <div>
                    <h4 className="text-sm font-semibold text-muted-foreground mb-2">Permissions:</h4>
                    <div className="space-y-2">
                        {config.permissions.map((permission, index) => (
                            <div key={index} className="flex items-start gap-2 text-sm">
                                <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                                <span className="text-foreground">{permission}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Admin Quick Access */}
                {isUserAdmin && (
                    <div className="pt-3 border-t border-border">
                        <Link to={createPageUrl("Users")}>
                            <div className="flex items-center justify-between p-3 rounded-lg bg-muted hover:bg-accent transition-colors cursor-pointer">
                                <div className="flex items-center gap-2">
                                    <Settings className="w-4 h-4 text-muted-foreground" />
                                    <span className="text-sm font-medium text-foreground">Admin Dashboard</span>
                                </div>
                                <Badge variant="outline" className="text-xs">
                                    {isUserSuperAdmin ? "Super Admin" : "Admin"}
                                </Badge>
                            </div>
                        </Link>
                    </div>
                )}

                {/* Role Hierarchy Info */}
                {userRole === ROLES.USER && (
                    <div className="pt-3 border-t border-border">
                        <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
                            <Lock className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="text-xs text-muted-foreground">
                                    Need more access? Contact your administrator to request role changes.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}