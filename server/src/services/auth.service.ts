import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../utils/AppError.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  type AccessTokenPayload,
} from "../utils/jwt.js";
import { generateSlug } from "../utils/slug.js";
import type { RegisterInput, LoginInput } from "../validations/auth.validation.js";
import type { Role } from "@prisma/client";

const SALT_ROUNDS = 12;

function toUserResponse(user: {
  id: string;
  name: string;
  email: string;
  role: Role;
  organizationId: string;
  avatar: string | null;
}) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    organizationId: user.organizationId,
    avatar: user.avatar,
  };
}

export class AuthService {
  /**
   * Register a new organization owner.
   * Creates Organization + User (OWNER) in a single transaction.
   */
  async register(input: RegisterInput) {
    const { name, email, password, organizationName } = input;

    // Check if email already exists in any organization (simple global uniqueness for owners for now)
    // For multi-tenant we allow same email in different orgs later if needed.
    // Here we keep email unique per org (schema), but for register we create new org.
    const existing = await prisma.user.findFirst({
      where: { email: email.toLowerCase() },
    });

    if (existing) {
      throw new AppError("Email already registered", 409, "EMAIL_EXISTS");
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const slug = generateSlug(organizationName);

    const result = await prisma.$transaction(async (tx) => {
      const organization = await tx.organization.create({
        data: {
          name: organizationName,
          slug,
          plan: "FREE",
        },
      });

      const user = await tx.user.create({
        data: {
          name,
          email: email.toLowerCase(),
          password: hashedPassword,
          role: "OWNER",
          organizationId: organization.id,
        },
      });

      return { user, organization };
    });

    const accessToken = signAccessToken({
      sub: result.user.id,
      email: result.user.email,
      role: result.user.role,
      organizationId: result.user.organizationId,
      name: result.user.name,
    });

    const refreshToken = signRefreshToken(result.user.id);

    // Store refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: result.user.id,
        expiresAt,
      },
    });

    return {
      user: toUserResponse(result.user),
      organization: {
        id: result.organization.id,
        name: result.organization.name,
        slug: result.organization.slug,
        plan: result.organization.plan,
      },
      accessToken,
      refreshToken,
    };
  }

  async login(input: LoginInput) {
    const { email, password } = input;

    const user = await prisma.user.findFirst({
      where: {
        email: email.toLowerCase(),
        isActive: true,
      },
      include: {
        organization: {
          select: { id: true, name: true, slug: true, plan: true },
        },
      },
    });

    if (!user) {
      throw new AppError("Invalid email or password", 401, "INVALID_CREDENTIALS");
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new AppError("Invalid email or password", 401, "INVALID_CREDENTIALS");
    }

    // Update lastSeenAt
    await prisma.user.update({
      where: { id: user.id },
      data: { lastSeenAt: new Date() },
    });

    const accessToken = signAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
      name: user.name,
    });

    const refreshToken = signRefreshToken(user.id);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Clean old tokens for this user (simple rotation)
    await prisma.refreshToken.deleteMany({
      where: { userId: user.id },
    });

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt,
      },
    });

    return {
      user: toUserResponse(user),
      organization: user.organization,
      accessToken,
      refreshToken,
    };
  }

  async refresh(refreshToken: string) {
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw new AppError("Invalid or expired refresh token", 401, "INVALID_REFRESH_TOKEN");
    }

    const stored = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: {
        user: {
          include: {
            organization: {
              select: { id: true, name: true, slug: true, plan: true },
            },
          },
        },
      },
    });

    if (!stored || stored.expiresAt < new Date()) {
      if (stored) {
        await prisma.refreshToken.delete({ where: { id: stored.id } });
      }
      throw new AppError("Invalid or expired refresh token", 401, "INVALID_REFRESH_TOKEN");
    }

    if (!stored.user.isActive) {
      throw new AppError("Account is deactivated", 403, "ACCOUNT_DEACTIVATED");
    }

    // Rotate refresh token
    await prisma.refreshToken.delete({ where: { id: stored.id } });

    const newAccessToken = signAccessToken({
      sub: stored.user.id,
      email: stored.user.email,
      role: stored.user.role,
      organizationId: stored.user.organizationId,
      name: stored.user.name,
    });

    const newRefreshToken = signRefreshToken(stored.user.id);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.refreshToken.create({
      data: {
        token: newRefreshToken,
        userId: stored.user.id,
        expiresAt,
      },
    });

    return {
      user: toUserResponse(stored.user),
      organization: stored.user.organization,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  async logout(refreshToken?: string) {
    if (refreshToken) {
      await prisma.refreshToken.deleteMany({
        where: { token: refreshToken },
      });
    }
  }

  async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        organizationId: true,
        avatar: true,
        isActive: true,
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            plan: true,
            logo: true,
          },
        },
      },
    });

    if (!user || !user.isActive) {
      throw new AppError("User not found", 404, "USER_NOT_FOUND");
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
      avatar: user.avatar,
      organization: user.organization,
    };
  }
}

export const authService = new AuthService();
