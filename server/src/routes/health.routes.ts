import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { isAIEnabled } from "../lib/openai.js";
import { env } from "../config/env.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

/** Liveness — process is up */
router.get(
  "/",
  asyncHandler(async (_req, res) => {
    res.json({
      success: true,
      status: "ok",
      service: "voxly-api",
      timestamp: new Date().toISOString(),
    });
  })
);

/** Readiness — dependencies available */
router.get(
  "/ready",
  asyncHandler(async (_req, res) => {
    const checks: Record<string, "ok" | "degraded" | "down"> = {
      database: "down",
      ai: isAIEnabled() ? "ok" : "degraded",
    };

    try {
      await prisma.$queryRaw`SELECT 1`;
      checks.database = "ok";
    } catch {
      checks.database = "down";
    }

    const ready = checks.database === "ok";

    res.status(ready ? 200 : 503).json({
      success: ready,
      status: ready ? "ready" : "not_ready",
      checks,
      env: env.NODE_ENV,
      timestamp: new Date().toISOString(),
    });
  })
);

export default router;
