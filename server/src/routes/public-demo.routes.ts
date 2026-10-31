import { Router } from "express";
import rateLimit from "express-rate-limit";
import * as controller from "../controllers/public-demo.controller.js";

const router = Router();

const demoLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 12,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Demo limit reached. Please try again in a few minutes." },
});

router.post("/chat", demoLimiter, controller.chat);

export default router;
