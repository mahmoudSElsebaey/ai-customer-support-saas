import type { Request, Response } from "express";
import { aiService } from "../services/ai.service.js";
import { aiUsageService } from "../services/ai-usage.service.js";
import { successResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { isAIEnabled } from "../lib/openai.js";

export const status = asyncHandler(async (_req: Request, res: Response) => {
  return successResponse(res, {
    enabled: isAIEnabled(),
    features: ["analyze_ticket", "suggest_reply", "summarize"],
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
  const result = await aiService.suggestReply(
    req.params.ticketId,
    req.user!.organizationId
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
