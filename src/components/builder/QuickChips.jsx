import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export default function QuickChips({ chips, onChipClick }) {
  if (!chips || chips.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      <span className="text-xs text-slate-500 self-center mr-1">Quick start:</span>
      {chips.map((chip, index) => (
        <motion.div
          key={chip}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.05 }}
        >
          <Button
            variant="outline"
            size="sm"
            onClick={() => onChipClick(chip)}
            className="text-xs h-7 px-3 bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 hover:border-blue-300"
          >
            {chip}
          </Button>
        </motion.div>
      ))}
    </div>
  );
}
