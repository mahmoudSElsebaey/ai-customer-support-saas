import { Schema, model, type Document, type Model, type Types } from "mongoose";
import {
  TicketStatus,
  TicketPriority,
  TICKET_STATUS_VALUES,
  TICKET_PRIORITY_VALUES,
  type TicketStatus as TicketStatusType,
  type TicketPriority as TicketPriorityType,
} from "../types/enums.js";

export interface ITicket {
  organizationId: Types.ObjectId;
  customerId: Types.ObjectId;
  assignedAgentId?: Types.ObjectId | null;
  subject: string;
  description?: string | null;
  status: TicketStatusType;
  priority: TicketPriorityType;
  category?: string | null;
  tags: string[];
  resolvedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITicketDocument extends ITicket, Document {}

const ticketSchema = new Schema<ITicketDocument>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      index: true,
    },
    assignedAgentId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    subject: { type: String, required: true, trim: true },
    description: { type: String, default: null },
    status: {
      type: String,
      enum: TICKET_STATUS_VALUES,
      default: TicketStatus.OPEN,
    },
    priority: {
      type: String,
      enum: TICKET_PRIORITY_VALUES,
      default: TicketPriority.MEDIUM,
    },
    category: { type: String, default: null },
    tags: { type: [String], default: [] },
    resolvedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    collection: "tickets",
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

ticketSchema.index({ organizationId: 1 });
ticketSchema.index({ organizationId: 1, status: 1 });
ticketSchema.index({ organizationId: 1, assignedAgentId: 1 });
ticketSchema.index({ organizationId: 1, updatedAt: -1 });
ticketSchema.index({ organizationId: 1, priority: -1, updatedAt: -1 });
ticketSchema.index({ customerId: 1 });
ticketSchema.index({ organizationId: 1, subject: "text", description: "text" });

export const Ticket: Model<ITicketDocument> =
  model<ITicketDocument>("Ticket", ticketSchema);
