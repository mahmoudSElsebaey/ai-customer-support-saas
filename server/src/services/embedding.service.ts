import mongoose from "mongoose";
import { KnowledgeArticle } from "../models/KnowledgeArticle.js";
import {
  getOpenAI,
  DEFAULT_EMBEDDING_MODEL,
} from "../lib/openai.js";
import { aiUsageService } from "./ai-usage.service.js";
import { logger } from "../lib/logger.js";
import { AppError } from "../utils/AppError.js";
import { ArticleStatus } from "../types/enums.js";

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
    if (
      !mongoose.Types.ObjectId.isValid(articleId) ||
      !mongoose.Types.ObjectId.isValid(organizationId)
    ) {
      throw new AppError("Article not found", 404, "ARTICLE_NOT_FOUND");
    }

    const article = await KnowledgeArticle.findOne({
      _id: articleId,
      organizationId,
    });

    if (!article) {
      throw new AppError("Article not found", 404, "ARTICLE_NOT_FOUND");
    }

    const text = buildEmbedText(article.title, article.content, article.excerpt);
    const vector = await this.embedText(text, organizationId);

    article.embedding = vector;
    article.embeddingUpdatedAt = new Date();
    await article.save();

    return { id: articleId, dimensions: vector.length };
  }

  async embedOrganization(
    organizationId: string,
    options: { force?: boolean; limit?: number } = {}
  ) {
    if (!mongoose.Types.ObjectId.isValid(organizationId)) {
      return { processed: 0, succeeded: 0, failed: 0, results: [] };
    }

    const { force = false, limit = 50 } = options;
    const orgId = new mongoose.Types.ObjectId(organizationId);

    const filter: Record<string, unknown> = {
      organizationId: orgId,
      status: ArticleStatus.PUBLISHED,
    };
    if (!force) {
      filter.$or = [{ embedding: null }, { embeddingUpdatedAt: null }];
    }

    const articles = await KnowledgeArticle.find(filter)
      .select("title content excerpt")
      .sort({ updatedAt: -1 })
      .limit(limit)
      .exec();

    const results: { id: string; ok: boolean; error?: string }[] = [];

    for (const article of articles) {
      try {
        const text = buildEmbedText(
          article.title,
          article.content,
          article.excerpt
        );
        const vector = await this.embedText(text, organizationId);
        article.embedding = vector;
        article.embeddingUpdatedAt = new Date();
        await article.save();
        results.push({ id: article._id.toString(), ok: true });
      } catch (err) {
        logger.error({ err, articleId: article._id }, "embed article failed");
        results.push({
          id: article._id.toString(),
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

  async search(
    organizationId: string,
    query: string,
    topK = 5,
    minScore = 0.25
  ) {
    if (!mongoose.Types.ObjectId.isValid(organizationId)) {
      return [];
    }

    const queryVector = await this.embedText(query, organizationId);

    const articles = await KnowledgeArticle.find({
      organizationId: new mongoose.Types.ObjectId(organizationId),
      status: ArticleStatus.PUBLISHED,
      embedding: { $ne: null, $exists: true },
    })
      .select("title excerpt content category tags embedding")
      .limit(200)
      .lean()
      .exec();

    const scored = articles
      .map((a) => {
        const emb = a.embedding as number[] | null | undefined;
        if (!Array.isArray(emb) || emb.length === 0) return null;
        const score = cosineSimilarity(queryVector, emb);
        return {
          id: a._id.toString(),
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
      contentPreview: content.slice(0, 1200),
    }));
  }
}

export const embeddingService = new EmbeddingService();
