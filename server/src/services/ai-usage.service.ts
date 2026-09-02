import mongoose from "mongoose";
import { AIUsage } from "../models/AIUsage.js";
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
    if (!mongoose.Types.ObjectId.isValid(input.organizationId)) {
      return null;
    }

    const totalTokens = input.promptTokens + input.completionTokens;
    const estimatedCost = estimateCost(
      input.model,
      input.promptTokens,
      input.completionTokens
    );

    return AIUsage.create({
      organizationId: new mongoose.Types.ObjectId(input.organizationId),
      feature: input.feature,
      model: input.model,
      promptTokens: input.promptTokens,
      completionTokens: input.completionTokens,
      totalTokens,
      estimatedCost,
    });
  }

  async summary(organizationId: string, days = 30) {
    if (!mongoose.Types.ObjectId.isValid(organizationId)) {
      return {
        periodDays: days,
        totalRequests: 0,
        totalTokens: 0,
        totalCost: 0,
        byFeature: {},
      };
    }

    const since = new Date();
    since.setDate(since.getDate() - days);

    const rows = await AIUsage.find({
      organizationId: new mongoose.Types.ObjectId(organizationId),
      createdAt: { $gte: since },
    })
      .select("feature totalTokens estimatedCost")
      .lean()
      .exec();

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
