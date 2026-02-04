import React from "react";
import { base44 } from "@/api/base44Client";
import { JobApplication } from "@/entities/JobApplication";
import { Resume } from "@/entities/Resume";
import { hasAccess, TIERS } from "@/components/utils/accessControl";
import UpgradePrompt from "@/components/subscription/UpgradePrompt";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import {
    Plus,
    Search,
    Briefcase,
    Star,
    Edit,
    Trash2,
    ExternalLink,
    CheckCircle,
    XCircle,
    Calendar as CalendarIcon,
    FileText,
    MessageSquare,
    Users,
    Sparkles,
    Building2,
    ChevronDown,
    ChevronUp
} from "lucide-react";
import { motion } from "framer-motion";
import CompanyResearchDisplay from "@/components/company/CompanyResearchDisplay";

export default function ApplicationTracker() {
    const [currentUser, setCurrentUser] = React.useState(null);
    const [isLoadingUser, setIsLoadingUser] = React.useState(true);
    const [applications, setApplications] = React.useState([]);
    const [resumes, setResumes] = React.useState([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [searchTerm, setSearchTerm] = React.useState("");
    const [statusFilter, setStatusFilter] = React.useState("all");
    const [showAddDialog, setShowAddDialog] = React.useState(false);
    const [editingApp, setEditingApp] = React.useState(null);
    const [formData, setFormData] = React.useState({
        company_name: "",
        job_title: "",
        job_posting_url: "",
        job_description: "",
        application_status: "applied",
        interview_status: "active",
        is_rejected: false,
        user_rating: 0,
        date_applied: "",
        notes: "",
        optimized_resume_id: ""
    });
    const [saving, setSaving] = React.useState(false);
    const [error, setError] = React.useState("");
    const [selectedIds, setSelectedIds] = React.useState([]);
    const [expandedApp, setExpandedApp] = React.useState(null);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [apps, resumeList] = await Promise.all([
                JobApplication.list("-created_date"),
                Resume.list("-created_date", 100)
            ]);
            setApplications(apps);
            setResumes(resumeList);
        } catch (e) {
            console.error("Error loading data:", e);
            setError("Failed to load applications");
        }
        setIsLoading(false);
    };

    // Load user for feature access check
    React.useEffect(() => {
        (async () => {
            try {
                const user = await base44.auth.me();
                setCurrentUser(user);
            } catch (e) {
                console.warn("Failed to load user:", e);
            } finally {
                setIsLoadingUser(false);
            }
        })();
    }, []);

    React.useEffect(() => {
        loadData();
    }, []);

    // Show loading while checking user access
    if (isLoadingUser) {
        return (
            <div className="min-h-screen p-4 md:p-8 flex items-center justify-center">
                <div className="flex items-center gap-3 text-slate-600">
                    <Sparkles className="w-5 h-5 animate-spin" />
                    <span>Loading...</span>
                </div>
            </div>
        );
    }

    // Feature gate - require Pro or higher
    if (!hasAccess(currentUser, "app_tracker")) {
        return (
            <div className="min-h-screen p-4 md:p-8 flex items-center justify-center">
                <UpgradePrompt
                    feature="app_tracker"
                    currentTier={currentUser?.subscription_tier || TIERS.FREE}
                    variant="card"
                />
            </div>
        );
    }

    const statusConfig = {
        applied: { color: "bg-blue-100 text-blue-800", label: "Applied", icon: FileText },
        first_interview: { color: "bg-purple-100 text-purple-800", label: "1st Interview", icon: MessageSquare },
        second_interview: { color: "bg-purple-100 text-purple-800", label: "2nd Interview", icon: MessageSquare },
        final_interview: { color: "bg-purple-100 text-purple-800", label: "Final Interview", icon: Users },
        hired: { color: "bg-green-100 text-green-800", label: "Hired", icon: CheckCircle },
        rejected: { color: "bg-red-100 text-red-800", label: "Rejected", icon: XCircle }
    };

    const resetForm = () => {
        setFormData({
            company_name: "",
            job_title: "",
            job_posting_url: "",
            job_description: "",
            application_status: "applied",
            interview_status: "active",
            is_rejected: false,
            user_rating: 0,
            date_applied: "",
            notes: "",
            optimized_resume_id: ""
        });
        setEditingApp(null);
    };

    const openAddDialog = () => {
        resetForm();
        setShowAddDialog(true);
    };

    const openEditDialog = (app) => {
        setEditingApp(app);
        setFormData({
            company_name: app.company_name || "",
            job_title: app.job_title || "",
            job_posting_url: app.job_posting_url || "",
            job_description: app.job_description || "",
            application_status: app.application_status || "applied",
            interview_status: app.interview_status || "",
            is_rejected: app.is_rejected || false,
            user_rating: app.user_rating || 0,
            date_applied: app.applied_at ? format(new Date(app.applied_at), "yyyy-MM-dd") : "",
            notes: app.summary?.notes || "",
            optimized_resume_id: app.optimized_resume_id || ""
        });
        setShowAddDialog(true);
    };

    const handleSave = async () => {
        if (!formData.company_name || !formData.job_title) {
            setError("Company name and job title are required");
            return;
        }

        setSaving(true);
        setError("");

        try {
            const payload = {
                company_name: formData.company_name,
                job_title: formData.job_title,
                job_posting_url: formData.job_posting_url || "",
                job_description: formData.job_description || "",
                application_status: formData.application_status,
                interview_status: formData.interview_status,
                is_rejected: formData.is_rejected,
                user_rating: formData.user_rating || null,
                optimized_resume_id: formData.optimized_resume_id || null,
                applied: true,
                applied_at: formData.date_applied ? new Date(formData.date_applied).toISOString() : new Date().toISOString(),
                summary: {
                    ...(editingApp?.summary || {}),
                    notes: formData.notes
                }
            };

            if (editingApp) {
                await JobApplication.update(editingApp.id, payload);
                // Update the application in the local state without reloading
                setApplications(prev => prev.map(app => app.id === editingApp.id ? { ...app, ...payload } : app));
            } else {
                const newApp = await JobApplication.create(payload);
                // Add the new application to the local state without reloading
                setApplications(prev => [newApp, ...prev]);
            }

            setShowAddDialog(false);
            resetForm();
        } catch (e) {
            console.error("Error saving application:", e);
            setError("Failed to save application");
        }

        setSaving(false);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this application? This cannot be undone.")) return;
        try {
            await JobApplication.delete(id);
            setSelectedIds(prev => prev.filter(x => x !== id));
            await loadData();
        } catch (e) {
            console.error("Error deleting:", e);
            setError("Failed to delete application");
        }
    };

    const bulkDelete = async () => {
        if (!selectedIds.length) return;
        if (!window.confirm(`Delete ${selectedIds.length} application(s)? This cannot be undone.`)) return;
        try {
            await Promise.all(selectedIds.map(id => JobApplication.delete(id)));
            setSelectedIds([]);
            await loadData();
        } catch (e) {
            console.error("Error bulk deleting:", e);
            setError("Failed to delete applications");
        }
    };

    const updateStatus = async (app, field, value) => {
        // Store original value for rollback
        const originalValue = app[field];

        try {
            // First, update the API
            await JobApplication.update(app.id, { [field]: value });

            // Only update state AFTER successful API call
            setApplications(prev => prev.map(a =>
                a.id === app.id ? { ...a, [field]: value } : a
            ));

            setError(""); // Clear any previous errors
        } catch (e) {
            console.error("Error updating status:", e);
            setError(`Failed to update status. Changes reverted.`);

            // Rollback: revert to original value
            setApplications(prev => prev.map(a =>
                a.id === app.id ? { ...a, [field]: originalValue } : a
            ));
        }
    };

    const updateRating = async (app, rating) => {
        try {
            await JobApplication.update(app.id, { user_rating: rating });
            await loadData();
        } catch (e) {
            console.error("Error updating rating:", e);
        }
    };

    const toggleSelected = (id) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const filteredApplications = applications.filter(app => {
        const matchesSearch = 
            app.job_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            app.company_name?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === "all" || app.application_status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const stats = {
        all: applications.length,
        rejected: applications.filter(a => a.is_rejected || a.application_status === "rejected").length,
        applied: applications.filter(a => a.application_status === "applied").length,
        interview: applications.filter(a => ["first_interview", "second_interview", "final_interview"].includes(a.application_status)).length,
        hired: applications.filter(a => a.application_status === "hired").length
    };

    const StarRating = ({ rating, onRate, readOnly = false }) => {
        return (
            <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map(star => (
                    <button
                        key={star}
                        onClick={() => !readOnly && onRate(star)}
                        disabled={readOnly}
                        className={`${readOnly ? 'cursor-default' : 'cursor-pointer hover:scale-110'} transition-transform`}
                    >
                        <Star 
                            className={`w-4 h-4 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                        />
                    </button>
                ))}
            </div>
        );
    };

    return (
        <div className="min-h-screen p-4 md:p-8 bg-gray-50">
            <div className="max-w-[1400px] mx-auto space-y-6">
                {/* Header with Stats */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="flex flex-wrap gap-4 mb-6">
                        <button className="flex flex-col items-center px-4 py-2 bg-white rounded-lg border hover:bg-gray-50">
                            <div className="text-2xl font-bold text-slate-800">{stats.all}</div>
                            <div className="text-xs text-slate-600">All</div>
                        </button>
                        <button 
                            className="flex flex-col items-center px-4 py-2 bg-white rounded-lg border hover:bg-gray-50"
                            onClick={() => setStatusFilter("rejected")}
                        >
                            <div className="flex items-center gap-1">
                                <XCircle className="w-4 h-4 text-red-600" />
                                <div className="text-2xl font-bold text-slate-800">{stats.rejected}</div>
                            </div>
                            <div className="text-xs text-slate-600">Rejected</div>
                        </button>
                        <button 
                            className="flex flex-col items-center px-4 py-2 bg-white rounded-lg border hover:bg-gray-50"
                            onClick={() => setStatusFilter("applied")}
                        >
                            <div className="flex items-center gap-1">
                                <FileText className="w-4 h-4 text-blue-600" />
                                <div className="text-2xl font-bold text-slate-800">{stats.applied}</div>
                            </div>
                            <div className="text-xs text-slate-600">Applied</div>
                        </button>
                        <button 
                            className="flex flex-col items-center px-4 py-2 bg-white rounded-lg border hover:bg-gray-50"
                            onClick={() => setStatusFilter("all")}
                        >
                            <div className="flex items-center gap-1">
                                <MessageSquare className="w-4 h-4 text-purple-600" />
                                <div className="text-2xl font-bold text-slate-800">{stats.interview}</div>
                            </div>
                            <div className="text-xs text-slate-600">Interview</div>
                        </button>
                        <button 
                            className="flex flex-col items-center px-4 py-2 bg-white rounded-lg border hover:bg-gray-50"
                            onClick={() => setStatusFilter("hired")}
                        >
                            <div className="flex items-center gap-1">
                                <CheckCircle className="w-4 h-4 text-green-600" />
                                <div className="text-2xl font-bold text-slate-800">{stats.hired}</div>
                            </div>
                            <div className="text-xs text-slate-600">Hired</div>
                        </button>
                    </div>
                </motion.div>

                {error && (
                    <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {/* Search & Add */}
                <Card>
                    <CardContent className="p-4">
                        <div className="flex gap-4">
                            <div className="relative flex-1">
                                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                                <Input
                                    placeholder="Search applications..."
                                    className="pl-10"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Filter by status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Statuses</SelectItem>
                                    {Object.entries(statusConfig).map(([key, config]) => (
                                        <SelectItem key={key} value={key}>{config.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                                <DialogTrigger asChild>
                                    <Button onClick={openAddDialog} className="bg-blue-600 hover:bg-blue-700">
                                        <Plus className="w-4 h-4 mr-2" />
                                        Add Application
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white border-slate-200">
                                    <DialogHeader>
                                        <DialogTitle>
                                            {editingApp ? "Edit Application" : "Add New Application"}
                                        </DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4 py-4">
                                        <div className="grid md:grid-cols-2 gap-4">
                                            <div>
                                                <Label>Company Name *</Label>
                                                <Input
                                                    value={formData.company_name}
                                                    onChange={(e) => setFormData({...formData, company_name: e.target.value})}
                                                    placeholder="e.g. Google"
                                                />
                                            </div>
                                            <div>
                                                <Label>Job Title *</Label>
                                                <Input
                                                    value={formData.job_title}
                                                    onChange={(e) => setFormData({...formData, job_title: e.target.value})}
                                                    placeholder="e.g. Senior Engineer"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <Label>Job Posting URL</Label>
                                            <Input
                                                value={formData.job_posting_url}
                                                onChange={(e) => setFormData({...formData, job_posting_url: e.target.value})}
                                                placeholder="https://..."
                                            />
                                        </div>
                                        <div>
                                            <Label>Job Description</Label>
                                            <Textarea
                                                value={formData.job_description}
                                                onChange={(e) => setFormData({...formData, job_description: e.target.value})}
                                                placeholder="Paste the full job description..."
                                                className="min-h-[100px]"
                                            />
                                        </div>
                                        <div className="grid md:grid-cols-3 gap-4">
                                            <div>
                                                <Label>Stage</Label>
                                                <Select 
                                                    value={formData.application_status} 
                                                    onValueChange={(val) => setFormData({...formData, application_status: val})}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {Object.entries(statusConfig).map(([key, config]) => (
                                                            <SelectItem key={key} value={key}>{config.label}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div>
                                                <Label>Interview Status</Label>
                                                <Select 
                                                    value={formData.interview_status || ""} 
                                                    onValueChange={(val) => setFormData({...formData, interview_status: val || null})}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value={null}>—</SelectItem>
                                                        <SelectItem value="active">Active</SelectItem>
                                                        <SelectItem value="inactive">Inactive</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div>
                                                <Label>Rejected</Label>
                                                <Select 
                                                    value={formData.is_rejected ? "yes" : "no"} 
                                                    onValueChange={(val) => setFormData({...formData, is_rejected: val === "yes"})}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="no">No</SelectItem>
                                                        <SelectItem value="yes">Yes</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                        <div className="grid md:grid-cols-2 gap-4">
                                            <div>
                                                <Label>Date Applied</Label>
                                                <Input
                                                    type="date"
                                                    value={formData.date_applied}
                                                    onChange={(e) => setFormData({...formData, date_applied: e.target.value})}
                                                />
                                            </div>
                                            <div>
                                                <Label>Your Rating</Label>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <StarRating 
                                                        rating={formData.user_rating} 
                                                        onRate={(r) => setFormData({...formData, user_rating: r})}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <Label>Linked Resume</Label>
                                            <Select 
                                                value={formData.optimized_resume_id} 
                                                onValueChange={(val) => setFormData({...formData, optimized_resume_id: val})}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select resume..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value={null}>None</SelectItem>
                                                    {resumes.map(r => (
                                                        <SelectItem key={r.id} value={r.id}>
                                                            {r.version_name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div>
                                            <Label>Notes</Label>
                                            <Textarea
                                                value={formData.notes}
                                                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                                                placeholder="Add any notes..."
                                                className="min-h-[80px]"
                                            />
                                        </div>
                                        <div className="flex gap-3 pt-4">
                                            <Button 
                                                onClick={handleSave} 
                                                disabled={saving}
                                                className="flex-1 bg-blue-600 hover:bg-blue-700"
                                            >
                                                {saving ? "Saving..." : (editingApp ? "Update" : "Create")}
                                            </Button>
                                            <Button 
                                                variant="outline" 
                                                onClick={() => setShowAddDialog(false)}
                                                disabled={saving}
                                            >
                                                Cancel
                                            </Button>
                                        </div>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </CardContent>
                </Card>

                {/* Bulk Actions */}
                {selectedIds.length > 0 && (
                    <Card className="bg-blue-50 border-blue-200">
                        <CardContent className="p-4 flex items-center justify-between">
                            <span className="font-medium text-blue-900">
                                {selectedIds.length} selected
                            </span>
                            <div className="flex gap-2">
                                <Button variant="destructive" size="sm" onClick={bulkDelete}>
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => setSelectedIds([])}>
                                    Clear
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Table */}
                {isLoading ? (
                    <div className="text-center py-12 text-slate-600">Loading...</div>
                ) : filteredApplications.length === 0 ? (
                    <Card>
                        <CardContent className="py-16 text-center">
                            <Briefcase className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                            <h3 className="text-xl font-medium text-slate-600 mb-2">No applications yet</h3>
                            <p className="text-slate-500 mb-6">Start tracking your job applications!</p>
                            <Button onClick={openAddDialog} className="bg-blue-600 hover:bg-blue-700">
                                <Plus className="w-4 h-4 mr-2" />
                                Add First Application
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <Card>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 border-b">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-10">
                                                <Checkbox
                                                    checked={selectedIds.length === filteredApplications.length}
                                                    onCheckedChange={(checked) => {
                                                        if (checked) {
                                                            setSelectedIds(filteredApplications.map(a => a.id));
                                                        } else {
                                                            setSelectedIds([]);
                                                        }
                                                    }}
                                                />
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                Application Name
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                Applied
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                Stage
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                Interview Status
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                Rejected?
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                Your Rating
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-24">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {filteredApplications.map(app => {
                                            const StatusIcon = statusConfig[app.application_status]?.icon;
                                            const isExpanded = expandedApp === app.id;
                                            return (
                                                <React.Fragment key={app.id}>
                                                    <motion.tr 
                                                        initial={{ opacity: 0 }} 
                                                        animate={{ opacity: 1 }}
                                                        className="hover:bg-gray-50"
                                                    >
                                                        <td className="px-4 py-3">
                                                            <Checkbox
                                                                checked={selectedIds.includes(app.id)}
                                                                onCheckedChange={() => toggleSelected(app.id)}
                                                            />
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center gap-2">
                                                                <button
                                                                    onClick={() => setExpandedApp(isExpanded ? null : app.id)}
                                                                    className="text-slate-400 hover:text-slate-600"
                                                                >
                                                                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                                </button>
                                                                <div>
                                                                    <div className="font-medium text-slate-800">{app.job_title}</div>
                                                                    <div className="text-sm text-slate-500 flex items-center gap-1">
                                                                        <Building2 className="w-3 h-3" />
                                                                        {app.company_name}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                    <td className="px-4 py-3">
                                                        <Popover>
                                                            <PopoverTrigger asChild>
                                                                <Button variant="outline" className="h-8 text-xs w-32 justify-start font-normal">
                                                                    <CalendarIcon className="mr-2 h-3 w-3" />
                                                                    {app.applied_at ? format(new Date(app.applied_at), "d MMM yyyy") : "Select date"}
                                                                </Button>
                                                            </PopoverTrigger>
                                                            <PopoverContent className="w-auto p-0" align="start">
                                                                <Calendar
                                                                    mode="single"
                                                                    selected={app.applied_at ? new Date(app.applied_at) : undefined}
                                                                    onSelect={(date) => updateStatus(app, "applied_at", date ? date.toISOString() : null)}
                                                                    initialFocus
                                                                />
                                                            </PopoverContent>
                                                        </Popover>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <Select 
                                                            value={app.application_status} 
                                                            onValueChange={(val) => updateStatus(app, "application_status", val)}
                                                        >
                                                            <SelectTrigger className="h-8 text-xs">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {Object.entries(statusConfig).map(([key, config]) => (
                                                                    <SelectItem key={key} value={key}>
                                                                        <div className="flex items-center gap-2">
                                                                            {config.icon && <config.icon className="w-3 h-3" />}
                                                                            {config.label}
                                                                        </div>
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <Select 
                                                            value={app.interview_status || ""} 
                                                            onValueChange={(val) => updateStatus(app, "interview_status", val || null)}
                                                        >
                                                            <SelectTrigger className="h-8 text-xs w-28">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value={null}>—</SelectItem>
                                                                <SelectItem value="active">Active</SelectItem>
                                                                <SelectItem value="inactive">Inactive</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <Select 
                                                            value={app.is_rejected ? "yes" : "no"} 
                                                            onValueChange={(val) => updateStatus(app, "is_rejected", val === "yes")}
                                                        >
                                                            <SelectTrigger className="h-8 text-xs w-20">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="no">No</SelectItem>
                                                                <SelectItem value="yes">Yes</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <StarRating 
                                                            rating={app.user_rating || 0} 
                                                            onRate={(r) => updateRating(app, r)}
                                                        />
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex gap-1">
                                                            <Button 
                                                                size="sm" 
                                                                variant="ghost"
                                                                onClick={() => openEditDialog(app)}
                                                                className="h-8 w-8 p-0"
                                                            >
                                                                <Edit className="w-4 h-4" />
                                                            </Button>
                                                            {app.job_posting_url && (
                                                                <a href={app.job_posting_url} target="_blank" rel="noopener noreferrer">
                                                                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                                                                        <ExternalLink className="w-4 h-4" />
                                                                    </Button>
                                                                </a>
                                                            )}
                                                            <Link to={createPageUrl(`JobSummary?id=${app.id}`)}>
                                                                <Button 
                                                                    size="sm" 
                                                                    variant="ghost"
                                                                    title="View Job Analysis"
                                                                    className="h-8 w-8 p-0"
                                                                >
                                                                    <Search className="w-4 h-4" />
                                                                </Button>
                                                            </Link>
                                                            <Link to={createPageUrl(`ResumeOptimizer?id=${app.id}`)}>
                                                                <Button 
                                                                    size="sm" 
                                                                    variant="ghost"
                                                                    title="Optimize Resume"
                                                                    className="h-8 w-8 p-0"
                                                                >
                                                                    <Sparkles className="w-4 h-4" />
                                                                </Button>
                                                            </Link>
                                                            <Button 
                                                                size="sm" 
                                                                variant="ghost"
                                                                onClick={() => handleDelete(app.id)}
                                                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </motion.tr>
                                                {isExpanded && (
                                                    <tr>
                                                        <td colSpan="8" className="px-4 py-4 bg-slate-50">
                                                            <CompanyResearchDisplay 
                                                                company={app.company_name} 
                                                                jobApplication={app}
                                                            />
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                            );
                                            })}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
