import { Router } from "express";
import * as billingController from "../controllers/billing.controller.js";
import { protect, authorize, requireTenant } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/plans", billingController.listPlans);

router.use(protect, requireTenant);

router.get(
  "/subscription",
  authorize("OWNER", "ADMIN", "MANAGER", "AGENT"),
  billingController.getSubscription
);

router.post(
  "/checkout",
  authorize("OWNER", "ADMIN"),
  billingController.createCheckout
);

router.post(
  "/portal",
  authorize("OWNER", "ADMIN"),
  billingController.createPortal
);

export default router;
