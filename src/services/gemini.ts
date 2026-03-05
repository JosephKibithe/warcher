import { GoogleGenAI } from "@google/genai";
import type { Article } from "./api";

const SYSTEM_PROMPT = `You are WARCHER AI, a military intelligence analyst and OSINT specialist embedded in a real-time Middle East conflict monitoring dashboard. Your role:

CORE MANDATE:
- Analyze war, conflict, geopolitics, military operations, and security developments
- Provide tactical assessments, escalation analysis, and strategic context
- Reference current articles/intelligence when available
- Use concise, professional military briefing language

STYLE:
- Be direct, factual, analytical — like a senior intelligence briefer
- Use military terminology where appropriate (SITREP, AOR, OPORD, etc.)
- Structure longer responses with numbered points or bullet format
- Provide escalation assessments when relevant (LOW/MODERATE/ELEVATED/HIGH/CRITICAL)

BOUNDARIES:
- ONLY discuss war, conflict, geopolitics, defense, security, military affairs, humanitarian crises in conflict zones, and related OSINT topics
- If asked about unrelated topics, firmly but professionally redirect: "That falls outside my area of operations. I'm configured for conflict monitoring and geopolitical analysis. What would you like to know about current security developments?"
- Never provide instructions for violence or illegal activities
- Present analysis objectively without political bias`;

let ai: GoogleGenAI | null = null;
let chatHistory: { role: string; parts: { text: string }[] }[] = [];

function getClient(): GoogleGenAI | null {
  if (ai) return ai;
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) return null;
  ai = new GoogleGenAI({ apiKey });
  return ai;
}

export function isGeminiConfigured(): boolean {
  return !!import.meta.env.VITE_GEMINI_API_KEY;
}

export function resetChat(): void {
  chatHistory = [];
}

export async function chatWithSitrep(
  message: string,
  articles: Article[],
): Promise<string> {
  const client = getClient();
  if (!client) {
    return "COMMS ERROR: Gemini API key not configured. Add VITE_GEMINI_API_KEY to your .env.local file to enable AI analysis.";
  }

  // Build context from current articles
  const articleContext = articles
    .slice(0, 10)
    .map(
      (a, i) =>
        `[${i + 1}] ${a.title} (${a.source}, ${a.category}, Priority: ${a.priority})`,
    )
    .join("\n");

  const contextMessage = `CURRENT INTELLIGENCE FEED (${articles.length} total articles):\n${articleContext}\n\nANALYST QUERY: ${message}`;

  try {
    const response = await client.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        ...chatHistory,
        { role: "user", parts: [{ text: contextMessage }] },
      ],
      config: {
        systemInstruction: SYSTEM_PROMPT,
        maxOutputTokens: 1024,
        temperature: 0.7,
      },
    });

    const responseText = response.text || "No response generated.";

    // Update chat history
    chatHistory.push(
      { role: "user", parts: [{ text: message }] },
      { role: "model", parts: [{ text: responseText }] },
    );

    // Keep history manageable
    if (chatHistory.length > 20) {
      chatHistory = chatHistory.slice(-16);
    }

    return responseText;
  } catch (error: unknown) {
    console.error("Gemini API error:", error);
    const errMsg = error instanceof Error ? error.message : "Unknown error";
    return `COMMS ERROR: ${errMsg}`;
  }
}
