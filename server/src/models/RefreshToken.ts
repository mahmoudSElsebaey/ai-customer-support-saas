import { Schema, model, type Document, type Model, type Types } from "mongoose";

export interface IRefreshToken {
  token: string;
  userId: Types.ObjectId;
  expiresAt: Date;
  createdAt: Date;
}

export interface IRefreshTokenDocument extends IRefreshToken, Document {}

const refreshTokenSchema = new Schema<IRefreshTokenDocument>(
  {
    token: { type: String, required: true, unique: true },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    expiresAt: { type: Date, required: true },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: "refresh_tokens",
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

refreshTokenSchema.index({ token: 1 }, { unique: true });
refreshTokenSchema.index({ userId: 1 });
// TTL index — documents expire when expiresAt is reached
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const RefreshToken: Model<IRefreshTokenDocument> =
  model<IRefreshTokenDocument>("RefreshToken", refreshTokenSchema);
