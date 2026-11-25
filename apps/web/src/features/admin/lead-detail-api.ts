"use client";

import { normalisePhone } from "@keoshaa/core";
import type { components } from "@keoshaa/api-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";

import { api } from "@/lib/api";

import { adminKeys, cursorPage, leadUpdateBody, requireData } from "./api";

type Schemas = components["schemas"];
type SchoolLead = Schemas["SchoolLeadRead"];

export interface StaffChoice {
  id: string;
  name: string;
}

const STAFF_LIMIT = 100;
const STAFF_STALE_MS = 5 * 60_000;

export function useStaffChoices() {
  return useQuery({
    queryKey: ["admin", "staff", "choices"],
    staleTime: STAFF_STALE_MS,
    queryFn: async (): Promise<StaffChoice[]> => {
      const { data } = await api.GET("/api/v1/users", {
        params: { query: { account_kind: "staff", limit: STAFF_LIMIT } },
      });
      return cursorPage(data).items.map((user) => ({ id: user.id, name: user.name }));
    },
  });
}

export function useAccountName(userId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: ["admin", "account", userId, "name"],
    enabled: enabled && userId !== null,
    staleTime: STAFF_STALE_MS,
    retry: false,
    queryFn: async () => {
      const { data } = await api.GET("/api/v1/users/{user_id}", {
        params: { path: { user_id: userId ?? "" } },
      });
      return requireData(data).name;
    },
  });
}

/** Creates the school from the lead, then links it; a retry after a failed link reuses the school. */
export function useCreateSchoolFromLead(lead: SchoolLead) {
  const queryClient = useQueryClient();
  const created = useRef<string | null>(null);
  return useMutation({
    mutationFn: async () => {
      if (!created.current) {
        const { data } = await api.POST("/api/v1/organisations", {
          body: {
            name: lead.school_name,
            kind: "school",
            contact_phone: normalisePhone(lead.phone),
            vat_registered: false,
          },
        });
        created.current = requireData(data).id;
        void queryClient.invalidateQueries({ queryKey: ["admin", "organisations"] });
      }
      const { data } = await api.PATCH("/api/v1/admin/school-leads/{lead_id}", {
        params: { path: { lead_id: lead.id } },
        body: leadUpdateBody(lead, { status: "won", organisation_id: created.current }),
      });
      return requireData(data);
    },
    onSuccess: (saved: SchoolLead) => {
      queryClient.setQueryData(adminKeys.lead(lead.id), saved);
      void queryClient.invalidateQueries({ queryKey: ["admin", "school-leads"] });
    },
  });
}
