import type { Request, Response } from "express";
import { knowledgeService } from "../services/knowledge.service.js";
import { successResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const listArticles = asyncHandler(async (req: Request, res: Response) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const role = req.user!.role;

  // Agents can browse all for support; tighten later if needed
  const publishedOnly = role === "CUSTOMER";

  const result = await knowledgeService.list({
    organizationId: req.user!.organizationId,
    page,
    limit,
    search: req.query.search as string | undefined,
    status: req.query.status as string | undefined,
    category: req.query.category as string | undefined,
    tag: req.query.tag as string | undefined,
    publishedOnly,
  });

  return successResponse(res, result);
});

export const getArticle = asyncHandler(async (req: Request, res: Response) => {
  const publishedOnly = req.user!.role === "CUSTOMER";
  const article = await knowledgeService.getById(
    String(req.params.id),
    req.user!.organizationId,
    publishedOnly
  );
  return successResponse(res, article);
});

export const createArticle = asyncHandler(async (req: Request, res: Response) => {
  const article = await knowledgeService.create(
    req.user!.organizationId,
    req.user!.id,
    req.body
  );
  return successResponse(res, article, "Article created", 201);
});

export const updateArticle = asyncHandler(async (req: Request, res: Response) => {
  const article = await knowledgeService.update(
    String(req.params.id),
    req.user!.organizationId,
    req.body
  );
  return successResponse(res, article, "Article updated");
});

export const deleteArticle = asyncHandler(async (req: Request, res: Response) => {
  await knowledgeService.remove(String(req.params.id), req.user!.organizationId);
  return successResponse(res, null, "Article deleted");
});

export const listCategories = asyncHandler(async (req: Request, res: Response) => {
  const categories = await knowledgeService.listCategories(
    req.user!.organizationId
  );
  return successResponse(res, categories);
});
