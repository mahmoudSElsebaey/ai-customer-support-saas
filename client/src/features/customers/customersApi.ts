import { api } from "@/app/api";

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  status: string;
  tags: string[];
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: { tickets: number };
  tickets?: Array<{
    id: string;
    subject: string;
    status: string;
    priority: string;
    createdAt: string;
  }>;
}

export interface CustomersListResponse {
  items: Customer[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateCustomerRequest {
  name: string;
  email: string;
  phone?: string | null;
  company?: string | null;
  tags?: string[];
  notes?: string | null;
  status?: "active" | "inactive";
}

export const customersApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getCustomers: builder.query<
      { success: boolean; data: CustomersListResponse },
      { page?: number; limit?: number; search?: string; status?: string }
    >({
      query: (params) => ({
        url: "/customers",
        params,
      }),
      providesTags: ["Customer"],
    }),
    getCustomer: builder.query<{ success: boolean; data: Customer }, string>({
      query: (id) => `/customers/${id}`,
      providesTags: (_r, _e, id) => [{ type: "Customer", id }],
    }),
    createCustomer: builder.mutation<
      { success: boolean; data: Customer },
      CreateCustomerRequest
    >({
      query: (body) => ({
        url: "/customers",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Customer"],
    }),
    updateCustomer: builder.mutation<
      { success: boolean; data: Customer },
      { id: string; body: Partial<CreateCustomerRequest> }
    >({
      query: ({ id, body }) => ({
        url: `/customers/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_r, _e, { id }) => [
        "Customer",
        { type: "Customer", id },
      ],
    }),
    deleteCustomer: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({
        url: `/customers/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Customer"],
    }),
  }),
});

export const {
  useGetCustomersQuery,
  useGetCustomerQuery,
  useCreateCustomerMutation,
  useUpdateCustomerMutation,
  useDeleteCustomerMutation,
} = customersApi;
