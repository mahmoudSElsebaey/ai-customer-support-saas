import type Stripe from "stripe";
import { prisma } from "../lib/prisma.js";
import { getStripe } from "../lib/stripe.js";
import { env } from "../config/env.js";
import { AppError } from "../utils/AppError.js";
import {
  PLAN_CATALOG,
  isStripeEnabled,
  planFromPriceId,
} from "../config/plans.js";
import type { Plan, PlanStatus } from "@prisma/client";
import { logger } from "../lib/logger.js";

function mapSubscriptionStatus(status: Stripe.Subscription.Status): PlanStatus {
  switch (status) {
    case "active":
      return "ACTIVE";
    case "past_due":
      return "PAST_DUE";
    case "canceled":
    case "unpaid":
      return "CANCELED";
    case "trialing":
      return "TRIALING";
    case "incomplete":
    case "incomplete_expired":
      return "INCOMPLETE";
    default:
      return "ACTIVE";
  }
}

export class BillingService {
  isEnabled() {
    return isStripeEnabled();
  }

  listPlans() {
    return Object.values(PLAN_CATALOG).map((p) => ({
      id: p.id,
      name: p.name,
      priceMonthly: p.priceMonthly,
      currency: p.currency,
      features: p.features,
      limits: p.limits,
      checkoutAvailable: Boolean(p.stripePriceId) && isStripeEnabled(),
    }));
  }

  async getSubscription(organizationId: string) {
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        id: true,
        name: true,
        plan: true,
        planStatus: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
        stripePriceId: true,
        currentPeriodEnd: true,
      },
    });

    if (!org) {
      throw new AppError("Organization not found", 404, "ORG_NOT_FOUND");
    }

    const planDef = PLAN_CATALOG[org.plan];

    return {
      ...org,
      planName: planDef.name,
      features: planDef.features,
      limits: planDef.limits,
      billingEnabled: isStripeEnabled(),
    };
  }

  private async ensureStripeCustomer(
    organizationId: string,
    email: string,
    name: string
  ) {
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
    });
    if (!org) {
      throw new AppError("Organization not found", 404, "ORG_NOT_FOUND");
    }

    if (org.stripeCustomerId) {
      return org.stripeCustomerId;
    }

    const stripe = getStripe();
    const customer = await stripe.customers.create({
      email,
      name: org.name || name,
      metadata: { organizationId },
    });

    await prisma.organization.update({
      where: { id: organizationId },
      data: { stripeCustomerId: customer.id },
    });

    return customer.id;
  }

  async createCheckoutSession(
    organizationId: string,
    userEmail: string,
    userName: string,
    plan: Plan
  ) {
    if (plan === "FREE") {
      throw new AppError("Cannot checkout Free plan", 400, "INVALID_PLAN");
    }

    const def = PLAN_CATALOG[plan];
    if (!def.stripePriceId) {
      throw new AppError(
        `Stripe price not configured for ${plan}. Set STRIPE_PRICE_${plan}.`,
        503,
        "PRICE_NOT_CONFIGURED"
      );
    }

    const customerId = await this.ensureStripeCustomer(
      organizationId,
      userEmail,
      userName
    );

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: def.stripePriceId, quantity: 1 }],
      success_url: `${env.CLIENT_URL}/billing?success=1`,
      cancel_url: `${env.CLIENT_URL}/billing?canceled=1`,
      metadata: {
        organizationId,
        plan,
      },
      subscription_data: {
        metadata: {
          organizationId,
          plan,
        },
      },
      allow_promotion_codes: true,
    });

    return { url: session.url, sessionId: session.id };
  }

  async createPortalSession(organizationId: string) {
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!org?.stripeCustomerId) {
      throw new AppError(
        "No billing customer yet. Subscribe to a plan first.",
        400,
        "NO_STRIPE_CUSTOMER"
      );
    }

    const stripe = getStripe();
    const session = await stripe.billingPortal.sessions.create({
      customer: org.stripeCustomerId,
      return_url: `${env.CLIENT_URL}/billing`,
    });

    return { url: session.url };
  }

  async handleWebhook(rawBody: Buffer, signature: string) {
    if (!env.STRIPE_WEBHOOK_SECRET) {
      throw new AppError(
        "STRIPE_WEBHOOK_SECRET not set",
        503,
        "WEBHOOK_NOT_CONFIGURED"
      );
    }

    const stripe = getStripe();
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        rawBody,
        signature,
        env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      logger.warn({ err }, "Stripe webhook signature verification failed");
      throw new AppError("Invalid webhook signature", 400, "INVALID_SIGNATURE");
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await this.onCheckoutCompleted(session);
        break;
      }
      case "customer.subscription.updated":
      case "customer.subscription.created": {
        const sub = event.data.object as Stripe.Subscription;
        await this.syncSubscription(sub);
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await this.onSubscriptionDeleted(sub);
        break;
      }
      default:
        logger.debug({ type: event.type }, "Unhandled Stripe event");
    }

    return { received: true };
  }

  private async onCheckoutCompleted(session: Stripe.Checkout.Session) {
    const organizationId =
      session.metadata?.organizationId ||
      (session.subscription
        ? undefined
        : undefined);

    if (!session.subscription) return;

    const stripe = getStripe();
    const subId =
      typeof session.subscription === "string"
        ? session.subscription
        : session.subscription.id;

    const sub = await stripe.subscriptions.retrieve(subId);
    await this.syncSubscription(sub, organizationId ?? session.metadata?.organizationId);
  }

  private async syncSubscription(
    sub: Stripe.Subscription,
    organizationIdHint?: string
  ) {
    const organizationId =
      organizationIdHint ||
      sub.metadata?.organizationId ||
      (await this.findOrgIdByCustomer(
        typeof sub.customer === "string" ? sub.customer : sub.customer.id
      ));

    if (!organizationId) {
      logger.warn({ subId: sub.id }, "Subscription without organizationId");
      return;
    }

    const priceId = sub.items.data[0]?.price?.id ?? null;
    const plan = planFromPriceId(priceId);
    const periodEnd = sub.current_period_end
      ? new Date(sub.current_period_end * 1000)
      : null;

    await prisma.organization.update({
      where: { id: organizationId },
      data: {
        plan,
        planStatus: mapSubscriptionStatus(sub.status),
        stripeSubscriptionId: sub.id,
        stripePriceId: priceId,
        stripeCustomerId:
          typeof sub.customer === "string" ? sub.customer : sub.customer.id,
        currentPeriodEnd: periodEnd,
      },
    });
  }

  private async onSubscriptionDeleted(sub: Stripe.Subscription) {
    const organizationId =
      sub.metadata?.organizationId ||
      (await this.findOrgIdByCustomer(
        typeof sub.customer === "string" ? sub.customer : sub.customer.id
      ));

    if (!organizationId) return;

    await prisma.organization.update({
      where: { id: organizationId },
      data: {
        plan: "FREE",
        planStatus: "CANCELED",
        stripeSubscriptionId: null,
        stripePriceId: null,
        currentPeriodEnd: null,
      },
    });
  }

  private async findOrgIdByCustomer(customerId: string) {
    const org = await prisma.organization.findFirst({
      where: { stripeCustomerId: customerId },
      select: { id: true },
    });
    return org?.id;
  }
}

export const billingService = new BillingService();
