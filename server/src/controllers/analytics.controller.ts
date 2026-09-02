import type { Request, Response } from "express";
import { analyticsService } from "../services/analytics.service.js";
import { successResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const overview = asyncHandler(async (req: Request, res: Response) => {
  const days = Math.min(Number(req.query.days) || 30, 90);
  const data = await analyticsService.overview(
    req.user!.organizationId,
    days
  );
  return successResponse(res, data);
});
