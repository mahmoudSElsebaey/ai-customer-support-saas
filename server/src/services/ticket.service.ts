import { prisma } from "../lib/prisma.js";
import { AppError } from "../utils/AppError.js";
import { emitToOrg, emitToTicket } from "../socket/index.js";
import type {
  CreateTicketInput,
  UpdateTicketInput,
  CreateMessageInput,
} from "../validations/ticket.validation.js";
import type { Role } from "@prisma/client";

interface ListParams {
  organizationId: string;
  page: number;
  limit: number;
  search?: string;
  status?: string;
  priority?: string;
  assignedAgentId?: string;
  customerId?: string;
  unassigned?: boolean;
  viewerRole?: Role;
  viewerId?: string;
}

export class TicketService {
  async list(params: ListParams) {
    const {
      organizationId,
      page,
      limit,
      search,
      status,
      priority,
      assignedAgentId,
      customerId,
      unassigned,
      viewerRole,
      viewerId,
    } = params;

    const where: Record<string, unknown> = { organizationId };

    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (customerId) where.customerId = customerId;
    if (unassigned === true) where.assignedAgentId = null;
    else if (assignedAgentId) where.assignedAgentId = assignedAgentId;

    if (viewerRole === "AGENT" && viewerId) {
      where.OR = [
        { assignedAgentId: viewerId },
        { assignedAgentId: null },
      ];
    }

    if (search) {
      const searchFilter = [
        { subject: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
      if (where.OR) {
        where.AND = [{ OR: where.OR }, { OR: searchFilter }];
        delete where.OR;
      } else {
        where.OR = searchFilter;
      }
    }

    const [items, total] = await Promise.all([
      prisma.ticket.findMany({
        where,
        orderBy: [{ priority: "desc" }, { updatedAt: "desc" }],
        skip: (page - 1) * limit,
        take: limit,
        include: {
          customer: {
            select: { id: true, name: true, email: true, company: true },
          },
          assignedAgent: {
            select: { id: true, name: true, email: true, avatar: true },
          },
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

  async getById(
    id: string,
    organizationId: string,
    viewerRole?: Role,
    viewerId?: string
  ) {
    const ticket = await prisma.ticket.findFirst({
      where: { id, organizationId },
      include: {
        customer: true,
        assignedAgent: {
          select: { id: true, name: true, email: true, avatar: true },
        },
        messages: {
          orderBy: { createdAt: "asc" },
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
                role: true,
              },
            },
          },
        },
      },
    });

    if (!ticket) {
      throw new AppError("Ticket not found", 404, "TICKET_NOT_FOUND");
    }

    if (
      viewerRole === "AGENT" &&
      viewerId &&
      ticket.assignedAgentId &&
      ticket.assignedAgentId !== viewerId
    ) {
      throw new AppError("Ticket not found", 404, "TICKET_NOT_FOUND");
    }

    return ticket;
  }

  async create(
    organizationId: string,
    input: CreateTicketInput,
    creatorId?: string
  ) {
    const customer = await prisma.customer.findFirst({
      where: { id: input.customerId, organizationId },
    });

    if (!customer) {
      throw new AppError("Customer not found", 404, "CUSTOMER_NOT_FOUND");
    }

    if (input.assignedAgentId) {
      const agent = await prisma.user.findFirst({
        where: {
          id: input.assignedAgentId,
          organizationId,
          role: { in: ["OWNER", "ADMIN", "MANAGER", "AGENT"] },
          isActive: true,
        },
      });
      if (!agent) {
        throw new AppError("Agent not found", 404, "AGENT_NOT_FOUND");
      }
    }

    const ticket = await prisma.ticket.create({
      data: {
        organizationId,
        customerId: input.customerId,
        subject: input.subject,
        description: input.description ?? null,
        priority: input.priority ?? "MEDIUM",
        category: input.category ?? null,
        tags: input.tags ?? [],
        assignedAgentId: input.assignedAgentId ?? null,
        status: "OPEN",
      },
      include: {
        customer: {
          select: { id: true, name: true, email: true },
        },
        assignedAgent: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (input.description) {
      await prisma.message.create({
        data: {
          ticketId: ticket.id,
          senderId: creatorId ?? null,
          content: input.description,
          type: "CUSTOMER",
        },
      });
    }

    try {
      emitToOrg(organizationId, "ticket:created", { ticket });
    } catch {
      // Socket may not be ready in tests
    }

    return ticket;
  }

  async update(
    id: string,
    organizationId: string,
    input: UpdateTicketInput,
    actorId?: string
  ) {
    const ticket = await prisma.ticket.findFirst({
      where: { id, organizationId },
    });

    if (!ticket) {
      throw new AppError("Ticket not found", 404, "TICKET_NOT_FOUND");
    }

    if (input.assignedAgentId) {
      const agent = await prisma.user.findFirst({
        where: {
          id: input.assignedAgentId,
          organizationId,
          role: { in: ["OWNER", "ADMIN", "MANAGER", "AGENT"] },
          isActive: true,
        },
      });
      if (!agent) {
        throw new AppError("Agent not found", 404, "AGENT_NOT_FOUND");
      }
    }

    const data: Record<string, unknown> = { ...input };

    if (
      input.status &&
      (input.status === "RESOLVED" || input.status === "CLOSED") &&
      !ticket.resolvedAt
    ) {
      data.resolvedAt = new Date();
    }
    if (
      input.status &&
      input.status !== "RESOLVED" &&
      input.status !== "CLOSED"
    ) {
      data.resolvedAt = null;
    }

    const updated = await prisma.ticket.update({
      where: { id },
      data,
      include: {
        customer: {
          select: { id: true, name: true, email: true },
        },
        assignedAgent: {
          select: { id: true, name: true, email: true, avatar: true },
        },
      },
    });

    if (
      input.assignedAgentId !== undefined &&
      input.assignedAgentId !== ticket.assignedAgentId &&
      actorId
    ) {
      await prisma.message.create({
        data: {
          ticketId: id,
          senderId: actorId,
          content: input.assignedAgentId
            ? `Ticket assigned to agent`
            : `Ticket unassigned`,
          type: "SYSTEM",
        },
      });

      try {
        emitToOrg(organizationId, "ticket:assigned", {
          ticketId: id,
          assignedAgentId: input.assignedAgentId,
        });
        emitToTicket(id, "ticket:assigned", {
          ticketId: id,
          assignedAgentId: input.assignedAgentId,
        });
      } catch {
        /* ignore */
      }
    }

    try {
      emitToOrg(organizationId, "ticket:updated", { ticket: updated });
      emitToTicket(id, "ticket:updated", { ticket: updated });
    } catch {
      /* ignore */
    }

    return updated;
  }

  async addMessage(
    ticketId: string,
    organizationId: string,
    senderId: string,
    input: CreateMessageInput,
    senderRole: Role
  ) {
    const ticket = await prisma.ticket.findFirst({
      where: { id: ticketId, organizationId },
    });

    if (!ticket) {
      throw new AppError("Ticket not found", 404, "TICKET_NOT_FOUND");
    }

    if (
      senderRole === "AGENT" &&
      ticket.assignedAgentId &&
      ticket.assignedAgentId !== senderId
    ) {
      throw new AppError("Ticket not found", 404, "TICKET_NOT_FOUND");
    }

    let type = input.type ?? "AGENT";
    if (type === "INTERNAL_NOTE" && senderRole === "CUSTOMER") {
      throw new AppError("Forbidden", 403, "FORBIDDEN");
    }
    if (senderRole === "CUSTOMER") {
      type = "CUSTOMER";
    }

    const message = await prisma.message.create({
      data: {
        ticketId,
        senderId,
        content: input.content,
        type,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true,
          },
        },
      },
    });

    await prisma.ticket.update({
      where: { id: ticketId },
      data: { updatedAt: new Date() },
    });

    if (
      (type === "AGENT" || type === "INTERNAL_NOTE") &&
      ticket.status === "OPEN"
    ) {
      await prisma.ticket.update({
        where: { id: ticketId },
        data: { status: "IN_PROGRESS" },
      });
    }

    try {
      emitToTicket(ticketId, "message:created", {
        ticketId,
        message,
      });
      emitToOrg(organizationId, "message:created", {
        ticketId,
        message,
      });
    } catch {
      /* ignore */
    }

    return message;
  }

  async listMessages(ticketId: string, organizationId: string) {
    const ticket = await prisma.ticket.findFirst({
      where: { id: ticketId, organizationId },
      select: { id: true },
    });

    if (!ticket) {
      throw new AppError("Ticket not found", 404, "TICKET_NOT_FOUND");
    }

    return prisma.message.findMany({
      where: { ticketId },
      orderBy: { createdAt: "asc" },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true,
          },
        },
      },
    });
  }
}

export const ticketService = new TicketService();
