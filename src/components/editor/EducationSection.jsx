import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";

export default function EducationSection({ education, onChange }) {
  const list = education || [];

  const addEdu = () => onChange([...list, { institution: "", degree: "", year: "" }]);
  const removeEdu = (i) => onChange(list.filter((_, idx) => idx !== i));
  const updateField = (i, field, value) => {
    const updated = [...list];
    updated[i] = { ...updated[i], [field]: value };
    onChange(updated);
  };

  return (
    <section>
      <div className="flex justify-between items-center mb-3">
        <Label className="text-base font-semibold">Education</Label>
        <Button onClick={addEdu} size="sm" variant="outline" className="gap-1">
          <Plus className="w-4 h-4" /> Add
        </Button>
      </div>
      <div className="space-y-4">
        {list.map((edu, index) => (
          <Card key={index} className="bg-slate-50">
            <CardContent className="p-4 space-y-3">
              <div className="flex justify-between items-start">
                <Label className="text-sm font-semibold text-slate-700">Education {index + 1}</Label>
                <Button onClick={() => removeEdu(index)} size="sm" variant="ghost" className="text-red-600 hover:text-red-800 hover:bg-red-50">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              <div className="grid md:grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs text-slate-600">Institution</Label>
                  <Input value={edu.institution || ""} onChange={(e) => updateField(index, "institution", e.target.value)} placeholder="e.g. Stanford University" />
                </div>
                <div>
                  <Label className="text-xs text-slate-600">Degree</Label>
                  <Input value={edu.degree || ""} onChange={(e) => updateField(index, "degree", e.target.value)} placeholder="e.g. BS Computer Science" />
                </div>
                <div>
                  <Label className="text-xs text-slate-600">Year</Label>
                  <Input value={edu.year || ""} onChange={(e) => updateField(index, "year", e.target.value)} placeholder="e.g. 2020" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {list.length === 0 && (
          <p className="text-sm text-slate-500 text-center py-4">No education added yet.</p>
        )}
      </div>
    </section>
  );
}