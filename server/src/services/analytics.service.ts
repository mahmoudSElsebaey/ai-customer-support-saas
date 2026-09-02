import mongoose from "mongoose";
import { Ticket } from "../models/Ticket.js";
import { Message } from "../models/Message.js";
import { Customer } from "../models/Customer.js";
import { KnowledgeArticle } from "../models/KnowledgeArticle.js";
import { User } from "../models/User.js";
import { aiUsageService } from "./ai-usage.service.js";
import { ArticleStatus } from "../types/enums.js";

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
    if (!mongoose.Types.ObjectId.isValid(organizationId)) {
      throw new Error("Invalid organizationId");
    }

    const orgId = new mongoose.Types.ObjectId(organizationId);
    const since = daysAgo(days);
    const activeStatuses = ["OPEN", "PENDING", "IN_PROGRESS"];

    const [
      byStatusAgg,
      byPriorityAgg,
      createdInPeriod,
      resolvedInPeriod,
      activeTickets,
      customersTotal,
      articlesPublished,
      aiSummary,
      agentLoadAgg,
    ] = await Promise.all([
      Ticket.aggregate<{ _id: string; count: number }>([
        { $match: { organizationId: orgId } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      Ticket.aggregate<{ _id: string; count: number }>([
        {
          $match: {
            organizationId: orgId,
            status: { $in: activeStatuses },
          },
        },
        { $group: { _id: "$priority", count: { $sum: 1 } } },
      ]),
      Ticket.find({
        organizationId: orgId,
        createdAt: { $gte: since },
      })
        .select("createdAt status")
        .lean()
        .exec(),
      Ticket.find({
        organizationId: orgId,
        resolvedAt: { $gte: since, $ne: null },
      })
        .select("createdAt resolvedAt")
        .lean()
        .exec(),
      Ticket.countDocuments({
        organizationId: orgId,
        status: { $in: activeStatuses },
      }),
      Customer.countDocuments({ organizationId: orgId }),
      KnowledgeArticle.countDocuments({
        organizationId: orgId,
        status: ArticleStatus.PUBLISHED,
      }),
      aiUsageService.summary(organizationId, days),
      Ticket.aggregate<{ _id: mongoose.Types.ObjectId; count: number }>([
        {
          $match: {
            organizationId: orgId,
            assignedAgentId: { $ne: null },
            status: { $in: activeStatuses },
          },
        },
        { $group: { _id: "$assignedAgentId", count: { $sum: 1 } } },
      ]),
    ]);

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

    // First response: tickets created in period + first agent message
    const recentTicketIds = createdInPeriod.map((t) => t._id);
    const firstAgentMessages =
      recentTicketIds.length > 0
        ? await Message.aggregate<{
            _id: mongoose.Types.ObjectId;
            firstAt: Date;
          }>([
            {
              $match: {
                ticketId: { $in: recentTicketIds },
                type: { $in: ["AGENT", "INTERNAL_NOTE"] },
              },
            },
            { $sort: { createdAt: 1 } },
            {
              $group: {
                _id: "$ticketId",
                firstAt: { $first: "$createdAt" },
              },
            },
          ])
        : [];

    const ticketCreatedMap = new Map(
      createdInPeriod.map((t) => [t._id.toString(), t.createdAt])
    );
    const firstResponseHours: number[] = [];
    for (const row of firstAgentMessages) {
      const created = ticketCreatedMap.get(row._id.toString());
      if (!created) continue;
      const hrs =
        (row.firstAt.getTime() - created.getTime()) / (1000 * 60 * 60);
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
    for (const row of byStatusAgg) {
      statusMap[row._id] = row.count;
    }

    const priorityMap: Record<string, number> = {};
    for (const row of byPriorityAgg) {
      priorityMap[row._id] = row.count;
    }

    const agentIds = agentLoadAgg.map((a) => a._id);
    const agents =
      agentIds.length > 0
        ? await User.find({
            _id: { $in: agentIds },
            organizationId: orgId,
          })
            .select("name email")
            .lean()
            .exec()
        : [];

    const agentMap = new Map(agents.map((a) => [a._id.toString(), a]));

    const agentWorkload = agentLoadAgg
      .map((row) => ({
        agentId: row._id.toString(),
        name: agentMap.get(row._id.toString())?.name ?? "Unknown",
        activeTickets: row.count,
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
