import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function AnswerStrength({ score }) {
  const getLabel = () => {
    if (score === 0) return { text: "Start typing...", color: "text-slate-400" };
    if (score < 40) return { text: "Keep going!", color: "text-red-500" };
    if (score < 70) return { text: "Looking good!", color: "text-amber-500" };
    return { text: "Excellent!", color: "text-green-500" };
  };

  const getBarColor = () => {
    if (score === 0) return "bg-slate-300";
    if (score < 40) return "bg-red-500";
    if (score < 70) return "bg-amber-500";
    return "bg-green-500";
  };

  const label = getLabel();

  return (
    <div className="flex items-center gap-3">
      {/* Progress Bar */}
      <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
        <motion.div
          className={cn("h-full rounded-full", getBarColor())}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ type: "spring", stiffness: 100, damping: 15 }}
        />
      </div>

      {/* Label */}
      <motion.span
        key={label.text}
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn("text-xs font-medium min-w-20 text-right", label.color)}
      >
        {label.text}
      </motion.span>
    </div>
  );
}
