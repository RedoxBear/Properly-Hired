import React from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Mic, MicOff, RotateCcw, AlertCircle } from "lucide-react";

export default function VoiceCapture({ transcript, setTranscript, onUseTranscript, i18n }) {
  const [listening, setListening] = React.useState(false);
  const [error, setError] = React.useState("");
  const recognitionRef = React.useRef(null);
  const autoRestartRef = React.useRef(false);
  const errorCountRef = React.useRef(0);

  const start = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice input is not supported in this browser. Please use Chrome.");
      return;
    }
    const rec = new SpeechRecognition();
    rec.lang = "en-US";
    rec.interimResults = true;
    rec.continuous = true;
    recognitionRef.current = rec;
    autoRestartRef.current = true;
    errorCountRef.current = 0;
    setError("");

    let finalText = transcript || "";
    rec.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const segment = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalText += (finalText ? " " : "") + segment;
        else interim += segment;
      }
      setTranscript(finalText + (interim ? " " + interim : ""));
      setError(""); // Clear error on successful speech detection
    };
    rec.onend = () => {
      if (autoRestartRef.current) {
        rec.start();
      } else {
        setListening(false);
      }
    };
    rec.onerror = (event) => {
      const errorType = event.error;
      console.error("Voice recognition error:", errorType);

      // Map error codes to user-friendly messages
      const errorMessages = {
        'no-speech': 'No speech detected. Please try again.',
        'audio-capture': 'No microphone detected. Please check your audio permissions.',
        'network': 'Network error. Please try again.',
        'permission-denied': 'Microphone access denied. Please enable audio permissions in your browser.',
        'aborted': 'Voice recording was cancelled.',
        'service-not-allowed': 'Voice service is not available in your region.'
      };

      const userMessage = errorMessages[errorType] || `Voice error: ${errorType}. Please try again.`;
      setError(userMessage);
      console.warn(`Voice error: ${userMessage}`);

      // Exponential backoff retry
      errorCountRef.current++;
      if (autoRestartRef.current && errorCountRef.current < 3) {
        const backoffDelay = Math.min(1000 * Math.pow(2, errorCountRef.current - 1), 5000);
        setTimeout(() => {
          if (autoRestartRef.current) rec.start();
        }, backoffDelay);
      } else if (errorCountRef.current >= 3) {
        console.error("Max retries reached for voice recording");
        setListening(false);
        setError("Voice service failed. Please refresh and try again.");
      }
    };

    setListening(true);
    rec.start();
  };

  const stop = () => {
    autoRestartRef.current = false;
    setListening(false);
    if (recognitionRef.current) recognitionRef.current.stop();
  };

  const clear = () => {
    setTranscript("");
    setError("");
  };

  return (
    <div className="p-4 border rounded-lg bg-white">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        <div className="font-medium">Voice Session</div>
        <div className="flex gap-2">
          {!listening ? (
            <Button variant="default" onClick={start} className="gap-2">
              <Mic className="w-4 h-4" />
              {i18n?.controls?.start_voice_session || "Start Voice Session"}
            </Button>
          ) : (
            <Button variant="destructive" onClick={stop} className="gap-2">
              <MicOff className="w-4 h-4" />
              {i18n?.controls?.stop_voice_session || "Stop Voice Session"}
            </Button>
          )}
          <Button variant="outline" onClick={clear} className="gap-2">
            <RotateCcw className="w-4 h-4" />
            {i18n?.controls?.clear_transcript || "Clear Transcript"}
          </Button>
          <Button onClick={onUseTranscript} className="gap-2">
            {i18n?.controls?.use_transcript || "Use Transcript to Build"}
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg flex gap-2 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">{error}</p>
            {listening && (
              <p className="text-xs mt-1">Voice input will retry automatically...</p>
            )}
          </div>
        </div>
      )}

      <Textarea
        value={transcript}
        onChange={(e) => setTranscript(e.target.value)}
        placeholder="Speak continuously—your full dialog will be captured here. You can also edit this text before generating."
        className="min-h-40"
      />
    </div>
  );
}
