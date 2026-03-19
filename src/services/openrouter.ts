import { GoogleGenAI } from "@google/genai";
import type { Content } from "@google/genai";
import type { Article } from "./api";

export const FREE_MODELS = [
  { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash" },
  { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash" },
  { id: "gemini-3-flash-preview", name: "Gemini 3 Flash (Preview)" },
];

export const DEFAULT_MODEL = FREE_MODELS[0].id;

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
- If asked about unrelated topics, firmly but professionally redirect: "That falls outside my area of operations. I'm configured for conflict monitoring and geopolitical analysis."
- Never provide instructions for violence or illegal activities
- Present analysis objectively without political bias`;

const SITREP_PROMPT = `Generate a concise, factual, military-style SITREP (Situation Report) based ONLY on the provided articles.
Do not add outside facts or hallucinate. Use professional military briefing language.

Structure the response EXACTLY like this (use markdown):

1. CURRENT SITUATION
[A brief 2-3 sentence overview of the overall situation based on the articles]

2. KEY DEVELOPMENTS
[List the most critical points from the articles as bullet points]

3. ESCALATION ASSESSMENT
[A 1-2 sentence assessment of the escalation risk (LOW, MODERATE, ELEVATED, HIGH, CRITICAL) based on the events]

4. WATCH LIST
[2-3 bullet points of things to monitor based on the news]

Here are the articles:
`;

let chatHistory: Content[] = [];

export function isOpenRouterConfigured(): boolean {
  return !!import.meta.env.VITE_GEMINI_API_KEY;
}

export function resetChat(): void {
  chatHistory = [];
}

function getGeminiClient() {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "COMMS ERROR: Gemini API key not configured. Add VITE_GEMINI_API_KEY to your .env.local file to enable AI analysis."
    );
  }

  return new GoogleGenAI({ 
    apiKey,
    apiVersion: 'v1'
  });
}

export async function generateAISitRep(
  articles: Article[],
  modelId: string = DEFAULT_MODEL
): Promise<string> {
  const articleContext = articles
    .slice(0, 15)
    .map(
      (a, i) =>
        `[${i + 1}] ${a.title} (${a.source}, ${a.category}, Priority: ${a.priority})`
    )
    .join("\n");

  const prompt = `${SITREP_PROMPT}\n${articleContext}`;

  try {
    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: modelId,
      systemInstruction: SYSTEM_PROMPT,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });
    
    return response.text || "COMMS ERROR: Empty response from AI.";
  } catch (error: unknown) {
    console.error("Gemini API error:", error);
    const errMsg = error instanceof Error ? error.message : "Unknown error";
    return `COMMS ERROR: Failed to generate SITREP. ${errMsg}`;
  }
}

export async function chatWithSitrep(
  message: string,
  articles: Article[],
  modelId: string = DEFAULT_MODEL
): Promise<string> {
  const articleContext = articles
    .slice(0, 10)
    .map(
      (a, i) =>
        `[${i + 1}] ${a.title} (${a.source}, ${a.category}, Priority: ${a.priority})`
    )
    .join("\n");

  const contextMessage = `CURRENT INTELLIGENCE FEED (${articles.length} total articles):\n${articleContext}\n\nANALYST QUERY: ${message}`;

  try {
    const ai = getGeminiClient();
    
    // Add current message to context
    const currentContents: Content[] = [
      ...chatHistory,
      { role: 'user', parts: [{ text: contextMessage }] }
    ];

    const response = await ai.models.generateContent({
      model: modelId,
      systemInstruction: SYSTEM_PROMPT,
      contents: currentContents,
    });

    const responseText = response.text || "COMMS ERROR: Empty response from AI.";

    // Update history
    chatHistory.push(
      { role: 'user', parts: [{ text: message }] },
      { role: 'model', parts: [{ text: responseText }] }
    );

    // Keep history manageable
    if (chatHistory.length > 20) {
      chatHistory = chatHistory.slice(-20);
    }

    return responseText;
  } catch (error: unknown) {
    console.error("Gemini API error:", error);
    const errMsg = error instanceof Error ? error.message : "Unknown error";
    return `COMMS ERROR: ${errMsg}`;
  }
}
