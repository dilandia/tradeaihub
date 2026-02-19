/**
 * Cliente LLM para agentes de IA.
 * Recomendação: OpenAI GPT-4o-mini (custo/qualidade) ou GPT-4o (melhor qualidade).
 */
import OpenAI from "openai";

let _client: OpenAI | null = null;

export function getOpenAIClient(): OpenAI | null {
  const key = process.env.OPENAI_API_KEY;
  if (!key || key === "sk-your-key-here") return null;
  if (!_client) _client = new OpenAI({ apiKey: key });
  return _client;
}

export async function chatCompletion(
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
  options?: { model?: string; maxTokens?: number }
): Promise<string> {
  const client = getOpenAIClient();
  if (!client) {
    throw new Error("OPENAI_API_KEY não configurada. Configure em .env.local");
  }
  const model = options?.model ?? "gpt-4o-mini";
  const maxTokens = options?.maxTokens ?? 1024;
  const res = await client.chat.completions.create({
    model,
    messages,
    max_tokens: maxTokens,
    temperature: 0.7,
  });
  const content = res.choices[0]?.message?.content?.trim();
  return content ?? "";
}

/** Streaming: retorna AsyncIterable de chunks de texto */
export async function* chatCompletionStream(
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
  options?: { model?: string; maxTokens?: number }
): AsyncGenerator<string, void, unknown> {
  const client = getOpenAIClient();
  if (!client) {
    throw new Error("OPENAI_API_KEY não configurada. Configure em .env.local");
  }
  const model = options?.model ?? "gpt-4o-mini";
  const maxTokens = options?.maxTokens ?? 1024;

  const stream = await client.chat.completions.create({
    model,
    messages,
    max_tokens: maxTokens,
    temperature: 0.7,
    stream: true,
  });

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content;
    if (delta) yield delta;
  }
}
