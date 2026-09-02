import { Router } from "express";
import * as ticketController from "../controllers/ticket.controller.js";
import { protect, authorize, requireTenant } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.js";
import {
  createTicketSchema,
  updateTicketSchema,
  listTicketsSchema,
  createMessageSchema,
} from "../validations/ticket.validation.js";

const router = Router();

router.use(protect, requireTenant);

router.get(
  "/stats/workspace",
  authorize("OWNER", "ADMIN", "MANAGER", "AGENT"),
  ticketController.workspaceStats
);

router.get(
  "/",
  authorize("OWNER", "ADMIN", "MANAGER", "AGENT"),
  validate(listTicketsSchema),
  ticketController.listTickets
);

router.get(
  "/:id",
  authorize("OWNER", "ADMIN", "MANAGER", "AGENT"),
  ticketController.getTicket
);

router.post(
  "/",
  authorize("OWNER", "ADMIN", "MANAGER", "AGENT"),
  validate(createTicketSchema),
  ticketController.createTicket
);

router.patch(
  "/:id",
  authorize("OWNER", "ADMIN", "MANAGER", "AGENT"),
  validate(updateTicketSchema),
  ticketController.updateTicket
);

router.get(
  "/:id/messages",
  authorize("OWNER", "ADMIN", "MANAGER", "AGENT"),
  ticketController.listMessages
);

router.post(
  "/:id/messages",
  authorize("OWNER", "ADMIN", "MANAGER", "AGENT"),
  validate(createMessageSchema),
  ticketController.addMessage
);

export default router;
