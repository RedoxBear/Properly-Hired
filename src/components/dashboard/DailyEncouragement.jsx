import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";
import { EncouragementQuote } from "@/entities/EncouragementQuote";

const FALLBACK_QUOTES = [
  { text: "Believe you can and you’re halfway there.", author: "Theodore Roosevelt" },
  { text: "It always seems impossible until it’s done.", author: "Nelson Mandela" },
  { text: "Don’t watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" }
];

function dayIndex(len) {
  const d = new Date();
  const dayOfYear = Math.floor((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - Date.UTC(d.getFullYear(), 0, 0)) / 86400000);
  return len > 0 ? dayOfYear % len : 0;
}

export default function DailyEncouragement() {
  const [quote, setQuote] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const list = await EncouragementQuote.list("-created_date", 200);
        const approved = Array.isArray(list) ? list.filter(q => q.approved !== false) : [];
        const pick = approved.length ? approved[dayIndex(approved.length)] : FALLBACK_QUOTES[dayIndex(FALLBACK_QUOTES.length)];
        setQuote(pick);
      } catch {
        const pick = FALLBACK_QUOTES[dayIndex(FALLBACK_QUOTES.length)];
        setQuote(pick);
      }
    })();
  }, []);

  if (!quote) return null;

  return (
    <Card className="bg-white/90 border-0 shadow">
      <CardContent className="py-5 px-6 flex items-start gap-3">
        <div className="p-2 rounded-lg bg-amber-50 text-amber-700">
          <Sparkles className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-slate-800 text-base md:text-lg leading-relaxed">
            “{quote.text}”
          </div>
          <div className="mt-2 flex items-center gap-2">
            <Badge variant="outline" className="text-slate-600">
              {quote.author || "Unknown"}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}