import { Schema, model, type Document, type Model, type Types } from "mongoose";

export interface IAIUsage {
  organizationId: Types.ObjectId;
  feature: string;
  model?: string | null;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCost: number;
  createdAt: Date;
}

export interface IAIUsageDocument extends Omit<Document, "model">, IAIUsage {}

const aiUsageSchema = new Schema<IAIUsageDocument>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    feature: { type: String, required: true },
    model: { type: String, default: null },
    promptTokens: { type: Number, default: 0 },
    completionTokens: { type: Number, default: 0 },
    totalTokens: { type: Number, default: 0 },
    estimatedCost: { type: Number, default: 0 },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: "ai_usages",
    toJSON: {
      virtuals: true,
      transform(_doc, ret: Record<string, unknown>) {
        ret.id = ret._id?.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

aiUsageSchema.index({ organizationId: 1 });
aiUsageSchema.index({ organizationId: 1, createdAt: -1 });
aiUsageSchema.index({ organizationId: 1, feature: 1, createdAt: -1 });

export const AIUsage: Model<IAIUsageDocument> =
  model<IAIUsageDocument>("AIUsage", aiUsageSchema);
