import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { Organization } from "../models/Organization.js";
import { User } from "../models/User.js";
import { RefreshToken } from "../models/RefreshToken.js";
import { AppError } from "../utils/AppError.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt.js";
import { generateSlug } from "../utils/slug.js";
import { toId } from "../utils/serialize.js";
import type { RegisterInput, LoginInput } from "../validations/auth.validation.js";
import { Role, type Role as RoleType } from "../types/enums.js";
import { hashRefreshToken } from "../utils/refreshToken.js";

const SALT_ROUNDS = 12;

function toUserResponse(user: {
  _id?: mongoose.Types.ObjectId;
  id?: string;
  name: string;
  email: string;
  role: RoleType;
  organizationId: mongoose.Types.ObjectId | string;
  avatar?: string | null;
}) {
  const id = user.id ?? toId(user._id) ?? "";
  return {
    id,
    name: user.name,
    email: user.email,
    role: user.role,
    organizationId: toId(user.organizationId as mongoose.Types.ObjectId) ?? String(user.organizationId),
    avatar: user.avatar ?? null,
  };
}

function toOrgResponse(org: {
  _id?: mongoose.Types.ObjectId;
  id?: string;
  name: string;
  slug: string;
  plan: string;
  logo?: string | null;
}) {
  return {
    id: org.id ?? toId(org._id) ?? "",
    name: org.name,
    slug: org.slug,
    plan: org.plan,
    ...(org.logo !== undefined ? { logo: org.logo ?? null } : {}),
  };
}

export class AuthService {
  /**
   * Register a new organization owner.
   * Creates Organization + User (OWNER).
   */
  async register(input: RegisterInput) {
    const { name, email, password, organizationName } = input;
    const normalizedEmail = email.toLowerCase();

    const existing = await User.findOne({ email: normalizedEmail }).lean();
    if (existing) {
      throw new AppError("Email already registered", 409, "EMAIL_EXISTS");
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    let slug = generateSlug(organizationName);

    // Ensure slug uniqueness
    const slugExists = await Organization.findOne({ slug }).lean();
    if (slugExists) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    let organization;
    let user;

    try {
      organization = await Organization.create({
        name: organizationName,
        slug,
        plan: "FREE",
      });

      user = await User.create({
        name,
        email: normalizedEmail,
        password: hashedPassword,
        role: Role.OWNER,
        organizationId: organization._id,
      });
    } catch (err) {
      // Best-effort cleanup if user create failed after org create
      if (organization?._id) {
        await Organization.deleteOne({ _id: organization._id }).catch(() => {});
      }
      throw err;
    }

    const userId = user._id.toString();
    const orgId = organization._id.toString();

    const accessToken = signAccessToken({
      sub: userId,
      email: user.email,
      role: user.role,
      organizationId: orgId,
      name: user.name,
    });

    const refreshToken = signRefreshToken(userId);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await RefreshToken.create({
      tokenHash: hashRefreshToken(refreshToken),
      userId: user._id,
      expiresAt,
    });

    return {
      user: toUserResponse(user),
      organization: toOrgResponse(organization),
      accessToken,
      refreshToken,
    };
  }

  async login(input: LoginInput) {
    const { email, password } = input;
    const normalizedEmail = email.toLowerCase();

    const user = await User.findOne({
      email: normalizedEmail,
      isActive: true,
    })
      .select("+password")
      .populate("organizationId", "name slug plan logo")
      .exec();

    if (!user) {
      throw new AppError("Invalid email or password", 401, "INVALID_CREDENTIALS");
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new AppError("Invalid email or password", 401, "INVALID_CREDENTIALS");
    }

    user.lastSeenAt = new Date();
    await user.save();

    const userId = user._id.toString();
    const orgDoc = user.organizationId as unknown as {
      _id: mongoose.Types.ObjectId;
      name: string;
      slug: string;
      plan: string;
      logo?: string | null;
    };
    const orgId =
      orgDoc && typeof orgDoc === "object" && "_id" in orgDoc
        ? orgDoc._id.toString()
        : toId(user.organizationId as mongoose.Types.ObjectId) ?? "";

    const accessToken = signAccessToken({
      sub: userId,
      email: user.email,
      role: user.role,
      organizationId: orgId,
      name: user.name,
    });

    const refreshToken = signRefreshToken(userId);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await RefreshToken.deleteMany({ userId: user._id });
    await RefreshToken.create({
      tokenHash: hashRefreshToken(refreshToken),
      userId: user._id,
      expiresAt,
    });

    return {
      user: toUserResponse({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        organizationId: orgId,
        avatar: user.avatar,
      }),
      organization: toOrgResponse({
        _id: orgDoc._id,
        name: orgDoc.name,
        slug: orgDoc.slug,
        plan: orgDoc.plan,
      }),
      accessToken,
      refreshToken,
    };
  }

  async refresh(refreshToken: string) {
    try {
      verifyRefreshToken(refreshToken);
    } catch {
      throw new AppError("Invalid or expired refresh token", 401, "INVALID_REFRESH_TOKEN");
    }

    const tokenHash = hashRefreshToken(refreshToken);
    const stored = await RefreshToken.findOne({ tokenHash }).exec();
    if (!stored || stored.expiresAt < new Date()) {
      if (stored) {
        await RefreshToken.deleteOne({ _id: stored._id });
      }
      throw new AppError("Invalid or expired refresh token", 401, "INVALID_REFRESH_TOKEN");
    }

    const user = await User.findById(stored.userId)
      .populate("organizationId", "name slug plan logo")
      .exec();

    if (!user || !user.isActive) {
      await RefreshToken.deleteOne({ _id: stored._id });
      throw new AppError(
        user ? "Account is deactivated" : "Invalid or expired refresh token",
        user ? 403 : 401,
        user ? "ACCOUNT_DEACTIVATED" : "INVALID_REFRESH_TOKEN"
      );
    }

    await RefreshToken.deleteOne({ _id: stored._id });

    const userId = user._id.toString();
    const orgDoc = user.organizationId as unknown as {
      _id: mongoose.Types.ObjectId;
      name: string;
      slug: string;
      plan: string;
    };
    const orgId =
      orgDoc && typeof orgDoc === "object" && "_id" in orgDoc
        ? orgDoc._id.toString()
        : toId(user.organizationId as mongoose.Types.ObjectId) ?? "";

    const newAccessToken = signAccessToken({
      sub: userId,
      email: user.email,
      role: user.role,
      organizationId: orgId,
      name: user.name,
    });

    const newRefreshToken = signRefreshToken(userId);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await RefreshToken.create({
      tokenHash: hashRefreshToken(newRefreshToken),
      userId: user._id,
      expiresAt,
    });

    return {
      user: toUserResponse({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        organizationId: orgId,
        avatar: user.avatar,
      }),
      organization: toOrgResponse({
        _id: orgDoc._id,
        name: orgDoc.name,
        slug: orgDoc.slug,
        plan: orgDoc.plan,
      }),
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  async logout(refreshToken?: string) {
    if (refreshToken) {
      await RefreshToken.deleteMany({ tokenHash: hashRefreshToken(refreshToken) });
    }
  }

  async getMe(userId: string) {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new AppError("User not found", 404, "USER_NOT_FOUND");
    }

    const user = await User.findById(userId)
      .populate("organizationId", "name slug plan logo")
      .exec();

    if (!user || !user.isActive) {
      throw new AppError("User not found", 404, "USER_NOT_FOUND");
    }

    const orgDoc = user.organizationId as unknown as {
      _id: mongoose.Types.ObjectId;
      name: string;
      slug: string;
      plan: string;
      logo?: string | null;
    };
    const orgId =
      orgDoc && typeof orgDoc === "object" && "_id" in orgDoc
        ? orgDoc._id.toString()
        : toId(user.organizationId as mongoose.Types.ObjectId) ?? "";

    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      organizationId: orgId,
      avatar: user.avatar ?? null,
      organization: toOrgResponse({
        _id: orgDoc._id,
        name: orgDoc.name,
        slug: orgDoc.slug,
        plan: orgDoc.plan,
        logo: orgDoc.logo,
      }),
    };
  }
}

export const authService = new AuthService();
