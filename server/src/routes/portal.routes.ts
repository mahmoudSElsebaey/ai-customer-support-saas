import { Router } from "express";
import * as portalController from "../controllers/portal.controller.js";
import { protect, authorize, requireTenant } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.js";
import { authLimiter } from "../middleware/rateLimit.js";
import {
  portalRegisterSchema,
  portalLoginSchema,
  portalCreateTicketSchema,
  portalMessageSchema,
} from "../validations/portal.validation.js";

const router = Router();

// Public
router.get("/org/:slug", portalController.resolveOrg);

router.post(
  "/auth/register",
  authLimiter,
  validate(portalRegisterSchema),
  portalController.register
);

router.post(
  "/auth/login",
  authLimiter,
  validate(portalLoginSchema),
  portalController.login
);

router.post("/auth/logout", portalController.logout);

// Authenticated customer only
router.use(protect, requireTenant, authorize("CUSTOMER"));

router.get("/tickets", portalController.listTickets);
router.get("/tickets/:id", portalController.getTicket);
router.post(
  "/tickets",
  validate(portalCreateTicketSchema),
  portalController.createTicket
);
router.post(
  "/tickets/:id/messages",
  validate(portalMessageSchema),
  portalController.addMessage
);

router.get("/knowledge", portalController.listArticles);
router.get("/knowledge/:id", portalController.getArticle);

export default router;
