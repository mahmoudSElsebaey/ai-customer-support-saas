import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";

const rawBaseQuery = fetchBaseQuery({
  baseUrl: "/api",
  credentials: "include",
});

let refreshRequest: Promise<boolean> | null = null;

const baseQueryWithRefresh: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await rawBaseQuery(args, api, extraOptions);
  const url = typeof args === "string" ? args : args.url;
  const canRefresh = !url.includes("/auth/");

  if (result.error?.status !== 401 || !canRefresh) {
    return result;
  }

  if (!refreshRequest) {
    refreshRequest = Promise.resolve(
      rawBaseQuery(
        { url: "/auth/refresh", method: "POST" },
        api,
        extraOptions
      )
    )
      .then((refreshResult) => !refreshResult.error)
      .finally(() => {
        refreshRequest = null;
      });
  }

  if (await refreshRequest) {
    result = await rawBaseQuery(args, api, extraOptions);
  }

  return result;
};

export const api = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithRefresh,
  tagTypes: [
    "User",
    "Organization",
    "Ticket",
    "Customer",
    "Message",
    "KnowledgeArticle",
    "CannedResponse",
    "Analytics",
  ],
  endpoints: () => ({}),
});
