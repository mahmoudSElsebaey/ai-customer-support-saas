import type { Request, Response } from "express";
import { aiService } from "../services/ai.service.js";
import { aiUsageService } from "../services/ai-usage.service.js";
import { embeddingService } from "../services/embedding.service.js";
import { successResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { isAIEnabled } from "../lib/openai.js";

export const status = asyncHandler(async (_req: Request, res: Response) => {
  return successResponse(res, {
    enabled: isAIEnabled(),
    features: [
      "analyze_ticket",
      "suggest_reply",
      "suggest_reply_rag",
      "summarize",
      "knowledge_search",
      "embed_articles",
    ],
  });
});

export const analyzeTicket = asyncHandler(async (req: Request, res: Response) => {
  const result = await aiService.analyzeTicket(
    req.params.ticketId,
    req.user!.organizationId
  );
  return successResponse(res, result);
});

export const suggestReply = asyncHandler(async (req: Request, res: Response) => {
  const useRag = req.body?.useRag !== false && req.query.useRag !== "false";
  const result = await aiService.suggestReply(
    req.params.ticketId,
    req.user!.organizationId,
    { useRag }
  );
  return successResponse(res, result);
});

export const summarizeTicket = asyncHandler(async (req: Request, res: Response) => {
  const result = await aiService.summarizeTicket(
    req.params.ticketId,
    req.user!.organizationId
  );
  return successResponse(res, result);
});

export const usageSummary = asyncHandler(async (req: Request, res: Response) => {
  const days = Number(req.query.days) || 30;
  const summary = await aiUsageService.summary(
    req.user!.organizationId,
    days
  );
  return successResponse(res, summary);
});

export const searchKnowledge = asyncHandler(async (req: Request, res: Response) => {
  const query = String(req.query.q || req.body?.query || "").trim();
  if (!query) {
    return successResponse(res, []);
  }
  const topK = Number(req.query.topK) || 5;
  const results = await aiService.searchKnowledge(
    req.user!.organizationId,
    query,
    topK
  );
  return successResponse(res, results);
});

export const embedArticles = asyncHandler(async (req: Request, res: Response) => {
  const force = Boolean(req.body?.force);
  const limit = Number(req.body?.limit) || 50;
  const result = await embeddingService.embedOrganization(
    req.user!.organizationId,
    { force, limit }
  );
  return successResponse(res, result, "Embedding job completed");
});

export const embedArticle = asyncHandler(async (req: Request, res: Response) => {
  const result = await embeddingService.embedArticle(
    req.params.articleId,
    req.user!.organizationId
  );
  return successResponse(res, result, "Article embedded");
});
