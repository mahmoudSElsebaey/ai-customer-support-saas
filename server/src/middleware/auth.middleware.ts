import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt.js";
import { AppError } from "../utils/AppError.js";
import type { Role } from "../types/enums.js";

/**
 * Protect routes – requires valid access token.
 * Attaches req.user with id, email, role, organizationId, name.
 * NEVER trusts client-provided organizationId / role.
 */
export function protect(req: Request, _res: Response, next: NextFunction) {
  try {
    const token =
      req.cookies?.accessToken ||
      (req.headers.authorization?.startsWith("Bearer ")
        ? req.headers.authorization.split(" ")[1]
        : undefined);

    if (!token) {
      throw new AppError("Authentication required", 401, "UNAUTHORIZED");
    }

    const payload = verifyAccessToken(token);

    req.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      organizationId: payload.organizationId,
      name: payload.name,
    };

    next();
  } catch (error) {
    if (error instanceof AppError) {
      return next(error);
    }
    next(new AppError("Invalid or expired token", 401, "INVALID_TOKEN"));
  }
}

/**
 * Role-based authorization.
 * Usage: authorize("OWNER", "ADMIN")
 */
export function authorize(...allowedRoles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError("Authentication required", 401, "UNAUTHORIZED"));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError("You do not have permission to perform this action", 403, "FORBIDDEN")
      );
    }

    next();
  };
}

/**
 * Ensures the request is scoped to the authenticated user's organization.
 * Call this after protect().
 * Any route that needs tenant isolation should use this.
 */
export function requireTenant(req: Request, _res: Response, next: NextFunction) {
  if (!req.user?.organizationId) {
    return next(new AppError("Organization context required", 403, "TENANT_REQUIRED"));
  }
  next();
}
