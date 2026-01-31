import React from "react";
import { AutofillVault } from "@/entities/AutofillVault";
import { Resume } from "@/entities/Resume";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, DownloadCloud, Save, Plus, Trash2, RefreshCw, X } from "lucide-react";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";

function timeAgo(ts) {
  if (!ts) return "never";
  const diff = Date.now() - new Date(ts).getTime();
  const sec = Math.round(diff / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.round(hr / 24);
  return `${d}d ago`;
}

export default function AutofillVaultPage() {
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [vaultRec, setVaultRec] = React.useState(null);
  const [showRemapPrompt, setShowRemapPrompt] = React.useState(false);
  const [latestMaster, setLatestMaster] = React.useState(null);

  // default structure
  const emptyVault = {
    personal: { full_name: "", email: "", phone: "", location: "" },
    work_history: [],
    education: [],
    qa_snippets: [],
    ats_profile: {
      work_authorization: "",
      work_authorization_expires: "",
      sponsorship_needed: "",
      salary_expectation: "",
      compensation_currency: "",
      notice_period: "",
      willing_to_travel: "",
      travel_percentage: "",
      remote_preference: "",
      relocation: "",
      preferred_locations: [],
      desired_titles: [],
      earliest_start_date: "",
      linkedin: "",
      portfolio: "",
      github: "",
      clearance_level: "",
      notes: "",
      other_fields: []
    },
    updated_at: new Date().toISOString()
  };

  React.useEffect(() => {
    (async () => {
      setLoading(true);
      const [list, masters] = await Promise.all([
        AutofillVault.list("-updated_date", 1),
        Resume.filter({ is_master_resume: true }, "-updated_date", 1)
      ]);
      
      // Ensure all new ats_profile fields are initialized if vaultRec exists but is old
      let loadedVault = list && list[0] ? list[0] : emptyVault;
      if (loadedVault !== emptyVault && loadedVault.ats_profile) {
        loadedVault.ats_profile = { ...emptyVault.ats_profile, ...loadedVault.ats_profile };
      }
      setVaultRec(loadedVault);
      
      // Check if there's a master resume that's newer than the vault
      const master = masters && masters[0] ? masters[0] : null;
      if (master && loadedVault.updated_at) {
        const masterDate = new Date(master.updated_date || master.created_date);
        const vaultDate = new Date(loadedVault.updated_at);
        if (masterDate > vaultDate) {
          setLatestMaster(master);
          setShowRemapPrompt(true);
        }
      } else if (master && !loadedVault.id) {
        // New vault, suggest importing
        setLatestMaster(master);
        setShowRemapPrompt(true);
      }
      
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setField = (path, val) => {
    setVaultRec(prev => {
      const next = JSON.parse(JSON.stringify(prev || emptyVault));
      const segs = path.split(".");
      let cur = next;
      while (segs.length > 1) cur = cur[segs.shift()];
      cur[segs[0]] = val;
      next.updated_at = new Date().toISOString();
      return next;
    });
  };

  const addRole = () => {
    setVaultRec(prev => {
      const next = JSON.parse(JSON.stringify(prev || emptyVault));
      next.work_history.push({
        id: crypto.randomUUID(),
        title: "",
        company: "",
        location: "",
        start: "",
        end: "",
        bullets: []
      });
      next.updated_at = new Date().toISOString();
      return next;
    });
  };

  const save = async () => {
    if (!vaultRec) return;
    setSaving(true);
    const data = { ...vaultRec, updated_at: new Date().toISOString() };
    let saved;
    if (vaultRec.id) {
      saved = await AutofillVault.update(vaultRec.id, data);
    } else {
      saved = await AutofillVault.create(data);
    }
    setVaultRec(saved);
    setSaving(false);
  };

  const importFromMaster = async (masterResume = null) => {
    // Use provided master or fetch latest
    let master = masterResume;
    if (!master) {
      const masters = await Resume.filter({ is_master_resume: true }, "-updated_date", 1);
      master = masters && masters[0] ? masters[0] : null;
    }
    if (!master) return;
    let parsed = {};
    try {
      parsed = master.optimized_content ? JSON.parse(master.optimized_content)
        : (master.parsed_content ? JSON.parse(master.parsed_content) : {});
    } catch { }
    const roles = Array.isArray(parsed.experience) ? parsed.experience.map(e => ({
      id: crypto.randomUUID(),
      title: e?.position || "",
      company: e?.company || "",
      location: e?.location || "",
      start: String(e?.duration || "").split("–").join("-").split("-")[0]?.trim() || "",
      end: String(e?.duration || "").split("–").join("-").split("-")[1]?.trim() || "Present",
      bullets: Array.isArray(e?.achievements) ? e.achievements : []
    })) : [];
    setVaultRec(prev => {
      const next = JSON.parse(JSON.stringify(prev || emptyVault));
      next.personal.full_name = parsed?.personal_info?.name || next.personal.full_name;
      next.personal.email = parsed?.personal_info?.email || next.personal.email;
      next.personal.phone = parsed?.personal_info?.phone || next.personal.phone;
      next.personal.location = parsed?.personal_info?.location || next.personal.location;
      if (roles.length) next.work_history = roles;
      next.updated_at = new Date().toISOString();
      return next;
    });
  };

  // Helpers for ATS Profile custom fields and CSV inputs
  const addOtherField = () => {
    setVaultRec(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      const arr = Array.isArray(next.ats_profile?.other_fields) ? next.ats_profile.other_fields : [];
      next.ats_profile = { ...(next.ats_profile || {}), other_fields: [...arr, { label: "", value: "" }] };
      next.updated_at = new Date().toISOString();
      return next;
    });
  };

  const updateOtherField = (index, patch) => {
    setVaultRec(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      const arr = Array.isArray(next.ats_profile?.other_fields) ? next.ats_profile.other_fields : [];
      arr[index] = { ...(arr[index] || {}), ...patch };
      next.ats_profile.other_fields = arr;
      next.updated_at = new Date().toISOString();
      return next;
    });
  };

  const removeOtherField = (index) => {
    setVaultRec(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      const arr = Array.isArray(next.ats_profile?.other_fields) ? next.ats_profile.other_fields : [];
      arr.splice(index, 1);
      next.ats_profile.other_fields = arr;
      next.updated_at = new Date().toISOString();
      return next;
    });
  };

  const setCsv = (path, csv) => {
    const arr = csv.split(",").map(s => s.trim()).filter(Boolean);
    setVaultRec(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      const segs = path.split(".");
      let cur = next;
      while (segs.length > 1) cur = cur[segs.shift()];
      cur[segs[0]] = arr;
      next.updated_at = new Date().toISOString();
      return next;
    });
  };


  if (loading || !vaultRec) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center text-slate-600">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading Vault...
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-6">
      {showRemapPrompt && latestMaster && (
        <Alert className="bg-blue-50 border-blue-200">
          <AlertDescription className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <RefreshCw className="w-5 h-5 text-blue-600" />
              <div>
                <p className="font-semibold text-blue-900">Updated Master Resume Detected</p>
                <p className="text-sm text-blue-700">
                  Your master resume "{latestMaster.version_name}" has been updated. Remap your autofill fields from it?
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                onClick={() => importFromMaster(latestMaster)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Yes, Remap
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => setShowRemapPrompt(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800">Autofill Vault</h1>
          <p className="text-sm text-slate-500">Last updated {timeAgo(vaultRec.updated_at)}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={importFromMaster} className="gap-2">
            <DownloadCloud className="w-4 h-4" /> Import from Master CV
          </Button>
          <Button onClick={save} disabled={saving} className="gap-2 bg-blue-600 hover:bg-blue-700">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      <Card className="bg-white/90 backdrop-blur-sm border-0 shadow">
        <CardHeader><CardTitle>Personal</CardTitle></CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          <Input placeholder="Full name" value={vaultRec.personal.full_name || ""} onChange={e => setField("personal.full_name", e.target.value)} />
          <Input placeholder="Email" value={vaultRec.personal.email || ""} onChange={e => setField("personal.email", e.target.value)} />
          <Input placeholder="Phone" value={vaultRec.personal.phone || ""} onChange={e => setField("personal.phone", e.target.value)} />
          <Input placeholder="Location" value={vaultRec.personal.location || ""} onChange={e => setField("personal.location", e.target.value)} />
        </CardContent>
      </Card>

      <Card className="bg-white/90 backdrop-blur-sm border-0 shadow">
        <CardHeader><CardTitle>Work History</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {vaultRec.work_history.map((j, i) => (
            <div key={j.id || i} className="grid md:grid-cols-2 gap-3 border rounded-lg p-3 bg-white">
              <Input placeholder="Title" value={j.title || ""} onChange={e => {
                const v = [...vaultRec.work_history]; v[i] = { ...j, title: e.target.value }; setVaultRec({ ...vaultRec, work_history: v, updated_at: new Date().toISOString() });
              }} />
              <Input placeholder="Company" value={j.company || ""} onChange={e => {
                const v = [...vaultRec.work_history]; v[i] = { ...j, company: e.target.value }; setVaultRec({ ...vaultRec, work_history: v, updated_at: new Date().toISOString() });
              }} />
              <Input placeholder="Location" value={j.location || ""} onChange={e => {
                const v = [...vaultRec.work_history]; v[i] = { ...j, location: e.target.value }; setVaultRec({ ...vaultRec, work_history: v, updated_at: new Date().toISOString() });
              }} />
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="Start (YYYY-MM)" value={j.start || ""} onChange={e => {
                  const v = [...vaultRec.work_history]; v[i] = { ...j, start: e.target.value }; setVaultRec({ ...vaultRec, work_history: v, updated_at: new Date().toISOString() });
                }} />
                <Input placeholder="End (YYYY-MM or Present)" value={j.end || ""} onChange={e => {
                  const v = [...vaultRec.work_history]; v[i] = { ...j, end: e.target.value }; setVaultRec({ ...vaultRec, work_history: v, updated_at: new Date().toISOString() });
                }} />
              </div>
              <Textarea
                className="md:col-span-2" placeholder="Bullets (one per line)"
                value={Array.isArray(j.bullets) ? j.bullets.join("\n") : ""}
                onChange={e => {
                  const v = [...vaultRec.work_history]; v[i] = { ...j, bullets: e.target.value.split("\n").map(s => s.trim()).filter(Boolean) }; setVaultRec({ ...vaultRec, work_history: v, updated_at: new Date().toISOString() });
                }}
              />
            </div>
          ))}
          <Button variant="outline" onClick={addRole} className="gap-2"><Plus className="w-4 h-4" /> Add Role</Button>
        </CardContent>
      </Card>

      <Card className="bg-white/90 backdrop-blur-sm border-0 shadow">
        <CardHeader><CardTitle>ATS Profile</CardTitle></CardHeader>
        <CardContent className="grid gap-3">
          <div className="grid md:grid-cols-2 gap-3">
            <Input placeholder="Work authorization" value={vaultRec.ats_profile?.work_authorization || ""} onChange={e => setField("ats_profile.work_authorization", e.target.value)} />
            <Input placeholder="Authorization expires (YYYY-MM-DD)" value={vaultRec.ats_profile?.work_authorization_expires || ""} onChange={e => setField("ats_profile.work_authorization_expires", e.target.value)} />
            <Input placeholder="Sponsorship needed (yes/no or details)" value={vaultRec.ats_profile?.sponsorship_needed || ""} onChange={e => setField("ats_profile.sponsorship_needed", e.target.value)} />
            <Input placeholder="Salary expectation" value={vaultRec.ats_profile?.salary_expectation || ""} onChange={e => setField("ats_profile.salary_expectation", e.target.value)} />
            <Input placeholder="Compensation currency (e.g., USD)" value={vaultRec.ats_profile?.compensation_currency || ""} onChange={e => setField("ats_profile.compensation_currency", e.target.value)} />
            <Input placeholder="Notice period" value={vaultRec.ats_profile?.notice_period || ""} onChange={e => setField("ats_profile.notice_period", e.target.value)} />
            <Input placeholder="Willing to travel (text)" value={vaultRec.ats_profile?.willing_to_travel || ""} onChange={e => setField("ats_profile.willing_to_travel", e.target.value)} />
            <Input placeholder="Travel percentage (e.g., up to 25%)" value={vaultRec.ats_profile?.travel_percentage || ""} onChange={e => setField("ats_profile.travel_percentage", e.target.value)} />
            <Input placeholder="Remote preference (remote/hybrid/onsite)" value={vaultRec.ats_profile?.remote_preference || ""} onChange={e => setField("ats_profile.remote_preference", e.target.value)} />
            <Input placeholder="Relocation (open? where?)" value={vaultRec.ats_profile?.relocation || ""} onChange={e => setField("ats_profile.relocation", e.target.value)} />
            <Input placeholder="Preferred locations (comma separated)" value={(vaultRec.ats_profile?.preferred_locations || []).join(", ")} onChange={e => setCsv("ats_profile.preferred_locations", e.target.value)} />
            <Input placeholder="Desired titles (comma separated)" value={(vaultRec.ats_profile?.desired_titles || []).join(", ")} onChange={e => setCsv("ats_profile.desired_titles", e.target.value)} />
            <Input placeholder="Earliest start date (YYYY-MM-DD or ASAP)" value={vaultRec.ats_profile?.earliest_start_date || ""} onChange={e => setField("ats_profile.earliest_start_date", e.target.value)} />
            <Input placeholder="LinkedIn URL" value={vaultRec.ats_profile?.linkedin || ""} onChange={e => setField("ats_profile.linkedin", e.target.value)} />
            <Input placeholder="Portfolio URL" value={vaultRec.ats_profile?.portfolio || ""} onChange={e => setField("ats_profile.portfolio", e.target.value)} />
            <Input placeholder="GitHub URL" value={vaultRec.ats_profile?.github || ""} onChange={e => setField("ats_profile.github", e.target.value)} />
            <Input placeholder="Clearance level" value={vaultRec.ats_profile?.clearance_level || ""} onChange={e => setField("ats_profile.clearance_level", e.target.value)} />
          </div>

          <Textarea placeholder="Notes (anything recruiters should know)" value={vaultRec.ats_profile?.notes || ""} onChange={e => setField("ats_profile.notes", e.target.value)} />

          {/* Custom fields */}
          <div className="mt-2">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-semibold text-slate-700">Custom fields</div>
              <Button variant="outline" size="sm" onClick={addOtherField} className="gap-1">
                <Plus className="w-4 h-4" /> Add field
              </Button>
            </div>
            <div className="space-y-2">
              {(vaultRec.ats_profile?.other_fields || []).map((f, idx) => (
                <div key={idx} className="grid grid-cols-1 md:grid-cols-5 gap-2">
                  <Input className="md:col-span-2" placeholder="Label (e.g., Work visa type)" value={f.label || ""} onChange={e => updateOtherField(idx, { label: e.target.value })} />
                  <Input className="md:col-span-3" placeholder="Value (e.g., H1B, valid until 2026)" value={f.value || ""} onChange={e => updateOtherField(idx, { value: e.target.value })} />
                  <div className="md:col-span-5 flex justify-end">
                    <Button variant="ghost" size="sm" onClick={() => removeOtherField(idx)} className="text-red-600 hover:text-red-700">
                      <Trash2 className="w-4 h-4 mr-1" /> Remove
                    </Button>
                  </div>
                </div>
              ))}
              {(!vaultRec.ats_profile?.other_fields || vaultRec.ats_profile.other_fields.length === 0) && (
                <div className="text-xs text-slate-500">No custom fields yet. Click “Add field” to create your own key/value entries for portals.</div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-end">
        <Link to={createPageUrl("ApplicationQnA")}>
          <Button variant="ghost">Use in Q&A</Button>
        </Link>
      </div>
    </div>
  );
}