import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import type { Role } from "../types/enums.js";

export interface AccessTokenPayload {
  sub: string;
  email: string;
  role: Role;
  organizationId: string;
  name: string;
}

export interface RefreshTokenPayload {
  sub: string;
  type: "refresh";
}

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  });
}

export function signRefreshToken(userId: string): string {
  const payload: RefreshTokenPayload = { sub: userId, type: "refresh" };
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  const payload = jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshTokenPayload;
  if (payload.type !== "refresh") {
    throw new Error("Invalid refresh token");
  }
  return payload;
}
