import { Router } from "express";
import healthRoutes from "./health.routes.js";
import authRoutes from "./auth.routes.js";
import customerRoutes from "./customer.routes.js";
import ticketRoutes from "./ticket.routes.js";
import knowledgeRoutes from "./knowledge.routes.js";
import aiRoutes from "./ai.routes.js";

const router = Router();

router.use("/health", healthRoutes);
router.use("/auth", authRoutes);
router.use("/customers", customerRoutes);
router.use("/tickets", ticketRoutes);
router.use("/knowledge", knowledgeRoutes);
router.use("/ai", aiRoutes);

export default router;
