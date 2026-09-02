import { Schema, model, type Document, type Model, type Types } from "mongoose";
import {
  MessageType,
  MESSAGE_TYPE_VALUES,
  type MessageType as MessageTypeType,
} from "../types/enums.js";

export interface IMessage {
  ticketId: Types.ObjectId;
  senderId?: Types.ObjectId | null;
  content: string;
  type: MessageTypeType;
  readAt?: Date | null;
  createdAt: Date;
}

export interface IMessageDocument extends IMessage, Document {}

const messageSchema = new Schema<IMessageDocument>(
  {
    ticketId: {
      type: Schema.Types.ObjectId,
      ref: "Ticket",
      required: true,
      index: true,
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    content: { type: String, required: true },
    type: {
      type: String,
      enum: MESSAGE_TYPE_VALUES,
      required: true,
    },
    readAt: { type: Date, default: null },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: "messages",
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

messageSchema.index({ ticketId: 1 });
messageSchema.index({ ticketId: 1, createdAt: 1 });

export const Message: Model<IMessageDocument> =
  model<IMessageDocument>("Message", messageSchema);
