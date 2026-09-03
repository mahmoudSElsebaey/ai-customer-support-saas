import express from "express";
import type { IncomingMessage } from "http";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import { pinoHttp } from "pino-http";
import { env } from "./config/env.js";
import { logger } from "./lib/logger.js";
import { requestId } from "./middleware/requestId.js";
import { metricsMiddleware } from "./middleware/metrics.js";
import { globalLimiter } from "./middleware/rateLimit.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { requireTrustedOrigin } from "./middleware/originProtection.js";
import { notFound } from "./middleware/notFound.js";
import apiRoutes from "./routes/index.js";
import * as billingController from "./controllers/billing.controller.js";

const app = express();

if (env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

app.use(requestId);
app.use(metricsMiddleware);

app.use(
  pinoHttp({
    logger,
    genReqId: (req: IncomingMessage) =>
      (req as express.Request).requestId ?? "unknown",
    autoLogging: env.NODE_ENV !== "test",
    serializers: {
      req: (req: express.Request) => ({
        id: req.id,
        method: req.method,
        url: req.url,
      }),
    },
  })
);

app.use(
  helmet({
    contentSecurityPolicy: env.NODE_ENV === "production",
    crossOriginEmbedderPolicy: false,
  })
);

app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Request-Id"],
    exposedHeaders: ["X-Request-Id", "RateLimit-Limit", "RateLimit-Remaining"],
  })
);

app.use(compression());

app.post(
  "/api/billing/webhook",
  express.raw({ type: "application/json" }),
  billingController.webhook
);

app.use(cookieParser());
app.use(requireTrustedOrigin);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

app.disable("x-powered-by");

app.use("/api", globalLimiter, apiRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
