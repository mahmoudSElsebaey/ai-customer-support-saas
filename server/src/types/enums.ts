/**
 * Domain enums shared across the application.
 * Replaces Prisma-generated enums so the API and auth layers
 * no longer depend on @prisma/client after the MongoDB migration.
 */

export const Role = {
  OWNER: "OWNER",
  ADMIN: "ADMIN",
  MANAGER: "MANAGER",
  AGENT: "AGENT",
  CUSTOMER: "CUSTOMER",
} as const;
export type Role = (typeof Role)[keyof typeof Role];

export const Plan = {
  FREE: "FREE",
  PRO: "PRO",
  BUSINESS: "BUSINESS",
} as const;
export type Plan = (typeof Plan)[keyof typeof Plan];

export const PlanStatus = {
  ACTIVE: "ACTIVE",
  PAST_DUE: "PAST_DUE",
  CANCELED: "CANCELED",
  TRIALING: "TRIALING",
  INCOMPLETE: "INCOMPLETE",
} as const;
export type PlanStatus = (typeof PlanStatus)[keyof typeof PlanStatus];

export const TicketStatus = {
  OPEN: "OPEN",
  PENDING: "PENDING",
  IN_PROGRESS: "IN_PROGRESS",
  RESOLVED: "RESOLVED",
  CLOSED: "CLOSED",
} as const;
export type TicketStatus = (typeof TicketStatus)[keyof typeof TicketStatus];

export const TicketPriority = {
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
  URGENT: "URGENT",
} as const;
export type TicketPriority = (typeof TicketPriority)[keyof typeof TicketPriority];

export const MessageType = {
  CUSTOMER: "CUSTOMER",
  AGENT: "AGENT",
  INTERNAL_NOTE: "INTERNAL_NOTE",
  AI_SUGGESTION: "AI_SUGGESTION",
  SYSTEM: "SYSTEM",
} as const;
export type MessageType = (typeof MessageType)[keyof typeof MessageType];

export const ArticleStatus = {
  DRAFT: "DRAFT",
  PUBLISHED: "PUBLISHED",
  ARCHIVED: "ARCHIVED",
} as const;
export type ArticleStatus = (typeof ArticleStatus)[keyof typeof ArticleStatus];

export const ROLE_VALUES = Object.values(Role);
export const PLAN_VALUES = Object.values(Plan);
export const PLAN_STATUS_VALUES = Object.values(PlanStatus);
export const TICKET_STATUS_VALUES = Object.values(TicketStatus);
export const TICKET_PRIORITY_VALUES = Object.values(TicketPriority);
export const MESSAGE_TYPE_VALUES = Object.values(MessageType);
export const ARTICLE_STATUS_VALUES = Object.values(ArticleStatus);
