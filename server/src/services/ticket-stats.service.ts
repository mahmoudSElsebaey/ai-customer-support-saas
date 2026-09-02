import { prisma } from "../lib/prisma.js";

export class TicketStatsService {
  async workspaceStats(organizationId: string, agentId: string) {
    const base = { organizationId };

    const [
      open,
      pending,
      inProgress,
      urgent,
      unassigned,
      mine,
      resolvedToday,
    ] = await Promise.all([
      prisma.ticket.count({
        where: { ...base, status: "OPEN" },
      }),
      prisma.ticket.count({
        where: { ...base, status: "PENDING" },
      }),
      prisma.ticket.count({
        where: { ...base, status: "IN_PROGRESS" },
      }),
      prisma.ticket.count({
        where: {
          ...base,
          priority: "URGENT",
          status: { in: ["OPEN", "PENDING", "IN_PROGRESS"] },
        },
      }),
      prisma.ticket.count({
        where: {
          ...base,
          assignedAgentId: null,
          status: { in: ["OPEN", "PENDING", "IN_PROGRESS"] },
        },
      }),
      prisma.ticket.count({
        where: {
          ...base,
          assignedAgentId: agentId,
          status: { in: ["OPEN", "PENDING", "IN_PROGRESS"] },
        },
      }),
      prisma.ticket.count({
        where: {
          ...base,
          status: { in: ["RESOLVED", "CLOSED"] },
          resolvedAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
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
