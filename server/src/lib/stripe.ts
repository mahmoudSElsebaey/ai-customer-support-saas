import Stripe from "stripe";
import { env } from "../config/env.js";
import { AppError } from "../utils/AppError.js";

let stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!env.STRIPE_SECRET_KEY) {
    throw new AppError(
      "Billing is not configured. Set STRIPE_SECRET_KEY.",
      503,
      "BILLING_NOT_CONFIGURED"
    );
  }

  if (!stripe) {
    stripe = new Stripe(env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-02-24.acacia",
      typescript: true,
    });
  }

  return stripe;
}
