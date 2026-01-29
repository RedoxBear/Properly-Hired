import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Send, Loader2, X, Minimize2, Maximize2, Bot } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";

export default function AgentChat({ agentName, agentTitle, context = {} }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [conversation, setConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const initConversation = async () => {
        try {
            const conv = await base44.agents.createConversation({
                agent_name: agentName,
                metadata: {
                    name: `${agentTitle} Chat`,
                    context: JSON.stringify(context)
                }
            });
            setConversation(conv);
            setMessages(conv.messages || []);
        } catch (e) {
            console.error("Failed to create conversation:", e);
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
        setInput("");
        setIsLoading(true);

        try {
            await base44.agents.addMessage(conversation, {
                role: "user",
                content: userMessage
            });
        } catch (e) {
            console.error("Failed to send message:", e);
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
                                {messages.length === 0 && (
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

                                {messages.map((msg, idx) => (
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
                                                <ReactMarkdown>{msg.content}</ReactMarkdown>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {isLoading && (
                                    <div className="flex justify-start">
                                        <div className="bg-slate-100 rounded-lg px-4 py-2">
                                            <Loader2 className="w-4 h-4 animate-spin text-slate-600" />
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </CardContent>

                            <div className="border-t p-3">
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
                                        disabled={isLoading}
                                    />
                                    <Button
                                        onClick={sendMessage}
                                        disabled={!input.trim() || isLoading}
                                        size="icon"
                                        className="bg-orange-600 hover:bg-orange-700"
                                    >
                                        <Send className="w-4 h-4" />
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