import { api } from "@/app/api";

export interface PortalOrg {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
}

export interface PortalTicket {
  id: string;
  subject: string;
  description: string | null;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
  _count?: { messages: number };
  messages?: {
    id: string;
    content: string;
    type: string;
    createdAt: string;
    sender: { id: string; name: string; role: string } | null;
  }[];
}

export const portalApi = api.injectEndpoints({
  endpoints: (builder) => ({
    resolvePortalOrg: builder.query<
      { success: boolean; data: PortalOrg },
      string
    >({
      query: (slug) => `/portal/org/${slug}`,
    }),
    portalRegister: builder.mutation<
      {
        success: boolean;
        data: {
          user: { id: string; name: string; email: string; role: string };
          organization: PortalOrg;
        };
      },
      {
        organizationSlug: string;
        name: string;
        email: string;
        password: string;
      }
    >({
      query: (body) => ({
        url: "/portal/auth/register",
        method: "POST",
        body,
      }),
    }),
    portalLogin: builder.mutation<
      {
        success: boolean;
        data: {
          user: { id: string; name: string; email: string; role: string };
          organization: PortalOrg;
        };
      },
      { organizationSlug: string; email: string; password: string }
    >({
      query: (body) => ({
        url: "/portal/auth/login",
        method: "POST",
        body,
      }),
    }),
    portalLogout: builder.mutation<{ success: boolean }, void>({
      query: () => ({ url: "/portal/auth/logout", method: "POST" }),
    }),
    portalTickets: builder.query<
      {
        success: boolean;
        data: {
          items: PortalTicket[];
          pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
          };
        };
      },
      { page?: number; limit?: number } | void
    >({
      query: (params) => ({
        url: "/portal/tickets",
        params: params ?? {},
      }),
      providesTags: ["Ticket"],
    }),
    portalTicket: builder.query<
      { success: boolean; data: PortalTicket },
      string
    >({
      query: (id) => `/portal/tickets/${id}`,
      providesTags: (_r, _e, id) => [{ type: "Ticket", id }],
    }),
    portalCreateTicket: builder.mutation<
      { success: boolean; data: PortalTicket },
      { subject: string; description?: string; priority?: string }
    >({
      query: (body) => ({
        url: "/portal/tickets",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Ticket"],
    }),
    portalAddMessage: builder.mutation<
      { success: boolean; data: unknown },
      { ticketId: string; content: string }
    >({
      query: ({ ticketId, content }) => ({
        url: `/portal/tickets/${ticketId}/messages`,
        method: "POST",
        body: { content },
      }),
      invalidatesTags: (_r, _e, { ticketId }) => [
        { type: "Ticket", id: ticketId },
        "Ticket",
      ],
    }),
    portalKnowledge: builder.query<
      {
        success: boolean;
        data: {
          items: {
            id: string;
            title: string;
            excerpt: string | null;
            category: string | null;
            tags: string[];
          }[];
          pagination: { total: number; page: number; totalPages: number };
        };
      },
      { search?: string; page?: number } | void
    >({
      query: (params) => ({
        url: "/portal/knowledge",
        params: params ?? {},
      }),
    }),
    portalArticle: builder.query<
      {
        success: boolean;
        data: {
          id: string;
          title: string;
          content: string;
          category: string | null;
          tags: string[];
        };
      },
      string
    >({
      query: (id) => `/portal/knowledge/${id}`,
    }),
  }),
});

export const {
  useResolvePortalOrgQuery,
  usePortalRegisterMutation,
  usePortalLoginMutation,
  usePortalLogoutMutation,
  usePortalTicketsQuery,
  usePortalTicketQuery,
  usePortalCreateTicketMutation,
  usePortalAddMessageMutation,
  usePortalKnowledgeQuery,
  usePortalArticleQuery,
} = portalApi;
