import { Schema, model, type Document, type Model, type Types } from "mongoose";

export interface ICannedResponse {
  organizationId: Types.ObjectId;
  title: string;
  content: string;
  shortcut?: string | null;
  category?: string | null;
  authorId?: Types.ObjectId | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICannedResponseDocument extends ICannedResponse, Document {}

const cannedResponseSchema = new Schema<ICannedResponseDocument>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    shortcut: { type: String, default: null },
    category: { type: String, default: null },
    authorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    collection: "canned_responses",
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

cannedResponseSchema.index({ organizationId: 1 });
cannedResponseSchema.index({ organizationId: 1, isActive: 1 });

export const CannedResponse: Model<ICannedResponseDocument> =
  model<ICannedResponseDocument>("CannedResponse", cannedResponseSchema);
