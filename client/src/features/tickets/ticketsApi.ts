import { api } from "@/app/api";

export type TicketStatus =
  | "OPEN"
  | "PENDING"
  | "IN_PROGRESS"
  | "RESOLVED"
  | "CLOSED";
export type TicketPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export type MessageType =
  | "CUSTOMER"
  | "AGENT"
  | "INTERNAL_NOTE"
  | "AI_SUGGESTION"
  | "SYSTEM";

export interface TicketMessage {
  id: string;
  content: string;
  type: MessageType;
  createdAt: string;
  readAt: string | null;
  sender: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
    role: string;
  } | null;
}

export interface Ticket {
  id: string;
  subject: string;
  description: string | null;
  status: TicketStatus;
  priority: TicketPriority;
  category: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  customer: {
    id: string;
    name: string;
    email: string;
    company?: string | null;
  };
  assignedAgent: {
    id: string;
    name: string;
    email: string;
    avatar?: string | null;
  } | null;
  messages?: TicketMessage[];
  _count?: { messages: number };
}

export interface TicketsListResponse {
  items: Ticket[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface WorkspaceStats {
  open: number;
  pending: number;
  inProgress: number;
  urgent: number;
  unassigned: number;
  mine: number;
  resolvedToday: number;
  active: number;
}

export interface CreateTicketRequest {
  customerId: string;
  subject: string;
  description?: string | null;
  priority?: TicketPriority;
  category?: string | null;
  tags?: string[];
  assignedAgentId?: string | null;
}

export interface UpdateTicketRequest {
  subject?: string;
  description?: string | null;
  status?: TicketStatus;
  priority?: TicketPriority;
  category?: string | null;
  tags?: string[];
  assignedAgentId?: string | null;
}

export const ticketsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getWorkspaceStats: builder.query<
      { success: boolean; data: WorkspaceStats },
      void
    >({
      query: () => "/tickets/stats/workspace",
      providesTags: ["Ticket"],
    }),
    getTickets: builder.query<
      { success: boolean; data: TicketsListResponse },
      {
        page?: number;
        limit?: number;
        search?: string;
        status?: string;
        priority?: string;
        unassigned?: string;
        assignedAgentId?: string;
        customerId?: string;
      }
    >({
      query: (params) => ({
        url: "/tickets",
        params,
      }),
      providesTags: ["Ticket"],
    }),
    getTicket: builder.query<{ success: boolean; data: Ticket }, string>({
      query: (id) => `/tickets/${id}`,
      providesTags: (_r, _e, id) => [{ type: "Ticket", id }],
    }),
    createTicket: builder.mutation<
      { success: boolean; data: Ticket },
      CreateTicketRequest
    >({
      query: (body) => ({
        url: "/tickets",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Ticket", "Customer"],
    }),
    updateTicket: builder.mutation<
      { success: boolean; data: Ticket },
      { id: string; body: UpdateTicketRequest }
    >({
      query: ({ id, body }) => ({
        url: `/tickets/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_r, _e, { id }) => ["Ticket", { type: "Ticket", id }],
    }),
    addMessage: builder.mutation<
      { success: boolean; data: TicketMessage },
      {
        ticketId: string;
        content: string;
        type?: "AGENT" | "INTERNAL_NOTE" | "CUSTOMER";
      }
    >({
      query: ({ ticketId, ...body }) => ({
        url: `/tickets/${ticketId}/messages`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_r, _e, { ticketId }) => [
        { type: "Ticket", id: ticketId },
        "Ticket",
      ],
    }),
  }),
});

export const {
  useGetWorkspaceStatsQuery,
  useGetTicketsQuery,
  useGetTicketQuery,
  useCreateTicketMutation,
  useUpdateTicketMutation,
  useAddMessageMutation,
} = ticketsApi;
