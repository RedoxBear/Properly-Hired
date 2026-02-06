import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { MessageSquare, Sparkles, Copy, Loader2, Check } from "lucide-react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";

export default function NetworkingMessages() {
  const [recipientName, setRecipientName] = React.useState("");
  const [recipientTitle, setRecipientTitle] = React.useState("");
  const [company, setCompany] = React.useState("");
  const [messageType, setMessageType] = React.useState("connection");
  const [context, setContext] = React.useState("");
  const [generatedMessage, setGeneratedMessage] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  const generateMessage = async () => {
    if (!recipientName || !recipientTitle || !company) {
      alert("Please fill in recipient details");
      return;
    }

    setLoading(true);
    setGeneratedMessage("");

    try {
      const messageTypePrompts = {
        connection: "a LinkedIn connection request (300 chars max, friendly, professional)",
        follow_up: "a follow-up message after connecting (mention previous interaction)",
        informational: "a request for an informational interview (explain why you're interested)",
        job_inquiry: "an inquiry about potential job opportunities",
        referral: "a request for a referral or introduction"
      };

      const prompt = `Generate a personalized networking message.

Recipient: ${recipientName}
Their Title: ${recipientTitle}
Company: ${company}
Message Type: ${messageTypePrompts[messageType]}
Additional Context: ${context || "None"}

Requirements:
- Sound genuine and human (not AI-generated)
- Be concise and respectful of their time
- Include a clear value proposition or reason for connecting
- Avoid clichés and generic phrases
- Use a warm but professional tone

Return JSON with the message and 2 alternative versions:
{
  "primary_message": string,
  "alternative_1": string,
  "alternative_2": string,
  "subject_line": string (if applicable)
}`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            primary_message: { type: "string" },
            alternative_1: { type: "string" },
            alternative_2: { type: "string" },
            subject_line: { type: "string" }
          }
        }
      });

      setGeneratedMessage(response.primary_message);
    } catch (err) {
      console.error(err);
      alert("Failed to generate message. Please try again.");
    }

    setLoading(false);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 rounded-full text-sm font-medium mb-4">
            <MessageSquare className="w-4 h-4" />
            AI Message Generator
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-2">
            Networking <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">Messages</span>
          </h1>
          <p className="text-lg text-slate-600">
            Generate personalized outreach messages with AI
          </p>
        </motion.div>

        <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm mb-6">
          <CardHeader>
            <CardTitle>Message Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Recipient Name</Label>
                <Input
                  placeholder="e.g., Sarah Johnson"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                />
              </div>
              <div>
                <Label>Their Job Title</Label>
                <Input
                  placeholder="e.g., Senior Recruiter"
                  value={recipientTitle}
                  onChange={(e) => setRecipientTitle(e.target.value)}
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Company</Label>
                <Input
                  placeholder="e.g., Google"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                />
              </div>
              <div>
                <Label>Message Type</Label>
                <Select value={messageType} onValueChange={setMessageType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="connection">Connection Request</SelectItem>
                    <SelectItem value="follow_up">Follow-up Message</SelectItem>
                    <SelectItem value="informational">Informational Interview</SelectItem>
                    <SelectItem value="job_inquiry">Job Inquiry</SelectItem>
                    <SelectItem value="referral">Referral Request</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Additional Context (Optional)</Label>
              <Textarea
                placeholder="Any specific details you want to include (e.g., 'We met at the Tech Conference', 'I'm transitioning from marketing to product management')"
                value={context}
                onChange={(e) => setContext(e.target.value)}
                className="min-h-[80px]"
              />
            </div>

            <Button
              onClick={generateMessage}
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Message
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {generatedMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="shadow-xl border-0 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Generated Message</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={copyToClipboard}
                    className="gap-2"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 text-green-600" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy
                      </>
                    )}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-white rounded-lg p-4 border-2 border-purple-200">
                  <p className="text-slate-700 whitespace-pre-wrap">{generatedMessage}</p>
                </div>
                <div className="mt-4 p-4 bg-purple-100 rounded-lg border border-purple-200">
                  <p className="text-sm text-purple-800">
                    <strong>💡 Pro Tip:</strong> Personalize this message further by adding specific details about why you're interested in connecting with this person. AI-generated messages work best as a starting point!
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}