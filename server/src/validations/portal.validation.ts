import { z } from "zod";

export const portalRegisterSchema = z.object({
  body: z.object({
    organizationSlug: z.string().min(1).max(100),
    name: z.string().min(2).max(100),
    email: z.string().email(),
    password: z.string().min(8).max(128),
  }),
});

export const portalLoginSchema = z.object({
  body: z.object({
    organizationSlug: z.string().min(1).max(100),
    email: z.string().email(),
    password: z.string().min(1),
  }),
});

export const portalCreateTicketSchema = z.object({
  body: z.object({
    subject: z.string().min(3).max(200),
    description: z.string().max(10000).optional().nullable(),
    priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  }),
});

export const portalMessageSchema = z.object({
  body: z.object({
    content: z.string().min(1).max(10000),
  }),
  params: z.object({
    id: z.string().min(1),
  }),
});

export type PortalRegisterInput = z.infer<typeof portalRegisterSchema>["body"];
export type PortalLoginInput = z.infer<typeof portalLoginSchema>["body"];
export type PortalCreateTicketInput = z.infer<
  typeof portalCreateTicketSchema
>["body"];
