import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { isAIEnabled } from "../lib/openai.js";
import { isStripeEnabled } from "../config/plans.js";
import { env } from "../config/env.js";
import { getMetricsSnapshot, getUptimeSec } from "../lib/metrics.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();
const VERSION = "0.13.0";

/** Liveness */
router.get(
  "/",
  asyncHandler(async (_req, res) => {
    res.json({
      success: true,
      status: "ok",
      service: "voxly-api",
      version: VERSION,
      uptimeSec: getUptimeSec(),
      timestamp: new Date().toISOString(),
    });
  })
);

/** Readiness — dependencies */
router.get(
  "/ready",
  asyncHandler(async (_req, res) => {
    const checks: Record<string, "ok" | "degraded" | "down"> = {
      database: "down",
      ai: isAIEnabled() ? "ok" : "degraded",
      billing: isStripeEnabled() ? "ok" : "degraded",
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
      version: VERSION,
      checks,
      env: env.NODE_ENV,
      timestamp: new Date().toISOString(),
    });
  })
);

/** Basic process metrics (no secrets) */
router.get(
  "/metrics",
  asyncHandler(async (_req, res) => {
    res.json({
      success: true,
      version: VERSION,
      data: getMetricsSnapshot(),
    });
  })
);

export default router;
