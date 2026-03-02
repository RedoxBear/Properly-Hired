import React, { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Scan, Trash2, ClipboardPaste, FileText } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { scanText, PREFERRED_VERBS } from "@/components/utils/humanVoiceRules";
import ScanResults from "@/components/scanner/ScanResults";

export default function AIDetectionScanner() {
  const [inputText, setInputText] = useState("");
  const [results, setResults] = useState(null);

  const handleScan = useCallback(() => {
    if (!inputText.trim()) return;
    const scanResults = scanText(inputText.trim());
    setResults(scanResults);
  }, [inputText]);

  const handlePaste = async () => {
    const text = await navigator.clipboard.readText();
    setInputText(text);
  };

  const handleClear = () => {
    setInputText("");
    setResults(null);
  };

  const wordCount = inputText.trim() ? inputText.trim().split(/\s+/).length : 0;

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 rounded-full text-sm font-medium mb-4">
            <Scan className="w-4 h-4" />
            Human Voice Engine
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            AI Detection <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">Scanner</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Paste any text to instantly check for AI-sounding words, phrases, and structural patterns. No LLM credits used.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* Input Column */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Input Text
                  </span>
                  <Badge variant="secondary" className="text-xs">{wordCount} words</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Paste your resume, cover letter, or any text here to scan for AI-sounding language..."
                  className="min-h-[300px] text-sm resize-none"
                />
                <div className="flex gap-2">
                  <Button onClick={handleScan} disabled={!inputText.trim()} className="flex-1">
                    <Scan className="w-4 h-4 mr-2" />
                    Scan Text
                  </Button>
                  <Button variant="outline" onClick={handlePaste} title="Paste from clipboard">
                    <ClipboardPaste className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" onClick={handleClear} disabled={!inputText} title="Clear">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Preferred Verbs Reference */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-green-700 dark:text-green-400">Preferred Verbs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1.5">
                  {PREFERRED_VERBS.map(v => (
                    <Badge key={v} variant="outline" className="text-xs bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800">
                      {v}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Results Column */}
          <div className="lg:col-span-3">
            <AnimatePresence mode="wait">
              {results ? (
                <motion.div
                  key="results"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <ScanResults results={results} />
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <Card className="border-dashed">
                    <CardContent className="p-12 text-center">
                      <Scan className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-30" />
                      <p className="text-muted-foreground font-medium">Paste text and click Scan</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Results will appear here with violations, replacements, and your human voice score.
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}