import { Schema, model, type Document, type Model, type Types } from "mongoose";

export interface ICustomer {
  organizationId: Types.ObjectId;
  name: string;
  email: string;
  phone?: string | null;
  company?: string | null;
  status: string;
  tags: string[];
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICustomerDocument extends ICustomer, Document {}

const customerSchema = new Schema<ICustomerDocument>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, default: null },
    company: { type: String, default: null },
    status: { type: String, default: "active" },
    tags: { type: [String], default: [] },
    notes: { type: String, default: null },
  },
  {
    timestamps: true,
    collection: "customers",
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

customerSchema.index({ email: 1, organizationId: 1 }, { unique: true });
customerSchema.index({ organizationId: 1 });
customerSchema.index({ organizationId: 1, status: 1 });
customerSchema.index({ organizationId: 1, name: "text", email: "text" });

export const Customer: Model<ICustomerDocument> =
  model<ICustomerDocument>("Customer", customerSchema);
