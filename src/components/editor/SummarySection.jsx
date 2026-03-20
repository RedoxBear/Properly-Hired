import React from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export default function SummarySection({ value, onChange, label = "Career Summary" }) {
  const display = Array.isArray(value) ? value.join("\n") : (value || "");
  return (
    <section>
      <Label className="text-base font-semibold mb-2 block">
        {label} {display && <span className="text-xs text-green-600 ml-2">✓ Filled</span>}
      </Label>
      <Textarea
        className="w-full min-h-[120px]"
        value={display}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Professional summary — your elevator pitch with key qualifications."
      />
    </section>
  );
}