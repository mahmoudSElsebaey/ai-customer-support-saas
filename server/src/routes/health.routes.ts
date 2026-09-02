import { Router } from "express";
import mongoose from "mongoose";
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
      mongodb: "down",
      postgres: env.DATABASE_URL ? "down" : "degraded",
      ai: isAIEnabled() ? "ok" : "degraded",
      billing: isStripeEnabled() ? "ok" : "degraded",
    };

    // MongoDB is the primary store after Phase 2
    if (env.MONGODB_URI && mongoose.connection.readyState === 1) {
      checks.mongodb = "ok";
    } else if (!env.MONGODB_URI) {
      checks.mongodb = "degraded";
    }

    // Legacy Postgres (optional during migration)
    if (env.DATABASE_URL) {
      try {
        await prisma.$queryRaw`SELECT 1`;
        checks.postgres = "ok";
      } catch {
        checks.postgres = "down";
      }
    }

    const ready =
      checks.mongodb === "ok" ||
      (checks.mongodb === "degraded" && checks.postgres === "ok");

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
