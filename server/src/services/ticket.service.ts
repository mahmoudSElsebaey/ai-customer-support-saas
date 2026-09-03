import mongoose from "mongoose";
import { Ticket } from "../models/Ticket.js";
import { Message } from "../models/Message.js";
import { Customer } from "../models/Customer.js";
import { User } from "../models/User.js";
import { AppError } from "../utils/AppError.js";
import { emitToOrg, emitToTicket } from "../socket/index.js";
import { toId, serializeDoc } from "../utils/serialize.js";
import type {
  CreateTicketInput,
  UpdateTicketInput,
  CreateMessageInput,
} from "../validations/ticket.validation.js";
import type { Role as RoleType } from "../types/enums.js";
import { MessageType, TicketStatus } from "../types/enums.js";

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
  viewerRole?: RoleType;
  viewerId?: string;
}

function requireObjectId(id: string, code = "TICKET_NOT_FOUND") {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError("Resource not found", 404, code);
  }
  return new mongoose.Types.ObjectId(id);
}

function mapUserRef(user: unknown) {
  if (!user || typeof user !== "object") return null;
  const u = user as {
    _id?: mongoose.Types.ObjectId;
    name?: string;
    email?: string;
    avatar?: string | null;
    role?: string;
  };
  return {
    id: toId(u._id) ?? null,
    name: u.name ?? null,
    email: u.email ?? null,
    avatar: u.avatar ?? null,
    ...(u.role !== undefined ? { role: u.role } : {}),
  };
}

function mapCustomerRef(customer: unknown) {
  if (!customer || typeof customer !== "object") return null;
  const c = customer as {
    _id?: mongoose.Types.ObjectId;
    name?: string;
    email?: string;
    company?: string | null;
    phone?: string | null;
    status?: string;
    tags?: string[];
    notes?: string | null;
  };
  return {
    id: toId(c._id) ?? null,
    name: c.name ?? null,
    email: c.email ?? null,
    company: c.company ?? null,
    ...(c.phone !== undefined ? { phone: c.phone } : {}),
    ...(c.status !== undefined ? { status: c.status } : {}),
    ...(c.tags !== undefined ? { tags: c.tags } : {}),
    ...(c.notes !== undefined ? { notes: c.notes } : {}),
  };
}

function mapTicket(
  ticket: Record<string, unknown>,
  extras: Record<string, unknown> = {}
) {
  const base = serializeDoc(ticket) as Record<string, unknown>;
  if (!base) return null;

  base.organizationId = toId(ticket.organizationId as mongoose.Types.ObjectId);
  base.customerId =
    ticket.customerId &&
    typeof ticket.customerId === "object" &&
    "_id" in (ticket.customerId as object)
      ? toId((ticket.customerId as { _id: mongoose.Types.ObjectId })._id)
      : toId(ticket.customerId as mongoose.Types.ObjectId);
  base.assignedAgentId =
    ticket.assignedAgentId &&
    typeof ticket.assignedAgentId === "object" &&
    "_id" in (ticket.assignedAgentId as object)
      ? toId((ticket.assignedAgentId as { _id: mongoose.Types.ObjectId })._id)
      : toId(ticket.assignedAgentId as mongoose.Types.ObjectId);

  if (ticket.customerId && typeof ticket.customerId === "object") {
    base.customer = mapCustomerRef(ticket.customerId);
  }
  if (ticket.assignedAgentId && typeof ticket.assignedAgentId === "object") {
    base.assignedAgent = mapUserRef(ticket.assignedAgentId);
  }

  return { ...base, ...extras };
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

    const orgId = requireObjectId(organizationId);
    const filter: Record<string, unknown> = { organizationId: orgId };

    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (customerId) filter.customerId = requireObjectId(customerId, "CUSTOMER_NOT_FOUND");
    if (unassigned === true) filter.assignedAgentId = null;
    else if (assignedAgentId) {
      filter.assignedAgentId = requireObjectId(assignedAgentId, "AGENT_NOT_FOUND");
    }

    const andClauses: Record<string, unknown>[] = [];

    if (viewerRole === "AGENT" && viewerId && mongoose.Types.ObjectId.isValid(viewerId)) {
      andClauses.push({
        $or: [
          { assignedAgentId: new mongoose.Types.ObjectId(viewerId) },
          { assignedAgentId: null },
        ],
      });
    }

    if (search) {
      const re = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      andClauses.push({
        $or: [{ subject: re }, { description: re }],
      });
    }

    if (andClauses.length) {
      filter.$and = andClauses;
    }

    const [items, total] = await Promise.all([
      Ticket.find(filter)
        .sort({ priority: -1, updatedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("customerId", "name email company")
        .populate("assignedAgentId", "name email avatar")
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
      items: items.map((t) =>
        mapTicket(t as Record<string, unknown>, {
          _count: { messages: msgMap.get(t._id.toString()) ?? 0 },
        })
      ),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async getById(
    id: string,
    organizationId: string,
    viewerRole?: RoleType,
    viewerId?: string
  ) {
    const ticketId = requireObjectId(id);
    const orgId = requireObjectId(organizationId);

    const ticket = await Ticket.findOne({
      _id: ticketId,
      organizationId: orgId,
    })
      .populate("customerId")
      .populate("assignedAgentId", "name email avatar")
      .lean()
      .exec();

    if (!ticket) {
      throw new AppError("Ticket not found", 404, "TICKET_NOT_FOUND");
    }

    const assignedId = toId(ticket.assignedAgentId as mongoose.Types.ObjectId);
    if (
      viewerRole === "AGENT" &&
      viewerId &&
      assignedId &&
      assignedId !== viewerId
    ) {
      throw new AppError("Ticket not found", 404, "TICKET_NOT_FOUND");
    }

    const messages = await Message.find({ ticketId })
      .sort({ createdAt: 1 })
      .populate("senderId", "name email avatar role")
      .lean()
      .exec();

    const mapped = mapTicket(ticket as Record<string, unknown>) as Record<
      string,
      unknown
    >;
    mapped.messages = messages.map((m) => {
      const base = serializeDoc(m as Record<string, unknown>) as Record<
        string,
        unknown
      >;
      base.ticketId = toId(m.ticketId);
      base.senderId =
        m.senderId && typeof m.senderId === "object" && "_id" in m.senderId
          ? toId((m.senderId as { _id: mongoose.Types.ObjectId })._id)
          : toId(m.senderId);
      base.sender = mapUserRef(m.senderId);
      return base;
    });

    return mapped;
  }

  async create(
    organizationId: string,
    input: CreateTicketInput,
    creatorId?: string
  ) {
    const orgId = requireObjectId(organizationId);
    const customerObjectId = requireObjectId(input.customerId, "CUSTOMER_NOT_FOUND");

    const customer = await Customer.findOne({
      _id: customerObjectId,
      organizationId: orgId,
    }).lean();

    if (!customer) {
      throw new AppError("Customer not found", 404, "CUSTOMER_NOT_FOUND");
    }

    let assignedAgentObjectId: mongoose.Types.ObjectId | null = null;
    if (input.assignedAgentId) {
      assignedAgentObjectId = requireObjectId(input.assignedAgentId, "AGENT_NOT_FOUND");
      const agent = await User.findOne({
        _id: assignedAgentObjectId,
        organizationId: orgId,
        role: { $in: ["OWNER", "ADMIN", "MANAGER", "AGENT"] },
        isActive: true,
      }).lean();
      if (!agent) {
        throw new AppError("Agent not found", 404, "AGENT_NOT_FOUND");
      }
    }

    const ticket = await Ticket.create({
      organizationId: orgId,
      customerId: customerObjectId,
      subject: input.subject,
      description: input.description ?? null,
      priority: input.priority ?? "MEDIUM",
      category: input.category ?? null,
      tags: input.tags ?? [],
      assignedAgentId: assignedAgentObjectId,
      status: TicketStatus.OPEN,
    });

    if (input.description) {
      await Message.create({
        ticketId: ticket._id,
        senderId:
          creatorId && mongoose.Types.ObjectId.isValid(creatorId)
            ? new mongoose.Types.ObjectId(creatorId)
            : null,
        content: input.description,
        type: MessageType.CUSTOMER,
      });
    }

    const populated = await Ticket.findById(ticket._id)
      .populate("customerId", "name email")
      .populate("assignedAgentId", "name email")
      .lean()
      .exec();

    const result = mapTicket(populated as Record<string, unknown>);

    try {
      emitToOrg(organizationId, "ticket:created", { ticket: result });
    } catch {
      /* ignore */
    }

    return result;
  }

  async update(
    id: string,
    organizationId: string,
    input: UpdateTicketInput,
    actorId?: string
  ) {
    const ticketId = requireObjectId(id);
    const orgId = requireObjectId(organizationId);

    const ticket = await Ticket.findOne({
      _id: ticketId,
      organizationId: orgId,
    });

    if (!ticket) {
      throw new AppError("Ticket not found", 404, "TICKET_NOT_FOUND");
    }

    if (input.assignedAgentId) {
      const agentObjectId = requireObjectId(input.assignedAgentId, "AGENT_NOT_FOUND");
      const agent = await User.findOne({
        _id: agentObjectId,
        organizationId: orgId,
        role: { $in: ["OWNER", "ADMIN", "MANAGER", "AGENT"] },
        isActive: true,
      }).lean();
      if (!agent) {
        throw new AppError("Agent not found", 404, "AGENT_NOT_FOUND");
      }
      ticket.assignedAgentId = agentObjectId;
    } else if (input.assignedAgentId === null) {
      ticket.assignedAgentId = null;
    }

    const prevAssigned = toId(ticket.assignedAgentId);

    if (input.subject !== undefined) ticket.subject = input.subject;
    if (input.description !== undefined) ticket.description = input.description;
    if (input.priority !== undefined) ticket.priority = input.priority;
    if (input.category !== undefined) ticket.category = input.category;
    if (input.tags !== undefined) ticket.tags = input.tags;

    if (input.status !== undefined) {
      ticket.status = input.status;
      if (
        (input.status === "RESOLVED" || input.status === "CLOSED") &&
        !ticket.resolvedAt
      ) {
        ticket.resolvedAt = new Date();
      }
      if (input.status !== "RESOLVED" && input.status !== "CLOSED") {
        ticket.resolvedAt = null;
      }
    }

    await ticket.save();

    if (
      input.assignedAgentId !== undefined &&
      toId(ticket.assignedAgentId) !== prevAssigned &&
      actorId &&
      mongoose.Types.ObjectId.isValid(actorId)
    ) {
      await Message.create({
        ticketId: ticket._id,
        senderId: new mongoose.Types.ObjectId(actorId),
        content: input.assignedAgentId
          ? "Ticket assigned to agent"
          : "Ticket unassigned",
        type: MessageType.SYSTEM,
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

    const updated = await Ticket.findById(ticket._id)
      .populate("customerId", "name email")
      .populate("assignedAgentId", "name email avatar")
      .lean()
      .exec();

    const result = mapTicket(updated as Record<string, unknown>);

    try {
      emitToOrg(organizationId, "ticket:updated", { ticket: result });
      emitToTicket(id, "ticket:updated", { ticket: result });
    } catch {
      /* ignore */
    }

    return result;
  }

  async addMessage(
    ticketId: string,
    organizationId: string,
    senderId: string,
    input: CreateMessageInput,
    senderRole: RoleType
  ) {
    const tId = requireObjectId(ticketId);
    const orgId = requireObjectId(organizationId);
    const senderObjectId = requireObjectId(senderId, "USER_NOT_FOUND");

    const ticket = await Ticket.findOne({
      _id: tId,
      organizationId: orgId,
    });

    if (!ticket) {
      throw new AppError("Ticket not found", 404, "TICKET_NOT_FOUND");
    }

    const assignedId = toId(ticket.assignedAgentId);
    if (
      senderRole === "AGENT" &&
      assignedId &&
      assignedId !== senderId
    ) {
      throw new AppError("Ticket not found", 404, "TICKET_NOT_FOUND");
    }

    let type = input.type ?? MessageType.AGENT;
    if (type === MessageType.INTERNAL_NOTE && senderRole === "CUSTOMER") {
      throw new AppError("Forbidden", 403, "FORBIDDEN");
    }
    if (senderRole === "CUSTOMER") {
      type = MessageType.CUSTOMER;
    }

    const message = await Message.create({
      ticketId: tId,
      senderId: senderObjectId,
      content: input.content,
      type,
    });

    ticket.updatedAt = new Date();
    if (
      (type === MessageType.AGENT || type === MessageType.INTERNAL_NOTE) &&
      ticket.status === TicketStatus.OPEN
    ) {
      ticket.status = TicketStatus.IN_PROGRESS;
    }
    await ticket.save();

    const populated = await Message.findById(message._id)
      .populate("senderId", "name email avatar role")
      .lean()
      .exec();

    const mapped = serializeDoc(populated as Record<string, unknown>) as Record<
      string,
      unknown
    >;
    mapped.ticketId = ticketId;
    mapped.senderId = senderId;
    mapped.sender = mapUserRef(populated?.senderId);

    try {
      emitToTicket(ticketId, "message:created", {
        ticketId,
        message: mapped,
      });
      emitToOrg(organizationId, "message:created", {
        ticketId,
        message: mapped,
      });
    } catch {
      /* ignore */
    }

    return mapped;
  }

  async listMessages(ticketId: string, organizationId: string) {
    const tId = requireObjectId(ticketId);
    const orgId = requireObjectId(organizationId);

    const ticket = await Ticket.findOne({
      _id: tId,
      organizationId: orgId,
    })
      .select("_id")
      .lean();

    if (!ticket) {
      throw new AppError("Ticket not found", 404, "TICKET_NOT_FOUND");
    }

    const messages = await Message.find({ ticketId: tId })
      .sort({ createdAt: 1 })
      .populate("senderId", "name email avatar role")
      .lean()
      .exec();

    return messages.map((m) => {
      const base = serializeDoc(m as Record<string, unknown>) as Record<
        string,
        unknown
      >;
      base.ticketId = ticketId;
      base.senderId =
        m.senderId && typeof m.senderId === "object" && "_id" in m.senderId
          ? toId((m.senderId as { _id: mongoose.Types.ObjectId })._id)
          : toId(m.senderId);
      base.sender = mapUserRef(m.senderId);
      return base;
    });
  }
}

export const ticketService = new TicketService();
