import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const api = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: "/api",
    credentials: "include",
  }),
  tagTypes: [
    "User",
    "Organization",
    "Ticket",
    "Customer",
    "Message",
    "KnowledgeArticle",
    "Analytics",
  ],
  endpoints: () => ({}),
});
