import mongoose from "mongoose";
import { Ticket } from "../models/Ticket.js";

export class TicketStatsService {
  async workspaceStats(organizationId: string, agentId: string) {
    const orgId = new mongoose.Types.ObjectId(organizationId);
    const agentObjectId = mongoose.Types.ObjectId.isValid(agentId)
      ? new mongoose.Types.ObjectId(agentId)
      : null;

    const activeStatuses = ["OPEN", "PENDING", "IN_PROGRESS"];
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const base = { organizationId: orgId };

    const [
      open,
      pending,
      inProgress,
      urgent,
      unassigned,
      mine,
      resolvedToday,
    ] = await Promise.all([
      Ticket.countDocuments({ ...base, status: "OPEN" }),
      Ticket.countDocuments({ ...base, status: "PENDING" }),
      Ticket.countDocuments({ ...base, status: "IN_PROGRESS" }),
      Ticket.countDocuments({
        ...base,
        priority: "URGENT",
        status: { $in: activeStatuses },
      }),
      Ticket.countDocuments({
        ...base,
        assignedAgentId: null,
        status: { $in: activeStatuses },
      }),
      agentObjectId
        ? Ticket.countDocuments({
            ...base,
            assignedAgentId: agentObjectId,
            status: { $in: activeStatuses },
          })
        : Promise.resolve(0),
      Ticket.countDocuments({
        ...base,
        status: { $in: ["RESOLVED", "CLOSED"] },
        resolvedAt: { $gte: startOfDay },
      }),
    ]);

    return {
      open,
      pending,
      inProgress,
      urgent,
      unassigned,
      mine,
      resolvedToday,
      active: open + pending + inProgress,
    };
  }
}

export const ticketStatsService = new TicketStatsService();
