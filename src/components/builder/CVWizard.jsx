import React, { useReducer, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Sparkles, Loader2 } from "lucide-react";
import WizardProgress from "./WizardProgress";
import WizardStep from "./WizardStep";
import CVBot from "./CVBot";
import WelcomeSheet from "./WelcomeSheet";
import confetti from "canvas-confetti";

const QUESTIONS = [
  {
    id: 0,
    title: "Tell me about yourself",
    question: "Tell me about yourself.",
    placeholder: "Share a brief professional introduction...",
    minChars: 50,
    chips: ["I'm a software engineer with...", "I have X years of experience in...", "I specialize in..."],
    example: "I'm a marketing professional with 5 years of experience in digital campaigns. I've helped brands grow their online presence through data-driven strategies and creative storytelling."
  },
  {
    id: 1,
    title: "Career goal",
    question: "What is your career goal?",
    placeholder: "Where do you want to be professionally?",
    minChars: 30,
    chips: ["I want to become a...", "My goal is to lead...", "I'm working towards..."],
    example: "I aim to become a product manager at a tech company where I can combine my technical background with business strategy to build products that solve real user problems."
  },
  {
    id: 2,
    title: "Inspiration",
    question: "What inspires you?",
    placeholder: "What drives your professional passion?",
    minChars: 30,
    chips: ["I'm passionate about...", "I'm driven by...", "I love solving..."],
    example: "I'm inspired by the potential of technology to improve people's daily lives. Seeing users benefit from solutions I've helped create motivates me to keep learning and innovating."
  },
  {
    id: 3,
    title: "Experience",
    question: "Tell me about your past experience.",
    placeholder: "Share your work history and achievements...",
    minChars: 100,
    chips: ["At my last role, I...", "I've worked at...", "My key achievement was..."],
    example: "At TechCorp, I led a team of 5 developers to rebuild our checkout system, reducing cart abandonment by 25%. Previously at StartupXYZ, I built their MVP from scratch which helped secure $2M in funding."
  },
  {
    id: 4,
    title: "Qualities",
    question: "What do you think the best quality of yours?",
    placeholder: "What strengths set you apart?",
    minChars: 40,
    chips: ["I'm great at...", "People say I'm...", "My strength is..."],
    example: "My greatest strength is my ability to simplify complex problems. I can break down technical concepts for non-technical stakeholders and find practical solutions that balance idealism with constraints."
  },
  {
    id: 5,
    title: "Education & Skills",
    question: "Your current Education and Skills?",
    placeholder: "Degrees, certifications, technical skills...",
    minChars: 50,
    chips: ["I have a degree in...", "I'm skilled in...", "I'm certified in..."],
    example: "BS in Computer Science from State University (2019). Proficient in Python, JavaScript, React, and SQL. AWS Certified Solutions Architect. Strong skills in data analysis and agile methodologies."
  },
  {
    id: 6,
    title: "Achievements",
    question: "Any certifications, publications, and awards you'd like people to know?",
    placeholder: "Notable recognitions and accomplishments...",
    minChars: 20,
    chips: ["I received...", "I was recognized for...", "I published..."],
    example: "Google Analytics Certified. Published 'Modern UX Patterns' in UX Magazine (2023). Employee of the Quarter at TechCorp (Q3 2022). Speaker at LocalTech Conference 2023."
  },
  {
    id: 7,
    title: "Values",
    question: "If you have a million dollars today, what would you do about it?",
    placeholder: "This reveals your values and priorities...",
    minChars: 30,
    chips: ["I would invest in...", "I'd use it to...", "I believe in..."],
    example: "I'd invest in education technology startups that make learning accessible to underserved communities. I believe technology should bridge gaps, not widen them, and I'd want my resources to reflect that value."
  }
];

const STORAGE_KEY = "cvbuilder_draft";
const WELCOMED_KEY = "cvbuilder_welcomed";

// State reducer
function wizardReducer(state, action) {
  switch (action.type) {
    case "NEXT_STEP":
      return { ...state, currentStep: Math.min(state.currentStep + 1, QUESTIONS.length - 1) };
    case "PREV_STEP":
      return { ...state, currentStep: Math.max(state.currentStep - 1, 0) };
    case "GO_TO_STEP":
      return { ...state, currentStep: Math.max(0, Math.min(action.step, QUESTIONS.length - 1)) };
    case "UPDATE_ANSWER": {
      const newAnswers = [...state.answers];
      newAnswers[action.index] = action.value;
      return { ...state, answers: newAnswers };
    }
    case "UPDATE_STRENGTH": {
      const newStrength = [...state.answerStrength];
      newStrength[action.index] = action.score;
      return { ...state, answerStrength: newStrength };
    }
    case "TOGGLE_CVBOT":
      return { ...state, cvBotOpen: !state.cvBotOpen };
    case "SET_CVBOT":
      return { ...state, cvBotOpen: action.open };
    case "DISMISS_WELCOME":
      localStorage.setItem(WELCOMED_KEY, "true");
      return { ...state, showWelcome: false };
    case "SET_BUILDING":
      return { ...state, isBuilding: action.value };
    case "SET_VOICE_TRANSCRIPT":
      return { ...state, voiceTranscript: action.value };
    case "RESTORE_DRAFT":
      return {
        ...state,
        answers: action.payload.answers || state.answers,
        currentStep: action.payload.currentStep || 0,
        voiceTranscript: action.payload.voiceTranscript || ""
      };
    default:
      return state;
  }
}

// Answer strength calculator
function calculateStrength(answer, questionIndex) {
  const minChars = QUESTIONS[questionIndex]?.minChars || 30;
  const chars = (answer || "").trim().length;

  if (chars === 0) return { score: 0, label: "empty" };
  if (chars < minChars) return { score: 30, label: "weak" };
  if (chars < minChars * 2) return { score: 60, label: "good" };
  return { score: 90, label: "strong" };
}

export default function CVWizard({ onBuild, isBuilding }) {
  const isFirstTime = !localStorage.getItem(WELCOMED_KEY);

  const [state, dispatch] = useReducer(wizardReducer, {
    currentStep: 0,
    answers: Array(QUESTIONS.length).fill(""),
    answerStrength: Array(QUESTIONS.length).fill(0),
    showWelcome: isFirstTime,
    cvBotOpen: false,
    voiceTranscript: ""
  });

  // Restore draft on mount
  useEffect(() => {
    const draft = localStorage.getItem(STORAGE_KEY);
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        if (Date.now() - parsed.timestamp < 86400000) { // 24 hours
          dispatch({ type: "RESTORE_DRAFT", payload: parsed });
        }
      } catch (e) {
        console.error("Failed to restore draft:", e);
      }
    }
  }, []);

  // Auto-save draft
  useEffect(() => {
    const saveTimer = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        answers: state.answers,
        currentStep: state.currentStep,
        voiceTranscript: state.voiceTranscript,
        timestamp: Date.now()
      }));
    }, 1000);
    return () => clearTimeout(saveTimer);
  }, [state.answers, state.currentStep, state.voiceTranscript]);

  // Update strength when answer changes
  useEffect(() => {
    const strength = calculateStrength(state.answers[state.currentStep], state.currentStep);
    dispatch({ type: "UPDATE_STRENGTH", index: state.currentStep, score: strength.score });
  }, [state.answers, state.currentStep]);

  const handleAnswerChange = useCallback((value) => {
    dispatch({ type: "UPDATE_ANSWER", index: state.currentStep, value });
  }, [state.currentStep]);

  const handleNext = useCallback(() => {
    dispatch({ type: "NEXT_STEP" });
  }, []);

  const handlePrev = useCallback(() => {
    dispatch({ type: "PREV_STEP" });
  }, []);

  const handleGoToStep = useCallback((step) => {
    dispatch({ type: "GO_TO_STEP", step });
  }, []);

  const handleBuild = useCallback(async () => {
    // Trigger confetti
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });

    // Call parent build function
    if (onBuild) {
      await onBuild(state.answers, state.voiceTranscript);
    }
  }, [onBuild, state.answers, state.voiceTranscript]);

  const handleVoiceTranscript = useCallback((value) => {
    dispatch({ type: "SET_VOICE_TRANSCRIPT", value });
  }, []);

  const currentQuestion = QUESTIONS[state.currentStep];
  const isLastStep = state.currentStep === QUESTIONS.length - 1;
  const hasAnyContent = state.answers.some(a => a.trim().length > 0) || state.voiceTranscript.trim().length > 0;

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === "TEXTAREA" || e.target.tagName === "INPUT") return;
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "ArrowLeft") handlePrev();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleNext, handlePrev]);

  return (
    <div className="min-h-screen p-4 md:p-8">
      {/* Welcome Sheet */}
      <WelcomeSheet
        open={state.showWelcome}
        onDismiss={() => dispatch({ type: "DISMISS_WELCOME" })}
      />

      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main Wizard Area */}
          <div className="flex-1">
            <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm">
              {/* Progress */}
              <div className="border-b px-4 py-4">
                <WizardProgress
                  currentStep={state.currentStep}
                  totalSteps={QUESTIONS.length}
                  answers={state.answers}
                  onStepClick={handleGoToStep}
                />
              </div>

              <CardContent className="p-6">
                {/* Question Step with Animation */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={state.currentStep}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <WizardStep
                      question={currentQuestion}
                      answer={state.answers[state.currentStep]}
                      strength={state.answerStrength[state.currentStep]}
                      onAnswerChange={handleAnswerChange}
                      onOpenCVBot={() => dispatch({ type: "SET_CVBOT", open: true })}
                      voiceTranscript={state.voiceTranscript}
                      onVoiceTranscriptChange={handleVoiceTranscript}
                    />
                  </motion.div>
                </AnimatePresence>

                {/* Navigation */}
                <div className="flex items-center justify-between mt-8 pt-6 border-t">
                  <Button
                    variant="outline"
                    onClick={handlePrev}
                    disabled={state.currentStep === 0}
                    className="gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </Button>

                  <div className="flex gap-3">
                    {!isLastStep ? (
                      <Button onClick={handleNext} className="gap-2 bg-blue-600 hover:bg-blue-700">
                        Next
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    ) : (
                      <Button
                        onClick={handleBuild}
                        disabled={!hasAnyContent || isBuilding}
                        className="gap-2 bg-green-600 hover:bg-green-700"
                      >
                        {isBuilding ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Sparkles className="w-4 h-4" />
                        )}
                        {isBuilding ? "Building..." : "Build My Resume"}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* CVBot Sidebar - Desktop */}
          <div className="hidden lg:block w-80">
            <CVBot
              isOpen={true}
              currentQuestion={currentQuestion}
              currentAnswer={state.answers[state.currentStep]}
              onClose={() => {}}
              embedded={true}
            />
          </div>
        </div>

        {/* CVBot Toggle - Mobile */}
        <div className="lg:hidden fixed bottom-6 right-6 z-50">
          <Button
            onClick={() => dispatch({ type: "TOGGLE_CVBOT" })}
            className="h-14 w-14 rounded-full shadow-lg bg-blue-600 hover:bg-blue-700"
            size="icon"
          >
            <Sparkles className="w-6 h-6" />
          </Button>
        </div>

        {/* CVBot Mobile Sheet */}
        {state.cvBotOpen && (
          <div className="lg:hidden fixed inset-0 z-50">
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => dispatch({ type: "SET_CVBOT", open: false })}
            />
            <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[70vh] overflow-hidden">
              <CVBot
                isOpen={true}
                currentQuestion={currentQuestion}
                currentAnswer={state.answers[state.currentStep]}
                onClose={() => dispatch({ type: "SET_CVBOT", open: false })}
                embedded={false}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export { QUESTIONS };
