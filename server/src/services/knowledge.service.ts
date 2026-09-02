import { prisma } from "../lib/prisma.js";
import { AppError } from "../utils/AppError.js";
import type {
  CreateArticleInput,
  UpdateArticleInput,
} from "../validations/knowledge.validation.js";

function buildExcerpt(content: string, provided?: string | null): string {
  if (provided && provided.trim()) return provided.trim().slice(0, 500);
  const plain = content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return plain.slice(0, 200) + (plain.length > 200 ? "…" : "");
}

interface ListParams {
  organizationId: string;
  page: number;
  limit: number;
  search?: string;
  status?: string;
  category?: string;
  tag?: string;
  /** Agents/customers typically only see PUBLISHED */
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

    const where: Record<string, unknown> = { organizationId };

    if (publishedOnly) {
      where.status = "PUBLISHED";
    } else if (status) {
      where.status = status;
    }

    if (category) where.category = category;
    if (tag) where.tags = { has: tag };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { content: { contains: search, mode: "insensitive" } },
        { excerpt: { contains: search, mode: "insensitive" } },
        { category: { contains: search, mode: "insensitive" } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.knowledgeArticle.findMany({
        where,
        orderBy: [{ updatedAt: "desc" }],
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          title: true,
          excerpt: true,
          category: true,
          tags: true,
          status: true,
          authorId: true,
          publishedAt: true,
          createdAt: true,
          updatedAt: true,
          author: {
            select: { id: true, name: true },
          },
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

  async getById(id: string, organizationId: string, publishedOnly = false) {
    const article = await prisma.knowledgeArticle.findFirst({
      where: {
        id,
        organizationId,
        ...(publishedOnly ? { status: "PUBLISHED" } : {}),
      },
      include: {
        author: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!article) {
      throw new AppError("Article not found", 404, "ARTICLE_NOT_FOUND");
    }

    // Don't expose embedding vector in normal responses
    const { embedding: _e, ...rest } = article;
    return rest;
  }

  async create(
    organizationId: string,
    authorId: string,
    input: CreateArticleInput
  ) {
    const status = input.status ?? "DRAFT";
    const excerpt = buildExcerpt(input.content, input.excerpt);

    return prisma.knowledgeArticle.create({
      data: {
        organizationId,
        authorId,
        title: input.title,
        content: input.content,
        excerpt,
        category: input.category ?? null,
        tags: input.tags ?? [],
        status,
        publishedAt: status === "PUBLISHED" ? new Date() : null,
        // embedding left null until Phase 6/7
      },
      include: {
        author: { select: { id: true, name: true } },
      },
    });
  }

  async update(
    id: string,
    organizationId: string,
    input: UpdateArticleInput
  ) {
    const existing = await prisma.knowledgeArticle.findFirst({
      where: { id, organizationId },
    });

    if (!existing) {
      throw new AppError("Article not found", 404, "ARTICLE_NOT_FOUND");
    }

    const content = input.content ?? existing.content;
    const excerpt =
      input.excerpt !== undefined || input.content !== undefined
        ? buildExcerpt(content, input.excerpt ?? existing.excerpt)
        : existing.excerpt;

    let publishedAt = existing.publishedAt;
    if (input.status === "PUBLISHED" && existing.status !== "PUBLISHED") {
      publishedAt = new Date();
    }
    if (input.status && input.status !== "PUBLISHED") {
      // keep publishedAt history or clear — keep it for analytics
    }

    // Content change invalidates embedding (Phase 6 will regenerate)
    const contentChanged =
      input.content !== undefined && input.content !== existing.content;

    return prisma.knowledgeArticle.update({
      where: { id },
      data: {
        ...(input.title !== undefined && { title: input.title }),
        ...(input.content !== undefined && { content: input.content }),
        excerpt,
        ...(input.category !== undefined && { category: input.category }),
        ...(input.tags !== undefined && { tags: input.tags }),
        ...(input.status !== undefined && { status: input.status }),
        publishedAt,
        ...(contentChanged && {
          embedding: null,
          embeddingUpdatedAt: null,
        }),
      },
      include: {
        author: { select: { id: true, name: true } },
      },
    });
  }

  async remove(id: string, organizationId: string) {
    const existing = await prisma.knowledgeArticle.findFirst({
      where: { id, organizationId },
    });

    if (!existing) {
      throw new AppError("Article not found", 404, "ARTICLE_NOT_FOUND");
    }

    await prisma.knowledgeArticle.delete({ where: { id } });
    return { id };
  }

  /** Distinct categories for filter UI */
  async listCategories(organizationId: string) {
    const rows = await prisma.knowledgeArticle.findMany({
      where: {
        organizationId,
        category: { not: null },
      },
      select: { category: true },
      distinct: ["category"],
      orderBy: { category: "asc" },
    });

    return rows
      .map((r) => r.category)
      .filter((c): c is string => Boolean(c));
  }

  /** Articles that need embedding regeneration (Phase 6) */
  async listNeedingEmbedding(organizationId: string, limit = 50) {
    return prisma.knowledgeArticle.findMany({
      where: {
        organizationId,
        status: "PUBLISHED",
        OR: [{ embedding: { equals: null } }, { embeddingUpdatedAt: null }],
      },
      select: {
        id: true,
        title: true,
        content: true,
        updatedAt: true,
      },
      take: limit,
      orderBy: { updatedAt: "desc" },
    });
  }
}

export const knowledgeService = new KnowledgeService();
