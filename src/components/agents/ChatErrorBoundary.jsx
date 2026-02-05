import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RotateCcw } from "lucide-react";

/**
 * Error Boundary for Agent Chat
 *
 * Catches React errors in chat components and provides recovery UI.
 * Errors are logged to console and could be sent to analytics/backend.
 *
 * Storage: Errors logged to browser console.
 * Optional: Can send to backend analytics service by uncommenting logErrorToService()
 */
export class ChatErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
            errorCount: 0
        };
    }

    static getDerivedStateFromError(error) {
        // Update state so next render shows fallback UI
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        // Log error details
        console.error("Chat Error Boundary caught an error:", error, errorInfo);

        // Special detection for [object Object] errors
        if (error.message && error.message.includes('object Object')) {
            console.error('[CHATBOT] DETECTED [object Object] ERROR:', {
                message: error.message,
                stack: error.stack,
                componentStack: errorInfo.componentStack,
                timestamp: new Date().toISOString()
            });
        }

        // Store error in component state for display
        this.setState(prevState => ({
            error,
            errorInfo,
            errorCount: prevState.errorCount + 1
        }));

        // Optional: Send error to analytics/monitoring service
        this.logErrorToService(error, errorInfo);
    }

    logErrorToService = (error, errorInfo) => {
        // Errors are stored in browser console by default
        // Uncomment below to send to backend analytics:

        /*
        try {
            // Example: Send to backend logging service
            fetch('/api/log-error', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    error: error.toString(),
                    errorInfo: errorInfo.componentStack,
                    timestamp: new Date().toISOString(),
                    userAgent: navigator.userAgent,
                    component: 'AgentChat'
                })
            });
        } catch (logError) {
            console.error("Failed to log error to service:", logError);
        }
        */

        // For now, errors are only logged to browser console
        console.log("Error logged locally. To enable remote logging, configure logErrorToService() method.");
    };

    handleReset = () => {
        // Clear error state and attempt recovery
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null
        });

        // Clear session storage for this chat to force fresh start
        if (this.props.agentName) {
            const sessionKey = `agent-chat-${this.props.agentName}`;
            sessionStorage.removeItem(sessionKey);
        }
    };

    render() {
        if (this.state.hasError) {
            // Error fallback UI
            return (
                <div className="fixed bottom-6 right-6 z-50">
                    <Card className="w-96 shadow-2xl border-2 border-red-200 bg-red-50">
                        <CardHeader className="border-b bg-red-100 py-3 px-4">
                            <div className="flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-red-600" />
                                <CardTitle className="text-base text-red-900">Chat Error</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4 space-y-3">
                            <div className="text-sm text-red-800">
                                <p className="font-medium mb-2">
                                    Something went wrong with the chat.
                                </p>
                                <p className="text-xs text-red-700 mb-3">
                                    The error has been logged. You can try restarting the chat.
                                </p>

                                {this.state.errorCount > 2 && (
                                    <div className="p-2 bg-red-100 border border-red-300 rounded text-xs mb-3">
                                        <p className="font-medium">Multiple errors detected ({this.state.errorCount})</p>
                                        <p className="mt-1">If this persists, try refreshing the page.</p>
                                    </div>
                                )}

                                {process.env.NODE_ENV === 'development' && this.state.error && (
                                    <details className="mt-3 p-2 bg-white border border-red-200 rounded text-xs">
                                        <summary className="cursor-pointer font-medium">Error Details (Dev Mode)</summary>
                                        <pre className="mt-2 overflow-auto max-h-40 text-xs">
                                            {this.state.error.toString()}
                                            {this.state.errorInfo?.componentStack}
                                        </pre>
                                    </details>
                                )}
                            </div>

                            <div className="flex gap-2">
                                <Button
                                    onClick={this.handleReset}
                                    className="flex-1 bg-red-600 hover:bg-red-700"
                                    size="sm"
                                >
                                    <RotateCcw className="w-4 h-4 mr-2" />
                                    Restart Chat
                                </Button>
                                <Button
                                    onClick={() => window.location.reload()}
                                    variant="outline"
                                    size="sm"
                                >
                                    Refresh Page
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            );
        }

        // No error, render children normally
        return this.props.children;
    }
}

export default ChatErrorBoundary;
