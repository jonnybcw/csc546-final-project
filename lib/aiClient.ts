interface ChatMessage {
  role: "system" | "user";
  content: string;
}

type AIProvider = "gemini" | "openai";

function readProvider(): AIProvider {
  const explicit = process.env.AI_PROVIDER?.trim().toLowerCase();
  if (explicit === "openai") return "openai";
  if (explicit === "gemini") return "gemini";

  // Prefer Gemini when configured, otherwise fall back to OpenAI-compatible.
  if (process.env.GEMINI_API_KEY?.trim()) return "gemini";
  return "openai";
}

function readOpenAIKey(): string | null {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  return apiKey && apiKey.length > 0 ? apiKey : null;
}

function readGeminiKey(): string | null {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  return apiKey && apiKey.length > 0 ? apiKey : null;
}

function normalizeGeminiModel(model: string): string {
  return model.replace(/^models\//, "").trim();
}

function getGeminiModelCandidates(): string[] {
  const configured = process.env.GEMINI_MODEL?.trim();
  const defaults = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash-latest"];

  const ordered = [configured, ...defaults]
    .filter((value): value is string => !!value && value.length > 0)
    .map(normalizeGeminiModel);

  return Array.from(new Set(ordered));
}

export function isAIConfigured(): boolean {
  const provider = readProvider();
  return provider === "gemini" ? readGeminiKey() !== null : readOpenAIKey() !== null;
}

function parseAssistantText(content: unknown): string | null {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    const textPart = content.find((part) => typeof part === "object" && part && "text" in part) as
      | { text?: unknown }
      | undefined;
    if (typeof textPart?.text === "string") return textPart.text;
  }
  return null;
}

function parseJsonResponse(text: string): unknown {
  const trimmed = text.trim();
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    return JSON.parse(trimmed);
  }

  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return JSON.parse(trimmed.slice(firstBrace, lastBrace + 1));
  }

  throw new Error("AI response did not contain valid JSON");
}

function convertMessagesToPrompt(messages: ChatMessage[]): string {
  return messages
    .map((message) => `${message.role.toUpperCase()}:\n${message.content}`)
    .join("\n\n");
}

async function requestGeminiJson(messages: ChatMessage[], temperature: number): Promise<unknown | null> {
  const apiKey = readGeminiKey();
  if (!apiKey) return null;

  const models = getGeminiModelCandidates();
  const baseUrl = (process.env.GEMINI_BASE_URL?.trim() || "https://generativelanguage.googleapis.com/v1beta")
    .replace(/\/+$/, "");

  let lastError: string | null = null;

  for (const model of models) {
    const response = await fetch(
      `${baseUrl}/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `${convertMessagesToPrompt(messages)}\n\nReturn only valid JSON.`
                }
              ]
            }
          ],
          generationConfig: {
            temperature
          }
        })
      }
    );

    if (!response.ok) {
      const body = await response.text();
      lastError = `model=${model} status=${response.status} body=${body}`;
      // Retry with another model when the current one is unavailable.
      if (response.status === 404) continue;
      throw new Error(`AI request failed (${response.status}): ${body}`);
    }

    const result = (await response.json()) as {
      candidates?: Array<{
        content?: {
          parts?: Array<{ text?: string }>;
        };
      }>;
    };

    const text = result.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("\n").trim();
    if (!text) throw new Error("AI response was empty");
    return parseJsonResponse(text);
  }

  throw new Error(
    `AI request failed (404): no supported Gemini model found. Attempted: ${models.join(
      ", "
    )}. Last error: ${lastError ?? "unknown"}`
  );
}

async function requestOpenAIJson(messages: ChatMessage[], temperature: number): Promise<unknown | null> {
  const apiKey = readOpenAIKey();
  if (!apiKey) return null;

  const model = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
  const baseUrl = (process.env.OPENAI_BASE_URL?.trim() || "https://api.openai.com/v1").replace(/\/+$/, "");

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      temperature,
      messages,
      response_format: { type: "json_object" }
    })
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`AI request failed (${response.status}): ${body}`);
  }

  const result = (await response.json()) as {
    choices?: Array<{ message?: { content?: unknown } }>;
  };

  const text = parseAssistantText(result.choices?.[0]?.message?.content);
  if (!text) throw new Error("AI response was empty");
  return parseJsonResponse(text);
}

export async function requestAIJson(messages: ChatMessage[], temperature = 0.2): Promise<unknown | null> {
  const provider = readProvider();
  if (provider === "gemini") return requestGeminiJson(messages, temperature);
  return requestOpenAIJson(messages, temperature);
}
