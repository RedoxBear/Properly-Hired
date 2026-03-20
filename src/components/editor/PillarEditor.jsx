import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, GripVertical, Award } from "lucide-react";
import { normalizeAchievementItem } from "@/components/utils/achievementItemUtils";

const FORMULA_OPTIONS = ["ARC", "TEAL", "XYZ", "CAR", "PAR", "SOAR", "STAR", "LPS", "ELITE"];

function PillarItemRow({ item, onUpdate, onRemove }) {
  const normalized = normalizeAchievementItem(item);

  return (
    <div className="flex items-start gap-2 p-3 bg-white rounded-lg border border-amber-100">
      <GripVertical className="w-4 h-4 text-slate-300 mt-2 flex-shrink-0 cursor-grab" />
      <div className="flex-1 space-y-2">
        <Textarea
          className="min-h-[60px] text-sm"
          value={normalized.text}
          onChange={(e) => onUpdate({ text: e.target.value, formula: normalized.formula })}
          placeholder="Achievement statement..."
        />
        <div className="flex flex-wrap gap-1">
          {FORMULA_OPTIONS.map(f => (
            <button
              key={f}
              onClick={() => onUpdate({ text: normalized.text, formula: normalized.formula === f ? null : f })}
              className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all ${
                normalized.formula === f
                  ? "bg-amber-600 text-white"
                  : "bg-slate-100 text-slate-500 hover:bg-amber-100 hover:text-amber-700"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>
      <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700 mt-1 flex-shrink-0" onClick={onRemove}>
        <Trash2 className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
}

export default function PillarEditor({ careerAchievements, onChange }) {
  const pillars = careerAchievements || [];

  const updatePillar = (pIdx, updated) => {
    const next = [...pillars];
    next[pIdx] = updated;
    onChange(next);
  };

  const removePillar = (pIdx) => onChange(pillars.filter((_, i) => i !== pIdx));

  const addPillar = () => onChange([...pillars, { pillar_name: "", items: [] }]);

  const addItem = (pIdx) => {
    const next = [...pillars];
    next[pIdx] = { ...next[pIdx], items: [...(next[pIdx].items || []), { text: "", formula: null }] };
    onChange(next);
  };

  const updateItem = (pIdx, iIdx, value) => {
    const next = [...pillars];
    const items = [...(next[pIdx].items || [])];
    items[iIdx] = value;
    next[pIdx] = { ...next[pIdx], items };
    onChange(next);
  };

  const removeItem = (pIdx, iIdx) => {
    const next = [...pillars];
    next[pIdx] = { ...next[pIdx], items: next[pIdx].items.filter((_, i) => i !== iIdx) };
    onChange(next);
  };

  // Count formula distribution
  const formulaCounts = {};
  pillars.forEach(p => (p.items || []).forEach(item => {
    const f = normalizeAchievementItem(item).formula;
    if (f) formulaCounts[f] = (formulaCounts[f] || 0) + 1;
  }));

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <Label className="text-base font-semibold flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-600" />
          Career Achievements (Pillars)
        </Label>
        <Button onClick={addPillar} size="sm" variant="outline" className="gap-1 border-amber-300 text-amber-700 hover:bg-amber-50">
          <Plus className="w-4 h-4" /> Add Pillar
        </Button>
      </div>

      {/* Formula distribution */}
      {Object.keys(formulaCounts).length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          <span className="text-xs text-slate-500 self-center mr-1">Formulas:</span>
          {Object.entries(formulaCounts).map(([f, count]) => (
            <Badge key={f} className="bg-amber-100 text-amber-800 border-amber-200 text-[10px]">{f}: {count}</Badge>
          ))}
        </div>
      )}

      <div className="space-y-4">
        {pillars.map((pillar, pIdx) => (
          <Card key={pIdx} className="bg-amber-50/50 border-amber-200">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Input
                  value={pillar.pillar_name || ""}
                  onChange={(e) => updatePillar(pIdx, { ...pillar, pillar_name: e.target.value })}
                  placeholder="PILLAR NAME (e.g. STRATEGIC LEADERSHIP)"
                  className="font-semibold uppercase tracking-wide text-amber-900 bg-white flex-1"
                />
                <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700" onClick={() => removePillar(pIdx)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-2">
                {(pillar.items || []).map((item, iIdx) => (
                  <PillarItemRow
                    key={iIdx}
                    item={item}
                    onUpdate={(val) => updateItem(pIdx, iIdx, val)}
                    onRemove={() => removeItem(pIdx, iIdx)}
                  />
                ))}
              </div>

              <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => addItem(pIdx)}>
                <Plus className="w-3 h-3" /> Add Achievement
              </Button>
            </CardContent>
          </Card>
        ))}

        {pillars.length === 0 && (
          <div className="text-center py-6 text-slate-500 text-sm">
            No career achievement pillars yet. Click "Add Pillar" to create your first one.
          </div>
        )}
      </div>
    </section>
  );
}