import { Schema, model, type Document, type Model } from "mongoose";
import {
  Plan,
  PlanStatus,
  PLAN_VALUES,
  PLAN_STATUS_VALUES,
  type Plan as PlanType,
  type PlanStatus as PlanStatusType,
} from "../types/enums.js";

export interface IOrganization {
  name: string;
  slug: string;
  logo?: string | null;
  plan: PlanType;
  planStatus: PlanStatusType;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  stripePriceId?: string | null;
  currentPeriodEnd?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IOrganizationDocument extends IOrganization, Document {}

const organizationSchema = new Schema<IOrganizationDocument>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    logo: { type: String, default: null },
    plan: {
      type: String,
      enum: PLAN_VALUES,
      default: Plan.FREE,
    },
    planStatus: {
      type: String,
      enum: PLAN_STATUS_VALUES,
      default: PlanStatus.ACTIVE,
    },
    stripeCustomerId: { type: String, default: null, sparse: true },
    stripeSubscriptionId: { type: String, default: null, sparse: true },
    stripePriceId: { type: String, default: null },
    currentPeriodEnd: { type: Date, default: null },
  },
  {
    timestamps: true,
    collection: "organizations",
    toJSON: {
      virtuals: true,
      transform(_doc, ret) {
        ret.id = ret._id?.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

organizationSchema.index({ slug: 1 }, { unique: true });
organizationSchema.index(
  { stripeCustomerId: 1 },
  { unique: true, sparse: true }
);
organizationSchema.index(
  { stripeSubscriptionId: 1 },
  { unique: true, sparse: true }
);

export const Organization: Model<IOrganizationDocument> =
  model<IOrganizationDocument>("Organization", organizationSchema);
