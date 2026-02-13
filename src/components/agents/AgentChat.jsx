import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { MessageCircle, Send, Loader2, X, Minimize2, Maximize2, Bot, Mic, MicOff, RotateCcw, Trash2, ChevronRight, ChevronLeft, Minus, ThumbsUp, ThumbsDown, AtSign, Share2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { useAppContext } from "@/context/AppContextProvider";
import { canPerformAction, getTierLimit, getWeekStart } from "@/components/utils/accessControl";
import { readEvents, logEvent } from "@/components/utils/telemetry";
import ChatErrorBoundary from "./ChatErrorBoundary";
import { AGENT_CONFIG, parseAgentFromResponse } from "./agentPrompts";

function AgentChatComponent({ agentName, agentTitle, context = {}, autoOpen = false, initialMessage = "", autoSendInitial = false }) {
    const { context: appContext, getContextSummary } = useAppContext();
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [conversation, setConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [pendingInput, setPendingInput] = useState(""); // For failed message retry
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [info, setInfo] = useState("");
    const [initError, setInitError] = useState("");
    const [isInitializing, setIsInitializing] = useState(false);
    const [voiceListening, setVoiceListening] = useState(false);
    const [voiceSupported, setVoiceSupported] = useState(true);
    const [currentUser, setCurrentUser] = useState(null);
    const [handoffContext, setHandoffContext] = useState(null);
    const [feedbackState, setFeedbackState] = useState({});
    const [feedbackComment, setFeedbackComment] = useState("");
    const [externalResources, setExternalResources] = useState([]);
    const [chatUsageCount, setChatUsageCount] = useState(0);
    const dockKey = `chatDocked_${agentName}`;
    const expandKey = `chatExpanded_${agentName}`;
    const [isDocked, setIsDocked] = useState(() => localStorage.getItem(dockKey) === "true");
    const [isExpanded, setIsExpanded] = useState(() => localStorage.getItem(expandKey) === "true");
    const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
    const autoSentRef = useRef(false);

    // Refs for cleanup
    const isMountedRef = useRef(true);
    const recognitionRef = useRef(null);
    const messagesEndRef = useRef(null);
    const initTimeoutRef = useRef(null);
    const subscriptionRef = useRef(null);
    const handoffSentRef = useRef(false);
    const infoTimeoutRef = useRef(null);

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

            if (infoTimeoutRef.current) {
                clearTimeout(infoTimeoutRef.current);
            }
        };
    }, []);

    // Fetch current user for message metadata
    useEffect(() => {
        const fetchUser = async () => {
            try {
                const user = await base44.auth.me();
                if (isMountedRef.current) {
                    setCurrentUser(user);
                }
            } catch (e) {
                console.error("Failed to fetch current user:", e);
            }
        };
        fetchUser();
    }, []);

    useEffect(() => {
        const loadUsage = async () => {
            try {
                const weekStart = getWeekStart();
                const events = await readEvents();
                const count = events.filter((ev) => ev.type === "agent_chat_used" && new Date(ev.ts) >= weekStart).length;
                setChatUsageCount(count);
            } catch (e) {
                console.warn("Failed to load chat usage:", e);
            }
        };
        loadUsage();
    }, []);

    useEffect(() => {
        const onResize = () => {
            const mobileNow = window.innerWidth < 768;
            setIsMobile(mobileNow);
            if (mobileNow && isDocked) {
                setIsDocked(false);
            }
        };
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, [isDocked]);

    useEffect(() => {
        const mountedKey = "agent-chat-mounted";
        try {
            const list = JSON.parse(sessionStorage.getItem(mountedKey) || "[]");
            if (!list.includes(agentName)) {
                list.push(agentName);
                sessionStorage.setItem(mountedKey, JSON.stringify(list));
            }
        } catch (e) {
            console.warn("Failed to register mounted agent:", e);
        }

        const autoKey = "agent-chat-autopen";
        if (localStorage.getItem(autoKey) === agentName) {
            localStorage.removeItem(autoKey);
            setIsOpen(true);
        }

        return () => {
            try {
                const list = JSON.parse(sessionStorage.getItem(mountedKey) || "[]");
                const next = list.filter((item) => item !== agentName);
                sessionStorage.setItem(mountedKey, JSON.stringify(next));
            } catch (e) {
                // ignore
            }
        };
    }, [agentName]);

    useEffect(() => {
        localStorage.setItem(dockKey, String(isDocked));
    }, [dockKey, isDocked]);

    useEffect(() => {
        localStorage.setItem(expandKey, String(isExpanded));
    }, [expandKey, isExpanded]);

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
                        appContext: appContext,
                        handoff_context: handoffContext || null
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

    useEffect(() => {
        if (autoOpen) {
            setIsOpen(true);
        }
    }, [autoOpen]);

    useEffect(() => {
        const loadResources = async () => {
            try {
                const data = await base44.entities.AgentExternalResource.filter({}, "-created_date", 200);
                setExternalResources(data || []);
            } catch (e) {
                console.error("Failed to load external resources:", e);
            }
        };
        loadResources();
    }, []);

    useEffect(() => {
        const stored = sessionStorage.getItem(`agent-handoff-${agentName}`);
        if (stored) {
            try {
                setHandoffContext(JSON.parse(stored));
                setIsOpen(true);
            } catch (e) {
                console.warn("Failed to parse handoff context:", e);
            }
        }
    }, [agentName]);

    useEffect(() => {
        const handler = (event) => {
            if (event?.detail?.target !== agentName) return;
            setHandoffContext(event.detail);
            setIsOpen(true);
            sessionStorage.setItem(`agent-handoff-${agentName}`, JSON.stringify(event.detail));
        };
        window.addEventListener("agent-handoff", handler);
        return () => window.removeEventListener("agent-handoff", handler);
    }, [agentName]);

    // Subscribe to conversation updates
    useEffect(() => {
        if (!conversation) return;

        if (!base44.agents?.subscribeToConversation) {
            console.warn("[CHATBOT] subscribeToConversation not available in SDK.");
            return;
        }

        const unsubscribe = base44.agents.subscribeToConversation(conversation.id, (data) => {

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
    const sendMessageWithContent = useCallback(async (userMessage) => {
        if (!userMessage || !conversation) return;

        if (currentUser) {
            const allowed = canPerformAction(currentUser, "agent_chat", chatUsageCount);
            if (!allowed) {
                const limit = getTierLimit(currentUser, "agent_chat");
                setError(
                    limit === -1
                        ? "Agent chat is currently unavailable. Please try again later."
                        : `You've used all ${limit} AI agent chat credits this week. Upgrade for more.`
                );
                return;
            }
        }

        setPendingInput(""); // Clear any pending retry
        setError("");
        setInfo("");
        setIsLoading(true);

        try {
            // Send message with required metadata fields for Base44 API
            const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
            await base44.agents.addMessage(conversation, {
                role: "user",
                content: userMessage.trim(),
                metadata: {
                    created_date: today,
                    created_by_email: currentUser?.email || "unknown@example.com"
                }
            });

            try {
                await logEvent({
                    type: "agent_chat_used",
                    ts: new Date().toISOString(),
                    agent: agentName
                });
                if (isMountedRef.current) {
                    setChatUsageCount((prev) => prev + 1);
                }
            } catch (logErr) {
                console.warn("Failed to log chat usage:", logErr);
            }

            // Success - clear input
            if (isMountedRef.current) {
                setInput("");
            }
        } catch (e) {
            console.error("Failed to send message:", e);

            if (isMountedRef.current) {
                // Save failed message for retry
                setPendingInput(userMessage.trim());
                setError(e.message || "Failed to send message. Click retry to try again.");
            }
        } finally {
            if (isMountedRef.current) {
                setIsLoading(false);
            }
        }
    }, [conversation, currentUser]);

    useEffect(() => {
        if (!conversation || !handoffContext || handoffSentRef.current) return;
        const from = handoffContext.fromAgent || "another agent";
        const summary = handoffContext.summary || handoffContext.context?.summary || "";
        const highlights = handoffContext.context?.highlights || [];
        const payload = [
            `Handoff from ${from}:`,
            summary ? `Summary: ${summary}` : "",
            highlights.length ? `Key points: ${highlights.join("; ")}` : ""
        ].filter(Boolean).join("\n");

        if (payload) {
            handoffSentRef.current = true;
            sendMessageWithContent(payload);
        }
    }, [conversation, handoffContext, sendMessageWithContent]);

    useEffect(() => {
        if (!info) return;
        if (infoTimeoutRef.current) {
            clearTimeout(infoTimeoutRef.current);
        }
        infoTimeoutRef.current = setTimeout(() => {
            if (isMountedRef.current) {
                setInfo("");
            }
        }, 3500);
    }, [info]);

    const sendMessage = useCallback(async () => {
        if (!input.trim() || !conversation) return;
        await sendMessageWithContent(input.trim());
    }, [input, conversation, sendMessageWithContent]);

    useEffect(() => {
        if (!autoSendInitial || !initialMessage || !conversation) return;
        if (autoSentRef.current) return;
        if (messages.length > 0 || isLoading) return;
        autoSentRef.current = true;
        sendMessageWithContent(initialMessage);
    }, [autoSendInitial, initialMessage, conversation, messages.length, isLoading, sendMessageWithContent]);

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
            if (!msg) {
                return '';
            }

            // Empty or no content - may be waiting for response
            if (!msg.content) {
                console.warn('[CHATBOT] No content in message - may still be loading');
                return '';
            }

            // Type 1: String content (simplest case)
            if (typeof msg.content === 'string') {
                if (msg.content === '') {
                    console.warn('[CHATBOT] Empty string content for message:', msg.id);
                }
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

    const filteredMessages = useMemo(() => {
        if (!messages.length) return [];
        const result = [];
        let lastAssistantContent = null;

        for (const msg of messages) {
            let contentText = safeExtractContent(msg);

            if (msg.role === "assistant" && typeof contentText === "string") {
                try {
                    const parsed = parseAgentFromResponse(contentText);
                    if (parsed?.cleanedResponse) {
                        contentText = parsed.cleanedResponse;
                    }
                } catch (parseErr) {
                    console.warn("[CHATBOT] Failed to parse agent from response:", parseErr);
                }
            }

            if (!contentText || (typeof contentText === "string" && contentText.includes("[object Object]"))) {
                if (msg.role === "assistant") {
                    console.warn("[CHATBOT] Skipping non-text assistant message:", msg);
                    continue;
                }
                contentText = contentText || "";
            }

            const normalized = typeof contentText === "string"
                ? contentText.replace(/\s+/g, " ").trim()
                : "";

            if (msg.role === "assistant") {
                if (!normalized) {
                    continue;
                }
                if (normalized === lastAssistantContent) {
                    continue;
                }
                lastAssistantContent = normalized;
            }

            result.push({ msg, contentText });
        }

        return result;
    }, [messages, safeExtractContent]);

    const MAX_RENDERED_MESSAGES = 80;
    const displayedMessages = useMemo(
        () => filteredMessages.slice(-MAX_RENDERED_MESSAGES),
        [filteredMessages]
    );

    useEffect(() => {
        if (!conversation?.id || displayedMessages.length === 0) return;
        const key = "agent-search-index";
        const existing = JSON.parse(localStorage.getItem(key) || "[]");
        const summary = displayedMessages.slice(-4).map((item) => item.contentText).join(" | ").slice(0, 700);
        const payload = {
            id: `conv-${conversation.id}`,
            type: "conversation",
            agent: agentName,
            message: summary,
            created_at: new Date().toISOString(),
            conversation_id: conversation.id
        };
        const next = existing.filter((item) => item.id !== payload.id);
        next.unshift(payload);
        localStorage.setItem(key, JSON.stringify(next.slice(0, 200)));
    }, [agentName, conversation?.id, displayedMessages]);

    const lastAssistant = useMemo(() => {
        for (let i = displayedMessages.length - 1; i >= 0; i--) {
            const item = displayedMessages[i];
            if (item.msg?.role === "assistant") return item;
        }
        return null;
    }, [displayedMessages]);

    const lastUserMessage = useMemo(() => {
        for (let i = displayedMessages.length - 1; i >= 0; i--) {
            const item = displayedMessages[i];
            if (item.msg?.role === "user") return item.contentText || "";
        }
        return "";
    }, [displayedMessages]);

    const suggestedResources = useMemo(() => {
        if (!lastUserMessage || externalResources.length === 0) return [];
        const tokens = lastUserMessage.toLowerCase().split(/\W+/).filter(Boolean);
        return externalResources
            .filter((resource) => {
                if (resource.audience && resource.audience !== "all" && resource.audience !== agentName) return false;
                const haystack = `${resource.title} ${resource.description || ""} ${(resource.tags || []).join(" ")}`.toLowerCase();
                return tokens.some((token) => haystack.includes(token));
            })
            .slice(0, 3);
    }, [lastUserMessage, externalResources, agentName]);

    const buildContextPack = useCallback(() => {
        const recent = displayedMessages.slice(-6);
        const summary = recent
            .map((item) => `${item.msg?.role || "assistant"}: ${item.contentText}`)
            .join(" | ")
            .slice(0, 700);
        const highlights = recent
            .filter((item) => item.msg?.role === "assistant")
            .slice(-3)
            .map((item) => item.contentText)
            .filter(Boolean);
        return {
            summary,
            highlights,
            messages: recent.map((item) => ({
                role: item.msg?.role,
                content: item.contentText
            }))
        };
    }, [displayedMessages]);

    const persistFeedback = useCallback(async (payload) => {
        const entity = base44.entities?.AgentFeedback;
        if (entity) {
            await entity.create(payload);
            return;
        }
        const key = "agent-feedback-store";
        const existing = JSON.parse(localStorage.getItem(key) || "[]");
        existing.push(payload);
        localStorage.setItem(key, JSON.stringify(existing));
    }, []);

    const notifyAdmin = useCallback(async (message, type = "feedback") => {
        const payload = {
            id: `note-${Date.now()}`,
            type,
            message,
            created_at: new Date().toISOString(),
            created_by: currentUser?.email || ""
        };
        try {
            const entity = base44.entities?.AgentNotification;
            if (entity) {
                await entity.create(payload);
                return;
            }
            const key = "agent-notifications";
            const existing = JSON.parse(localStorage.getItem(key) || "[]");
            existing.unshift(payload);
            localStorage.setItem(key, JSON.stringify(existing));
        } catch (e) {
            console.error("Failed to create notification:", e);
        }
    }, [currentUser?.email]);

    const submitFeedback = useCallback(async (rating) => {
        if (!lastAssistant?.msg) return;
        const messageId = lastAssistant.msg.id || lastAssistant.msg.timestamp || `msg-${Date.now()}`;
        const payload = {
            agent_name: agentName,
            conversation_id: conversation?.id || "",
            message_id: messageId,
            rating,
            comment: feedbackComment.trim(),
            created_at: new Date().toISOString(),
            user_email: currentUser?.email || ""
        };

        try {
            await persistFeedback(payload);
            await notifyAdmin(`Feedback received for ${agentName}: ${rating > 0 ? "helpful" : "not helpful"}.`, "feedback");
            setFeedbackState((prev) => ({ ...prev, [messageId]: { rating, comment: payload.comment } }));
            setFeedbackComment("");
            setInfo("Thanks for the feedback.");
        } catch (e) {
            console.error("Failed to save feedback:", e);
            setError("Could not save feedback. Please try again.");
        }
    }, [agentName, conversation?.id, currentUser?.email, feedbackComment, lastAssistant, persistFeedback]);

    const createInboxItem = useCallback(async (targetAgent) => {
        const contextPack = buildContextPack();
        const lower = (contextPack.summary || "").toLowerCase();
        const priority = /urgent|asap|deadline|high priority|immediately/.test(lower) ? "high" : "normal";
        const payload = {
            id: `inbox-${Date.now()}`,
            from_agent: agentName,
            to_agent: targetAgent,
            conversation_id: conversation?.id || "",
            summary: contextPack.summary,
            highlights: contextPack.highlights,
            priority,
            messages: contextPack.messages,
            status: "open",
            created_at: new Date().toISOString(),
            created_by: currentUser?.email || ""
        };

        try {
            const entity = base44.entities?.AgentCollabInbox;
            if (entity) {
                await entity.create(payload);
                await notifyAdmin(`${agentName} tagged ${targetAgent} in shared inbox.`, "collab");
                setInfo(`Tagged ${targetAgent} in shared inbox.`);
                return;
            }
            const key = "agent-collab-inbox";
            const existing = JSON.parse(localStorage.getItem(key) || "[]");
            existing.unshift(payload);
            localStorage.setItem(key, JSON.stringify(existing));
            await notifyAdmin(`${agentName} tagged ${targetAgent} in shared inbox.`, "collab");
            setInfo(`Tagged ${targetAgent} in shared inbox.`);
        } catch (e) {
            console.error("Failed to add inbox item:", e);
            setError("Could not tag agent. Please try again.");
        }
    }, [agentName, buildContextPack, conversation?.id, currentUser?.email, notifyAdmin]);

    const handoffToAgent = useCallback((targetAgent) => {
        const mountedKey = "agent-chat-mounted";
        let isMounted = false;
        try {
            const list = JSON.parse(sessionStorage.getItem(mountedKey) || "[]");
            isMounted = list.includes(targetAgent);
        } catch (e) {
            isMounted = false;
        }
        const contextPack = buildContextPack();
        const payload = {
            target: targetAgent,
            fromAgent: agentName,
            summary: contextPack.summary,
            context: contextPack,
            conversationId: conversation?.id || "",
            createdAt: new Date().toISOString()
        };
        sessionStorage.setItem(`agent-handoff-${targetAgent}`, JSON.stringify(payload));
        window.dispatchEvent(new CustomEvent("agent-handoff", { detail: payload }));
        if (!isMounted) {
            localStorage.setItem("agent-chat-autopen", targetAgent);
            setInfo(`${targetAgent} chat isn't open on this page. Open it to receive the handoff.`);
        } else {
            setInfo(`Handoff sent to ${targetAgent}.`);
        }
    }, [agentName, buildContextPack, conversation?.id]);

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
                    title={`Open ${agentConfig.fullName} chat`}
                    aria-label={`Open ${agentConfig.fullName} chat`}
                >
                    <span className="text-2xl">{agentConfig.icon}</span>
                </Button>
            </motion.div>
        );
    }

    const containerClass = isDocked && !isMobile
        ? "fixed right-0 top-0 bottom-0 z-50"
        : isMobile
            ? "fixed left-0 right-0 bottom-0 z-50"
            : "fixed bottom-6 right-6 z-50";

    const cardClass = isDocked && !isMobile
        ? (isMinimized ? "h-16 w-[380px] max-w-[45vw]" : "h-full w-[380px] max-w-[45vw]")
        : isMobile
            ? (isMinimized ? "w-full h-16" : (isExpanded ? "w-full h-[85vh]" : "w-full h-[45vh]"))
            : (isMinimized ? "w-80 h-16" : (isExpanded ? "w-[520px] h-[70vh]" : "w-96 h-[600px]"));

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                className={containerClass}
            >
                <Card className={`shadow-2xl border-2 ${agentConfig.headerBorder} ${cardClass} flex flex-col dark:bg-slate-900 dark:border-slate-700`}>
                    <CardHeader className={`border-b ${agentConfig.headerBg} py-3 px-4 dark:border-slate-700`}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-xl">{agentConfig.icon}</span>
                                <CardTitle
                                    className="text-base dark:text-slate-100"
                                    title={`Chatting with ${agentConfig.fullName}`}
                                    aria-label={`Chatting with ${agentConfig.fullName}`}
                                >
                                    {agentConfig.fullName}
                                </CardTitle>
                                <Badge variant="outline" className="text-xs bg-white/50 border-current dark:bg-slate-800">
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
                                    aria-label="Clear conversation history"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                                {!isMobile && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7"
                                        onClick={() => setIsDocked(!isDocked)}
                                        title={isDocked ? "Undock" : "Dock Right"}
                                        aria-label={isDocked ? "Undock" : "Dock Right"}
                                    >
                                        {isDocked ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                                    </Button>
                                )}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() => setIsExpanded(!isExpanded)}
                                    title={isExpanded ? "Shrink" : "Expand"}
                                    aria-label={isExpanded ? "Shrink" : "Expand"}
                                >
                                    {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() => setIsMinimized(!isMinimized)}
                                    title={isMinimized ? "Restore" : "Minimize"}
                                    aria-label={isMinimized ? "Restore" : "Minimize"}
                                >
                                    {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() => setIsOpen(false)}
                                    title="Close"
                                    aria-label="Close"
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </CardHeader>

                    {!isMinimized && (
                        <>
                            <CardContent className="flex-1 overflow-y-auto p-4 space-y-3 dark:text-slate-100">
                                {initError && (
                                    <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700 dark:bg-red-950 dark:border-red-900 dark:text-red-200">
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
                                    <div className="flex items-center justify-center py-8 text-slate-500 dark:text-slate-400">
                                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                        <span className="text-sm">Initializing chat...</span>
                                    </div>
                                )}

                                {filteredMessages.length === 0 && !isInitializing && !initError && (
                                    <div className="text-center text-slate-500 dark:text-slate-400 text-sm mt-8">
                                        <Bot className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                                        <p>
                                            {agentName === 'kyle'
                                                ? "Ask Kyle, your Resume Expert!"
                                                : agentName === 'simon'
                                                ? "Ask Simon, insider Recruiter for the Company!"
                                                : `Ask me anything about ${agentTitle.toLowerCase()}!`}
                                        </p>
                                    </div>
                                )}

                                {displayedMessages.map(({ msg, contentText }, idx) => {
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
                                                        : "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100"
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
                                        <div className="bg-slate-100 dark:bg-slate-800 rounded-lg px-4 py-2">
                                            <Loader2 className="w-4 h-4 animate-spin text-slate-600 dark:text-slate-300" />
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </CardContent>

                            <div className="border-t p-3 space-y-2 dark:border-slate-700">
                                {error && (
                                    <div className="p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700 flex items-center justify-between dark:bg-red-950 dark:border-red-900 dark:text-red-200">
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
                                {info && (
                                    <div className="p-2 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-700 dark:bg-emerald-950 dark:border-emerald-900 dark:text-emerald-200">
                                        {info}
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
                                        className="resize-none h-10 min-h-0 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700"
                                        disabled={isLoading || !conversation}
                                    />
                                    {voiceSupported && (
                                        <Button
                                            onClick={voiceListening ? stopVoiceInput : startVoiceInput}
                                            disabled={isLoading || !conversation}
                                            size="icon"
                                            variant={voiceListening ? "destructive" : "outline"}
                                            title={voiceListening ? "Stop voice input" : "Start voice input"}
                                            aria-label={voiceListening ? "Stop voice input" : "Start voice input"}
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
                                        aria-label="Send message"
                                    >
                                        {isLoading ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Send className="w-4 h-4" />
                                        )}
                                    </Button>
                                </div>
                                <div className="flex flex-col gap-2">
                                    {lastAssistant && !isLoading && (() => {
                                        const messageId = lastAssistant.msg.id || lastAssistant.msg.timestamp || "last";
                                        const feedback = feedbackState[messageId];
                                        if (!lastAssistant.contentText || !String(lastAssistant.contentText).trim()) {
                                            return null;
                                        }
                                        return (
                                            <div className="border rounded-lg p-2 bg-slate-50 dark:bg-slate-900 dark:border-slate-700">
                                                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                                                    <span className="font-medium">Was this helpful?</span>
                                                    <Button
                                                        size="sm"
                                                        variant={feedback?.rating === 1 ? "default" : "outline"}
                                                        className="h-7 px-2"
                                                        onClick={() => submitFeedback(1)}
                                                    >
                                                        <ThumbsUp className="w-3 h-3 mr-1" />
                                                        Yes
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant={feedback?.rating === -1 ? "default" : "outline"}
                                                        className="h-7 px-2"
                                                        onClick={() => submitFeedback(-1)}
                                                    >
                                                        <ThumbsDown className="w-3 h-3 mr-1" />
                                                        No
                                                    </Button>
                                                    {feedback?.rating && (
                                                        <span className="text-emerald-600 dark:text-emerald-300">Thanks for the feedback.</span>
                                                    )}
                                                </div>
                                                {!feedback?.rating && (
                                                    <Input
                                                        value={feedbackComment}
                                                        onChange={(e) => setFeedbackComment(e.target.value)}
                                                        placeholder="Optional: short note to improve future responses"
                                                        className="mt-2 h-8 text-xs dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700"
                                                    />
                                                )}
                                            </div>
                                        );
                                    })()}
                                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                        <span className="font-medium">Collaborate:</span>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-7 px-2"
                                            onClick={() => createInboxItem(agentName === "kyle" ? "simon" : "kyle")}
                                        >
                                            <AtSign className="w-3 h-3 mr-1" />
                                            Tag {agentName === "kyle" ? "Simon" : "Kyle"}
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-7 px-2"
                                            onClick={() => handoffToAgent(agentName === "kyle" ? "simon" : "kyle")}
                                        >
                                            <Share2 className="w-3 h-3 mr-1" />
                                            Handoff
                                        </Button>
                                        <span className="text-[11px]">Transfers last 6 messages as context.</span>
                                    </div>
                                    {suggestedResources.length > 0 && (
                                        <div className="border rounded-lg p-2 bg-white dark:bg-slate-900 dark:border-slate-700">
                                            <p className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-2">Suggested resources</p>
                                            <div className="space-y-1 text-xs">
                                                {suggestedResources.map((resource) => (
                                                    <div key={resource.id} className="flex flex-col">
                                                        <span className="font-semibold text-slate-700 dark:text-slate-200">{resource.title}</span>
                                                        <a
                                                            href={resource.url}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="text-blue-600 dark:text-blue-400 break-all"
                                                        >
                                                            {resource.url}
                                                        </a>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
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
