import { api } from "@/app/api";

export interface User {
  id: string;
  name: string;
  email: string;
  role: "OWNER" | "ADMIN" | "MANAGER" | "AGENT" | "CUSTOMER";
  organizationId: string;
  avatar: string | null;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: "FREE" | "PRO" | "BUSINESS";
  logo?: string | null;
}

export interface AuthResponse {
  user: User;
  organization: Organization;
}

export interface MeResponse extends User {
  organization: Organization;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  organizationName: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export const authApi = api.injectEndpoints({
  endpoints: (builder) => ({
    register: builder.mutation<{ success: boolean; data: AuthResponse }, RegisterRequest>({
      query: (body) => ({
        url: "/auth/register",
        method: "POST",
        body,
      }),
      invalidatesTags: ["User"],
    }),
    login: builder.mutation<{ success: boolean; data: AuthResponse }, LoginRequest>({
      query: (body) => ({
        url: "/auth/login",
        method: "POST",
        body,
      }),
      invalidatesTags: ["User"],
    }),
    logout: builder.mutation<{ success: boolean }, void>({
      query: () => ({
        url: "/auth/logout",
        method: "POST",
      }),
      invalidatesTags: ["User"],
    }),
    me: builder.query<{ success: boolean; data: MeResponse }, void>({
      query: () => "/auth/me",
      providesTags: ["User"],
    }),
    refresh: builder.mutation<{ success: boolean; data: AuthResponse }, void>({
      query: () => ({
        url: "/auth/refresh",
        method: "POST",
      }),
    }),
  }),
});

export const {
  useRegisterMutation,
  useLoginMutation,
  useLogoutMutation,
  useMeQuery,
  useRefreshMutation,
} = authApi;
