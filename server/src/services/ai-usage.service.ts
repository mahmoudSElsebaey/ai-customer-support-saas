import { prisma } from "../lib/prisma.js";
import { estimateCost } from "../lib/openai.js";

interface TrackInput {
  organizationId: string;
  feature: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
}

export class AIUsageService {
  async track(input: TrackInput) {
    const totalTokens = input.promptTokens + input.completionTokens;
    const estimatedCost = estimateCost(
      input.model,
      input.promptTokens,
      input.completionTokens
    );

    return prisma.aIUsage.create({
      data: {
        organizationId: input.organizationId,
        feature: input.feature,
        model: input.model,
        promptTokens: input.promptTokens,
        completionTokens: input.completionTokens,
        totalTokens,
        estimatedCost,
      },
    });
  }

  async summary(organizationId: string, days = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const rows = await prisma.aIUsage.findMany({
      where: {
        organizationId,
        createdAt: { gte: since },
      },
      select: {
        feature: true,
        totalTokens: true,
        estimatedCost: true,
      },
    });

    const byFeature: Record<
      string,
      { requests: number; tokens: number; cost: number }
    > = {};

    let totalRequests = 0;
    let totalTokens = 0;
    let totalCost = 0;

    for (const row of rows) {
      totalRequests += 1;
      totalTokens += row.totalTokens;
      totalCost += row.estimatedCost;

      if (!byFeature[row.feature]) {
        byFeature[row.feature] = { requests: 0, tokens: 0, cost: 0 };
      }
      byFeature[row.feature].requests += 1;
      byFeature[row.feature].tokens += row.totalTokens;
      byFeature[row.feature].cost += row.estimatedCost;
    }

    return {
      periodDays: days,
      totalRequests,
      totalTokens,
      totalCost: Number(totalCost.toFixed(6)),
      byFeature,
    };
  }
}

export const aiUsageService = new AIUsageService();
