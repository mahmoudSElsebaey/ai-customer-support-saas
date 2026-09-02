import type { Response, CookieOptions } from "express";
import { env } from "../config/env.js";

const isProduction = env.NODE_ENV === "production";

const baseCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "none" : "lax",
  path: "/",
};

export function setAuthCookies(
  res: Response,
  accessToken: string,
  refreshToken: string
): void {
  // Access token – short lived
  res.cookie("accessToken", accessToken, {
    ...baseCookieOptions,
    maxAge: 15 * 60 * 1000, // 15 minutes
  });

  // Refresh token – longer lived
  res.cookie("refreshToken", refreshToken, {
    ...baseCookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
}

export function clearAuthCookies(res: Response): void {
  res.clearCookie("accessToken", baseCookieOptions);
  res.clearCookie("refreshToken", baseCookieOptions);
}
