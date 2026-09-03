import type { Request, Response } from "express";
import { customerService } from "../services/customer.service.js";
import { successResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const listCustomers = asyncHandler(async (req: Request, res: Response) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const search = req.query.search as string | undefined;
  const status = req.query.status as string | undefined;

  const result = await customerService.list({
    organizationId: req.user!.organizationId,
    page,
    limit,
    search,
    status,
  });

  return successResponse(res, result);
});

export const getCustomer = asyncHandler(async (req: Request, res: Response) => {
  const customer = await customerService.getById(
    String(req.params.id),
    req.user!.organizationId
  );
  return successResponse(res, customer);
});

export const createCustomer = asyncHandler(async (req: Request, res: Response) => {
  const customer = await customerService.create(
    req.user!.organizationId,
    req.body
  );
  return successResponse(res, customer, "Customer created", 201);
});

export const updateCustomer = asyncHandler(async (req: Request, res: Response) => {
  const customer = await customerService.update(
    String(req.params.id),
    req.user!.organizationId,
    req.body
  );
  return successResponse(res, customer, "Customer updated");
});

export const deleteCustomer = asyncHandler(async (req: Request, res: Response) => {
  await customerService.remove(String(req.params.id), req.user!.organizationId);
  return successResponse(res, null, "Customer deleted");
});
