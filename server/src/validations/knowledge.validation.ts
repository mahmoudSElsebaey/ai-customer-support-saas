import { z } from "zod";

const articleStatus = z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]);

export const createArticleSchema = z.object({
  body: z.object({
    title: z.string().min(3).max(200),
    content: z.string().min(1).max(100000),
    excerpt: z.string().max(500).optional().nullable(),
    category: z.string().max(100).optional().nullable(),
    tags: z.array(z.string().max(50)).max(20).optional().default([]),
    status: articleStatus.optional().default("DRAFT"),
  }),
});

export const updateArticleSchema = z.object({
  body: z.object({
    title: z.string().min(3).max(200).optional(),
    content: z.string().min(1).max(100000).optional(),
    excerpt: z.string().max(500).optional().nullable(),
    category: z.string().max(100).optional().nullable(),
    tags: z.array(z.string().max(50)).max(20).optional(),
    status: articleStatus.optional(),
  }),
  params: z.object({
    id: z.string().min(1),
  }),
});

export const listArticlesSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(20),
    search: z.string().optional(),
    status: articleStatus.optional(),
    category: z.string().optional(),
    tag: z.string().optional(),
  }),
});

export type CreateArticleInput = z.infer<typeof createArticleSchema>["body"];
export type UpdateArticleInput = z.infer<typeof updateArticleSchema>["body"];
