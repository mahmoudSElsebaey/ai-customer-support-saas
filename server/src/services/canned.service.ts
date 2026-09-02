import { prisma } from "../lib/prisma.js";
import { AppError } from "../utils/AppError.js";
import type {
  CreateCannedInput,
  UpdateCannedInput,
} from "../validations/canned.validation.js";

export class CannedService {
  async list(organizationId: string, activeOnly = true) {
    return prisma.cannedResponse.findMany({
      where: {
        organizationId,
        ...(activeOnly ? { isActive: true } : {}),
      },
      orderBy: [{ category: "asc" }, { title: "asc" }],
      include: {
        author: { select: { id: true, name: true } },
      },
    });
  }

  async create(
    organizationId: string,
    authorId: string,
    input: CreateCannedInput
  ) {
    return prisma.cannedResponse.create({
      data: {
        organizationId,
        authorId,
        title: input.title,
        content: input.content,
        shortcut: input.shortcut ?? null,
        category: input.category ?? null,
        isActive: input.isActive ?? true,
      },
    });
  }

  async update(id: string, organizationId: string, input: UpdateCannedInput) {
    const existing = await prisma.cannedResponse.findFirst({
      where: { id, organizationId },
    });
    if (!existing) {
      throw new AppError("Canned response not found", 404, "CANNED_NOT_FOUND");
    }

    return prisma.cannedResponse.update({
      where: { id },
      data: input,
    });
  }

  async remove(id: string, organizationId: string) {
    const existing = await prisma.cannedResponse.findFirst({
      where: { id, organizationId },
    });
    if (!existing) {
      throw new AppError("Canned response not found", 404, "CANNED_NOT_FOUND");
    }
    await prisma.cannedResponse.delete({ where: { id } });
    return { id };
  }
}

export const cannedService = new CannedService();
