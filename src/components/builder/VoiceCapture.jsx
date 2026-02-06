import React from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Mic, MicOff, RotateCcw } from "lucide-react";

export default function VoiceCapture({ transcript, setTranscript, onUseTranscript, i18n }) {
  const [listening, setListening] = React.useState(false);
  const recognitionRef = React.useRef(null);
  const autoRestartRef = React.useRef(false);

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

    let finalText = transcript || "";
    rec.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const segment = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalText += (finalText ? " " : "") + segment;
        else interim += segment;
      }
      setTranscript(finalText + (interim ? " " + interim : ""));
    };
    rec.onend = () => {
      if (autoRestartRef.current) {
        rec.start();
      } else {
        setListening(false);
      }
    };
    rec.onerror = () => {
      if (autoRestartRef.current) rec.start();
    };

    setListening(true);
    rec.start();
  };

  const stop = () => {
    autoRestartRef.current = false;
    setListening(false);
    if (recognitionRef.current) recognitionRef.current.stop();
  };

  const clear = () => setTranscript("");

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
      <Textarea
        value={transcript}
        onChange={(e) => setTranscript(e.target.value)}
        placeholder="Speak continuously—your full dialog will be captured here. You can also edit this text before generating."
        className="min-h-40"
      />
    </div>
  );
}