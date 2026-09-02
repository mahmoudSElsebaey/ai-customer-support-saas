import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { AppError } from "../utils/AppError.js";
import { logger } from "../lib/logger.js";
import { env } from "../config/env.js";
import { captureException } from "../lib/sentry.js";

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const requestId = req.requestId;

  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      message: "Validation failed",
      code: "VALIDATION_ERROR",
      requestId,
      errors: err.errors.map((e) => ({
        path: e.path.join("."),
        message: e.message,
      })),
    });
    return;
  }

  if (err instanceof AppError) {
    if (!err.isOperational) {
      logger.error({ err, requestId }, "Non-operational error");
      void captureException(err, { requestId, code: err.code });
    }

    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      code: err.code,
      requestId,
    });
    return;
  }

  logger.error({ err, requestId }, "Unhandled error");
  void captureException(err, {
    requestId,
    path: req.originalUrl,
    method: req.method,
  });

  res.status(500).json({
    success: false,
    message:
      env.NODE_ENV === "production"
        ? "Internal server error"
        : err.message || "Internal server error",
    code: "INTERNAL_ERROR",
    requestId,
  });
}
