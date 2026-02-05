import React, { useState, useEffect, useRef, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Send, Loader2, X, Minimize2, Maximize2, Bot, Mic, MicOff, RotateCcw, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { useAppContext } from "@/components/context/AppContextProvider";
import ChatErrorBoundary from "./ChatErrorBoundary";
import { AGENT_CONFIG, parseAgentFromResponse } from "./agentPrompts";

function AgentChatComponent({ agentName, agentTitle, context = {} }) {
    const { context: appContext, getContextSummary } = useAppContext();
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [conversation, setConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [pendingInput, setPendingInput] = useState(""); // For failed message retry
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [initError, setInitError] = useState("");
    const [isInitializing, setIsInitializing] = useState(false);
    const [voiceListening, setVoiceListening] = useState(false);
    const [voiceSupported, setVoiceSupported] = useState(true);

    // Refs for cleanup
    const isMountedRef = useRef(true);
    const recognitionRef = useRef(null);
    const messagesEndRef = useRef(null);
    const initTimeoutRef = useRef(null);
    const subscriptionRef = useRef(null);

    // Scroll to bottom when messages update
    useEffect(() => {
        if (messages.length > 0) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    // Cleanup on unmount
    useEffect(() => {
        isMountedRef.current = true;

        return () => {
            isMountedRef.current = false;

            // Clear init timeout
            if (initTimeoutRef.current) {
                clearTimeout(initTimeoutRef.current);
            }

            // Stop voice recognition
            if (recognitionRef.current) {
                try {
                    recognitionRef.current.stop();
                } catch (e) {
                    // Ignore errors on cleanup
                }
            }

            // Unsubscribe from conversation
            if (subscriptionRef.current) {
                subscriptionRef.current();
            }
        };
    }, []);

    // Initialize or retrieve conversation
    const initConversation = useCallback(async () => {
        if (!isMountedRef.current) return;

        setIsInitializing(true);
        setInitError("");

        // Set timeout for initialization
        initTimeoutRef.current = setTimeout(() => {
            if (isMountedRef.current) {
                setInitError("Chat initialization timed out. Please try again.");
                setIsInitializing(false);
            }
        }, 10000);

        try {
            // Check for existing conversation in sessionStorage
            const sessionKey = `agent-chat-${agentName}`;
            const existingConvId = sessionStorage.getItem(sessionKey);

            let conv;

            if (existingConvId) {
                // Try to retrieve existing conversation
                try {
                    // Attempt to get conversation (may not be implemented in SDK)
                    if (base44.agents.getConversation) {
                        conv = await base44.agents.getConversation(existingConvId);
                    } else {
                        // If getConversation not available, create new one
                        throw new Error("Retrieval not available");
                    }
                } catch (retrieveError) {
                    console.log("Could not retrieve conversation, creating new one:", retrieveError);
                    // Clear invalid session and create new
                    sessionStorage.removeItem(sessionKey);
                    conv = null;
                }
            }

            // Create new conversation if needed
            if (!conv) {
                const mergedContext = {
                    ...context,
                    currentPage: appContext?.currentPage,
                    currentTask: appContext?.currentTask,
                    contextSummary: getContextSummary()
                };

                // Note: base44 SDK doesn't use systemPrompt in metadata for kyle/simon agents
                // Each agent (build, kyle, simon) has pre-configured backend system prompts
                conv = await base44.agents.createConversation({
                    agent_name: agentName,
                    metadata: {
                        name: `${agentTitle} Chat`,
                        context: mergedContext,
                        appContext: appContext
                    }
                });

                // Store conversation ID in sessionStorage
                sessionStorage.setItem(sessionKey, conv.id);
            }

            if (initTimeoutRef.current) {
                clearTimeout(initTimeoutRef.current);
                initTimeoutRef.current = null;
            }

            if (isMountedRef.current) {
                setConversation(conv);
                setMessages(conv.messages || []);
                setInitError("");
            }
        } catch (e) {
            if (initTimeoutRef.current) {
                clearTimeout(initTimeoutRef.current);
                initTimeoutRef.current = null;
            }

            console.error("Failed to create conversation:", e);
            if (isMountedRef.current) {
                setInitError(e.message || "Failed to initialize chat. Please try again.");
            }
        } finally {
            if (isMountedRef.current) {
                setIsInitializing(false);
            }
        }
    }, [agentName, agentTitle, context, appContext, getContextSummary]);

    // Open chat and initialize conversation
    useEffect(() => {
        if (isOpen && !conversation) {
            initConversation();
        }
    }, [isOpen, conversation, initConversation]);

    // Subscribe to conversation updates
    useEffect(() => {
        if (!conversation) return;

        const unsubscribe = base44.agents.subscribeToConversation(conversation.id, (data) => {
            // DEBUG: Log raw response structure to diagnose [object Object] issues
            if (data?.messages && data.messages.length > 0) {
                const firstMsg = data.messages[data.messages.length - 1]; // Last message (most recent)
                console.log('[CHATBOT] SDK Response:', {
                    timestamp: new Date().toISOString(),
                    agentName: agentName,
                    messageCount: data.messages.length,
                    latestMessage: {
                        role: firstMsg?.role,
                        contentType: typeof firstMsg?.content,
                        contentIsArray: Array.isArray(firstMsg?.content),
                        contentKeys: firstMsg?.content ? Object.keys(firstMsg.content).slice(0, 5) : [],
                        contentPreview: typeof firstMsg?.content === 'string'
                            ? firstMsg.content.substring(0, 100)
                            : Array.isArray(firstMsg?.content)
                            ? `[Array: ${firstMsg.content.length} items]`
                            : JSON.stringify(firstMsg?.content).substring(0, 100)
                    }
                });
            }

            if (isMountedRef.current) {
                const newMessages = data?.messages || [];
                if (!Array.isArray(newMessages)) {
                    console.error('[CHATBOT] Expected messages to be an array:', newMessages);
                    return;
                }
                setMessages(newMessages);
            }
        });

        subscriptionRef.current = unsubscribe;

        return () => {
            if (subscriptionRef.current) {
                subscriptionRef.current();
                subscriptionRef.current = null;
            }
        };
    }, [conversation, agentName]);

    // Send message
    const sendMessage = useCallback(async () => {
        if (!input.trim() || !conversation) return;

        const userMessage = input.trim();
        setPendingInput(""); // Clear any pending retry
        setError("");
        setIsLoading(true);

        // Don't clear input yet - wait for success
        const originalInput = input;

        try {
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

            // Success - clear input
            if (isMountedRef.current) {
                setInput("");
            }
        } catch (e) {
            console.error("Failed to send message:", e);

            if (isMountedRef.current) {
                // Save failed message for retry
                setPendingInput(userMessage);
                setError(e.message || "Failed to send message. Click retry to try again.");
            }
        } finally {
            if (isMountedRef.current) {
                setIsLoading(false);
            }
        }
    }, [input, conversation, appContext, getContextSummary]);

    // Retry failed message
    const retryMessage = useCallback(() => {
        if (pendingInput) {
            setInput(pendingInput);
            setPendingInput("");
            setError("");
        }
    }, [pendingInput]);

    // Safe content extraction with comprehensive error handling
    const safeExtractContent = useCallback((msg) => {
        try {
            if (!msg || !msg.content) {
                return '';
            }

            // Type 1: String content (simplest case)
            if (typeof msg.content === 'string') {
                return msg.content;
            }

            // Type 2: True Array
            if (Array.isArray(msg.content)) {
                return msg.content
                    .map(block => {
                        if (typeof block === 'string') return block;
                        if (block && typeof block === 'object') {
                            try {
                                return block.text || block.content || block.message || JSON.stringify(block);
                            } catch (e) {
                                console.warn('[CHATBOT] Failed to stringify array block:', e);
                                return '[Unable to parse content block]';
                            }
                        }
                        return '';
                    })
                    .filter(Boolean)
                    .join('\n');
            }

            // Type 3: Object - could be sparse array or regular object
            if (typeof msg.content === 'object' && msg.content !== null) {
                // Check if it's a sparse array (numeric keys + length property)
                const keys = Object.keys(msg.content);
                const hasNumericKeys = keys.some(k => !isNaN(parseInt(k)));
                const hasLengthProp = 'length' in msg.content;

                if (hasNumericKeys && hasLengthProp) {
                    // Treat as sparse array - iterate by numeric index
                    console.log('[CHATBOT] Detected sparse array in content, extracting...');
                    const texts = [];
                    for (let i = 0; i < msg.content.length; i++) {
                        if (msg.content[i]) {
                            texts.push(String(msg.content[i]));
                        }
                    }
                    const result = texts.join('\n');
                    return result || '[Empty sparse array]';
                }

                // Regular object - try known properties
                if (msg.content.text) return msg.content.text;
                if (msg.content.message) return msg.content.message;
                if (msg.content.response) return msg.content.response;
                if (msg.content.content) return msg.content.content;

                // Fallback: stringify with error handling
                try {
                    const stringified = JSON.stringify(msg.content, null, 2);
                    if (stringified !== '{}' && stringified !== '[object Object]') {
                        console.warn('[CHATBOT] Falling back to JSON.stringify for content');
                        return stringified;
                    } else {
                        console.error('[CHATBOT] Empty object in content:', msg.content);
                        return '[Empty response object]';
                    }
                } catch (stringifyErr) {
                    console.error('[CHATBOT] Failed to stringify content:', stringifyErr);
                    return `[Error: ${stringifyErr.message}]`;
                }
            }

            return `Unexpected content type: ${typeof msg.content}`;
        } catch (error) {
            console.error('[CHATBOT] Error extracting content:', error, msg);
            return `Error processing response: ${error.message}`;
        }
    }, []);

    // Clear conversation history
    const clearHistory = useCallback(() => {
        const sessionKey = `agent-chat-${agentName}`;
        sessionStorage.removeItem(sessionKey);
        setConversation(null);
        setMessages([]);
        setError("");
        setInitError("");
        // Reinitialize
        if (isOpen) {
            initConversation();
        }
    }, [agentName, isOpen, initConversation]);

    // Handle keyboard shortcuts
    const handleKeyPress = useCallback((e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    }, [sendMessage]);

    // Voice recognition
    const startVoiceInput = useCallback(() => {
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

        let finalTranscript = "";

        rec.onresult = (e) => {
            let interim = "";
            for (let i = e.resultIndex; i < e.results.length; i++) {
                const transcript = e.results[i][0].transcript;
                if (e.results[i].isFinal) {
                    finalTranscript += (finalTranscript ? " " : "") + transcript;
                } else {
                    interim += transcript;
                }
            }

            if (isMountedRef.current) {
                setInput(prev => finalTranscript + (interim ? " " + interim : ""));
                setError("");
            }
        };

        rec.onend = () => {
            if (isMountedRef.current) {
                setVoiceListening(false);
            }
        };

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

            if (isMountedRef.current) {
                setError(errorMessages[errorType] || `Voice error: ${errorType}`);
                setVoiceListening(false);
            }
        };

        setVoiceListening(true);
        rec.start();
    }, []);

    const stopVoiceInput = useCallback(() => {
        if (isMountedRef.current) {
            setVoiceListening(false);
        }
        if (recognitionRef.current) {
            try {
                recognitionRef.current.stop();
            } catch (e) {
                // Ignore errors
            }
        }
    }, []);

    // Cleanup voice recognition on listening state change
    useEffect(() => {
        return () => {
            if (recognitionRef.current && voiceListening) {
                try {
                    recognitionRef.current.stop();
                } catch (e) {
                    // Ignore errors
                }
            }
        };
    }, [voiceListening]);

    // Get agent config for styling
    const agentConfig = AGENT_CONFIG[agentName] || AGENT_CONFIG.build;

    if (!isOpen) {
        return (
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="fixed bottom-6 right-6 z-50"
            >
                <Button
                    onClick={() => setIsOpen(true)}
                    className={`h-14 w-14 rounded-full shadow-lg ${agentConfig.buttonColor}`}
                    size="icon"
                >
                    <span className="text-2xl">{agentConfig.icon}</span>
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
                <Card className={`shadow-2xl border-2 ${agentConfig.headerBorder} ${isMinimized ? 'w-80' : 'w-96 h-[600px]'} flex flex-col`}>
                    <CardHeader className={`border-b ${agentConfig.headerBg} py-3 px-4`}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-xl">{agentConfig.icon}</span>
                                <CardTitle className="text-base">{agentConfig.fullName}</CardTitle>
                                <Badge variant="outline" className="text-xs bg-white/50 border-current">
                                    AI
                                </Badge>
                            </div>
                            <div className="flex items-center gap-1">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={clearHistory}
                                    title="Clear conversation history"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
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
                                    // Extract content safely with comprehensive error handling
                                    let contentText = safeExtractContent(msg);

                                    // If this is an assistant response, try to parse agent tags
                                    if (msg.role === 'assistant' && typeof contentText === 'string') {
                                        try {
                                            const parsed = parseAgentFromResponse(contentText);
                                            if (parsed?.cleanedResponse) {
                                                contentText = parsed.cleanedResponse;
                                                if (parsed.agent) {
                                                    console.log('[CHATBOT] Parsed agent response:', parsed.agent);
                                                }
                                            }
                                        } catch (parseErr) {
                                            console.warn('[CHATBOT] Failed to parse agent from response:', parseErr);
                                        }
                                    }

                                    // Final safety check for [object Object]
                                    if (!contentText || contentText.includes('[object Object]')) {
                                        console.error("[CHATBOT] Failed to extract text from message:", msg);
                                        contentText = "Sorry, I encountered an error processing that response. Please try again.";
                                    }

                                    // Use message ID if available, otherwise create stable key
                                    const messageKey = msg.id || `msg-${idx}-${msg.timestamp || Date.now()}`;

                                    return (
                                        <div
                                            key={messageKey}
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
                                    <div className="p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700 flex items-center justify-between">
                                        <span>{error}</span>
                                        {pendingInput && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={retryMessage}
                                                className="h-6 text-xs ml-2"
                                            >
                                                <RotateCcw className="w-3 h-3 mr-1" />
                                                Retry
                                            </Button>
                                        )}
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

// Export wrapped with error boundary
export default function AgentChat(props) {
    return (
        <ChatErrorBoundary agentName={props.agentName}>
            <AgentChatComponent {...props} />
        </ChatErrorBoundary>
    );
}