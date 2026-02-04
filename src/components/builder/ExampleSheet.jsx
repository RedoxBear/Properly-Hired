import React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Copy, Check, Lightbulb } from "lucide-react";

export default function ExampleSheet({ open, onOpenChange, question, onUseExample }) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(question.example);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleUse = () => {
    onUseExample(question.example);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-amber-500" />
            Example Answer
          </SheetTitle>
          <SheetDescription>
            Here's a sample answer for "{question?.title}". Use it as inspiration or copy it directly.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {/* The Question */}
          <div className="p-3 bg-slate-50 rounded-lg">
            <p className="text-sm font-medium text-slate-700">
              {question?.question}
            </p>
          </div>

          {/* Example Answer */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-slate-800 leading-relaxed">
              {question?.example}
            </p>
          </div>

          {/* Tips */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">
              <strong>Tip:</strong> Personalize this example with your own details. Specific numbers and achievements make your CV stand out!
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={handleCopy}
              className="flex-1 gap-2"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? "Copied!" : "Copy"}
            </Button>
            <Button
              onClick={handleUse}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              Use This Answer
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
