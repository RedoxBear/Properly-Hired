import React from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Users, Send, Bell } from "lucide-react";

const LOCAL_CHAT = "agent-team-chat";
const LOCAL_NOTIFICATIONS = "agent-notifications";

const loadLocal = (key) => {
    try {
        return JSON.parse(localStorage.getItem(key) || "[]");
    } catch (e) {
        return [];
    }
};

const saveLocal = (key, value) => {
    localStorage.setItem(key, JSON.stringify(value));
};

export default function TeamWorkspace() {
    const [channel, setChannel] = React.useState("general");
    const [messages, setMessages] = React.useState([]);
    const [notifications, setNotifications] = React.useState([]);
    const [input, setInput] = React.useState("");
    const [currentUser, setCurrentUser] = React.useState(null);

    React.useEffect(() => {
        base44.auth.me().then(setCurrentUser).catch(() => setCurrentUser(null));
    }, []);

    const loadMessages = React.useCallback(async () => {
        try {
            const entity = base44.entities?.AgentTeamChat;
            if (entity) {
                const data = await entity.filter({ channel }, "-created_date", 200);
                setMessages(data.reverse());
                return;
            }
            const local = loadLocal(LOCAL_CHAT);
            setMessages(local.filter((msg) => msg.channel === channel));
        } catch (e) {
            console.error("Failed to load team chat:", e);
            setMessages(loadLocal(LOCAL_CHAT).filter((msg) => msg.channel === channel));
        }
    }, [channel]);

    const loadNotifications = React.useCallback(async () => {
        try {
            const entity = base44.entities?.AgentNotification;
            if (entity) {
                const data = await entity.filter({}, "-created_date", 100);
                setNotifications(data);
                return;
            }
            setNotifications(loadLocal(LOCAL_NOTIFICATIONS));
        } catch (e) {
            console.error("Failed to load notifications:", e);
            setNotifications(loadLocal(LOCAL_NOTIFICATIONS));
        }
    }, []);

    React.useEffect(() => {
        loadMessages();
        const interval = setInterval(loadMessages, 5000);
        return () => clearInterval(interval);
    }, [loadMessages]);

    React.useEffect(() => {
        loadNotifications();
        const interval = setInterval(loadNotifications, 8000);
        return () => clearInterval(interval);
    }, [loadNotifications]);

    const sendMessage = async () => {
        if (!input.trim()) return;
        const payload = {
            id: `msg-${Date.now()}`,
            channel,
            message: input.trim(),
            created_at: new Date().toISOString(),
            created_by: currentUser?.email || "guest"
        };

        try {
            const entity = base44.entities?.AgentTeamChat;
            if (entity) {
                await entity.create(payload);
            } else {
                const local = loadLocal(LOCAL_CHAT);
                local.push(payload);
                saveLocal(LOCAL_CHAT, local);
            }
            setInput("");
            await loadMessages();
        } catch (e) {
            console.error("Failed to send message:", e);
        }
    };

    return (
        <div className="min-h-screen p-4 md:p-8 bg-gray-50">
            <div className="max-w-6xl mx-auto space-y-6">
                <div>
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-medium mb-3">
                        <Users className="w-4 h-4" />
                        Team Collaboration
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-slate-800">Team Workspace</h1>
                    <p className="text-slate-600">Real-time agent collaboration, shared notes, and notifications.</p>
                </div>

                <div className="grid gap-4 md:grid-cols-[2fr,1fr]">
                    <Card>
                        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                            <CardTitle>Agent Team Chat</CardTitle>
                            <Select value={channel} onValueChange={setChannel}>
                                <SelectTrigger className="w-48">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="general">General</SelectItem>
                                    <SelectItem value="kyle">Kyle Focus</SelectItem>
                                    <SelectItem value="simon">Simon Focus</SelectItem>
                                    <SelectItem value="cv_assistant">CV Assistant</SelectItem>
                                </SelectContent>
                            </Select>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="max-h-[360px] overflow-y-auto space-y-2 border rounded-lg p-3 bg-white">
                                {messages.length === 0 && (
                                    <p className="text-sm text-slate-500">No messages yet.</p>
                                )}
                                {messages.map((msg) => (
                                    <div key={msg.id} className="text-sm text-slate-700">
                                        <span className="font-medium">{msg.created_by}</span>: {msg.message}
                                        <div className="text-xs text-slate-400">{new Date(msg.created_at).toLocaleString()}</div>
                                    </div>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <Input
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Message the team..."
                                    onKeyPress={(e) => {
                                        if (e.key === "Enter") sendMessage();
                                    }}
                                />
                                <Button onClick={sendMessage} className="gap-2">
                                    <Send className="w-4 h-4" />
                                    Send
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Bell className="w-5 h-5 text-amber-600" />
                                Notifications
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 max-h-[420px] overflow-y-auto">
                            {notifications.length === 0 && (
                                <p className="text-sm text-slate-500">No notifications yet.</p>
                            )}
                            {notifications.map((note) => (
                                <div key={note.id} className="border rounded-lg p-2 bg-white">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline">{note.type || "update"}</Badge>
                                        <span className="text-xs text-slate-500">{new Date(note.created_at).toLocaleString()}</span>
                                    </div>
                                    <p className="text-sm text-slate-700">{note.message}</p>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
