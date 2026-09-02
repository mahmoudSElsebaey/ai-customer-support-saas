import rateLimit from "express-rate-limit";
import { env } from "../config/env.js";

const isDev = env.NODE_ENV === "development";

/** Global API limit */
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 2000 : 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests. Please try again later.",
    code: "RATE_LIMITED",
  },
});

/** Stricter limit for auth endpoints */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 100 : 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many authentication attempts. Please try again later.",
    code: "AUTH_RATE_LIMITED",
  },
});

/** AI endpoints — more expensive */
export const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: isDev ? 60 : 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "AI rate limit exceeded. Please slow down.",
    code: "AI_RATE_LIMITED",
  },
});
