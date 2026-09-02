import mongoose from "mongoose";
import { Customer } from "../models/Customer.js";
import { Ticket } from "../models/Ticket.js";
import { AppError } from "../utils/AppError.js";
import { toId, serializeDoc } from "../utils/serialize.js";
import type {
  CreateCustomerInput,
  UpdateCustomerInput,
} from "../validations/customer.validation.js";

interface ListParams {
  organizationId: string;
  page: number;
  limit: number;
  search?: string;
  status?: string;
}

function requireObjectId(id: string, code = "INVALID_ID") {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError("Resource not found", 404, code);
  }
  return new mongoose.Types.ObjectId(id);
}

export class CustomerService {
  async list({ organizationId, page, limit, search, status }: ListParams) {
    const orgId = requireObjectId(organizationId, "CUSTOMER_NOT_FOUND");
    const filter: Record<string, unknown> = { organizationId: orgId };

    if (status) filter.status = status;
    if (search) {
      const re = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      filter.$or = [{ name: re }, { email: re }, { company: re }];
    }

    const [items, total] = await Promise.all([
      Customer.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean()
        .exec(),
      Customer.countDocuments(filter),
    ]);

    const ids = items.map((c) => c._id);
    const counts = await Ticket.aggregate<{ _id: mongoose.Types.ObjectId; count: number }>([
      { $match: { customerId: { $in: ids } } },
      { $group: { _id: "$customerId", count: { $sum: 1 } } },
    ]);
    const countMap = new Map(counts.map((c) => [c._id.toString(), c.count]));

    return {
      items: items.map((c) => ({
        ...serializeDoc(c as Record<string, unknown>),
        organizationId: toId(c.organizationId),
        _count: { tickets: countMap.get(c._id.toString()) ?? 0 },
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async getById(id: string, organizationId: string) {
    const customerId = requireObjectId(id, "CUSTOMER_NOT_FOUND");
    const orgId = requireObjectId(organizationId, "CUSTOMER_NOT_FOUND");

    const customer = await Customer.findOne({
      _id: customerId,
      organizationId: orgId,
    })
      .lean()
      .exec();

    if (!customer) {
      throw new AppError("Customer not found", 404, "CUSTOMER_NOT_FOUND");
    }

    const [tickets, ticketCount] = await Promise.all([
      Ticket.find({ customerId, organizationId: orgId })
        .sort({ createdAt: -1 })
        .limit(20)
        .select("subject status priority createdAt updatedAt")
        .lean()
        .exec(),
      Ticket.countDocuments({ customerId, organizationId: orgId }),
    ]);

    return {
      ...serializeDoc(customer as Record<string, unknown>),
      organizationId: toId(customer.organizationId),
      tickets: tickets.map((t) => serializeDoc(t as Record<string, unknown>)),
      _count: { tickets: ticketCount },
    };
  }

  async create(organizationId: string, input: CreateCustomerInput) {
    const orgId = requireObjectId(organizationId, "CUSTOMER_NOT_FOUND");
    const email = input.email.toLowerCase();

    const existing = await Customer.findOne({
      organizationId: orgId,
      email,
    }).lean();

    if (existing) {
      throw new AppError(
        "Customer with this email already exists in your organization",
        409,
        "CUSTOMER_EMAIL_EXISTS"
      );
    }

    const customer = await Customer.create({
      organizationId: orgId,
      name: input.name,
      email,
      phone: input.phone ?? null,
      company: input.company ?? null,
      tags: input.tags ?? [],
      notes: input.notes ?? null,
      status: input.status ?? "active",
    });

    return serializeDoc(customer.toObject() as Record<string, unknown>);
  }

  async update(id: string, organizationId: string, input: UpdateCustomerInput) {
    const customerId = requireObjectId(id, "CUSTOMER_NOT_FOUND");
    const orgId = requireObjectId(organizationId, "CUSTOMER_NOT_FOUND");

    const customer = await Customer.findOne({
      _id: customerId,
      organizationId: orgId,
    });

    if (!customer) {
      throw new AppError("Customer not found", 404, "CUSTOMER_NOT_FOUND");
    }

    if (input.email && input.email.toLowerCase() !== customer.email) {
      const conflict = await Customer.findOne({
        organizationId: orgId,
        email: input.email.toLowerCase(),
        _id: { $ne: customerId },
      }).lean();
      if (conflict) {
        throw new AppError(
          "Customer with this email already exists",
          409,
          "CUSTOMER_EMAIL_EXISTS"
        );
      }
    }

    if (input.name !== undefined) customer.name = input.name;
    if (input.email !== undefined) customer.email = input.email.toLowerCase();
    if (input.phone !== undefined) customer.phone = input.phone;
    if (input.company !== undefined) customer.company = input.company;
    if (input.tags !== undefined) customer.tags = input.tags;
    if (input.notes !== undefined) customer.notes = input.notes;
    if (input.status !== undefined) customer.status = input.status;

    await customer.save();
    return serializeDoc(customer.toObject() as Record<string, unknown>);
  }

  async remove(id: string, organizationId: string) {
    const customerId = requireObjectId(id, "CUSTOMER_NOT_FOUND");
    const orgId = requireObjectId(organizationId, "CUSTOMER_NOT_FOUND");

    const customer = await Customer.findOneAndDelete({
      _id: customerId,
      organizationId: orgId,
    });

    if (!customer) {
      throw new AppError("Customer not found", 404, "CUSTOMER_NOT_FOUND");
    }

    return { id };
  }
}

export const customerService = new CustomerService();
