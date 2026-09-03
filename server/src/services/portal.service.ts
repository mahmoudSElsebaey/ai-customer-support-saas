import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { Organization } from "../models/Organization.js";
import { User } from "../models/User.js";
import { Customer } from "../models/Customer.js";
import { Ticket } from "../models/Ticket.js";
import { Message } from "../models/Message.js";
import { RefreshToken } from "../models/RefreshToken.js";
import { KnowledgeArticle } from "../models/KnowledgeArticle.js";
import { AppError } from "../utils/AppError.js";
import { signAccessToken, signRefreshToken } from "../utils/jwt.js";
import { emitToOrg, emitToTicket } from "../socket/index.js";
import { serializeDoc, toId } from "../utils/serialize.js";
import { Role, TicketStatus, MessageType, ArticleStatus } from "../types/enums.js";
import type {
  PortalRegisterInput,
  PortalLoginInput,
  PortalCreateTicketInput,
} from "../validations/portal.validation.js";

const SALT_ROUNDS = 12;

export class PortalService {
  async getOrganizationBySlug(slug: string) {
    const org = await Organization.findOne({ slug })
      .select("name slug logo")
      .lean();
    if (!org) {
      throw new AppError("Organization not found", 404, "ORG_NOT_FOUND");
    }
    return {
      id: org._id.toString(),
      name: org.name,
      slug: org.slug,
      logo: org.logo ?? null,
    };
  }

  async register(input: PortalRegisterInput) {
    const org = await this.getOrganizationBySlug(input.organizationSlug);
    const email = input.email.toLowerCase();
    const orgId = new mongoose.Types.ObjectId(org.id);

    const existingUser = await User.findOne({
      email,
      organizationId: orgId,
    }).lean();
    if (existingUser) {
      throw new AppError("Email already registered", 409, "EMAIL_EXISTS");
    }

    const hashedPassword = await bcrypt.hash(input.password, SALT_ROUNDS);

    let customer = await Customer.findOne({
      organizationId: orgId,
      email,
    });

    if (!customer) {
      customer = await Customer.create({
        organizationId: orgId,
        name: input.name,
        email,
      });
    }

    const user = await User.create({
      name: input.name,
      email,
      password: hashedPassword,
      role: Role.CUSTOMER,
      organizationId: orgId,
    });

    return this.issueTokens(
      {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        organizationId: org.id,
        name: user.name,
      },
      org,
      customer._id.toString()
    );
  }

  async login(input: PortalLoginInput) {
    const org = await this.getOrganizationBySlug(input.organizationSlug);
    const email = input.email.toLowerCase();
    const orgId = new mongoose.Types.ObjectId(org.id);

    const user = await User.findOne({
      email,
      organizationId: orgId,
      role: Role.CUSTOMER,
      isActive: true,
    }).select("+password");

    if (!user) {
      throw new AppError("Invalid email or password", 401, "INVALID_CREDENTIALS");
    }

    const ok = await bcrypt.compare(input.password, user.password);
    if (!ok) {
      throw new AppError("Invalid email or password", 401, "INVALID_CREDENTIALS");
    }

    user.lastSeenAt = new Date();
    await user.save();

    let customer = await Customer.findOne({
      organizationId: orgId,
      email,
    });

    if (!customer) {
      customer = await Customer.create({
        organizationId: orgId,
        name: user.name,
        email,
      });
    }

    return this.issueTokens(
      {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        organizationId: org.id,
        name: user.name,
      },
      org,
      customer._id.toString()
    );
  }

  private async issueTokens(
    user: {
      id: string;
      email: string;
      role: string;
      organizationId: string;
      name: string;
    },
    organization: { id: string; name: string; slug: string; logo?: string | null },
    customerId: string
  ) {
    const accessToken = signAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role as "CUSTOMER",
      organizationId: user.organizationId,
      name: user.name,
    });

    const refreshToken = signRefreshToken(user.id);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await RefreshToken.deleteMany({
      userId: new mongoose.Types.ObjectId(user.id),
    });
    await RefreshToken.create({
      token: refreshToken,
      userId: new mongoose.Types.ObjectId(user.id),
      expiresAt,
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId,
        customerId,
      },
      organization: {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        logo: organization.logo ?? null,
      },
      accessToken,
      refreshToken,
    };
  }

  async resolveCustomer(userId: string, organizationId: string) {
    if (
      !mongoose.Types.ObjectId.isValid(userId) ||
      !mongoose.Types.ObjectId.isValid(organizationId)
    ) {
      throw new AppError("Customer account required", 403, "FORBIDDEN");
    }

    const user = await User.findOne({
      _id: userId,
      organizationId,
      role: Role.CUSTOMER,
      isActive: true,
    });

    if (!user) {
      throw new AppError("Customer account required", 403, "FORBIDDEN");
    }

    let customer = await Customer.findOne({
      organizationId,
      email: user.email,
    });

    if (!customer) {
      customer = await Customer.create({
        organizationId: new mongoose.Types.ObjectId(organizationId),
        name: user.name,
        email: user.email,
      });
    }

    return { user, customer };
  }

  async listTickets(
    userId: string,
    organizationId: string,
    page = 1,
    limit = 20
  ) {
    const { customer } = await this.resolveCustomer(userId, organizationId);
    const orgId = new mongoose.Types.ObjectId(organizationId);

    const filter = {
      organizationId: orgId,
      customerId: customer._id,
    };

    const [items, total] = await Promise.all([
      Ticket.find(filter)
        .sort({ updatedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean()
        .exec(),
      Ticket.countDocuments(filter),
    ]);

    const ticketIds = items.map((t) => t._id);
    const msgCounts = await Message.aggregate<{ _id: mongoose.Types.ObjectId; count: number }>([
      { $match: { ticketId: { $in: ticketIds } } },
      { $group: { _id: "$ticketId", count: { $sum: 1 } } },
    ]);
    const msgMap = new Map(msgCounts.map((m) => [m._id.toString(), m.count]));

    return {
      items: items.map((t) => ({
        ...serializeDoc(t as Record<string, unknown>),
        organizationId: toId(t.organizationId),
        customerId: toId(t.customerId),
        _count: { messages: msgMap.get(t._id.toString()) ?? 0 },
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async getTicket(ticketId: string, userId: string, organizationId: string) {
    const { customer } = await this.resolveCustomer(userId, organizationId);

    if (!mongoose.Types.ObjectId.isValid(ticketId)) {
      throw new AppError("Ticket not found", 404, "TICKET_NOT_FOUND");
    }

    const ticket = await Ticket.findOne({
      _id: ticketId,
      organizationId,
      customerId: customer._id,
    })
      .lean()
      .exec();

    if (!ticket) {
      throw new AppError("Ticket not found", 404, "TICKET_NOT_FOUND");
    }

    const messages = await Message.find({
      ticketId,
      type: { $ne: MessageType.INTERNAL_NOTE },
    })
      .sort({ createdAt: 1 })
      .populate("senderId", "name role")
      .lean()
      .exec();

    return {
      ...serializeDoc(ticket as Record<string, unknown>),
      organizationId: toId(ticket.organizationId),
      customerId: toId(ticket.customerId),
      messages: messages.map((m) => {
        const base = serializeDoc(m as Record<string, unknown>) as Record<
          string,
          unknown
        >;
        const sender = m.senderId as unknown as {
          _id?: mongoose.Types.ObjectId;
          name?: string;
          role?: string;
        };
        base.sender =
          sender && typeof sender === "object"
            ? {
                id: toId(sender._id),
                name: sender.name,
                role: sender.role,
              }
            : null;
        return base;
      }),
    };
  }

  async createTicket(
    userId: string,
    organizationId: string,
    input: PortalCreateTicketInput
  ) {
    const { customer, user } = await this.resolveCustomer(userId, organizationId);

    const ticket = await Ticket.create({
      organizationId: new mongoose.Types.ObjectId(organizationId),
      customerId: customer._id,
      subject: input.subject,
      description: input.description ?? null,
      priority: input.priority ?? "MEDIUM",
      status: TicketStatus.OPEN,
    });

    if (input.description) {
      await Message.create({
        ticketId: ticket._id,
        senderId: user._id,
        content: input.description,
        type: MessageType.CUSTOMER,
      });
    }

    const result = serializeDoc(ticket.toObject() as unknown as Record<string, unknown>);

    try {
      emitToOrg(organizationId, "ticket:created", { ticket: result });
    } catch {
      /* ignore */
    }

    return result;
  }

  async addMessage(
    ticketId: string,
    userId: string,
    organizationId: string,
    content: string
  ) {
    const { customer, user } = await this.resolveCustomer(userId, organizationId);

    if (!mongoose.Types.ObjectId.isValid(ticketId)) {
      throw new AppError("Ticket not found", 404, "TICKET_NOT_FOUND");
    }

    const ticket = await Ticket.findOne({
      _id: ticketId,
      organizationId,
      customerId: customer._id,
    });

    if (!ticket) {
      throw new AppError("Ticket not found", 404, "TICKET_NOT_FOUND");
    }

    if (ticket.status === TicketStatus.CLOSED) {
      throw new AppError("Ticket is closed", 400, "TICKET_CLOSED");
    }

    const message = await Message.create({
      ticketId: ticket._id,
      senderId: user._id,
      content,
      type: MessageType.CUSTOMER,
    });

    ticket.updatedAt = new Date();
    if (ticket.status === TicketStatus.RESOLVED) {
      ticket.status = TicketStatus.OPEN;
    }
    await ticket.save();

    const populated = await Message.findById(message._id)
      .populate("senderId", "name role")
      .lean();

    const mapped = serializeDoc(populated as Record<string, unknown>) as Record<
      string,
      unknown
    >;
    const sender = populated?.senderId as unknown as {
      _id?: mongoose.Types.ObjectId;
      name?: string;
      role?: string;
    };
    mapped.sender =
      sender && typeof sender === "object"
        ? { id: toId(sender._id), name: sender.name, role: sender.role }
        : null;

    try {
      emitToTicket(ticketId, "message:created", { ticketId, message: mapped });
      emitToOrg(organizationId, "message:created", { ticketId, message: mapped });
    } catch {
      /* ignore */
    }

    return mapped;
  }

  async listPublishedArticles(
    organizationId: string,
    page = 1,
    limit = 20,
    search?: string
  ) {
    if (!mongoose.Types.ObjectId.isValid(organizationId)) {
      return {
        items: [],
        pagination: { page, limit, total: 0, totalPages: 1 },
      };
    }

    const filter: Record<string, unknown> = {
      organizationId: new mongoose.Types.ObjectId(organizationId),
      status: ArticleStatus.PUBLISHED,
    };

    if (search) {
      const re = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      filter.$or = [{ title: re }, { excerpt: re }, { content: re }];
    }

    const [items, total] = await Promise.all([
      KnowledgeArticle.find(filter)
        .sort({ updatedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .select("title excerpt category tags publishedAt updatedAt")
        .lean()
        .exec(),
      KnowledgeArticle.countDocuments(filter),
    ]);

    return {
      items: items.map((a) => serializeDoc(a as Record<string, unknown>)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async getPublishedArticle(articleId: string, organizationId: string) {
    if (
      !mongoose.Types.ObjectId.isValid(articleId) ||
      !mongoose.Types.ObjectId.isValid(organizationId)
    ) {
      throw new AppError("Article not found", 404, "ARTICLE_NOT_FOUND");
    }

    const article = await KnowledgeArticle.findOne({
      _id: articleId,
      organizationId,
      status: ArticleStatus.PUBLISHED,
    })
      .select("title content excerpt category tags publishedAt updatedAt")
      .lean();

    if (!article) {
      throw new AppError("Article not found", 404, "ARTICLE_NOT_FOUND");
    }

    return serializeDoc(article as Record<string, unknown>);
  }
}

export const portalService = new PortalService();
