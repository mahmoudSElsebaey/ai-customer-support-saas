import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../utils/AppError.js";
import { signAccessToken, signRefreshToken } from "../utils/jwt.js";
import { emitToOrg, emitToTicket } from "../socket/index.js";
import type {
  PortalRegisterInput,
  PortalLoginInput,
  PortalCreateTicketInput,
} from "../validations/portal.validation.js";

const SALT_ROUNDS = 12;

export class PortalService {
  /** Resolve org by public slug */
  async getOrganizationBySlug(slug: string) {
    const org = await prisma.organization.findUnique({
      where: { slug },
      select: { id: true, name: true, slug: true, logo: true },
    });
    if (!org) {
      throw new AppError("Organization not found", 404, "ORG_NOT_FOUND");
    }
    return org;
  }

  /**
   * Register a CUSTOMER user for an existing organization.
   * Also ensures a CRM Customer row exists (matched by email).
   */
  async register(input: PortalRegisterInput) {
    const org = await this.getOrganizationBySlug(input.organizationSlug);
    const email = input.email.toLowerCase();

    const existingUser = await prisma.user.findFirst({
      where: { email, organizationId: org.id },
    });
    if (existingUser) {
      throw new AppError("Email already registered", 409, "EMAIL_EXISTS");
    }

    const hashedPassword = await bcrypt.hash(input.password, SALT_ROUNDS);

    const result = await prisma.$transaction(async (tx) => {
      let customer = await tx.customer.findFirst({
        where: { organizationId: org.id, email },
      });

      if (!customer) {
        customer = await tx.customer.create({
          data: {
            organizationId: org.id,
            name: input.name,
            email,
          },
        });
      }

      const user = await tx.user.create({
        data: {
          name: input.name,
          email,
          password: hashedPassword,
          role: "CUSTOMER",
          organizationId: org.id,
        },
      });

      return { user, customer, organization: org };
    });

    return this.issueTokens(result.user, result.organization, result.customer.id);
  }

  async login(input: PortalLoginInput) {
    const org = await this.getOrganizationBySlug(input.organizationSlug);
    const email = input.email.toLowerCase();

    const user = await prisma.user.findFirst({
      where: {
        email,
        organizationId: org.id,
        role: "CUSTOMER",
        isActive: true,
      },
    });

    if (!user) {
      throw new AppError("Invalid email or password", 401, "INVALID_CREDENTIALS");
    }

    const ok = await bcrypt.compare(input.password, user.password);
    if (!ok) {
      throw new AppError("Invalid email or password", 401, "INVALID_CREDENTIALS");
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastSeenAt: new Date() },
    });

    let customer = await prisma.customer.findFirst({
      where: { organizationId: org.id, email },
    });

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          organizationId: org.id,
          name: user.name,
          email,
        },
      });
    }

    return this.issueTokens(user, org, customer.id);
  }

  private async issueTokens(
    user: { id: string; email: string; role: "CUSTOMER" | string; organizationId: string; name: string },
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

    await prisma.refreshToken.deleteMany({ where: { userId: user.id } });
    await prisma.refreshToken.create({
      data: { token: refreshToken, userId: user.id, expiresAt },
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

  /** Resolve CRM customer for portal user (by email + org) */
  async resolveCustomer(userId: string, organizationId: string) {
    const user = await prisma.user.findFirst({
      where: { id: userId, organizationId, role: "CUSTOMER", isActive: true },
    });
    if (!user) {
      throw new AppError("Customer account required", 403, "FORBIDDEN");
    }

    let customer = await prisma.customer.findFirst({
      where: { organizationId, email: user.email },
    });

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          organizationId,
          name: user.name,
          email: user.email,
        },
      });
    }

    return { user, customer };
  }

  async listTickets(userId: string, organizationId: string, page = 1, limit = 20) {
    const { customer } = await this.resolveCustomer(userId, organizationId);

    const where = { organizationId, customerId: customer.id };

    const [items, total] = await Promise.all([
      prisma.ticket.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          _count: { select: { messages: true } },
        },
      }),
      prisma.ticket.count({ where }),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getTicket(ticketId: string, userId: string, organizationId: string) {
    const { customer } = await this.resolveCustomer(userId, organizationId);

    const ticket = await prisma.ticket.findFirst({
      where: {
        id: ticketId,
        organizationId,
        customerId: customer.id,
      },
      include: {
        messages: {
          where: { type: { not: "INTERNAL_NOTE" } },
          orderBy: { createdAt: "asc" },
          include: {
            sender: {
              select: { id: true, name: true, role: true },
            },
          },
        },
      },
    });

    if (!ticket) {
      throw new AppError("Ticket not found", 404, "TICKET_NOT_FOUND");
    }

    return ticket;
  }

  async createTicket(
    userId: string,
    organizationId: string,
    input: PortalCreateTicketInput
  ) {
    const { customer, user } = await this.resolveCustomer(userId, organizationId);

    const ticket = await prisma.ticket.create({
      data: {
        organizationId,
        customerId: customer.id,
        subject: input.subject,
        description: input.description ?? null,
        priority: input.priority ?? "MEDIUM",
        status: "OPEN",
      },
    });

    if (input.description) {
      await prisma.message.create({
        data: {
          ticketId: ticket.id,
          senderId: user.id,
          content: input.description,
          type: "CUSTOMER",
        },
      });
    }

    try {
      emitToOrg(organizationId, "ticket:created", { ticket });
    } catch {
      /* ignore */
    }

    return ticket;
  }

  async addMessage(
    ticketId: string,
    userId: string,
    organizationId: string,
    content: string
  ) {
    const { customer, user } = await this.resolveCustomer(userId, organizationId);

    const ticket = await prisma.ticket.findFirst({
      where: {
        id: ticketId,
        organizationId,
        customerId: customer.id,
      },
    });

    if (!ticket) {
      throw new AppError("Ticket not found", 404, "TICKET_NOT_FOUND");
    }

    if (ticket.status === "CLOSED") {
      throw new AppError("Ticket is closed", 400, "TICKET_CLOSED");
    }

    const message = await prisma.message.create({
      data: {
        ticketId,
        senderId: user.id,
        content,
        type: "CUSTOMER",
      },
      include: {
        sender: { select: { id: true, name: true, role: true } },
      },
    });

    await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        updatedAt: new Date(),
        status: ticket.status === "RESOLVED" ? "OPEN" : ticket.status,
      },
    });

    try {
      emitToTicket(ticketId, "message:created", { ticketId, message });
      emitToOrg(organizationId, "message:created", { ticketId, message });
    } catch {
      /* ignore */
    }

    return message;
  }

  async listPublishedArticles(organizationId: string, page = 1, limit = 20, search?: string) {
    const where: Record<string, unknown> = {
      organizationId,
      status: "PUBLISHED",
    };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { excerpt: { contains: search, mode: "insensitive" } },
        { content: { contains: search, mode: "insensitive" } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.knowledgeArticle.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          title: true,
          excerpt: true,
          category: true,
          tags: true,
          publishedAt: true,
          updatedAt: true,
        },
      }),
      prisma.knowledgeArticle.count({ where }),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getPublishedArticle(articleId: string, organizationId: string) {
    const article = await prisma.knowledgeArticle.findFirst({
      where: {
        id: articleId,
        organizationId,
        status: "PUBLISHED",
      },
      select: {
        id: true,
        title: true,
        content: true,
        excerpt: true,
        category: true,
        tags: true,
        publishedAt: true,
        updatedAt: true,
      },
    });

    if (!article) {
      throw new AppError("Article not found", 404, "ARTICLE_NOT_FOUND");
    }

    return article;
  }
}

export const portalService = new PortalService();
