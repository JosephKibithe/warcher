import { useState, useRef, useEffect, useMemo } from "react";
import {
  FileText,
  AlertTriangle,
  Send,
  Bot,
  User,
  Loader2,
  MessageSquare,
  RotateCcw,
} from "lucide-react";
import { generateSitRep, type Article } from "../services/api";
import {
  chatWithSitrep,
  isGeminiConfigured,
  resetChat,
} from "../services/gemini";

interface SitRepProps {
  articles: Article[];
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export function SitRep({ articles }: SitRepProps) {
  const [activeTab, setActiveTab] = useState<"briefing" | "chat">("briefing");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const sitrep = useMemo(() => generateSitRep(articles), [articles]);

  // Calculate escalation level
  const highPriorityCount = articles.filter(
    (a) => a.priority === "HIGH",
  ).length;
  const escalationScore = Math.min(10, Math.ceil(highPriorityCount / 2) + 3);
  const escalationLevel =
    escalationScore >= 7
      ? "CRITICAL"
      : escalationScore >= 5
        ? "ELEVATED"
        : "MODERATE";

  const getEscalationColor = () => {
    if (escalationScore >= 7) return "text-red-500";
    if (escalationScore >= 5) return "text-orange-500";
    return "text-yellow-500";
  };

  const lines = sitrep.split("\n");

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Welcome message when switching to chat
  useEffect(() => {
    if (activeTab === "chat" && messages.length === 0) {
      const geminiReady = isGeminiConfigured();
      setMessages([
        {
          role: "assistant",
          content: geminiReady
            ? "WARCHER AI online. I have access to the current intelligence feed. Ask me about ongoing conflicts, military operations, escalation risks, or request analysis on specific developments."
            : "⚠️ COMMS OFFLINE: No Gemini API key detected. Add VITE_GEMINI_API_KEY to your .env.local file to enable AI analysis. Get a free key at aistudio.google.com/apikey",
          timestamp: new Date(),
        },
      ]);
    }
  }, [activeTab, messages.length]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await chatWithSitrep(userMessage.content, articles);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: response,
          timestamp: new Date(),
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "COMMS ERROR: Failed to reach AI analysis backend. Check your connection and API key.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleReset = () => {
    resetChat();
    setMessages([
      {
        role: "assistant",
        content:
          "Chat history cleared. WARCHER AI ready for new analysis queries.",
        timestamp: new Date(),
      },
    ]);
  };

  return (
    <div className="glass rounded-lg overflow-hidden">
      {/* Header with tabs */}
      <div className="border-b border-gray-800 bg-[#0f0f14]">
        <div className="flex items-center justify-between p-3 pb-0">
          <div className="flex items-center gap-2">
            {activeTab === "briefing" ? (
              <FileText className="w-4 h-4 text-cyan-500" />
            ) : (
              <Bot className="w-4 h-4 text-emerald-500" />
            )}
            <h2 className="text-sm font-bold tracking-wider text-cyan-400">
              {activeTab === "briefing" ? "AI SITREP" : "WARCHER AI"}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {activeTab === "chat" && (
              <button
                onClick={handleReset}
                className="text-gray-500 hover:text-cyan-400 transition-colors p-1"
                title="Reset chat"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            )}
            <span className="text-xs text-gray-500">
              {activeTab === "briefing" ? "AUTO" : "LIVE"}
            </span>
            <div
              className={`w-2 h-2 ${activeTab === "briefing" ? "bg-green-500" : "bg-emerald-500"} rounded-full animate-pulse`}
            />
          </div>
        </div>

        {/* Tab buttons */}
        <div className="flex gap-0 px-3 mt-2">
          <button
            onClick={() => setActiveTab("briefing")}
            className={`px-3 py-1.5 text-[10px] font-bold tracking-wider border-b-2 transition-all ${
              activeTab === "briefing"
                ? "text-cyan-400 border-cyan-500"
                : "text-gray-500 border-transparent hover:text-gray-300"
            }`}
          >
            <span className="flex items-center gap-1.5">
              <FileText className="w-3 h-3" />
              BRIEFING
            </span>
          </button>
          <button
            onClick={() => setActiveTab("chat")}
            className={`px-3 py-1.5 text-[10px] font-bold tracking-wider border-b-2 transition-all ${
              activeTab === "chat"
                ? "text-emerald-400 border-emerald-500"
                : "text-gray-500 border-transparent hover:text-gray-300"
            }`}
          >
            <span className="flex items-center gap-1.5">
              <MessageSquare className="w-3 h-3" />
              CHAT
              {messages.length > 1 && (
                <span className="bg-emerald-500/20 text-emerald-400 px-1 rounded text-[9px]">
                  {messages.length - 1}
                </span>
              )}
            </span>
          </button>
        </div>
      </div>

      {/* Briefing Tab */}
      {activeTab === "briefing" && (
        <div className="p-4 space-y-4">
          {/* Escalation Indicator */}
          <div className="flex items-center justify-between p-3 bg-[#1a1a24] rounded border border-gray-800">
            <div className="flex items-center gap-2">
              <AlertTriangle className={`w-5 h-5 ${getEscalationColor()}`} />
              <span className="text-sm text-gray-400">ESCALATION LEVEL</span>
            </div>
            <div className="text-right">
              <span className={`text-lg font-bold ${getEscalationColor()}`}>
                {escalationLevel}
              </span>
              <span className="text-xs text-gray-500 ml-2">
                {escalationScore}/10
              </span>
            </div>
          </div>

          {/* SITREP Content */}
          <div className="space-y-2 text-xs leading-relaxed text-gray-300 max-h-64 overflow-y-auto">
            {lines.map((line, index) => {
              if (line.startsWith("Date:")) {
                return (
                  <p key={index} className="text-gray-500 font-mono">
                    {line}
                  </p>
                );
              }
              if (line.match(/^\d+\./)) {
                return (
                  <h3 key={index} className="text-cyan-400 font-bold mt-3">
                    {line}
                  </h3>
                );
              }
              if (line.startsWith("-")) {
                return (
                  <p key={index} className="pl-4 text-gray-400">
                    {line}
                  </p>
                );
              }
              return (
                <p key={index} className={line.trim() ? "" : "h-2"}>
                  {line}
                </p>
              );
            })}
          </div>
        </div>
      )}

      {/* Chat Tab */}
      {activeTab === "chat" && (
        <div className="flex flex-col" style={{ height: "400px" }}>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "assistant" && (
                  <div className="w-6 h-6 rounded bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] px-3 py-2 rounded-lg text-xs leading-relaxed ${
                    msg.role === "user"
                      ? "bg-cyan-500/20 text-cyan-100 border border-cyan-500/30"
                      : "bg-[#1a1a24] text-gray-300 border border-gray-800"
                  }`}
                >
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                  <div className="text-[9px] text-gray-600 mt-1">
                    {msg.timestamp.toLocaleTimeString("en-US", {
                      hour12: false,
                    })}
                  </div>
                </div>
                {msg.role === "user" && (
                  <div className="w-6 h-6 rounded bg-cyan-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <User className="w-3.5 h-3.5 text-cyan-400" />
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-2 items-start">
                <div className="w-6 h-6 rounded bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div className="bg-[#1a1a24] border border-gray-800 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span className="animate-pulse">
                      Analyzing intelligence...
                    </span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-gray-800 bg-[#0f0f14]">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about conflicts, military ops, escalation..."
                className="flex-1 bg-[#1a1a24] border border-gray-700 rounded px-3 py-2 text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 transition-colors"
                disabled={isLoading}
              />
              <button
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="px-3 py-2 bg-emerald-500/20 border border-emerald-500/30 rounded text-emerald-400 hover:bg-emerald-500/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[9px] text-gray-600 mt-1.5 text-center">
              Powered by Gemini · War & conflict analysis only
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
