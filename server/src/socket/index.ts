import { Server as HttpServer } from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import { env } from "../config/env.js";
import { logger } from "../lib/logger.js";
import { User } from "../models/User.js";
import { Ticket } from "../models/Ticket.js";
import { Message } from "../models/Message.js";
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

async function canAccessTicket(
  user: SocketData["user"],
  ticketId: string
): Promise<boolean> {
  if (
    !mongoose.Types.ObjectId.isValid(ticketId) ||
    !mongoose.Types.ObjectId.isValid(user.organizationId) ||
    user.role === "CUSTOMER"
  ) {
    return false;
  }

  const ticket = await Ticket.findOne({
    _id: ticketId,
    organizationId: user.organizationId,
  })
    .select("assignedAgentId")
    .lean();

  if (!ticket) return false;

  const assignedId = ticket.assignedAgentId?.toString() ?? null;
  return !(user.role === "AGENT" && assignedId && assignedId !== user.id);
}

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

    const orgRoom = `org:${user.organizationId}`;
    socket.join(orgRoom);

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

    socket.emit("presence:list", {
      onlineUserIds: getOnlineUserIds(user.organizationId),
    });

    User.findByIdAndUpdate(user.id, { lastSeenAt: new Date() }).catch(() => {});

    socket.on("ticket:join", async (ticketId) => {
      try {
        if (!(await canAccessTicket(user, ticketId))) return;

        socket.join(`ticket:${ticketId}`);
        logger.debug({ ticketId, userId: user.id }, "Joined ticket room");
      } catch (err) {
        logger.error({ err }, "ticket:join error");
      }
    });

    socket.on("ticket:leave", (ticketId) => {
      socket.leave(`ticket:${ticketId}`);
    });

    socket.on("typing:start", ({ ticketId }) => {
      if (!socket.rooms.has(`ticket:${ticketId}`)) return;
      socket.to(`ticket:${ticketId}`).emit("typing:start", {
        ticketId,
        userId: user.id,
        name: user.name,
      });
    });

    socket.on("typing:stop", ({ ticketId }) => {
      if (!socket.rooms.has(`ticket:${ticketId}`)) return;
      socket.to(`ticket:${ticketId}`).emit("typing:stop", {
        ticketId,
        userId: user.id,
      });
    });

    socket.on("message:read", async ({ ticketId, messageId }) => {
      try {
        if (!mongoose.Types.ObjectId.isValid(messageId)) {
          return;
        }
        if (!(await canAccessTicket(user, ticketId))) return;

        const message = await Message.findOne({
          _id: messageId,
          ticketId,
        });

        if (!message || message.readAt) return;

        message.readAt = new Date();
        await message.save();

        io!.to(`ticket:${ticketId}`).emit("message:read", {
          ticketId,
          messageId,
          readAt: message.readAt.toISOString(),
        });
      } catch (err) {
        logger.error({ err }, "message:read error");
      }
    });

    socket.on("presence:ping", () => {});

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

export function emitToOrg(
  organizationId: string,
  event: keyof ServerToClientEvents,
  payload: unknown
) {
  if (!io) return;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (io.to(`org:${organizationId}`) as any).emit(event, payload);
}

export function emitToTicket(
  ticketId: string,
  event: keyof ServerToClientEvents,
  payload: unknown
) {
  if (!io) return;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (io.to(`ticket:${ticketId}`) as any).emit(event, payload);
}
