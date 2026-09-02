import { z } from "zod";
import mongoose from "mongoose";
import { Ticket } from "../models/Ticket.js";
import { Message } from "../models/Message.js";
import { AppError } from "../utils/AppError.js";
import {
  getOpenAI,
  isAIEnabled,
  DEFAULT_CHAT_MODEL,
} from "../lib/openai.js";
import { aiUsageService } from "./ai-usage.service.js";
import { embeddingService } from "./embedding.service.js";
import { logger } from "../lib/logger.js";

const analysisSchema = z.object({
  intent: z.string(),
  category: z.string(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
  sentiment: z.enum(["POSITIVE", "NEUTRAL", "NEGATIVE"]),
  summary: z.string(),
});

export type TicketAnalysis = z.infer<typeof analysisSchema>;

function parseJsonFromModel(text: string): unknown {
  const cleaned = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  return JSON.parse(cleaned);
}

function requireIds(ticketId: string, organizationId: string) {
  if (
    !mongoose.Types.ObjectId.isValid(ticketId) ||
    !mongoose.Types.ObjectId.isValid(organizationId)
  ) {
    throw new AppError("Ticket not found", 404, "TICKET_NOT_FOUND");
  }
}

export class AIService {
  isAvailable() {
    return isAIEnabled();
  }

  async analyzeTicket(ticketId: string, organizationId: string) {
    requireIds(ticketId, organizationId);

    const ticket = await Ticket.findOne({
      _id: ticketId,
      organizationId,
    })
      .populate("customerId", "name email company")
      .lean()
      .exec();

    if (!ticket) {
      throw new AppError("Ticket not found", 404, "TICKET_NOT_FOUND");
    }

    const messages = await Message.find({ ticketId })
      .sort({ createdAt: 1 })
      .limit(30)
      .populate("senderId", "name role")
      .lean()
      .exec();

    const customer = ticket.customerId as unknown as {
      name?: string;
      email?: string;
      company?: string | null;
    };

    const openai = getOpenAI();
    const model = DEFAULT_CHAT_MODEL;

    const conversation = messages
      .map((m) => {
        const who =
          m.type === "CUSTOMER"
            ? "Customer"
            : m.type === "INTERNAL_NOTE"
              ? "Internal"
              : m.type === "SYSTEM"
                ? "System"
                : "Agent";
        return `[${who}] ${m.content}`;
      })
      .join("\n");

    const systemPrompt = `You are an expert customer support analyst for a SaaS helpdesk.
Analyze the support ticket and respond with ONLY valid JSON (no markdown) matching this shape:
{
  "intent": "short intent label e.g. Refund Request",
  "category": "short category e.g. Billing",
  "priority": "LOW" | "MEDIUM" | "HIGH" | "URGENT",
  "sentiment": "POSITIVE" | "NEUTRAL" | "NEGATIVE",
  "summary": "2-3 sentence neutral summary of the issue and current state"
}
Be concise and accurate. Do not invent facts not present in the ticket.`;

    const userPrompt = `Ticket subject: ${ticket.subject}
Description: ${ticket.description ?? "(none)"}
Customer: ${customer?.name ?? "Unknown"} (${customer?.email ?? ""})${
      customer?.company ? ` @ ${customer.company}` : ""
    }
Current status: ${ticket.status}
Current priority: ${ticket.priority}
Category field: ${ticket.category ?? "(none)"}

Conversation:
${conversation || "(no messages yet)"}`;

    try {
      const completion = await openai.chat.completions.create({
        model,
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      });

      const raw = completion.choices[0]?.message?.content ?? "{}";
      const usage = completion.usage;

      if (usage) {
        await aiUsageService.track({
          organizationId,
          feature: "analyze_ticket",
          model,
          promptTokens: usage.prompt_tokens,
          completionTokens: usage.completion_tokens,
        });
      }

      const parsed = analysisSchema.parse(parseJsonFromModel(raw));
      return {
        analysis: parsed,
        model,
        usage: usage
          ? {
              promptTokens: usage.prompt_tokens,
              completionTokens: usage.completion_tokens,
              totalTokens: usage.total_tokens,
            }
          : null,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error({ error, ticketId }, "AI analyzeTicket failed");
      throw new AppError(
        "AI analysis failed. Support continues without AI.",
        502,
        "AI_REQUEST_FAILED"
      );
    }
  }

  async suggestReply(
    ticketId: string,
    organizationId: string,
    options: { useRag?: boolean; topK?: number } = {}
  ) {
    requireIds(ticketId, organizationId);

    const useRag = options.useRag !== false;
    const topK = options.topK ?? 4;

    const ticket = await Ticket.findOne({
      _id: ticketId,
      organizationId,
    })
      .populate("customerId", "name")
      .lean()
      .exec();

    if (!ticket) {
      throw new AppError("Ticket not found", 404, "TICKET_NOT_FOUND");
    }

    const messages = await Message.find({ ticketId })
      .sort({ createdAt: 1 })
      .limit(40)
      .lean()
      .exec();

    const customer = ticket.customerId as unknown as { name?: string };

    const openai = getOpenAI();
    const model = DEFAULT_CHAT_MODEL;

    const conversation = messages
      .filter((m) => m.type !== "INTERNAL_NOTE")
      .map((m) => {
        const who = m.type === "CUSTOMER" ? "Customer" : "Agent";
        return `${who}: ${m.content}`;
      })
      .join("\n");

    let sources: {
      id: string;
      title: string;
      score: number;
      category: string | null;
    }[] = [];
    let knowledgeBlock = "";

    if (useRag) {
      try {
        const query = [
          ticket.subject,
          ticket.description ?? "",
          conversation.slice(-1500),
        ]
          .filter(Boolean)
          .join("\n");

        const hits = await embeddingService.search(
          organizationId,
          query,
          topK,
          0.28
        );

        sources = hits.map((h) => ({
          id: h.id,
          title: h.title,
          score: Number(h.score.toFixed(4)),
          category: h.category,
        }));

        if (hits.length > 0) {
          knowledgeBlock =
            "\n\nRelevant knowledge base articles (use only if applicable; do not invent policies):\n" +
            hits
              .map(
                (h, i) =>
                  `[${i + 1}] ${h.title} (score ${h.score.toFixed(3)})\n${h.contentPreview}`
              )
              .join("\n\n");
        }
      } catch (err) {
        logger.warn({ err, ticketId }, "RAG retrieval failed; continuing without KB");
      }
    }

    const systemPrompt = `You are a helpful customer support agent assistant.
Write a professional, empathetic reply the human agent can send to the customer.
Rules:
- Prefer facts from the provided knowledge base articles when relevant.
- Do not invent policies, refunds, or commitments not supported by the conversation or knowledge articles.
- If knowledge is insufficient, say what you can and ask a concise clarifying question.
- Keep tone clear and friendly.
- Output ONLY the reply text (no JSON, no quotes wrapper, no "Subject:").`;

    const userPrompt = `Customer name: ${customer?.name ?? "Customer"}
Ticket subject: ${ticket.subject}

Conversation so far:
${conversation || ticket.description || "(empty)"}${knowledgeBlock}`;

    try {
      const completion = await openai.chat.completions.create({
        model,
        temperature: 0.45,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      });

      const suggestion =
        completion.choices[0]?.message?.content?.trim() ?? "";
      const usage = completion.usage;

      if (usage) {
        await aiUsageService.track({
          organizationId,
          feature: sources.length > 0 ? "suggest_reply_rag" : "suggest_reply",
          model,
          promptTokens: usage.prompt_tokens,
          completionTokens: usage.completion_tokens,
        });
      }

      return {
        suggestion,
        sources,
        ragUsed: sources.length > 0,
        model,
        usage: usage
          ? {
              promptTokens: usage.prompt_tokens,
              completionTokens: usage.completion_tokens,
              totalTokens: usage.total_tokens,
            }
          : null,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error({ error, ticketId }, "AI suggestReply failed");
      throw new AppError(
        "AI suggestion failed. You can still reply manually.",
        502,
        "AI_REQUEST_FAILED"
      );
    }
  }

  async summarizeTicket(ticketId: string, organizationId: string) {
    const result = await this.analyzeTicket(ticketId, organizationId);
    return {
      summary: result.analysis.summary,
      analysis: result.analysis,
      model: result.model,
      usage: result.usage,
    };
  }

  async searchKnowledge(
    organizationId: string,
    query: string,
    topK = 5
  ) {
    return embeddingService.search(organizationId, query, topK);
  }
}

export const aiService = new AIService();
