import type { Request, Response } from "express";
import { z } from "zod";
import { getOpenAI, DEFAULT_CHAT_MODEL } from "../lib/openai.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../utils/AppError.js";

const bodySchema = z.object({
  messages: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string().trim().min(1).max(1200),
  })).min(1).max(12),
});

export const chat = asyncHandler(async (req: Request, res: Response) => {
  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError("Please send a valid message.", 400, "INVALID_MESSAGE");
  }

  const latestUserMessage = [...parsed.data.messages].reverse().find((m) => m.role === "user");
  if (!latestUserMessage) {
    throw new AppError("A user message is required.", 400, "INVALID_MESSAGE");
  }

  const completion = await getOpenAI().chat.completions.create({
    model: DEFAULT_CHAT_MODEL,
    temperature: 0.6,
    max_tokens: 350,
    messages: [
      {
        role: "system",
        content: "You are Voxly's public product demo assistant. Explain how Voxly helps businesses manage customer support using a shared inbox, tickets, live chat, a knowledge base, AI-assisted replies and analytics. Be friendly, concise, and helpful. Do not claim to access a real company's data, create tickets, or perform actions. If asked, explain this is a public product demo and invite the visitor to sign up to connect their own workspace. Reply in the same language as the visitor (Arabic or English).",
      },
      ...parsed.data.messages.slice(-8),
    ],
  });

  const reply = completion.choices[0]?.message?.content?.trim();
  if (!reply) throw new AppError("The AI could not generate a reply. Please try again.", 502, "AI_EMPTY_REPLY");

  return res.json({ success: true, data: { reply } });
});
