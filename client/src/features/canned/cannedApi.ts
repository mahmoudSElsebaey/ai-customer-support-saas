import { api } from "@/app/api";

export interface CannedResponse {
  id: string;
  title: string;
  content: string;
  shortcut: string | null;
  category: string | null;
  isActive: boolean;
  createdAt: string;
  author?: { id: string; name: string } | null;
}

export const cannedApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getCannedResponses: builder.query<
      { success: boolean; data: CannedResponse[] },
      void
    >({
      query: () => "/canned-responses",
      providesTags: ["CannedResponse"],
    }),
    createCannedResponse: builder.mutation<
      { success: boolean; data: CannedResponse },
      {
        title: string;
        content: string;
        shortcut?: string | null;
        category?: string | null;
      }
    >({
      query: (body) => ({
        url: "/canned-responses",
        method: "POST",
        body,
      }),
      invalidatesTags: ["CannedResponse"],
    }),
    deleteCannedResponse: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({
        url: `/canned-responses/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["CannedResponse"],
    }),
  }),
});

export const {
  useGetCannedResponsesQuery,
  useCreateCannedResponseMutation,
  useDeleteCannedResponseMutation,
} = cannedApi;
