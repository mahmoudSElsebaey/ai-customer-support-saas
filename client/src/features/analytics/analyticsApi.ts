import { api } from "@/app/api";

export interface AnalyticsOverview {
  periodDays: number;
  totals: {
    activeTickets: number;
    customers: number;
    publishedArticles: number;
    createdInPeriod: number;
    resolvedInPeriod: number;
  };
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
  volumeSeries: { date: string; count: number }[];
  performance: {
    avgResolutionHours: number | null;
    avgFirstResponseHours: number | null;
    resolvedCount: number;
    firstResponseSampleSize: number;
  };
  agentWorkload: {
    agentId: string;
    name: string;
    activeTickets: number;
  }[];
  ai: {
    periodDays: number;
    totalRequests: number;
    totalTokens: number;
    totalCost: number;
    byFeature: Record<
      string,
      { requests: number; tokens: number; cost: number }
    >;
  };
}

export const analyticsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getAnalyticsOverview: builder.query<
      { success: boolean; data: AnalyticsOverview },
      { days?: number } | void
    >({
      query: (params) => ({
        url: "/analytics/overview",
        params: params ?? { days: 30 },
      }),
      providesTags: ["Analytics"],
    }),
  }),
});

export const { useGetAnalyticsOverviewQuery } = analyticsApi;
