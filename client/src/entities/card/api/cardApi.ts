import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { Card, CardInput, ReviewResult } from "../model/types";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:14000";

export const cardApi = createApi({
  reducerPath: "cardApi",
  baseQuery: fetchBaseQuery({ baseUrl: API_URL }),
  tagTypes: ["Cards", "DueCards", "Tags"],
  endpoints: (builder) => ({
    listTags: builder.query<string[], void>({
      query: () => "/api/tags",
      providesTags: ["Tags"]
    }),
    listCards: builder.query<Card[], { dueOnly?: boolean; search?: string } | void>({
      query: (params) => ({
        url: "/api/cards",
        params: {
          ...(params?.dueOnly ? { dueOnly: true } : {}),
          ...(params?.search ? { search: params.search } : {})
        }
      }),
      providesTags: ["Cards"]
    }),
    dueCards: builder.query<Card[], void>({
      query: () => "/api/cards/due",
      providesTags: ["DueCards", "Cards"]
    }),
    createCard: builder.mutation<Card, CardInput>({
      query: (body) => ({
        url: "/api/cards",
        method: "POST",
        body
      }),
      invalidatesTags: ["Cards", "DueCards", "Tags"]
    }),
    updateCard: builder.mutation<Card, { id: string; input: CardInput }>({
      query: ({ id, input }) => ({
        url: `/api/cards/${id}`,
        method: "PUT",
        body: input
      }),
      invalidatesTags: ["Cards", "DueCards", "Tags"]
    }),
    deleteCard: builder.mutation<void, string>({
      query: (id) => ({
        url: `/api/cards/${id}`,
        method: "DELETE"
      }),
      invalidatesTags: ["Cards", "DueCards"]
    }),
    reviewCard: builder.mutation<Card, { id: string; result: ReviewResult }>({
      query: ({ id, result }) => ({
        url: `/api/cards/${id}/review`,
        method: "POST",
        body: { result }
      }),
      invalidatesTags: ["Cards", "DueCards"]
    }),
    resetCard: builder.mutation<Card, string>({
      query: (id) => ({
        url: `/api/cards/${id}/reset`,
        method: "POST"
      }),
      invalidatesTags: ["Cards", "DueCards"]
    })
  })
});

export const {
  useListTagsQuery,
  useListCardsQuery,
  useDueCardsQuery,
  useCreateCardMutation,
  useUpdateCardMutation,
  useDeleteCardMutation,
  useReviewCardMutation,
  useResetCardMutation
} = cardApi;
