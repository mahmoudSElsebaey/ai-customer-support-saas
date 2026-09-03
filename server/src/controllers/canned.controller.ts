import type { Request, Response } from "express";
import { cannedService } from "../services/canned.service.js";
import { successResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const listCanned = asyncHandler(async (req: Request, res: Response) => {
  const activeOnly = req.query.all !== "true";
  const items = await cannedService.list(
    req.user!.organizationId,
    activeOnly
  );
  return successResponse(res, items);
});

export const createCanned = asyncHandler(async (req: Request, res: Response) => {
  const item = await cannedService.create(
    req.user!.organizationId,
    req.user!.id,
    req.body
  );
  return successResponse(res, item, "Created", 201);
});

export const updateCanned = asyncHandler(async (req: Request, res: Response) => {
  const item = await cannedService.update(
    String(req.params.id),
    req.user!.organizationId,
    req.body
  );
  return successResponse(res, item, "Updated");
});

export const deleteCanned = asyncHandler(async (req: Request, res: Response) => {
  await cannedService.remove(String(req.params.id), req.user!.organizationId);
  return successResponse(res, null, "Deleted");
});
