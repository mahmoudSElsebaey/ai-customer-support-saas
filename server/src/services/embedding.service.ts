import { prisma } from "../lib/prisma.js";
import {
  getOpenAI,
  DEFAULT_EMBEDDING_MODEL,
} from "../lib/openai.js";
import { aiUsageService } from "./ai-usage.service.js";
import { logger } from "../lib/logger.js";
import { AppError } from "../utils/AppError.js";

/** Cosine similarity between two equal-length vectors */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom === 0 ? 0 : dot / denom;
}

function buildEmbedText(title: string, content: string, excerpt?: string | null) {
  const body = excerpt?.trim() || content.slice(0, 6000);
  return `Title: ${title}\n\n${body}`;
}

export class EmbeddingService {
  async embedText(text: string, organizationId: string): Promise<number[]> {
    const openai = getOpenAI();
    const model = DEFAULT_EMBEDDING_MODEL;

    const res = await openai.embeddings.create({
      model,
      input: text.slice(0, 8000),
    });

    const usage = res.usage;
    if (usage) {
      await aiUsageService.track({
        organizationId,
        feature: "embedding",
        model,
        promptTokens: usage.total_tokens,
        completionTokens: 0,
      });
    }

    return res.data[0]?.embedding ?? [];
  }

  async embedArticle(articleId: string, organizationId: string) {
    const article = await prisma.knowledgeArticle.findFirst({
      where: { id: articleId, organizationId },
    });

    if (!article) {
      throw new AppError("Article not found", 404, "ARTICLE_NOT_FOUND");
    }

    const text = buildEmbedText(article.title, article.content, article.excerpt);
    const vector = await this.embedText(text, organizationId);

    await prisma.knowledgeArticle.update({
      where: { id: articleId },
      data: {
        embedding: vector,
        embeddingUpdatedAt: new Date(),
      },
    });

    return { id: articleId, dimensions: vector.length };
  }

  /**
   * Embed all published articles missing embeddings (or force refresh).
   */
  async embedOrganization(
    organizationId: string,
    options: { force?: boolean; limit?: number } = {}
  ) {
    const { force = false, limit = 50 } = options;

    const articles = await prisma.knowledgeArticle.findMany({
      where: {
        organizationId,
        status: "PUBLISHED",
        ...(force
          ? {}
          : {
              OR: [
                { embedding: { equals: null } },
                { embeddingUpdatedAt: null },
              ],
            }),
      },
      select: {
        id: true,
        title: true,
        content: true,
        excerpt: true,
      },
      take: limit,
      orderBy: { updatedAt: "desc" },
    });

    const results: { id: string; ok: boolean; error?: string }[] = [];

    for (const article of articles) {
      try {
        const text = buildEmbedText(
          article.title,
          article.content,
          article.excerpt
        );
        const vector = await this.embedText(text, organizationId);
        await prisma.knowledgeArticle.update({
          where: { id: article.id },
          data: {
            embedding: vector,
            embeddingUpdatedAt: new Date(),
          },
        });
        results.push({ id: article.id, ok: true });
      } catch (err) {
        logger.error({ err, articleId: article.id }, "embed article failed");
        results.push({
          id: article.id,
          ok: false,
          error: err instanceof Error ? err.message : "failed",
        });
      }
    }

    return {
      processed: results.length,
      succeeded: results.filter((r) => r.ok).length,
      failed: results.filter((r) => !r.ok).length,
      results,
    };
  }

  /**
   * Semantic search over published articles with embeddings.
   * In-app cosine similarity (works without pgvector).
   * Scale path: replace with pgvector <=> operator later.
   */
  async search(
    organizationId: string,
    query: string,
    topK = 5,
    minScore = 0.25
  ) {
    const queryVector = await this.embedText(query, organizationId);

    const articles = await prisma.knowledgeArticle.findMany({
      where: {
        organizationId,
        status: "PUBLISHED",
        embedding: { not: null },
      },
      select: {
        id: true,
        title: true,
        excerpt: true,
        content: true,
        category: true,
        tags: true,
        embedding: true,
      },
      take: 200, // soft cap for in-memory ranking
    });

    const scored = articles
      .map((a) => {
        const emb = a.embedding as number[] | null;
        if (!Array.isArray(emb) || emb.length === 0) {
          return null;
        }
        const score = cosineSimilarity(queryVector, emb);
        return {
          id: a.id,
          title: a.title,
          excerpt: a.excerpt,
          content: a.content,
          category: a.category,
          tags: a.tags,
          score,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null && x.score >= minScore)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);

    return scored.map(({ content, ...rest }) => ({
      ...rest,
      // Truncate content for response / context building
      contentPreview: content.slice(0, 1200),
    }));
  }
}

export const embeddingService = new EmbeddingService();
