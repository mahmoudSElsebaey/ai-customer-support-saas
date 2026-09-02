import http from "http";
import app from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./lib/logger.js";
import { prisma } from "./lib/prisma.js";
import { initSocket } from "./socket/index.js";

let httpServer: http.Server | null = null;
let shuttingDown = false;

async function bootstrap() {
  try {
    await prisma.$connect();
    logger.info("Database connected");

    httpServer = http.createServer(app);
    initSocket(httpServer);

    httpServer.listen(env.PORT, () => {
      logger.info(
        {
          port: env.PORT,
          env: env.NODE_ENV,
        },
        "Voxly API listening"
      );
    });
  } catch (error) {
    logger.error({ error }, "Failed to start server");
    process.exit(1);
  }
}

async function shutdown(signal: string) {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info({ signal }, "Shutting down gracefully...");

  const forceTimer = setTimeout(() => {
    logger.error("Forced shutdown after timeout");
    process.exit(1);
  }, 15_000);
  forceTimer.unref();

  try {
    if (httpServer) {
      await new Promise<void>((resolve, reject) => {
        httpServer!.close((err) => (err ? reject(err) : resolve()));
      });
      logger.info("HTTP server closed");
    }
    await prisma.$disconnect();
    logger.info("Database disconnected");
    process.exit(0);
  } catch (error) {
    logger.error({ error }, "Error during shutdown");
    process.exit(1);
  }
}

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));

process.on("unhandledRejection", (reason) => {
  logger.error({ reason }, "Unhandled rejection");
});

process.on("uncaughtException", (error) => {
  logger.error({ error }, "Uncaught exception");
  void shutdown("uncaughtException");
});

bootstrap();
