import { api } from "@/app/api";

export interface TicketAnalysis {
  intent: string;
  category: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  sentiment: "POSITIVE" | "NEUTRAL" | "NEGATIVE";
  summary: string;
}

export interface AnalyzeResponse {
  analysis: TicketAnalysis;
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  } | null;
}

export interface SuggestReplyResponse {
  suggestion: string;
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  } | null;
}

export const aiApi = api.injectEndpoints({
  endpoints: (builder) => ({
    aiStatus: builder.query<
      { success: boolean; data: { enabled: boolean; features: string[] } },
      void
    >({
      query: () => "/ai/status",
    }),
    analyzeTicket: builder.mutation<
      { success: boolean; data: AnalyzeResponse },
      string
    >({
      query: (ticketId) => ({
        url: `/ai/tickets/${ticketId}/analyze`,
        method: "POST",
      }),
    }),
    suggestReply: builder.mutation<
      { success: boolean; data: SuggestReplyResponse },
      string
    >({
      query: (ticketId) => ({
        url: `/ai/tickets/${ticketId}/suggest-reply`,
        method: "POST",
      }),
    }),
    summarizeTicket: builder.mutation<
      {
        success: boolean;
        data: {
          summary: string;
          analysis: TicketAnalysis;
          model: string;
        };
      },
      string
    >({
      query: (ticketId) => ({
        url: `/ai/tickets/${ticketId}/summarize`,
        method: "POST",
      }),
    }),
    aiUsage: builder.query<
      {
        success: boolean;
        data: {
          periodDays: number;
          totalRequests: number;
          totalTokens: number;
          totalCost: number;
          byFeature: Record<
            string,
            { requests: number; tokens: number; cost: number }
          >;
        };
      },
      { days?: number } | void
    >({
      query: (params) => ({
        url: "/ai/usage",
        params: params ?? {},
      }),
    }),
  }),
});

export const {
  useAiStatusQuery,
  useAnalyzeTicketMutation,
  useSuggestReplyMutation,
  useSummarizeTicketMutation,
  useAiUsageQuery,
} = aiApi;
