import { Server as HttpServer } from "http";
import { Server } from "socket.io";
import { env } from "../config/env.js";
import { logger } from "../lib/logger.js";
import { prisma } from "../lib/prisma.js";
import { User } from "../models/User.js";
import { socketAuth } from "./auth.js";
import {
  addPresence,
  removePresence,
  getOnlineUserIds,
} from "./presence.js";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
} from "./types.js";

let io: Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
> | null = null;

export function getIO() {
  if (!io) {
    throw new Error("Socket.IO not initialized");
  }
  return io;
}

export function initSocket(httpServer: HttpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: env.CLIENT_URL,
      credentials: true,
    },
    transports: ["websocket", "polling"],
  });

  io.use(socketAuth);

  io.on("connection", (socket) => {
    const user = socket.data.user;
    logger.info(
      { userId: user.id, orgId: user.organizationId },
      "Socket connected"
    );

    // Join organization room (for ticket list updates, presence)
    const orgRoom = `org:${user.organizationId}`;
    socket.join(orgRoom);

    // Presence
    const becameOnline = addPresence(
      user.organizationId,
      user.id,
      user.name,
      socket.id
    );

    if (becameOnline) {
      socket.to(orgRoom).emit("agent:online", {
        userId: user.id,
        name: user.name,
        organizationId: user.organizationId,
      });
    }

    // Send current online list to this socket
    socket.emit("presence:list", {
      onlineUserIds: getOnlineUserIds(user.organizationId),
    });

    // Update lastSeenAt on MongoDB users (Auth is on Mongoose since Phase 2)
    User.findByIdAndUpdate(user.id, { lastSeenAt: new Date() }).catch(() => {});

    // —— Ticket rooms ——
    // Ticket/message queries still use Prisma until Phase 3 domain migration
    socket.on("ticket:join", async (ticketId) => {
      try {
        const ticket = await prisma.ticket.findFirst({
          where: {
            id: ticketId,
            organizationId: user.organizationId,
          },
          select: { id: true, assignedAgentId: true },
        });

        if (!ticket) return;

        // Agents can only join assigned or unassigned tickets
        if (
          user.role === "AGENT" &&
          ticket.assignedAgentId &&
          ticket.assignedAgentId !== user.id
        ) {
          return;
        }

        socket.join(`ticket:${ticketId}`);
        logger.debug({ ticketId, userId: user.id }, "Joined ticket room");
      } catch (err) {
        logger.error({ err }, "ticket:join error");
      }
    });

    socket.on("ticket:leave", (ticketId) => {
      socket.leave(`ticket:${ticketId}`);
    });

    // —— Typing ——
    socket.on("typing:start", ({ ticketId }) => {
      socket.to(`ticket:${ticketId}`).emit("typing:start", {
        ticketId,
        userId: user.id,
        name: user.name,
      });
    });

    socket.on("typing:stop", ({ ticketId }) => {
      socket.to(`ticket:${ticketId}`).emit("typing:stop", {
        ticketId,
        userId: user.id,
      });
    });

    // —— Read receipts ——
    socket.on("message:read", async ({ ticketId, messageId }) => {
      try {
        const message = await prisma.message.findFirst({
          where: {
            id: messageId,
            ticketId,
            ticket: { organizationId: user.organizationId },
          },
        });

        if (!message || message.readAt) return;

        const updated = await prisma.message.update({
          where: { id: messageId },
          data: { readAt: new Date() },
        });

        io!.to(`ticket:${ticketId}`).emit("message:read", {
          ticketId,
          messageId,
          readAt: updated.readAt!.toISOString(),
        });
      } catch (err) {
        logger.error({ err }, "message:read error");
      }
    });

    socket.on("presence:ping", () => {
      // keep-alive; presence already tracked by connection
    });

    socket.on("disconnect", () => {
      const wentOffline = removePresence(
        user.organizationId,
        user.id,
        socket.id
      );

      if (wentOffline) {
        socket.to(orgRoom).emit("agent:offline", {
          userId: user.id,
          organizationId: user.organizationId,
        });
      }

      logger.info({ userId: user.id }, "Socket disconnected");
    });
  });

  logger.info("🔌 Socket.IO initialized");
  return io;
}

/** Emit helpers used by HTTP services */
export function emitToOrg(organizationId: string, event: keyof ServerToClientEvents, payload: unknown) {
  if (!io) return;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (io.to(`org:${organizationId}`) as any).emit(event, payload);
}

export function emitToTicket(ticketId: string, event: keyof ServerToClientEvents, payload: unknown) {
  if (!io) return;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (io.to(`ticket:${ticketId}`) as any).emit(event, payload);
}
