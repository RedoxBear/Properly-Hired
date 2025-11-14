import React, { useState, useEffect } from "react";
import { JobApplication } from "@/entities/JobApplication";
import { Resume } from "@/entities/Resume";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format, formatDistanceToNow, addDays, isBefore } from "date-fns";
import {
    Plus,
    Clock,
    Search,
    Briefcase,
    Building,
    Calendar,
    FileText,
    Bell,
    Edit,
    Trash2,
    ExternalLink,
    CheckCircle2,
    AlertCircle,
    Target,
    Filter
} from "lucide-react";
import { motion } from "framer-motion";
import FollowUpList from "@/components/followups/FollowUpList";

export default function ApplicationTracker() {
    const [applications, setApplications] = useState([]);
    const [resumes, setResumes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [editingApp, setEditingApp] = useState(null);
    const [formData, setFormData] = useState({
        company_name: "",
        job_title: "",
        job_posting_url: "",
        job_description: "",
        application_status: "ready",
        date_applied: "",
        follow_up_date: "",
        notes: "",
        optimized_resume_id: ""
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [selectedIds, setSelectedIds] = useState([]);

    const statusConfig = {
        ready: { color: "bg-yellow-100 text-yellow-800", label: "Not Applied", icon: Clock },
        applied: { color: "bg-blue-100 text-blue-800", label: "Applied", icon: CheckCircle2 },
        interview: { color: "bg-purple-100 text-purple-800", label: "Interview", icon: Calendar },
        offer: { color: "bg-emerald-100 text-emerald-800", label: "Offer", icon: Target },
        rejected: { color: "bg-red-100 text-red-800", label: "Rejected", icon: AlertCircle }
    };

    useEffect(() => {
        loadData();
    }, []);

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

    const resetForm = () => {
        setFormData({
            company_name: "",
            job_title: "",
            job_posting_url: "",
            job_description: "",
            application_status: "ready",
            date_applied: "",
            follow_up_date: "",
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
            application_status: app.application_status || "ready",
            date_applied: app.applied_at ? format(new Date(app.applied_at), "yyyy-MM-dd") : "",
            follow_up_date: app.next_follow_up_at ? format(new Date(app.next_follow_up_at), "yyyy-MM-dd") : "",
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
                optimized_resume_id: formData.optimized_resume_id || null,
                applied: formData.application_status === "applied",
                applied_at: formData.date_applied ? new Date(formData.date_applied).toISOString() : null,
                next_follow_up_at: formData.follow_up_date ? new Date(formData.follow_up_date).toISOString() : null,
                summary: {
                    ...(editingApp?.summary || {}),
                    notes: formData.notes
                }
            };

            if (editingApp) {
                await JobApplication.update(editingApp.id, payload);
            } else {
                await JobApplication.create(payload);
            }

            setShowAddDialog(false);
            resetForm();
            await loadData();
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

    const updateStatus = async (app, newStatus) => {
        try {
            const payload = { application_status: newStatus };
            if (newStatus === "applied" && !app.applied_at) {
                payload.applied = true;
                payload.applied_at = new Date().toISOString();
                // Auto-set follow-up for 3 days from now
                payload.next_follow_up_at = addDays(new Date(), 3).toISOString();
            }
            await JobApplication.update(app.id, payload);
            await loadData();
        } catch (e) {
            console.error("Error updating status:", e);
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

    // Separate applications needing follow-up
    const needsFollowUp = filteredApplications.filter(app => 
        app.next_follow_up_at && isBefore(new Date(app.next_follow_up_at), new Date())
    );

    // Group by status
    const groupedApps = filteredApplications.reduce((acc, app) => {
        const status = app.application_status || "ready";
        if (!acc[status]) acc[status] = [];
        acc[status].push(app);
        return acc;
    }, {});

    const stats = {
        total: applications.length,
        applied: applications.filter(a => a.application_status === "applied").length,
        interview: applications.filter(a => a.application_status === "interview").length,
        offer: applications.filter(a => a.application_status === "offer").length
    };

    return (
        <div className="min-h-screen p-4 md:p-8 bg-gray-50">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-medium mb-4">
                        <Briefcase className="w-4 h-4" />
                        Application Tracking System
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-2">Application Tracker</h1>
                    <p className="text-lg text-slate-600">
                        Manage your job applications, track status updates, and never miss a follow-up.
                    </p>
                </motion.div>

                {error && (
                    <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="bg-white">
                        <CardContent className="p-4">
                            <div className="text-2xl font-bold text-slate-800">{stats.total}</div>
                            <div className="text-sm text-slate-600">Total Applications</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-blue-50 border-blue-200">
                        <CardContent className="p-4">
                            <div className="text-2xl font-bold text-blue-700">{stats.applied}</div>
                            <div className="text-sm text-blue-600">Applied</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-purple-50 border-purple-200">
                        <CardContent className="p-4">
                            <div className="text-2xl font-bold text-purple-700">{stats.interview}</div>
                            <div className="text-sm text-purple-600">Interviews</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-emerald-50 border-emerald-200">
                        <CardContent className="p-4">
                            <div className="text-2xl font-bold text-emerald-700">{stats.offer}</div>
                            <div className="text-sm text-emerald-600">Offers</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Follow-up Reminders */}
                {needsFollowUp.length > 0 && (
                    <FollowUpList apps={needsFollowUp} onUpdated={loadData} />
                )}

                {/* Search & Filters */}
                <Card>
                    <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="relative flex-1">
                                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                                <Input
                                    placeholder="Search by company or role..."
                                    className="pl-10"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-full md:w-[180px]">
                                    <Filter className="w-4 h-4 mr-2" />
                                    <SelectValue placeholder="Filter Status" />
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
                                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
                                        <div className="grid md:grid-cols-2 gap-4">
                                            <div>
                                                <Label>Status</Label>
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
                                                <Label>Follow-up Date</Label>
                                                <Input
                                                    type="date"
                                                    value={formData.follow_up_date}
                                                    onChange={(e) => setFormData({...formData, follow_up_date: e.target.value})}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <Label>Notes</Label>
                                            <Textarea
                                                value={formData.notes}
                                                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                                                placeholder="Add any notes about this application..."
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
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                        <Card className="bg-blue-50 border-blue-200">
                            <CardContent className="p-4 flex items-center justify-between">
                                <span className="font-medium text-blue-900">
                                    {selectedIds.length} application(s) selected
                                </span>
                                <div className="flex gap-2">
                                    <Button variant="destructive" size="sm" onClick={bulkDelete}>
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Delete Selected
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={() => setSelectedIds([])}>
                                        Clear Selection
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}

                {/* Applications List */}
                {isLoading ? (
                    <div className="text-center py-12 text-slate-600">Loading applications...</div>
                ) : filteredApplications.length === 0 ? (
                    <Card>
                        <CardContent className="py-16 text-center">
                            <Briefcase className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                            <h3 className="text-xl font-medium text-slate-600 mb-2">No applications yet</h3>
                            <p className="text-slate-500 mb-6">Start tracking your job applications by adding your first one!</p>
                            <Button onClick={openAddDialog} className="bg-blue-600 hover:bg-blue-700">
                                <Plus className="w-4 h-4 mr-2" />
                                Add Your First Application
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-3">
                        {filteredApplications.map(app => {
                            const StatusIcon = statusConfig[app.application_status]?.icon || Clock;
                            const isOverdue = app.next_follow_up_at && isBefore(new Date(app.next_follow_up_at), new Date());
                            const linkedResume = resumes.find(r => r.id === app.optimized_resume_id);

                            return (
                                <motion.div key={app.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                                    <Card className={`hover:shadow-lg transition-all ${isOverdue ? 'border-amber-300 bg-amber-50/30' : ''}`}>
                                        <CardContent className="p-4">
                                            <div className="flex items-start gap-4">
                                                <Checkbox
                                                    checked={selectedIds.includes(app.id)}
                                                    onCheckedChange={() => toggleSelected(app.id)}
                                                    className="mt-1"
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-4 mb-2">
                                                        <div className="flex-1 min-w-0">
                                                            <h3 className="text-lg font-semibold text-slate-800 truncate">
                                                                {app.job_title}
                                                            </h3>
                                                            <div className="flex items-center gap-2 text-slate-600 mb-1">
                                                                <Building className="w-4 h-4" />
                                                                <span className="truncate">{app.company_name}</span>
                                                            </div>
                                                        </div>
                                                        <Badge className={statusConfig[app.application_status]?.color}>
                                                            <StatusIcon className="w-3 h-3 mr-1" />
                                                            {statusConfig[app.application_status]?.label}
                                                        </Badge>
                                                    </div>

                                                    <div className="flex flex-wrap gap-4 text-sm text-slate-600 mb-3">
                                                        {app.applied_at && (
                                                            <div className="flex items-center gap-1">
                                                                <Calendar className="w-4 h-4" />
                                                                Applied {formatDistanceToNow(new Date(app.applied_at), { addSuffix: true })}
                                                            </div>
                                                        )}
                                                        {app.next_follow_up_at && (
                                                            <div className={`flex items-center gap-1 ${isOverdue ? 'text-amber-700 font-medium' : ''}`}>
                                                                <Bell className="w-4 h-4" />
                                                                Follow-up: {format(new Date(app.next_follow_up_at), 'MMM d')}
                                                                {isOverdue && ' (Overdue!)'}
                                                            </div>
                                                        )}
                                                        {linkedResume && (
                                                            <div className="flex items-center gap-1">
                                                                <FileText className="w-4 h-4" />
                                                                {linkedResume.version_name}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {app.summary?.notes && (
                                                        <p className="text-sm text-slate-600 line-clamp-2 mb-3">
                                                            {app.summary.notes}
                                                        </p>
                                                    )}

                                                    <div className="flex flex-wrap gap-2">
                                                        <Select 
                                                            value={app.application_status} 
                                                            onValueChange={(val) => updateStatus(app, val)}
                                                        >
                                                            <SelectTrigger className="w-[140px] h-8 text-xs">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {Object.entries(statusConfig).map(([key, config]) => (
                                                                    <SelectItem key={key} value={key}>{config.label}</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                        <Button 
                                                            size="sm" 
                                                            variant="outline"
                                                            onClick={() => openEditDialog(app)}
                                                        >
                                                            <Edit className="w-3 h-3 mr-1" />
                                                            Edit
                                                        </Button>
                                                        {app.job_posting_url && (
                                                            <a href={app.job_posting_url} target="_blank" rel="noopener noreferrer">
                                                                <Button size="sm" variant="outline">
                                                                    <ExternalLink className="w-3 h-3 mr-1" />
                                                                    View Job
                                                                </Button>
                                                            </a>
                                                        )}
                                                        {app.optimized_resume_id && (
                                                            <Link to={createPageUrl(`ResumeViewer?resumeId=${app.optimized_resume_id}`)}>
                                                                <Button size="sm" variant="outline">
                                                                    <FileText className="w-3 h-3 mr-1" />
                                                                    Resume
                                                                </Button>
                                                            </Link>
                                                        )}
                                                        <Button 
                                                            size="sm" 
                                                            variant="ghost"
                                                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                            onClick={() => handleDelete(app.id)}
                                                        >
                                                            <Trash2 className="w-3 h-3" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}