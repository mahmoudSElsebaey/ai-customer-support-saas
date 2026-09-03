import type { Request, Response } from "express";
import { portalService } from "../services/portal.service.js";
import { successResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { setAuthCookies, clearAuthCookies } from "../utils/cookies.js";

export const resolveOrg = asyncHandler(async (req: Request, res: Response) => {
  const org = await portalService.getOrganizationBySlug(
    String(req.params.slug)
  );
  return successResponse(res, org);
});

export const register = asyncHandler(async (req: Request, res: Response) => {
  const result = await portalService.register(req.body);
  setAuthCookies(res, result.accessToken, result.refreshToken);
  return successResponse(
    res,
    {
      user: result.user,
      organization: result.organization,
    },
    "Registered",
    201
  );
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const result = await portalService.login(req.body);
  setAuthCookies(res, result.accessToken, result.refreshToken);
  return successResponse(res, {
    user: result.user,
    organization: result.organization,
  });
});

export const logout = asyncHandler(async (_req: Request, res: Response) => {
  clearAuthCookies(res);
  return successResponse(res, null, "Logged out");
});

export const listTickets = asyncHandler(async (req: Request, res: Response) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const result = await portalService.listTickets(
    req.user!.id,
    req.user!.organizationId,
    page,
    limit
  );
  return successResponse(res, result);
});

export const getTicket = asyncHandler(async (req: Request, res: Response) => {
  const ticket = await portalService.getTicket(
    String(req.params.id),
    req.user!.id,
    req.user!.organizationId
  );
  return successResponse(res, ticket);
});

export const createTicket = asyncHandler(async (req: Request, res: Response) => {
  const ticket = await portalService.createTicket(
    req.user!.id,
    req.user!.organizationId,
    req.body
  );
  return successResponse(res, ticket, "Ticket created", 201);
});

export const addMessage = asyncHandler(async (req: Request, res: Response) => {
  const message = await portalService.addMessage(
    String(req.params.id),
    req.user!.id,
    req.user!.organizationId,
    req.body.content
  );
  return successResponse(res, message, "Message sent", 201);
});

export const listArticles = asyncHandler(async (req: Request, res: Response) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const search = req.query.search as string | undefined;
  const result = await portalService.listPublishedArticles(
    req.user!.organizationId,
    page,
    limit,
    search
  );
  return successResponse(res, result);
});

export const getArticle = asyncHandler(async (req: Request, res: Response) => {
  const article = await portalService.getPublishedArticle(
    String(req.params.id),
    req.user!.organizationId
  );
  return successResponse(res, article);
});
