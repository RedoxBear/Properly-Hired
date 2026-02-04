import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FileText, Mic, Bot, Sparkles, ArrowRight, X } from "lucide-react";

const TIPS = [
  {
    icon: FileText,
    title: "8 Simple Questions",
    description: "We'll guide you through 8 questions about your career. Take your time - there's no rush!",
    color: "bg-blue-100 text-blue-600"
  },
  {
    icon: Mic,
    title: "Voice or Type",
    description: "Prefer talking? Use voice input! Or type your answers - whatever feels comfortable.",
    color: "bg-green-100 text-green-600"
  },
  {
    icon: Bot,
    title: "CVBot is Here to Help",
    description: "Stuck? Ask CVBot for examples, tips, or suggestions. It's like having a career coach!",
    color: "bg-purple-100 text-purple-600"
  }
];

export default function WelcomeSheet({ open, onDismiss }) {
  const [currentTip, setCurrentTip] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  if (!open) return null;

  const handleNext = () => {
    if (currentTip < TIPS.length - 1) {
      setCurrentTip(currentTip + 1);
    } else {
      handleDismiss();
    }
  };

  const handleDismiss = () => {
    if (dontShowAgain) {
      localStorage.setItem("cvbuilder_welcomed", "true");
    }
    onDismiss();
  };

  const tip = TIPS[currentTip];
  const Icon = tip.icon;
  const isLast = currentTip === TIPS.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleDismiss}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 p-1 rounded-full hover:bg-slate-100 transition-colors z-10"
        >
          <X className="w-5 h-5 text-slate-400" />
        </button>

        {/* Header */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 px-6 py-8 text-center text-white">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="w-16 h-16 mx-auto mb-4 bg-white/20 rounded-2xl flex items-center justify-center"
          >
            <Sparkles className="w-8 h-8" />
          </motion.div>
          <h2 className="text-2xl font-bold mb-2">Welcome to CV Builder!</h2>
          <p className="text-blue-100 text-sm">
            Let's create your professional resume together
          </p>
        </div>

        {/* Tip Content */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentTip}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="text-center"
            >
              <div className={`w-14 h-14 mx-auto mb-4 rounded-xl ${tip.color} flex items-center justify-center`}>
                <Icon className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">
                {tip.title}
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                {tip.description}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Progress Dots */}
          <div className="flex justify-center gap-2 mt-6 mb-6">
            {TIPS.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentTip(idx)}
                className={`w-2 h-2 rounded-full transition-all ${
                  idx === currentTip ? "bg-blue-600 w-6" : "bg-slate-300"
                }`}
              />
            ))}
          </div>

          {/* Actions */}
          <div className="space-y-4">
            <Button
              onClick={handleNext}
              className="w-full gap-2 bg-blue-600 hover:bg-blue-700 h-11"
            >
              {isLast ? "Get Started" : "Next"}
              <ArrowRight className="w-4 h-4" />
            </Button>

            {isLast && (
              <div className="flex items-center justify-center gap-2">
                <Checkbox
                  id="dontShow"
                  checked={dontShowAgain}
                  onCheckedChange={setDontShowAgain}
                />
                <label htmlFor="dontShow" className="text-sm text-slate-500 cursor-pointer">
                  Don't show this again
                </label>
              </div>
            )}

            {!isLast && (
              <button
                onClick={handleDismiss}
                className="w-full text-sm text-slate-500 hover:text-slate-700"
              >
                Skip intro
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
