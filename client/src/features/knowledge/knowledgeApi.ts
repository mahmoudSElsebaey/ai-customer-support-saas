import { api } from "@/app/api";

export type ArticleStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export interface KnowledgeArticle {
  id: string;
  title: string;
  content?: string;
  excerpt: string | null;
  category: string | null;
  tags: string[];
  status: ArticleStatus;
  authorId: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  author?: { id: string; name: string; email?: string } | null;
}

export interface ArticlesListResponse {
  items: KnowledgeArticle[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateArticleRequest {
  title: string;
  content: string;
  excerpt?: string | null;
  category?: string | null;
  tags?: string[];
  status?: ArticleStatus;
}

export const knowledgeApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getArticles: builder.query<
      { success: boolean; data: ArticlesListResponse },
      {
        page?: number;
        limit?: number;
        search?: string;
        status?: string;
        category?: string;
        tag?: string;
      }
    >({
      query: (params) => ({
        url: "/knowledge",
        params,
      }),
      providesTags: ["KnowledgeArticle"],
    }),
    getArticle: builder.query<
      { success: boolean; data: KnowledgeArticle },
      string
    >({
      query: (id) => `/knowledge/${id}`,
      providesTags: (_r, _e, id) => [{ type: "KnowledgeArticle", id }],
    }),
    getCategories: builder.query<{ success: boolean; data: string[] }, void>({
      query: () => "/knowledge/categories",
      providesTags: ["KnowledgeArticle"],
    }),
    createArticle: builder.mutation<
      { success: boolean; data: KnowledgeArticle },
      CreateArticleRequest
    >({
      query: (body) => ({
        url: "/knowledge",
        method: "POST",
        body,
      }),
      invalidatesTags: ["KnowledgeArticle"],
    }),
    updateArticle: builder.mutation<
      { success: boolean; data: KnowledgeArticle },
      { id: string; body: Partial<CreateArticleRequest> }
    >({
      query: ({ id, body }) => ({
        url: `/knowledge/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_r, _e, { id }) => [
        "KnowledgeArticle",
        { type: "KnowledgeArticle", id },
      ],
    }),
    deleteArticle: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({
        url: `/knowledge/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["KnowledgeArticle"],
    }),
  }),
});

export const {
  useGetArticlesQuery,
  useGetArticleQuery,
  useGetCategoriesQuery,
  useCreateArticleMutation,
  useUpdateArticleMutation,
  useDeleteArticleMutation,
} = knowledgeApi;
