import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env.js";
import { AppError } from "../utils/AppError.js";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * Browser requests carrying cookies must originate from the configured client.
 * Requests without an Origin header are allowed for non-browser clients and
 * server-to-server webhooks, which use separate signature verification.
 */
export function requireTrustedOrigin(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  if (SAFE_METHODS.has(req.method) || !req.headers.origin) {
    return next();
  }

  if (req.headers.origin !== env.CLIENT_URL) {
    return next(new AppError("Untrusted request origin", 403, "UNTRUSTED_ORIGIN"));
  }

  next();
}
