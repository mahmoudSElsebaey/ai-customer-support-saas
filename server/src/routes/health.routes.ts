import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get(
  "/",
  asyncHandler(async (_req, res) => {
    // Simple DB connectivity check
    await prisma.$queryRaw`SELECT 1`;

    res.json({
      success: true,
      message: "Voxly API is healthy",
      timestamp: new Date().toISOString(),
    });
  })
);

export default router;
