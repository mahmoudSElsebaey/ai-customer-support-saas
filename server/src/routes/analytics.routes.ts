import { Router } from "express";
import * as analyticsController from "../controllers/analytics.controller.js";
import { protect, authorize, requireTenant } from "../middleware/auth.middleware.js";

const router = Router();

router.use(protect, requireTenant);

router.get(
  "/overview",
  authorize("OWNER", "ADMIN", "MANAGER", "AGENT"),
  analyticsController.overview
);

export default router;
