import type { Request, Response, NextFunction } from "express";
import { recordRequest } from "../lib/metrics.js";

export function metricsMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const start = process.hrtime.bigint();

  res.on("finish", () => {
    const end = process.hrtime.bigint();
    const durationMs = Number(end - start) / 1_000_000;
    recordRequest(req.method, req.originalUrl || req.url, res.statusCode, durationMs);
  });

  next();
}
