import { prisma } from "../lib/prisma.js";
import { AppError } from "../utils/AppError.js";
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

export class CustomerService {
  async list({ organizationId, page, limit, search, status }: ListParams) {
    const where: Record<string, unknown> = { organizationId };

    if (status) where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { company: { contains: search, mode: "insensitive" } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          _count: { select: { tickets: true } },
        },
      }),
      prisma.customer.count({ where }),
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

  async getById(id: string, organizationId: string) {
    const customer = await prisma.customer.findFirst({
      where: { id, organizationId },
      include: {
        tickets: {
          orderBy: { createdAt: "desc" },
          take: 20,
          select: {
            id: true,
            subject: true,
            status: true,
            priority: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        _count: { select: { tickets: true } },
      },
    });

    if (!customer) {
      throw new AppError("Customer not found", 404, "CUSTOMER_NOT_FOUND");
    }

    return customer;
  }

  async create(organizationId: string, input: CreateCustomerInput) {
    const existing = await prisma.customer.findFirst({
      where: {
        organizationId,
        email: input.email.toLowerCase(),
      },
    });

    if (existing) {
      throw new AppError(
        "Customer with this email already exists in your organization",
        409,
        "CUSTOMER_EMAIL_EXISTS"
      );
    }

    return prisma.customer.create({
      data: {
        organizationId,
        name: input.name,
        email: input.email.toLowerCase(),
        phone: input.phone ?? null,
        company: input.company ?? null,
        tags: input.tags ?? [],
        notes: input.notes ?? null,
        status: input.status ?? "active",
      },
    });
  }

  async update(
    id: string,
    organizationId: string,
    input: UpdateCustomerInput
  ) {
    const customer = await prisma.customer.findFirst({
      where: { id, organizationId },
    });

    if (!customer) {
      throw new AppError("Customer not found", 404, "CUSTOMER_NOT_FOUND");
    }

    if (input.email && input.email.toLowerCase() !== customer.email) {
      const conflict = await prisma.customer.findFirst({
        where: {
          organizationId,
          email: input.email.toLowerCase(),
          NOT: { id },
        },
      });
      if (conflict) {
        throw new AppError(
          "Customer with this email already exists",
          409,
          "CUSTOMER_EMAIL_EXISTS"
        );
      }
    }

    return prisma.customer.update({
      where: { id },
      data: {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.email !== undefined && { email: input.email.toLowerCase() }),
        ...(input.phone !== undefined && { phone: input.phone }),
        ...(input.company !== undefined && { company: input.company }),
        ...(input.tags !== undefined && { tags: input.tags }),
        ...(input.notes !== undefined && { notes: input.notes }),
        ...(input.status !== undefined && { status: input.status }),
      },
    });
  }

  async remove(id: string, organizationId: string) {
    const customer = await prisma.customer.findFirst({
      where: { id, organizationId },
    });

    if (!customer) {
      throw new AppError("Customer not found", 404, "CUSTOMER_NOT_FOUND");
    }

    await prisma.customer.delete({ where: { id } });
    return { id };
  }
}

export const customerService = new CustomerService();
