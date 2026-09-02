import { Router } from "express";
import * as aiController from "../controllers/ai.controller.js";
import { protect, authorize, requireTenant } from "../middleware/auth.middleware.js";
import { aiLimiter } from "../middleware/rateLimit.js";

const router = Router();

router.use(protect, requireTenant, aiLimiter);

router.get(
  "/status",
  authorize("OWNER", "ADMIN", "MANAGER", "AGENT"),
  aiController.status
);

router.get(
  "/usage",
  authorize("OWNER", "ADMIN", "MANAGER"),
  aiController.usageSummary
);

router.get(
  "/knowledge/search",
  authorize("OWNER", "ADMIN", "MANAGER", "AGENT"),
  aiController.searchKnowledge
);

router.post(
  "/knowledge/embed",
  authorize("OWNER", "ADMIN", "MANAGER"),
  aiController.embedArticles
);

router.post(
  "/knowledge/embed/:articleId",
  authorize("OWNER", "ADMIN", "MANAGER"),
  aiController.embedArticle
);

router.post(
  "/tickets/:ticketId/analyze",
  authorize("OWNER", "ADMIN", "MANAGER", "AGENT"),
  aiController.analyzeTicket
);

router.post(
  "/tickets/:ticketId/suggest-reply",
  authorize("OWNER", "ADMIN", "MANAGER", "AGENT"),
  aiController.suggestReply
);

router.post(
  "/tickets/:ticketId/summarize",
  authorize("OWNER", "ADMIN", "MANAGER", "AGENT"),
  aiController.summarizeTicket
);

export default router;
