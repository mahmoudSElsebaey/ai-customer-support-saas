import type { Request, Response } from "express";
import { authService } from "../services/auth.service.js";
import { successResponse } from "../utils/apiResponse.js";
import { setAuthCookies, clearAuthCookies } from "../utils/cookies.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const register = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.register(req.body);

  setAuthCookies(res, result.accessToken, result.refreshToken);

  return successResponse(
    res,
    {
      user: result.user,
      organization: result.organization,
    },
    "Registration successful",
    201
  );
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.login(req.body);

  setAuthCookies(res, result.accessToken, result.refreshToken);

  return successResponse(
    res,
    {
      user: result.user,
      organization: result.organization,
    },
    "Login successful"
  );
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.refreshToken;

  if (!refreshToken) {
    clearAuthCookies(res);
    return res.status(401).json({
      success: false,
      message: "Refresh token required",
      code: "REFRESH_TOKEN_REQUIRED",
    });
  }

  const result = await authService.refresh(refreshToken);

  setAuthCookies(res, result.accessToken, result.refreshToken);

  return successResponse(
    res,
    {
      user: result.user,
      organization: result.organization,
    },
    "Token refreshed"
  );
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.refreshToken;
  await authService.logout(refreshToken);
  clearAuthCookies(res);

  return successResponse(res, null, "Logged out successfully");
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  // req.user is set by protect middleware
  const user = await authService.getMe(req.user!.id);
  return successResponse(res, user, "Current user");
});
