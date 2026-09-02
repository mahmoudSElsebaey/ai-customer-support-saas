import { prisma } from "../lib/prisma.js";
import { aiUsageService } from "./ai-usage.service.js";

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return startOfDay(d);
}

function formatDay(d: Date) {
  return d.toISOString().slice(0, 10);
}

export class AnalyticsService {
  async overview(organizationId: string, days = 30) {
    const since = daysAgo(days);

    const [
      byStatus,
      byPriority,
      createdInPeriod,
      resolvedInPeriod,
      activeTickets,
      customersTotal,
      articlesPublished,
      recentTickets,
      aiSummary,
    ] = await Promise.all([
      prisma.ticket.groupBy({
        by: ["status"],
        where: { organizationId },
        _count: { _all: true },
      }),
      prisma.ticket.groupBy({
        by: ["priority"],
        where: {
          organizationId,
          status: { in: ["OPEN", "PENDING", "IN_PROGRESS"] },
        },
        _count: { _all: true },
      }),
      prisma.ticket.findMany({
        where: { organizationId, createdAt: { gte: since } },
        select: { id: true, createdAt: true, status: true },
      }),
      prisma.ticket.findMany({
        where: {
          organizationId,
          resolvedAt: { gte: since, not: null },
        },
        select: {
          id: true,
          createdAt: true,
          resolvedAt: true,
        },
      }),
      prisma.ticket.count({
        where: {
          organizationId,
          status: { in: ["OPEN", "PENDING", "IN_PROGRESS"] },
        },
      }),
      prisma.customer.count({ where: { organizationId } }),
      prisma.knowledgeArticle.count({
        where: { organizationId, status: "PUBLISHED" },
      }),
      prisma.ticket.findMany({
        where: { organizationId, createdAt: { gte: since } },
        select: {
          id: true,
          createdAt: true,
          messages: {
            where: { type: { in: ["AGENT", "INTERNAL_NOTE"] } },
            orderBy: { createdAt: "asc" },
            take: 1,
            select: { createdAt: true },
          },
        },
      }),
      aiUsageService.summary(organizationId, days),
    ]);

    // Volume series (created per day)
    const volumeMap = new Map<string, number>();
    for (let i = days - 1; i >= 0; i--) {
      volumeMap.set(formatDay(daysAgo(i)), 0);
    }
    for (const t of createdInPeriod) {
      const key = formatDay(startOfDay(t.createdAt));
      if (volumeMap.has(key)) {
        volumeMap.set(key, (volumeMap.get(key) ?? 0) + 1);
      }
    }
    const volumeSeries = Array.from(volumeMap.entries()).map(([date, count]) => ({
      date,
      count,
    }));

    // Average resolution time (hours)
    const resolutionHours: number[] = [];
    for (const t of resolvedInPeriod) {
      if (!t.resolvedAt) continue;
      const hrs =
        (t.resolvedAt.getTime() - t.createdAt.getTime()) / (1000 * 60 * 60);
      if (hrs >= 0 && hrs < 24 * 90) resolutionHours.push(hrs);
    }
    const avgResolutionHours =
      resolutionHours.length > 0
        ? Number(
            (
              resolutionHours.reduce((a, b) => a + b, 0) /
              resolutionHours.length
            ).toFixed(2)
          )
        : null;

    // First response time (hours until first agent message)
    const firstResponseHours: number[] = [];
    for (const t of recentTickets) {
      const first = t.messages[0];
      if (!first) continue;
      const hrs =
        (first.createdAt.getTime() - t.createdAt.getTime()) / (1000 * 60 * 60);
      if (hrs >= 0 && hrs < 24 * 30) firstResponseHours.push(hrs);
    }
    const avgFirstResponseHours =
      firstResponseHours.length > 0
        ? Number(
            (
              firstResponseHours.reduce((a, b) => a + b, 0) /
              firstResponseHours.length
            ).toFixed(2)
          )
        : null;

    const statusMap: Record<string, number> = {};
    for (const row of byStatus) {
      statusMap[row.status] = row._count._all;
    }

    const priorityMap: Record<string, number> = {};
    for (const row of byPriority) {
      priorityMap[row.priority] = row._count._all;
    }

    // Agent workload (assigned active tickets)
    const agentLoad = await prisma.ticket.groupBy({
      by: ["assignedAgentId"],
      where: {
        organizationId,
        assignedAgentId: { not: null },
        status: { in: ["OPEN", "PENDING", "IN_PROGRESS"] },
      },
      _count: { _all: true },
    });

    const agentIds = agentLoad
      .map((a) => a.assignedAgentId)
      .filter((id): id is string => Boolean(id));

    const agents = agentIds.length
      ? await prisma.user.findMany({
          where: { id: { in: agentIds }, organizationId },
          select: { id: true, name: true, email: true },
        })
      : [];

    const agentMap = new Map(agents.map((a) => [a.id, a]));

    const agentWorkload = agentLoad
      .map((row) => ({
        agentId: row.assignedAgentId!,
        name: agentMap.get(row.assignedAgentId!)?.name ?? "Unknown",
        activeTickets: row._count._all,
      }))
      .sort((a, b) => b.activeTickets - a.activeTickets);

    return {
      periodDays: days,
      totals: {
        activeTickets,
        customers: customersTotal,
        publishedArticles: articlesPublished,
        createdInPeriod: createdInPeriod.length,
        resolvedInPeriod: resolvedInPeriod.length,
      },
      byStatus: statusMap,
      byPriority: priorityMap,
      volumeSeries,
      performance: {
        avgResolutionHours,
        avgFirstResponseHours,
        resolvedCount: resolvedInPeriod.length,
        firstResponseSampleSize: firstResponseHours.length,
      },
      agentWorkload,
      ai: aiSummary,
    };
  }
}

export const analyticsService = new AnalyticsService();
