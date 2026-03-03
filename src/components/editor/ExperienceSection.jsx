import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";

export default function ExperienceSection({ experience, onChange, lightweight = false }) {
  const list = experience || [];

  const addExp = () => onChange([...list, { company: "", position: "", duration: "", location: "", achievements: [] }]);
  const removeExp = (i) => onChange(list.filter((_, idx) => idx !== i));
  const updateField = (i, field, value) => {
    const updated = [...list];
    updated[i] = { ...updated[i], [field]: value };
    onChange(updated);
  };
  const updateAchievements = (i, text) => {
    const updated = [...list];
    updated[i] = { ...updated[i], achievements: text.split("\n").filter(l => l.trim()) };
    onChange(updated);
  };

  return (
    <section>
      <div className="flex justify-between items-center mb-3">
        <Label className="text-base font-semibold">
          Professional Experience
          {lightweight && <span className="text-xs text-amber-600 ml-2">(Lightweight — no bullets in Achievement format)</span>}
        </Label>
        <Button onClick={addExp} size="sm" variant="outline" className="gap-1">
          <Plus className="w-4 h-4" /> Add
        </Button>
      </div>
      <div className="space-y-4">
        {list.map((exp, index) => (
          <Card key={index} className="bg-slate-50">
            <CardContent className="p-4 space-y-3">
              <div className="flex justify-between items-start">
                <Label className="text-sm font-semibold text-slate-700">Experience {index + 1}</Label>
                <Button onClick={() => removeExp(index)} size="sm" variant="ghost" className="text-red-600 hover:text-red-800 hover:bg-red-50">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-slate-600">Position</Label>
                  <Input value={exp.position || ""} onChange={(e) => updateField(index, "position", e.target.value)} placeholder="e.g. Senior Engineer" />
                </div>
                <div>
                  <Label className="text-xs text-slate-600">Company</Label>
                  <Input value={exp.company || ""} onChange={(e) => updateField(index, "company", e.target.value)} placeholder="e.g. Google" />
                </div>
                <div>
                  <Label className="text-xs text-slate-600">Duration</Label>
                  <Input value={exp.duration || ""} onChange={(e) => updateField(index, "duration", e.target.value)} placeholder="e.g. 2019-2024" />
                </div>
                <div>
                  <Label className="text-xs text-slate-600">Location</Label>
                  <Input value={exp.location || ""} onChange={(e) => updateField(index, "location", e.target.value)} placeholder="e.g. San Francisco, CA" />
                </div>
              </div>
              {!lightweight && (
                <div>
                  <Label className="text-xs text-slate-600">Achievements (one per line)</Label>
                  <Textarea
                    className="min-h-[100px]"
                    value={(exp.achievements || []).join("\n")}
                    onChange={(e) => updateAchievements(index, e.target.value)}
                    placeholder="Led team of 10 engineers&#10;Increased revenue by 25%&#10;Deployed 50+ features"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        {list.length === 0 && (
          <p className="text-sm text-slate-500 text-center py-4">No experience added yet.</p>
        )}
      </div>
    </section>
  );
}