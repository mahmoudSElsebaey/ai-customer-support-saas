import { Router } from "express";
import healthRoutes from "./health.routes.js";
import authRoutes from "./auth.routes.js";
import customerRoutes from "./customer.routes.js";
import ticketRoutes from "./ticket.routes.js";
import knowledgeRoutes from "./knowledge.routes.js";
import aiRoutes from "./ai.routes.js";
import cannedRoutes from "./canned.routes.js";
import analyticsRoutes from "./analytics.routes.js";
import billingRoutes from "./billing.routes.js";
import portalRoutes from "./portal.routes.js";

const router = Router();

router.use("/health", healthRoutes);
router.use("/auth", authRoutes);
router.use("/customers", customerRoutes);
router.use("/tickets", ticketRoutes);
router.use("/knowledge", knowledgeRoutes);
router.use("/ai", aiRoutes);
router.use("/canned-responses", cannedRoutes);
router.use("/analytics", analyticsRoutes);
router.use("/billing", billingRoutes);
router.use("/portal", portalRoutes);

export default router;
