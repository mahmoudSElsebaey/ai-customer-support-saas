import { Schema, model, type Document, type Model, type Types } from "mongoose";
import { Role, ROLE_VALUES, type Role as RoleType } from "../types/enums.js";

export interface IUser {
  name: string;
  email: string;
  password: string;
  role: RoleType;
  avatar?: string | null;
  organizationId: Types.ObjectId;
  isActive: boolean;
  lastSeenAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserDocument extends IUser, Document {}

const userSchema = new Schema<IUserDocument>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: ROLE_VALUES,
      default: Role.AGENT,
    },
    avatar: { type: String, default: null },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    isActive: { type: Boolean, default: true },
    lastSeenAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    collection: "users",
    toJSON: {
      virtuals: true,
      transform(_doc, ret: Record<string, unknown>) {
        ret.id = ret._id?.toString();
        delete ret._id;
        delete ret.__v;
        delete ret.password;
        return ret;
      },
    },
  }
);

// Same email can exist in different orgs; unique per organization
userSchema.index({ email: 1, organizationId: 1 }, { unique: true });
userSchema.index({ organizationId: 1 });
userSchema.index({ email: 1 });
userSchema.index({ organizationId: 1, role: 1, isActive: 1 });

export const User: Model<IUserDocument> = model<IUserDocument>("User", userSchema);
