import type { Request, Response } from "express";
import { ticketService } from "../services/ticket.service.js";
import { successResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const listTickets = asyncHandler(async (req: Request, res: Response) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;

  const result = await ticketService.list({
    organizationId: req.user!.organizationId,
    page,
    limit,
    search: req.query.search as string | undefined,
    status: req.query.status as string | undefined,
    priority: req.query.priority as string | undefined,
    assignedAgentId: req.query.assignedAgentId as string | undefined,
    customerId: req.query.customerId as string | undefined,
    unassigned:
      req.query.unassigned === "true"
        ? true
        : req.query.unassigned === "false"
          ? false
          : undefined,
    viewerRole: req.user!.role,
    viewerId: req.user!.id,
  });

  return successResponse(res, result);
});

export const getTicket = asyncHandler(async (req: Request, res: Response) => {
  const ticket = await ticketService.getById(
    req.params.id,
    req.user!.organizationId,
    req.user!.role,
    req.user!.id
  );
  return successResponse(res, ticket);
});

export const createTicket = asyncHandler(async (req: Request, res: Response) => {
  const ticket = await ticketService.create(
    req.user!.organizationId,
    req.body,
    req.user!.id
  );
  return successResponse(res, ticket, "Ticket created", 201);
});

export const updateTicket = asyncHandler(async (req: Request, res: Response) => {
  const ticket = await ticketService.update(
    req.params.id,
    req.user!.organizationId,
    req.body,
    req.user!.id
  );
  return successResponse(res, ticket, "Ticket updated");
});

export const addMessage = asyncHandler(async (req: Request, res: Response) => {
  const message = await ticketService.addMessage(
    req.params.id,
    req.user!.organizationId,
    req.user!.id,
    req.body,
    req.user!.role
  );
  return successResponse(res, message, "Message sent", 201);
});

export const listMessages = asyncHandler(async (req: Request, res: Response) => {
  const messages = await ticketService.listMessages(
    req.params.id,
    req.user!.organizationId
  );
  return successResponse(res, messages);
});
