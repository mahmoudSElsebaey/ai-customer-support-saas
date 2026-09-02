import { env } from "./env.js";
import { Plan, type Plan as PlanType } from "../types/enums.js";

export interface PlanDefinition {
  id: PlanType;
  name: string;
  priceMonthly: number;
  currency: string;
  features: string[];
  limits: {
    agents: number;
    ticketsPerMonth: number;
    knowledgeArticles: number;
    aiRequestsPerMonth: number;
  };
  stripePriceId: string | null;
}

export const PLAN_CATALOG: Record<PlanType, PlanDefinition> = {
  FREE: {
    id: Plan.FREE,
    name: "Free",
    priceMonthly: 0,
    currency: "usd",
    features: [
      "Up to 2 agents",
      "100 tickets / month",
      "10 knowledge articles",
      "Basic support inbox",
    ],
    limits: {
      agents: 2,
      ticketsPerMonth: 100,
      knowledgeArticles: 10,
      aiRequestsPerMonth: 20,
    },
    stripePriceId: null,
  },
  PRO: {
    id: Plan.PRO,
    name: "Pro",
    priceMonthly: 49,
    currency: "usd",
    features: [
      "Up to 10 agents",
      "2,000 tickets / month",
      "Unlimited knowledge articles",
      "AI assistant + RAG",
      "Analytics",
    ],
    limits: {
      agents: 10,
      ticketsPerMonth: 2000,
      knowledgeArticles: 10_000,
      aiRequestsPerMonth: 2000,
    },
    stripePriceId: env.STRIPE_PRICE_PRO ?? null,
  },
  BUSINESS: {
    id: Plan.BUSINESS,
    name: "Business",
    priceMonthly: 149,
    currency: "usd",
    features: [
      "Unlimited agents",
      "Unlimited tickets",
      "Advanced AI usage",
      "Priority support",
      "Custom limits on request",
    ],
    limits: {
      agents: 10_000,
      ticketsPerMonth: 100_000,
      knowledgeArticles: 100_000,
      aiRequestsPerMonth: 50_000,
    },
    stripePriceId: env.STRIPE_PRICE_BUSINESS ?? null,
  },
};

export function planFromPriceId(priceId: string | null | undefined): PlanType {
  if (!priceId) return Plan.FREE;
  if (env.STRIPE_PRICE_PRO && priceId === env.STRIPE_PRICE_PRO) return Plan.PRO;
  if (env.STRIPE_PRICE_BUSINESS && priceId === env.STRIPE_PRICE_BUSINESS) {
    return Plan.BUSINESS;
  }
  return Plan.FREE;
}

export function isStripeEnabled(): boolean {
  return Boolean(env.STRIPE_SECRET_KEY);
}
