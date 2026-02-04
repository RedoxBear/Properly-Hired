import React from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const STEP_LABELS = [
  "About",
  "Goal",
  "Inspire",
  "Experience",
  "Qualities",
  "Skills",
  "Awards",
  "Values"
];

export default function WizardProgress({ currentStep, totalSteps, answers, onStepClick }) {
  return (
    <div className="w-full">
      {/* Desktop Progress */}
      <div className="hidden sm:flex items-center justify-between">
        {Array.from({ length: totalSteps }).map((_, index) => {
          const isCompleted = answers[index]?.trim().length > 0;
          const isCurrent = currentStep === index;
          const isPast = index < currentStep;

          return (
            <React.Fragment key={index}>
              {/* Step Circle */}
              <div className="flex flex-col items-center">
                <motion.button
                  onClick={() => onStepClick(index)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-200 relative",
                    isCompleted && "bg-green-500 text-white",
                    isCurrent && !isCompleted && "bg-blue-600 text-white ring-4 ring-blue-200",
                    !isCompleted && !isCurrent && "bg-slate-200 text-slate-500 hover:bg-slate-300"
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    index + 1
                  )}
                  {isCurrent && (
                    <motion.div
                      className="absolute inset-0 rounded-full border-2 border-blue-400"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                  )}
                </motion.button>
                <span className={cn(
                  "mt-2 text-xs font-medium",
                  isCurrent ? "text-blue-600" : "text-slate-500"
                )}>
                  {STEP_LABELS[index]}
                </span>
              </div>

              {/* Connector Line */}
              {index < totalSteps - 1 && (
                <div className="flex-1 mx-2 h-1 bg-slate-200 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-green-500"
                    initial={{ width: "0%" }}
                    animate={{ width: isPast || isCompleted ? "100%" : "0%" }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Mobile Progress - Compact */}
      <div className="sm:hidden">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-700">
            Step {currentStep + 1} of {totalSteps}
          </span>
          <span className="text-sm text-slate-500">
            {STEP_LABELS[currentStep]}
          </span>
        </div>
        <div className="flex gap-1">
          {Array.from({ length: totalSteps }).map((_, index) => {
            const isCompleted = answers[index]?.trim().length > 0;
            const isCurrent = currentStep === index;

            return (
              <button
                key={index}
                onClick={() => onStepClick(index)}
                className={cn(
                  "flex-1 h-2 rounded-full transition-all duration-200",
                  isCompleted && "bg-green-500",
                  isCurrent && !isCompleted && "bg-blue-600",
                  !isCompleted && !isCurrent && "bg-slate-200"
                )}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
