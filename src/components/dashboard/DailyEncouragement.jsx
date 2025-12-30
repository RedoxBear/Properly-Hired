import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, RefreshCw } from "lucide-react";
import { EncouragementQuote } from "@/entities/EncouragementQuote";
import { InvokeLLM } from "@/integrations/Core";
import { differenceInDays } from "date-fns";

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
        let list = await EncouragementQuote.list("-created_date", 200);
        
        // Check if we need to fetch new quotes (if latest is older than 7 days or we have very few)
        const latest = list[0];
        const shouldFetch = !latest || differenceInDays(new Date(), new Date(latest.created_date)) >= 7 || list.length < 5;

        if (shouldFetch) {
           try {
             const existingTexts = new Set(list.map(q => q.text));
             const response = await InvokeLLM({
                prompt: `Find 5 distinct, powerful, and non-cliché encouragement quotes specifically for someone job hunting or building their career. 
                Avoid these if possible: ${Array.from(existingTexts).slice(0, 10).join(", ")}.
                Return a JSON object with a "quotes" array.`,
                add_context_from_internet: true, // Use web to get fresh/varied content
                response_json_schema: {
                  type: "object",
                  properties: {
                    quotes: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          text: { type: "string" },
                          author: { type: "string" },
                          source_url: { type: "string" }
                        }
                      }
                    }
                  }
                }
             });

             if (response?.quotes && Array.isArray(response.quotes)) {
                const newQuotes = response.quotes.filter(q => !existingTexts.has(q.text));
                if (newQuotes.length > 0) {
                   // Add new quotes to DB
                   await Promise.all(newQuotes.map(q => EncouragementQuote.create({
                     ...q,
                     approved: true,
                     tags: ["fresh_web_content"]
                   })));
                   // Refresh list
                   list = await EncouragementQuote.list("-created_date", 200);
                }
             }
           } catch (err) {
             console.error("Failed to fetch new quotes:", err);
           }
        }

        const approved = Array.isArray(list) ? list.filter(q => q.approved !== false) : [];
        const pick = approved.length ? approved[dayIndex(approved.length)] : FALLBACK_QUOTES[dayIndex(FALLBACK_QUOTES.length)];
        setQuote(pick);
      } catch (e) {
        console.error("Error loading quotes:", e);
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