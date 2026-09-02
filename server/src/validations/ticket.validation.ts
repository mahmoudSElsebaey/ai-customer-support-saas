import { z } from "zod";

const ticketStatus = z.enum([
  "OPEN",
  "PENDING",
  "IN_PROGRESS",
  "RESOLVED",
  "CLOSED",
]);

const ticketPriority = z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]);

export const createTicketSchema = z.object({
  body: z.object({
    customerId: z.string().min(1),
    subject: z.string().min(3).max(200),
    description: z.string().max(5000).optional().nullable(),
    priority: ticketPriority.optional().default("MEDIUM"),
    category: z.string().max(100).optional().nullable(),
    tags: z.array(z.string()).optional().default([]),
    assignedAgentId: z.string().optional().nullable(),
  }),
});

export const updateTicketSchema = z.object({
  body: z.object({
    subject: z.string().min(3).max(200).optional(),
    description: z.string().max(5000).optional().nullable(),
    status: ticketStatus.optional(),
    priority: ticketPriority.optional(),
    category: z.string().max(100).optional().nullable(),
    tags: z.array(z.string()).optional(),
    assignedAgentId: z.string().optional().nullable(),
  }),
  params: z.object({
    id: z.string().min(1),
  }),
});

export const listTicketsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(20),
    search: z.string().optional(),
    status: ticketStatus.optional(),
    priority: ticketPriority.optional(),
    assignedAgentId: z.string().optional(),
    customerId: z.string().optional(),
    unassigned: z
      .enum(["true", "false"])
      .optional()
      .transform((v) => (v === undefined ? undefined : v === "true")),
  }),
});

export const createMessageSchema = z.object({
  body: z.object({
    content: z.string().min(1).max(10000),
    type: z
      .enum(["CUSTOMER", "AGENT", "INTERNAL_NOTE"])
      .optional()
      .default("AGENT"),
  }),
  params: z.object({
    id: z.string().min(1), // ticketId
  }),
});

export type CreateTicketInput = z.infer<typeof createTicketSchema>["body"];
export type UpdateTicketInput = z.infer<typeof updateTicketSchema>["body"];
export type CreateMessageInput = z.infer<typeof createMessageSchema>["body"];
