import type { Socket } from "socket.io";
import { parse as parseCookie } from "cookie";
import { verifyAccessToken } from "../utils/jwt.js";
import { logger } from "../lib/logger.js";
import type { SocketData } from "./types.js";

/**
 * Authenticate Socket.IO connection using accessToken cookie or auth.token.
 */
export function socketAuth(
  socket: Socket,
  next: (err?: Error) => void
): void {
  try {
    const cookieHeader = socket.handshake.headers.cookie;
    let token: string | undefined;

    if (cookieHeader) {
      const cookies = parseCookie(cookieHeader);
      token = cookies.accessToken;
    }

    // Fallback: client can pass token in handshake.auth
    if (!token && socket.handshake.auth?.token) {
      token = String(socket.handshake.auth.token);
    }

    if (!token) {
      return next(new Error("Authentication required"));
    }

    const payload = verifyAccessToken(token);

    (socket.data as SocketData).user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      organizationId: payload.organizationId,
      name: payload.name,
    };

    next();
  } catch (error) {
    logger.warn({ error }, "Socket auth failed");
    next(new Error("Invalid or expired token"));
  }
}
