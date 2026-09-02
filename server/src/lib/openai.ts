import OpenAI from "openai";
import { env } from "../config/env.js";
import { AppError } from "../utils/AppError.js";

let client: OpenAI | null = null;

export function getOpenAI(): OpenAI {
  if (!env.OPENAI_API_KEY) {
    throw new AppError(
      "AI is not configured. Set OPENAI_API_KEY.",
      503,
      "AI_NOT_CONFIGURED"
    );
  }

  if (!client) {
    client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  }

  return client;
}

export function isAIEnabled(): boolean {
  return Boolean(env.OPENAI_API_KEY);
}

/** Rough cost estimate (USD) for gpt-4o-mini */
export function estimateCost(
  model: string,
  promptTokens: number,
  completionTokens: number
): number {
  // Prices approximate; adjust as needed
  const rates: Record<string, { in: number; out: number }> = {
    "gpt-4o-mini": { in: 0.15 / 1_000_000, out: 0.6 / 1_000_000 },
    "gpt-4o": { in: 2.5 / 1_000_000, out: 10 / 1_000_000 },
    "text-embedding-3-small": { in: 0.02 / 1_000_000, out: 0 },
  };

  const rate = rates[model] ?? rates["gpt-4o-mini"];
  return promptTokens * rate.in + completionTokens * rate.out;
}

export const DEFAULT_CHAT_MODEL = "gpt-4o-mini";
