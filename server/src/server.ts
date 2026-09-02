import http from "http";
import app from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./lib/logger.js";
import { prisma } from "./lib/prisma.js";
import { initSocket } from "./socket/index.js";

async function bootstrap() {
  try {
    await prisma.$connect();
    logger.info("✅ Database connected");

    const httpServer = http.createServer(app);
    initSocket(httpServer);

    httpServer.listen(env.PORT, () => {
      logger.info(`🚀 Voxly API running on http://localhost:${env.PORT}`);
      logger.info(`   Environment: ${env.NODE_ENV}`);
      logger.info(`   Socket.IO ready`);
    });
  } catch (error) {
    logger.error({ error }, "Failed to start server");
    process.exit(1);
  }
}

process.on("SIGTERM", async () => {
  logger.info("SIGTERM received, shutting down...");
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGINT", async () => {
  logger.info("SIGINT received, shutting down...");
  await prisma.$disconnect();
  process.exit(0);
});

bootstrap();
