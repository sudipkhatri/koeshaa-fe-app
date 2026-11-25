"use client";

import type { components } from "@keoshaa/api-client";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api";

import { requireData } from "./api";
import { contentKeys } from "./content-api";

type Created = components["schemas"]["CreatedRead"];

export interface CreatedItem {
  created: Created;
  reviewClosed: boolean;
}

async function closeReview(reviewId: string): Promise<void> {
  await api.POST("/api/v1/content/reviews/{review_id}/submit", {
    params: { path: { review_id: reviewId } },
  });
  await api.POST("/api/v1/content/reviews/{review_id}/decision", {
    params: { path: { review_id: reviewId } },
    body: { decision: "approved" },
  });
}

async function finish(body: { data: Created } | undefined): Promise<CreatedItem> {
  const created = requireData(body);
  try {
    await closeReview(created.review_id);
    return { created, reviewClosed: true };
  } catch {
    return { created, reviewClosed: false };
  }
}

export function useCreateChapter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: components["schemas"]["ChapterCreate"]) => {
      const { data } = await api.POST("/api/v1/content/chapters", { body });
      return finish(data);
    },
    onSuccess: (_result, body) => {
      void queryClient.invalidateQueries({ queryKey: contentKeys.releases(body.subject_id) });
    },
  });
}

export function useCreateTopic() {
  return useMutation({
    mutationFn: async (body: components["schemas"]["TopicCreate"]) => {
      const { data } = await api.POST("/api/v1/content/topics", { body });
      return finish(data);
    },
  });
}

export function useCreateIdea() {
  return useMutation({
    mutationFn: async (body: components["schemas"]["ConceptCreate"]) => {
      const { data } = await api.POST("/api/v1/content/concepts", { body });
      return finish(data);
    },
  });
}

export function useCreateQuestion() {
  return useMutation({
    mutationFn: async (body: components["schemas"]["QuestionCreate"]) => {
      const { data } = await api.POST("/api/v1/content/questions", { body });
      return finish(data);
    },
  });
}
