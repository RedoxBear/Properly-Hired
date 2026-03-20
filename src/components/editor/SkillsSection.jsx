import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2 } from "lucide-react";

export default function SkillsSection({ skills, onChange }) {
  const list = skills || [];

  return (
    <section>
      <div className="flex justify-between items-center mb-2">
        <Label className="text-base font-semibold">Core Competencies</Label>
        <span className="text-xs text-slate-500">{list.length} skills</span>
      </div>
      <Textarea
        className="w-full min-h-[80px]"
        value={list.join(", ")}
        onChange={(e) => onChange(e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
        placeholder="e.g. Talent Strategy, Workforce Planning, OKRs, ATS, Data Analytics"
      />
      <div className="flex flex-wrap gap-2 mt-3">
        {list.map((skill, idx) => (
          <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">{skill}</span>
        ))}
      </div>
    </section>
  );
}