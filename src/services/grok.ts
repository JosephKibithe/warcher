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

let chatHistory: { role: string; content: string }[] = [];

export function isGrokConfigured(): boolean {
  return !!import.meta.env.VITE_XAI_API_KEY;
}

export function resetChat(): void {
  chatHistory = [];
}

async function callGrokAPI(messages: { role: string; content: string }[]) {
  const apiKey = import.meta.env.VITE_XAI_API_KEY;
  if (!apiKey) {
    throw new Error("COMMS ERROR: xAI API key not configured. Add VITE_XAI_API_KEY to your .env.local file to enable AI analysis.");
  }

  const response = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      messages,
      model: "grok-beta",
      stream: false,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `API Error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

export async function generateAISitRep(articles: Article[]): Promise<string> {
  const articleContext = articles
    .slice(0, 15)
    .map(
      (a, i) =>
        `[${i + 1}] ${a.title} (${a.source}, ${a.category}, Priority: ${a.priority})`,
    )
    .join("\n");

  const prompt = `${SITREP_PROMPT}\n${articleContext}`;

  try {
    const response = await callGrokAPI([
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: prompt },
    ]);
    return response;
  } catch (error: unknown) {
    console.error("Grok API error:", error);
    const errMsg = error instanceof Error ? error.message : "Unknown error";
    return `COMMS ERROR: Failed to generate SITREP. ${errMsg}`;
  }
}

export async function chatWithSitrep(
  message: string,
  articles: Article[],
): Promise<string> {
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
    // Add context to user's message
    const currentMessage = { role: "user", content: contextMessage };
    
    // Call API with history
    const responseText = await callGrokAPI([
      { role: "system", content: SYSTEM_PROMPT },
      ...chatHistory,
      currentMessage,
    ]);

    // Update chat history with just the original message (without the huge context) to save tokens
    chatHistory.push(
      { role: "user", content: message },
      { role: "assistant", content: responseText },
    );

    // Keep history manageable
    if (chatHistory.length > 20) {
      chatHistory = chatHistory.slice(-16);
    }

    return responseText;
  } catch (error: unknown) {
    console.error("Grok API error:", error);
    const errMsg = error instanceof Error ? error.message : "Unknown error";
    return `COMMS ERROR: ${errMsg}`;
  }
}
