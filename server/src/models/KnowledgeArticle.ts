import { Schema, model, type Document, type Model, type Types } from "mongoose";
import {
  ArticleStatus,
  ARTICLE_STATUS_VALUES,
  type ArticleStatus as ArticleStatusType,
} from "../types/enums.js";

export interface IKnowledgeArticle {
  organizationId: Types.ObjectId;
  title: string;
  content: string;
  excerpt?: string | null;
  category?: string | null;
  tags: string[];
  status: ArticleStatusType;
  authorId?: Types.ObjectId | null;
  /** OpenAI embedding vector stored as number array for RAG */
  embedding?: number[] | null;
  embeddingUpdatedAt?: Date | null;
  publishedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IKnowledgeArticleDocument extends IKnowledgeArticle, Document {}

const knowledgeArticleSchema = new Schema<IKnowledgeArticleDocument>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    excerpt: { type: String, default: null },
    category: { type: String, default: null },
    tags: { type: [String], default: [] },
    status: {
      type: String,
      enum: ARTICLE_STATUS_VALUES,
      default: ArticleStatus.DRAFT,
    },
    authorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    embedding: { type: [Number], default: null },
    embeddingUpdatedAt: { type: Date, default: null },
    publishedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    collection: "knowledge_articles",
    toJSON: {
      virtuals: true,
      transform(_doc, ret: Record<string, unknown>) {
        ret.id = ret._id?.toString();
        delete ret._id;
        delete ret.__v;
        // Do not expose full embedding vectors in default JSON
        if (ret.embedding) {
          ret.hasEmbedding = Array.isArray(ret.embedding) && ret.embedding.length > 0;
          delete ret.embedding;
        }
        return ret;
      },
    },
  }
);

knowledgeArticleSchema.index({ organizationId: 1 });
knowledgeArticleSchema.index({ organizationId: 1, status: 1 });
knowledgeArticleSchema.index({ organizationId: 1, category: 1 });
knowledgeArticleSchema.index({
  organizationId: 1,
  title: "text",
  content: "text",
  excerpt: "text",
});

export const KnowledgeArticle: Model<IKnowledgeArticleDocument> =
  model<IKnowledgeArticleDocument>("KnowledgeArticle", knowledgeArticleSchema);
