import mongoose from "mongoose";
import { KnowledgeArticle } from "../models/KnowledgeArticle.js";
import { AppError } from "../utils/AppError.js";
import { toId, serializeDoc } from "../utils/serialize.js";
import type {
  CreateArticleInput,
  UpdateArticleInput,
} from "../validations/knowledge.validation.js";
import { ArticleStatus } from "../types/enums.js";

function buildExcerpt(content: string, provided?: string | null): string {
  if (provided && provided.trim()) return provided.trim().slice(0, 500);
  const plain = content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return plain.slice(0, 200) + (plain.length > 200 ? "…" : "");
}

function requireObjectId(id: string, code = "ARTICLE_NOT_FOUND") {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError("Article not found", 404, code);
  }
  return new mongoose.Types.ObjectId(id);
}

function mapArticle(doc: Record<string, unknown>) {
  const base = serializeDoc(doc) as Record<string, unknown>;
  if (!base) return null;
  base.organizationId = toId(doc.organizationId as mongoose.Types.ObjectId);
  if (doc.authorId && typeof doc.authorId === "object") {
    const author = doc.authorId as {
      _id?: mongoose.Types.ObjectId;
      name?: string;
      email?: string;
    };
    base.authorId = toId(author._id);
    base.author = {
      id: toId(author._id),
      name: author.name ?? null,
      ...(author.email !== undefined ? { email: author.email } : {}),
    };
  } else {
    base.authorId = toId(doc.authorId as mongoose.Types.ObjectId);
  }
  delete base.embedding;
  return base;
}

interface ListParams {
  organizationId: string;
  page: number;
  limit: number;
  search?: string;
  status?: string;
  category?: string;
  tag?: string;
  publishedOnly?: boolean;
}

export class KnowledgeService {
  async list(params: ListParams) {
    const {
      organizationId,
      page,
      limit,
      search,
      status,
      category,
      tag,
      publishedOnly,
    } = params;

    const orgId = requireObjectId(organizationId);
    const filter: Record<string, unknown> = { organizationId: orgId };

    if (publishedOnly) {
      filter.status = ArticleStatus.PUBLISHED;
    } else if (status) {
      filter.status = status;
    }

    if (category) filter.category = category;
    if (tag) filter.tags = tag;

    if (search) {
      const re = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      filter.$or = [
        { title: re },
        { content: re },
        { excerpt: re },
        { category: re },
      ];
    }

    const [items, total] = await Promise.all([
      KnowledgeArticle.find(filter)
        .sort({ updatedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .select(
          "title excerpt category tags status authorId publishedAt createdAt updatedAt"
        )
        .populate("authorId", "name")
        .lean()
        .exec(),
      KnowledgeArticle.countDocuments(filter),
    ]);

    return {
      items: items.map((a) => mapArticle(a as Record<string, unknown>)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async getById(id: string, organizationId: string, publishedOnly = false) {
    const articleId = requireObjectId(id);
    const orgId = requireObjectId(organizationId);

    const filter: Record<string, unknown> = {
      _id: articleId,
      organizationId: orgId,
    };
    if (publishedOnly) filter.status = ArticleStatus.PUBLISHED;

    const article = await KnowledgeArticle.findOne(filter)
      .populate("authorId", "name email")
      .lean()
      .exec();

    if (!article) {
      throw new AppError("Article not found", 404, "ARTICLE_NOT_FOUND");
    }

    return mapArticle(article as Record<string, unknown>);
  }

  async create(
    organizationId: string,
    authorId: string,
    input: CreateArticleInput
  ) {
    const orgId = requireObjectId(organizationId);
    const authorObjectId = requireObjectId(authorId);
    const status = input.status ?? ArticleStatus.DRAFT;
    const excerpt = buildExcerpt(input.content, input.excerpt);

    const created = await KnowledgeArticle.create({
      organizationId: orgId,
      authorId: authorObjectId,
      title: input.title,
      content: input.content,
      excerpt,
      category: input.category ?? null,
      tags: input.tags ?? [],
      status,
      publishedAt: status === ArticleStatus.PUBLISHED ? new Date() : null,
    });

    const populated = await KnowledgeArticle.findById(created._id)
      .populate("authorId", "name")
      .lean()
      .exec();

    return mapArticle(populated as Record<string, unknown>);
  }

  async update(id: string, organizationId: string, input: UpdateArticleInput) {
    const articleId = requireObjectId(id);
    const orgId = requireObjectId(organizationId);

    const existing = await KnowledgeArticle.findOne({
      _id: articleId,
      organizationId: orgId,
    });

    if (!existing) {
      throw new AppError("Article not found", 404, "ARTICLE_NOT_FOUND");
    }

    const content = input.content ?? existing.content;
    const excerpt =
      input.excerpt !== undefined || input.content !== undefined
        ? buildExcerpt(content, input.excerpt ?? existing.excerpt)
        : existing.excerpt;

    if (input.title !== undefined) existing.title = input.title;
    if (input.content !== undefined) existing.content = input.content;
    existing.excerpt = excerpt;
    if (input.category !== undefined) existing.category = input.category;
    if (input.tags !== undefined) existing.tags = input.tags;

    if (input.status !== undefined) {
      if (
        input.status === ArticleStatus.PUBLISHED &&
        existing.status !== ArticleStatus.PUBLISHED
      ) {
        existing.publishedAt = new Date();
      }
      existing.status = input.status;
    }

    const contentChanged =
      input.content !== undefined && input.content !== existing.content;
    if (contentChanged) {
      existing.embedding = null;
      existing.embeddingUpdatedAt = null;
    }

    await existing.save();

    const populated = await KnowledgeArticle.findById(existing._id)
      .populate("authorId", "name")
      .lean()
      .exec();

    return mapArticle(populated as Record<string, unknown>);
  }

  async remove(id: string, organizationId: string) {
    const articleId = requireObjectId(id);
    const orgId = requireObjectId(organizationId);

    const existing = await KnowledgeArticle.findOneAndDelete({
      _id: articleId,
      organizationId: orgId,
    });

    if (!existing) {
      throw new AppError("Article not found", 404, "ARTICLE_NOT_FOUND");
    }

    return { id };
  }

  async listCategories(organizationId: string) {
    const orgId = requireObjectId(organizationId);
    const rows = await KnowledgeArticle.distinct("category", {
      organizationId: orgId,
      category: { $ne: null },
    });
    return (rows as (string | null)[])
      .filter((c): c is string => Boolean(c))
      .sort();
  }

  async listNeedingEmbedding(organizationId: string, limit = 50) {
    const orgId = requireObjectId(organizationId);
    return KnowledgeArticle.find({
      organizationId: orgId,
      status: ArticleStatus.PUBLISHED,
      $or: [{ embedding: null }, { embeddingUpdatedAt: null }],
    })
      .select("title content updatedAt")
      .sort({ updatedAt: -1 })
      .limit(limit)
      .lean()
      .exec()
      .then((rows) =>
        rows.map((r) => ({
          id: r._id.toString(),
          title: r.title,
          content: r.content,
          updatedAt: r.updatedAt,
        }))
      );
  }
}

export const knowledgeService = new KnowledgeService();
