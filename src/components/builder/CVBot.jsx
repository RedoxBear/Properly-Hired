import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2, Bot, X, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import ReactMarkdown from "react-markdown";
import { classifyIntent, delegateToExpert } from "./intentRouter";
import ExpertInsightCard from "./ExpertInsightCard";

// CVBot System Prompt - Strict scope restriction
const SYSTEM_PROMPT = `You are CVBot, a friendly CV/resume creation assistant.

CRITICAL RULES:
1. Maximum 2 sentences per response. Be concise and action-oriented.
2. ONLY help with CV/resume writing for the current question.
3. If asked about ANYTHING else, respond: "I'm here to help with your CV! What would you like help with for this section?"

ALLOWED topics:
- Answering the 8 resume questions
- Providing examples for each question
- Clarifying what information to include
- Suggesting improvements to answers
- Tips for writing better CV content

FORBIDDEN topics (always redirect):
- Job searching, interviews, salary negotiation
- Career advice beyond CV writing
- Personal problems, relationships
- Politics, news, entertainment, jokes
- Technical help, coding, other products
- General knowledge questions

TONE: Encouraging, concise, professional yet warm. Use phrases like "Great start!", "Nice work!", "Almost there!"

When helping, give ONE specific suggestion. Don't overwhelm with multiple options.`;

// Quick prompts for users
const QUICK_PROMPTS = [
  "Give me an example",
  "How can I improve this?",
  "What should I include?",
  "Help me optimize my resume bullets",
  "What does the industry expect for this role?"
];

// Client-side guardrail check
function isOnTopic(message) {
  const cvKeywords = [
    'resume', 'cv', 'experience', 'skill', 'education', 'job', 'career',
    'work', 'example', 'help', 'write', 'answer', 'improve', 'tip',
    'stuck', 'better', 'include', 'achievement', 'qualification',
    'summary', 'goal', 'quality', 'strength', 'certification', 'award',
    // Kyle routing triggers
    'cover letter', 'bullet', 'optimize', 'rewrite', 'coaching', 'ats',
    'action verb', 'arc', 'star method', 'interview', 'formatting', 'template',
    // Simon routing triggers
    'company', 'industry', 'market', 'trade', 'sector', 'ghost job',
    'employer', 'hiring', 'trend', 'salary', 'compensation', 'wage',
    'bls', 'dol', 'labor', 'compliance', 'workforce', 'role'
  ];

  const offTopicPatterns = [
    /weather/i, /news/i, /politic/i, /joke/i, /story\s+about/i,
    /code|program|debug|javascript|python/i, /recipe/i, /game/i,
    /movie|music|sport/i, /hello|hi\s+there|hey\s+bot/i
  ];

  const msgLower = message.toLowerCase();
  const hasOffTopic = offTopicPatterns.some(p => p.test(message));
  const hasCVKeyword = cvKeywords.some(k => msgLower.includes(k));

  // Short messages like "hi" or "hello" are off-topic
  if (message.trim().length < 10 && !hasCVKeyword) return false;

  return !hasOffTopic || hasCVKeyword;
}

export default function CVBot({ isOpen, currentQuestion, currentAnswer, onClose, embedded = false }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Reset messages when question changes
  useEffect(() => {
    setMessages([]);
  }, [currentQuestion?.id]);

  const addMessage = (role, content, expertInsight = null) => {
    setMessages(prev => [...prev, { role, content, timestamp: Date.now(), expertInsight }]);
  };

  const sendMessage = async (text = input) => {
    const userMessage = text.trim();
    if (!userMessage) return;

    // Check guardrail BEFORE clearing input
    if (!isOnTopic(userMessage)) {
      setTimeout(() => {
        addMessage("assistant", "I'm here to help with your CV! What would you like help with for this section? Try asking for an example or tips to improve your answer.");
      }, 300);
      return; // Input remains for user to edit
    }

    // Only clear input after validation passes
    setInput("");
    addMessage("user", userMessage);

    setIsLoading(true);

    try {
      // Check if we should route to Kyle or Simon
      const expert = classifyIntent(userMessage);

      if (expert) {
        // Delegate to specialist agent
        const insight = await delegateToExpert(expert, {
          questionId: currentQuestion?.id,
          questionText: currentQuestion?.question,
          userAnswer: currentAnswer,
          userMessage,
          resumeDraft: null
        });

        const expertName = expert === "kyle" ? "Kyle" : "Simon";
        const summary = insight?.summary || "Here's what I found.";
        addMessage("assistant", `**${expertName} says:** ${summary}`, insight);
      } else {
        // Standard CVBot response
        const contextPrompt = `${SYSTEM_PROMPT}

CURRENT CONTEXT:
- Question ${currentQuestion?.id + 1} of 8: "${currentQuestion?.question}"
- User's current draft answer: "${currentAnswer || '(empty)'}"

USER ASKS: ${userMessage}

Remember: Maximum 2 sentences. Be specific and helpful.`;

        const response = await base44.integrations.Core.InvokeLLM({
          prompt: contextPrompt
        });

        addMessage("assistant", response || "I'm here to help with your CV! What would you like to know?");
      }
    } catch (error) {
      console.error("CVBot error:", error);
      addMessage("assistant", "Sorry, I couldn't process that. Let me know how I can help with your CV!");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleQuickPrompt = (prompt) => {
    sendMessage(prompt);
  };

  if (!isOpen) return null;

  return (
    <Card className={`flex flex-col ${embedded ? 'h-[calc(100vh-8rem)] sticky top-4' : 'h-full'} border-2 border-blue-100 bg-white`}>
      {/* Header */}
      <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-indigo-50 py-3 px-4 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold">CVBot</CardTitle>
              <p className="text-xs text-slate-500">Your CV assistant</p>
            </div>
          </div>
          {!embedded && (
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      {/* Messages */}
      <CardContent className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-6">
            <Sparkles className="w-10 h-10 mx-auto mb-3 text-blue-300" />
            <p className="text-sm text-slate-600 mb-1">
              Hi! I'm here to help with your CV.
            </p>
            <p className="text-xs text-slate-500">
              Ask me for examples, tips, or how to improve your answers.
            </p>
          </div>
        )}

        <AnimatePresence>
          {messages.map((msg, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2 ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white rounded-br-md"
                    : "bg-slate-100 text-slate-800 rounded-bl-md"
                }`}
              >
                <div className="text-sm prose prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                  {msg.role === "user" ? (
                    <p>{msg.content}</p>
                  ) : (
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  )}
                </div>
                {msg.expertInsight && (
                  <div className="mt-2">
                    <ExpertInsightCard insight={msg.expertInsight} />
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-slate-100 rounded-2xl rounded-bl-md px-4 py-2">
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </CardContent>

      {/* Quick Prompts */}
      {messages.length === 0 && (
        <div className="px-3 pb-2 flex flex-wrap gap-1.5">
          {QUICK_PROMPTS.map((prompt) => (
            <Button
              key={prompt}
              variant="outline"
              size="sm"
              onClick={() => handleQuickPrompt(prompt)}
              className="text-xs h-7 bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
            >
              {prompt}
            </Button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="border-t p-3 shrink-0">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about this section..."
            className="resize-none h-10 min-h-0 text-sm"
            disabled={isLoading}
          />
          <Button
            onClick={() => sendMessage()}
            disabled={!input.trim() || isLoading}
            size="icon"
            className="bg-blue-600 hover:bg-blue-700 shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-xs text-slate-400 mt-1.5 text-center">
          CVBot only helps with CV creation
        </p>
      </div>
    </Card>
  );
}