import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function PersonalInfoSection({ personalInfo, onChange }) {
  const pi = personalInfo || {};
  const update = (field, value) => onChange({ ...pi, [field]: value });

  return (
    <section>
      <Label className="text-base font-semibold mb-3 block">Personal Information</Label>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <Label className="text-xs text-slate-600">Full Name</Label>
          <Input value={pi.name || ""} onChange={(e) => update("name", e.target.value)} placeholder="e.g. Jane Doe" />
        </div>
        <div>
          <Label className="text-xs text-slate-600">Email</Label>
          <Input value={pi.email || ""} onChange={(e) => update("email", e.target.value)} placeholder="jane@example.com" />
        </div>
        <div>
          <Label className="text-xs text-slate-600">Phone</Label>
          <Input value={pi.phone || ""} onChange={(e) => update("phone", e.target.value)} placeholder="(555) 123-4567" />
        </div>
        <div>
          <Label className="text-xs text-slate-600">Location</Label>
          <Input value={pi.location || ""} onChange={(e) => update("location", e.target.value)} placeholder="City, State" />
        </div>
        <div>
          <Label className="text-xs text-slate-600">LinkedIn</Label>
          <Input value={pi.linkedin || ""} onChange={(e) => update("linkedin", e.target.value)} placeholder="linkedin.com/in/..." />
        </div>
        <div>
          <Label className="text-xs text-slate-600">Portfolio</Label>
          <Input value={pi.portfolio || ""} onChange={(e) => update("portfolio", e.target.value)} placeholder="https://..." />
        </div>
      </div>
    </section>
  );
}