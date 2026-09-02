import { api } from "@/app/api";

export interface PlanInfo {
  id: "FREE" | "PRO" | "BUSINESS";
  name: string;
  priceMonthly: number;
  currency: string;
  features: string[];
  limits: {
    agents: number;
    ticketsPerMonth: number;
    knowledgeArticles: number;
    aiRequestsPerMonth: number;
  };
  checkoutAvailable: boolean;
}

export interface SubscriptionInfo {
  id: string;
  name: string;
  plan: "FREE" | "PRO" | "BUSINESS";
  planStatus: string;
  planName: string;
  features: string[];
  limits: PlanInfo["limits"];
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  currentPeriodEnd: string | null;
  billingEnabled: boolean;
}

export const billingApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getPlans: builder.query<
      { success: boolean; data: { enabled: boolean; plans: PlanInfo[] } },
      void
    >({
      query: () => "/billing/plans",
    }),
    getSubscription: builder.query<
      { success: boolean; data: SubscriptionInfo },
      void
    >({
      query: () => "/billing/subscription",
      providesTags: ["Organization"],
    }),
    createCheckout: builder.mutation<
      { success: boolean; data: { url: string | null; sessionId: string } },
      { plan: "PRO" | "BUSINESS" }
    >({
      query: (body) => ({
        url: "/billing/checkout",
        method: "POST",
        body,
      }),
    }),
    createPortal: builder.mutation<
      { success: boolean; data: { url: string } },
      void
    >({
      query: () => ({
        url: "/billing/portal",
        method: "POST",
      }),
    }),
  }),
});

export const {
  useGetPlansQuery,
  useGetSubscriptionQuery,
  useCreateCheckoutMutation,
  useCreatePortalMutation,
} = billingApi;
