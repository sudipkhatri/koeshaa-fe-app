"use client";

import type { components } from "@keoshaa/api-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api";

import { LIST_STALE_MS, requireData } from "./api";

type PoolVersion = components["schemas"]["PoolVersionRead"];
type PoolItem = components["schemas"]["PoolItem"];
type Pagination =
  components["schemas"]["OffsetPagination"] | components["schemas"]["CursorPagination"] | null;

export type PoolKind = PoolItem["kind"];

export interface PoolChange {
  added: string[];
  removed: string[];
  moved: string[];
  pickFrom: number | null;
  pickTo: number;
}

export const poolKeys = {
  versions: (grade: string, stream: string) =>
    ["admin", "pools", "versions", grade, stream] as const,
  published: (grade: string, stream: string) =>
    ["admin", "pools", "published", grade, stream] as const,
};

const PAGE_CAP = 500;

function readPage<T>(body: { data: T[]; meta?: { pagination?: Pagination } } | undefined): {
  items: T[];
  total: number;
} {
  const envelope = requireData(body ? { data: body } : undefined);
  const pagination = envelope.meta?.pagination;
  const total = pagination && "total" in pagination ? pagination.total : envelope.data.length;
  return { items: envelope.data, total };
}

async function collectVersions(
  grade: string,
  stream: string,
  published: boolean | undefined,
): Promise<PoolVersion[]> {
  const found: PoolVersion[] = [];
  const limit = 100;
  for (let offset = 0; offset < PAGE_CAP; offset += limit) {
    const { data } = await api.GET("/api/v1/curriculum/pool-versions", {
      params: {
        query: {
          limit,
          offset,
          ...(published === undefined ? {} : { published }),
          ...(grade !== "all" ? { grade_level_id: grade } : {}),
          ...(stream !== "" && stream !== "all" ? { stream_id: stream } : {}),
        },
      },
    });
    const page = readPage<PoolVersion>(data);
    found.push(...page.items);
    if (found.length >= page.total || page.items.length < limit) break;
  }
  return found;
}

export function usePoolVersions(grade: string, stream: string) {
  return useQuery({
    queryKey: poolKeys.versions(grade, stream),
    enabled: grade !== "" && grade !== "all",
    staleTime: LIST_STALE_MS,
    queryFn: () => collectVersions(grade, stream, undefined),
  });
}

export function usePublishedPools(grade: string, stream: string) {
  return useQuery({
    queryKey: poolKeys.published(grade, stream),
    enabled: grade !== "",
    staleTime: LIST_STALE_MS,
    queryFn: () => collectVersions(grade, stream, true),
  });
}

function refreshPools(queryClient: ReturnType<typeof useQueryClient>) {
  return () => {
    void queryClient.invalidateQueries({ queryKey: ["admin", "pools"] });
  };
}

export function useCreatePoolVersion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      gradeId: string;
      streamId: string | null;
      optionalRequired: number;
      items: PoolItem[];
    }): Promise<PoolVersion> => {
      const { data } = await api.POST("/api/v1/curriculum/pool-versions", {
        body: {
          grade_level_id: input.gradeId,
          stream_id: input.streamId,
          optional_required: input.optionalRequired,
          items: input.items,
        },
      });
      return requireData(data);
    },
    onSuccess: refreshPools(queryClient),
  });
}

export function useUpdatePoolDraft(versionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (optionalRequired: number): Promise<PoolVersion> => {
      const { data } = await api.PATCH("/api/v1/curriculum/pool-versions/{version_id}", {
        params: { path: { version_id: versionId } },
        body: { optional_required: optionalRequired },
      });
      return requireData(data);
    },
    onSuccess: refreshPools(queryClient),
  });
}

export function usePutPoolItem(versionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (item: PoolItem): Promise<PoolVersion> => {
      const { data } = await api.PUT("/api/v1/curriculum/pool-versions/{version_id}/items", {
        params: { path: { version_id: versionId } },
        body: item,
      });
      return requireData(data);
    },
    onSuccess: refreshPools(queryClient),
  });
}

export function useRemovePoolItem(versionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (subjectId: string): Promise<void> => {
      const { data } = await api.DELETE(
        "/api/v1/curriculum/pool-versions/{version_id}/items/{subject_id}",
        { params: { path: { version_id: versionId, subject_id: subjectId } } },
      );
      requireData(data);
    },
    onSuccess: refreshPools(queryClient),
  });
}

export function usePublishPool(versionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (): Promise<PoolVersion> => {
      const { data } = await api.POST("/api/v1/curriculum/pool-versions/{version_id}/publish", {
        params: { path: { version_id: versionId } },
      });
      return requireData(data);
    },
    onSuccess: refreshPools(queryClient),
  });
}

export function draftVersion(versions: PoolVersion[]): PoolVersion | null {
  return versions.find((version) => version.published_at === null) ?? null;
}

export function liveVersion(versions: PoolVersion[]): PoolVersion | null {
  return (
    versions
      .filter((version) => version.published_at !== null)
      .sort((left, right) => right.version - left.version)[0] ?? null
  );
}

export function membership(
  versions: PoolVersion[],
  subject: Pick<SubjectGrade, "id" | "grade_level_id" | "stream_id">,
): PoolKind | null {
  const live = versions
    .filter(
      (version) =>
        version.published_at !== null &&
        version.grade_level_id === subject.grade_level_id &&
        (version.stream_id ?? null) === (subject.stream_id ?? null),
    )
    .sort((left, right) => right.version - left.version)[0];
  return live?.items.find((item) => item.subject_id === subject.id)?.kind ?? null;
}

interface SubjectGrade {
  id: string;
  grade_level_id: string;
  stream_id: string | null;
}

export function poolChange(
  draft: Pick<PoolVersion, "items" | "optional_required">,
  live: Pick<PoolVersion, "items" | "optional_required"> | null,
): PoolChange {
  const draftKinds = new Map(draft.items.map((item) => [item.subject_id, item.kind]));
  if (!live) {
    return {
      added: [...draftKinds.keys()],
      removed: [],
      moved: [],
      pickFrom: null,
      pickTo: draft.optional_required,
    };
  }
  const liveKinds = new Map(live.items.map((item) => [item.subject_id, item.kind]));
  return {
    added: [...draftKinds.keys()].filter((id) => !liveKinds.has(id)),
    removed: [...liveKinds.keys()].filter((id) => !draftKinds.has(id)),
    moved: [...draftKinds.keys()].filter(
      (id) => liveKinds.has(id) && liveKinds.get(id) !== draftKinds.get(id),
    ),
    pickFrom: live.optional_required,
    pickTo: draft.optional_required,
  };
}

export type { PoolItem, PoolVersion };
