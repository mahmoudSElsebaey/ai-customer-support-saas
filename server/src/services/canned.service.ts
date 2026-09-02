import mongoose from "mongoose";
import { CannedResponse } from "../models/CannedResponse.js";
import { AppError } from "../utils/AppError.js";
import { toId, serializeDoc } from "../utils/serialize.js";
import type {
  CreateCannedInput,
  UpdateCannedInput,
} from "../validations/canned.validation.js";

function requireObjectId(id: string, code = "CANNED_NOT_FOUND") {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError("Canned response not found", 404, code);
  }
  return new mongoose.Types.ObjectId(id);
}

function mapCanned(doc: Record<string, unknown>) {
  const base = serializeDoc(doc) as Record<string, unknown>;
  if (base && doc.authorId && typeof doc.authorId === "object" && doc.authorId !== null) {
    const author = doc.authorId as { _id?: mongoose.Types.ObjectId; name?: string };
    base.author = {
      id: toId(author._id) ?? null,
      name: author.name ?? null,
    };
    base.authorId = toId(author._id);
  } else if (base) {
    base.authorId = toId(doc.authorId as mongoose.Types.ObjectId);
  }
  if (base) {
    base.organizationId = toId(doc.organizationId as mongoose.Types.ObjectId);
  }
  return base;
}

export class CannedService {
  async list(organizationId: string, activeOnly = true) {
    const orgId = requireObjectId(organizationId);
    const filter: Record<string, unknown> = { organizationId: orgId };
    if (activeOnly) filter.isActive = true;

    const items = await CannedResponse.find(filter)
      .sort({ category: 1, title: 1 })
      .populate("authorId", "name")
      .lean()
      .exec();

    return items.map((item) => mapCanned(item as Record<string, unknown>));
  }

  async create(
    organizationId: string,
    authorId: string,
    input: CreateCannedInput
  ) {
    const orgId = requireObjectId(organizationId);
    const authorObjectId = requireObjectId(authorId);

    const created = await CannedResponse.create({
      organizationId: orgId,
      authorId: authorObjectId,
      title: input.title,
      content: input.content,
      shortcut: input.shortcut ?? null,
      category: input.category ?? null,
      isActive: input.isActive ?? true,
    });

    return serializeDoc(created.toObject() as Record<string, unknown>);
  }

  async update(id: string, organizationId: string, input: UpdateCannedInput) {
    const cannedId = requireObjectId(id);
    const orgId = requireObjectId(organizationId);

    const existing = await CannedResponse.findOne({
      _id: cannedId,
      organizationId: orgId,
    });

    if (!existing) {
      throw new AppError("Canned response not found", 404, "CANNED_NOT_FOUND");
    }

    if (input.title !== undefined) existing.title = input.title;
    if (input.content !== undefined) existing.content = input.content;
    if (input.shortcut !== undefined) existing.shortcut = input.shortcut;
    if (input.category !== undefined) existing.category = input.category;
    if (input.isActive !== undefined) existing.isActive = input.isActive;

    await existing.save();
    return serializeDoc(existing.toObject() as Record<string, unknown>);
  }

  async remove(id: string, organizationId: string) {
    const cannedId = requireObjectId(id);
    const orgId = requireObjectId(organizationId);

    const existing = await CannedResponse.findOneAndDelete({
      _id: cannedId,
      organizationId: orgId,
    });

    if (!existing) {
      throw new AppError("Canned response not found", 404, "CANNED_NOT_FOUND");
    }

    return { id };
  }
}

export const cannedService = new CannedService();
