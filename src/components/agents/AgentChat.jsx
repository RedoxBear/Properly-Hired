import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Send, Loader2, X, Minimize2, Maximize2, Bot, Mic, MicOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { useAppContext } from "@/components/context/AppContextProvider";

export default function AgentChat({ agentName, agentTitle, context = {} }) {
    const { context: appContext, getContextSummary } = useAppContext();
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [conversation, setConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [initError, setInitError] = useState("");
    const [isInitializing, setIsInitializing] = useState(false);
    const [voiceListening, setVoiceListening] = useState(false);
    const [voiceSupported, setVoiceSupported] = useState(true);
    const initTimeoutRef = useRef(null);
    const recognitionRef = useRef(null);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        if (messages.length > 0) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    const initConversation = async () => {
        setIsInitializing(true);
        setInitError("");

        // Set timeout for initialization
        const timeoutId = setTimeout(() => {
            setInitError("Chat initialization timed out. Please try again.");
            setIsInitializing(false);
        }, 10000);

        try {
            // Combine provided context with app context
            const mergedContext = {
                ...context,
                appPage: appContext?.currentPage,
                appTask: appContext?.currentTask,
                contextSummary: getContextSummary()
            };

            const conv = await base44.agents.createConversation({
                agent_name: agentName,
                metadata: {
                    name: `${agentTitle} Chat`,
                    context: JSON.stringify(mergedContext),
                    appContext: appContext
                }
            });
            clearTimeout(timeoutId);
            setConversation(conv);
            setMessages(conv.messages || []);
            setInitError("");
        } catch (e) {
            clearTimeout(timeoutId);
            console.error("Failed to create conversation:", e);
            setInitError(e.message || "Failed to initialize chat. Please try again.");
        } finally {
            setIsInitializing(false);
        }
    };

    useEffect(() => {
        if (isOpen && !conversation) {
            initConversation();
        }
    }, [isOpen]);

    useEffect(() => {
        if (!conversation) return;

        const unsubscribe = base44.agents.subscribeToConversation(conversation.id, (data) => {
            setMessages(data.messages || []);
        });

        return () => unsubscribe();
    }, [conversation]);

    const sendMessage = async () => {
        if (!input.trim() || !conversation) return;

        const userMessage = input.trim();
        setError("");
        setInput("");
        setIsLoading(true);

        try {
            // Include context in the message
            const messageContent = {
                userMessage: userMessage,
                context: {
                    currentPage: appContext?.currentPage,
                    currentTask: appContext?.currentTask,
                    contextSummary: getContextSummary(),
                    timestamp: new Date().toISOString()
                }
            };

            await base44.agents.addMessage(conversation, {
                role: "user",
                content: userMessage,
                metadata: messageContent
            });
        } catch (e) {
            console.error("Failed to send message:", e);
            // Restore input on failure so user doesn't lose their message
            setInput(userMessage);
            setError(e.message || "Failed to send message. Please try again.");
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

    const startVoiceInput = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            setVoiceSupported(false);
            setError("Voice input is not supported in this browser. Please use Chrome, Edge, or Safari.");
            return;
        }

        const rec = new SpeechRecognition();
        rec.lang = "en-US";
        rec.interimResults = true;
        rec.continuous = false;
        recognitionRef.current = rec;
        setError("");

        let finalTranscript = input || "";
        rec.onresult = (e) => {
            let interim = "";
            for (let i = e.resultIndex; i < e.results.length; i++) {
                const transcript = e.results[i][0].transcript;
                if (e.results[i].isFinal) finalTranscript += (finalTranscript ? " " : "") + transcript;
                else interim += transcript;
            }
            setInput(finalTranscript + (interim ? " " + interim : ""));
            setError("");
        };
        rec.onend = () => setVoiceListening(false);
        rec.onerror = (event) => {
            const errorType = event.error;
            console.error("Voice input error:", errorType);

            const errorMessages = {
                'no-speech': 'No speech detected. Please try again.',
                'audio-capture': 'Microphone not found. Check audio permissions.',
                'network': 'Network error. Please try again.',
                'permission-denied': 'Microphone access denied. Enable audio permissions.',
                'aborted': 'Voice input was cancelled.',
                'service-not-allowed': 'Voice service unavailable in your region.'
            };

            const userMessage = errorMessages[errorType] || `Voice error: ${errorType}`;
            setError(userMessage);
            setVoiceListening(false);
        };

        setVoiceListening(true);
        rec.start();
    };

    const stopVoiceInput = () => {
        setVoiceListening(false);
        if (recognitionRef.current) recognitionRef.current.stop();
    };

    if (!isOpen) {
        return (
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="fixed bottom-6 right-6 z-50"
            >
                <Button
                    onClick={() => setIsOpen(true)}
                    className="h-14 w-14 rounded-full shadow-lg bg-orange-600 hover:bg-orange-700"
                    size="icon"
                >
                    <Bot className="w-6 h-6" />
                </Button>
            </motion.div>
        );
    }

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                className={`fixed ${isMinimized ? 'bottom-6 right-6' : 'bottom-6 right-6'} z-50`}
            >
                <Card className={`shadow-2xl border-2 border-orange-200 ${isMinimized ? 'w-80' : 'w-96 h-[600px]'} flex flex-col`}>
                    <CardHeader className="border-b bg-orange-50 py-3 px-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Bot className="w-5 h-5 text-orange-600" />
                                <CardTitle className="text-base">{agentTitle}</CardTitle>
                                <Badge variant="outline" className="text-xs bg-orange-100 text-orange-700 border-orange-300">
                                    AI
                                </Badge>
                            </div>
                            <div className="flex items-center gap-1">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() => setIsMinimized(!isMinimized)}
                                >
                                    {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() => setIsOpen(false)}
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </CardHeader>

                    {!isMinimized && (
                        <>
                            <CardContent className="flex-1 overflow-y-auto p-4 space-y-3">
                                {initError && (
                                    <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                                        <p className="font-medium mb-2">{initError}</p>
                                        <Button
                                            size="sm"
                                            onClick={initConversation}
                                            disabled={isInitializing}
                                            className="text-xs"
                                        >
                                            {isInitializing ? (
                                                <>
                                                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                                    Retrying...
                                                </>
                                            ) : (
                                                "Try Again"
                                            )}
                                        </Button>
                                    </div>
                                )}

                                {isInitializing && !initError && (
                                    <div className="flex items-center justify-center py-8 text-slate-500">
                                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                        <span className="text-sm">Initializing chat...</span>
                                    </div>
                                )}

                                {messages.length === 0 && !isInitializing && !initError && (
                                    <div className="text-center text-slate-500 text-sm mt-8">
                                        <Bot className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                                        <p>
                                            {agentName === 'kyle'
                                                ? "Ask Kyle, your Resume Expert!"
                                                : agentName === 'simon'
                                                ? "Ask Simon, insider Recruiter for the Company!"
                                                : `Ask me anything about ${agentTitle.toLowerCase()}!`}
                                        </p>
                                    </div>
                                )}

                                {messages.map((msg, idx) => {
                                    // Handle content that might be an object
                                    const contentText = typeof msg.content === 'string'
                                        ? msg.content
                                        : msg.content?.text || JSON.stringify(msg.content);

                                    return (
                                    <div
                                        key={idx}
                                        className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                                    >
                                        <div
                                            className={`max-w-[85%] rounded-lg px-4 py-2 ${
                                                msg.role === "user"
                                                    ? "bg-orange-600 text-white"
                                                    : "bg-slate-100 text-slate-800"
                                            }`}
                                        >
                                            <div className="text-sm prose prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                                                <ReactMarkdown>{contentText}</ReactMarkdown>
                                            </div>
                                        </div>
                                    </div>
                                    );
                                })}
                                {isLoading && (
                                    <div className="flex justify-start">
                                        <div className="bg-slate-100 rounded-lg px-4 py-2">
                                            <Loader2 className="w-4 h-4 animate-spin text-slate-600" />
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </CardContent>

                            <div className="border-t p-3 space-y-2">
                                {error && (
                                    <div className="p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                                        {error}
                                    </div>
                                )}
                                <div className="flex gap-2">
                                    <Textarea
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                        placeholder={
                                            agentName === 'kyle'
                                                ? "Ask Kyle, your Resume Expert!"
                                                : agentName === 'simon'
                                                ? "Ask Simon, insider Recruiter for the Company!"
                                                : "Type your message..."
                                        }
                                        className="resize-none h-10 min-h-0"
                                        disabled={isLoading || !conversation}
                                    />
                                    {voiceSupported && (
                                        <Button
                                            onClick={voiceListening ? stopVoiceInput : startVoiceInput}
                                            disabled={isLoading || !conversation}
                                            size="icon"
                                            variant={voiceListening ? "destructive" : "outline"}
                                            title={voiceListening ? "Stop voice input" : "Start voice input"}
                                        >
                                            {voiceListening ? (
                                                <MicOff className="w-4 h-4" />
                                            ) : (
                                                <Mic className="w-4 h-4" />
                                            )}
                                        </Button>
                                    )}
                                    <Button
                                        onClick={sendMessage}
                                        disabled={!input.trim() || isLoading || !conversation}
                                        size="icon"
                                        className="bg-orange-600 hover:bg-orange-700"
                                    >
                                        {isLoading ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Send className="w-4 h-4" />
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}

                    {isMinimized && (
                        <CardContent className="p-3">
                            <p className="text-xs text-slate-600 text-center">
                                Click to expand chat
                            </p>
                        </CardContent>
                    )}
                </Card>
            </motion.div>
        </AnimatePresence>
    );
}