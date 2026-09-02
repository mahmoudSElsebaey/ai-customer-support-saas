import { z } from "zod";

export const createCustomerSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100),
    email: z.string().email(),
    phone: z.string().max(30).optional().nullable(),
    company: z.string().max(100).optional().nullable(),
    tags: z.array(z.string()).optional().default([]),
    notes: z.string().max(2000).optional().nullable(),
    status: z.enum(["active", "inactive"]).optional().default("active"),
  }),
});

export const updateCustomerSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100).optional(),
    email: z.string().email().optional(),
    phone: z.string().max(30).optional().nullable(),
    company: z.string().max(100).optional().nullable(),
    tags: z.array(z.string()).optional(),
    notes: z.string().max(2000).optional().nullable(),
    status: z.enum(["active", "inactive"]).optional(),
  }),
  params: z.object({
    id: z.string().min(1),
  }),
});

export const listCustomersSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(20),
    search: z.string().optional(),
    status: z.enum(["active", "inactive"]).optional(),
  }),
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>["body"];
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>["body"];
