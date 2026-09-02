import { z } from "zod";

export const createCannedSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(120),
    content: z.string().min(1).max(10000),
    shortcut: z.string().max(40).optional().nullable(),
    category: z.string().max(80).optional().nullable(),
    isActive: z.boolean().optional().default(true),
  }),
});

export const updateCannedSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(120).optional(),
    content: z.string().min(1).max(10000).optional(),
    shortcut: z.string().max(40).optional().nullable(),
    category: z.string().max(80).optional().nullable(),
    isActive: z.boolean().optional(),
  }),
  params: z.object({ id: z.string().min(1) }),
});

export type CreateCannedInput = z.infer<typeof createCannedSchema>["body"];
export type UpdateCannedInput = z.infer<typeof updateCannedSchema>["body"];
