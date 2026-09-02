import { env } from "../config/env.js";
import { logger } from "./logger.js";

let initialized = false;

/**
 * Optional Sentry. Safe no-op when SENTRY_DSN is unset.
 * Install: npm i @sentry/node (already listed in package.json).
 */
export async function initSentry() {
  if (!env.SENTRY_DSN || initialized) return;

  try {
    const Sentry = await import("@sentry/node");
    Sentry.init({
      dsn: env.SENTRY_DSN,
      environment: env.NODE_ENV,
      tracesSampleRate: env.NODE_ENV === "production" ? 0.1 : 1.0,
    });
    initialized = true;
    logger.info("Sentry initialized");
  } catch (err) {
    logger.warn(
      { err },
      "Sentry package not available — continuing without error reporting"
    );
  }
}

export async function captureException(error: unknown, context?: Record<string, unknown>) {
  if (!env.SENTRY_DSN || !initialized) return;
  try {
    const Sentry = await import("@sentry/node");
    Sentry.withScope((scope) => {
      if (context) {
        scope.setExtras(context);
      }
      Sentry.captureException(error);
    });
  } catch {
    /* ignore */
  }
}
