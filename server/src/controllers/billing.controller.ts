import type { Request, Response } from "express";
import { billingService } from "../services/billing.service.js";
import { successResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../utils/AppError.js";
import type { Plan } from "../types/enums.js";

export const listPlans = asyncHandler(async (_req: Request, res: Response) => {
  return successResponse(res, {
    enabled: billingService.isEnabled(),
    plans: billingService.listPlans(),
  });
});

export const getSubscription = asyncHandler(async (req: Request, res: Response) => {
  const data = await billingService.getSubscription(req.user!.organizationId);
  return successResponse(res, data);
});

export const createCheckout = asyncHandler(async (req: Request, res: Response) => {
  const plan = String(req.body.plan || "").toUpperCase() as Plan;
  if (plan !== "PRO" && plan !== "BUSINESS") {
    throw new AppError("plan must be PRO or BUSINESS", 400, "INVALID_PLAN");
  }

  const result = await billingService.createCheckoutSession(
    req.user!.organizationId,
    req.user!.email,
    req.user!.name,
    plan
  );

  return successResponse(res, result);
});

export const createPortal = asyncHandler(async (req: Request, res: Response) => {
  const result = await billingService.createPortalSession(
    req.user!.organizationId
  );
  return successResponse(res, result);
});

export const webhook = asyncHandler(async (req: Request, res: Response) => {
  const signature = req.headers["stripe-signature"];
  if (!signature || typeof signature !== "string") {
    throw new AppError("Missing stripe-signature", 400, "MISSING_SIGNATURE");
  }

  const rawBody = req.body as Buffer;
  if (!Buffer.isBuffer(rawBody)) {
    throw new AppError(
      "Webhook requires raw body",
      400,
      "INVALID_BODY"
    );
  }

  const result = await billingService.handleWebhook(rawBody, signature);
  return res.json(result);
});
