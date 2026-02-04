import React from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, HelpCircle, Lightbulb } from "lucide-react";
import AnswerStrength from "./AnswerStrength";
import QuickChips from "./QuickChips";
import ExampleSheet from "./ExampleSheet";

export default function WizardStep({
  question,
  answer,
  strength,
  onAnswerChange,
  onOpenCVBot,
  voiceTranscript,
  onVoiceTranscriptChange
}) {
  const [listening, setListening] = React.useState(false);
  const [showExample, setShowExample] = React.useState(false);
  const recognitionRef = React.useRef(null);
  const textareaRef = React.useRef(null);

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice input is not supported in this browser. Please use Chrome.");
      return;
    }
    const rec = new SpeechRecognition();
    rec.lang = "en-US";
    rec.interimResults = true;
    rec.continuous = false;
    recognitionRef.current = rec;

    let finalTranscript = answer || "";
    rec.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const transcript = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalTranscript += (finalTranscript ? " " : "") + transcript;
        else interim += transcript;
      }
      onAnswerChange(finalTranscript + (interim ? " " + interim : ""));
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);

    setListening(true);
    rec.start();
  };

  const stopListening = () => {
    setListening(false);
    if (recognitionRef.current) recognitionRef.current.stop();
  };

  const handleChipClick = (chipText) => {
    const currentValue = answer || "";
    const newValue = currentValue ? `${currentValue} ${chipText}` : chipText;
    onAnswerChange(newValue);
    // Focus textarea after chip click
    setTimeout(() => textareaRef.current?.focus(), 100);
  };

  const handleUseExample = (exampleText) => {
    onAnswerChange(exampleText);
    setShowExample(false);
  };

  return (
    <div className="space-y-4">
      {/* Question Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-800 mb-1">
            {question.title}
          </h2>
          <p className="text-slate-600">
            {question.question}
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowExample(true)}
            className="gap-2"
          >
            <Lightbulb className="w-4 h-4" />
            <span className="hidden sm:inline">Example</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenCVBot}
            className="gap-2 lg:hidden"
          >
            <HelpCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Help</span>
          </Button>
        </div>
      </div>

      {/* Quick Chips */}
      <QuickChips
        chips={question.chips}
        onChipClick={handleChipClick}
      />

      {/* Answer Input */}
      <div className="space-y-2">
        <div className="relative">
          <Textarea
            ref={textareaRef}
            value={answer}
            onChange={(e) => onAnswerChange(e.target.value)}
            placeholder={question.placeholder}
            className="min-h-32 pr-16 resize-none text-base"
          />
          <Button
            type="button"
            variant={listening ? "destructive" : "ghost"}
            size="icon"
            onClick={listening ? stopListening : startListening}
            className="absolute top-2 right-2"
          >
            {listening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </Button>
        </div>

        {/* Answer Strength */}
        <AnswerStrength score={strength} />
      </div>

      {/* Encouragement Message */}
      {strength >= 60 && (
        <p className="text-sm text-green-600 flex items-center gap-2">
          <span>✨</span>
          {strength >= 90 ? "Excellent! Your answer is detailed and strong." : "Nice work! Add a bit more for an even stronger answer."}
        </p>
      )}

      {/* Example Sheet */}
      <ExampleSheet
        open={showExample}
        onOpenChange={setShowExample}
        question={question}
        onUseExample={handleUseExample}
      />
    </div>
  );
}
