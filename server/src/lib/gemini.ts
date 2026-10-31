import OpenAI from "openai";
import { env } from "../config/env.js";
import { AppError } from "../utils/AppError.js";

let client: OpenAI | null = null;

/**
 * Gemini's OpenAI-compatible endpoint lets the public demo reuse the existing
 * OpenAI SDK without exposing the provider key to the browser.
 */
export function getGemini(): OpenAI {
  if (!env.GEMINI_API_KEY) {
    throw new AppError(
      "AI demo is not configured. Set GEMINI_API_KEY in the server environment.",
      503,
      "AI_NOT_CONFIGURED"
    );
  }

  if (!client) {
    client = new OpenAI({
      apiKey: env.GEMINI_API_KEY,
      baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
    });
  }

  return client;
}

export const DEFAULT_GEMINI_MODEL = env.GEMINI_MODEL;
