import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { keys } from "@/lib/query";
import { useApi } from "@/features/session/use-api";

export interface Profile {
  id: string;
  name: string;
  role: "student" | "parent" | "staff";
  /** ACC-9.7: show the "signed in on more than one device" prompt on this device. */
  secondDeviceNotice: boolean;
  /** Terms or privacy the person has not agreed to in their current version. */
  missingConsents: string[];
}

export interface Device {
  id: string;
  name: string;
  /** ISO time the device was last used. */
  lastSeenAt: string;
  isThisDevice: boolean;
}

const MOCK_PROFILE: Profile = {
  id: "demo",
  name: "Aarav",
  role: "student",
  secondDeviceNotice: true,
  missingConsents: [],
};

const ago = (ms: number) => new Date(Date.now() - ms).toISOString();
const DAY = 86_400_000;
const mockDevices = (): Device[] => [
  { id: "d1", name: "Redmi 12C", lastSeenAt: ago(0), isThisDevice: true },
  { id: "d2", name: "Samsung Galaxy A14", lastSeenAt: ago(DAY), isThisDevice: false },
  { id: "d3", name: "Tecno Spark 10", lastSeenAt: ago(3 * DAY), isThisDevice: false },
];

/** `/me` does not name the member type yet: a member with a date of birth is a student, without one a parent. */
const roleOf = (user: { account_kind: string; date_of_birth: string | null }): Profile["role"] =>
  user.account_kind === "staff" ? "staff" : user.date_of_birth ? "student" : "parent";

export function useProfile() {
  const api = useApi();
  return useQuery({
    queryKey: keys.me,
    staleTime: 60_000,
    queryFn: async (): Promise<Profile> => {
      if (!api) return MOCK_PROFILE;
      const { data } = await api.GET("/api/v1/me");
      const me = data?.data;
      if (!me) throw new Error("Empty /me response");
      return {
        id: me.user.id,
        name: me.user.name,
        role: roleOf(me.user),
        secondDeviceNotice: me.second_device_notice ?? false,
        missingConsents: me.missing_consents,
      };
    },
  });
}

export function useDevices() {
  const api = useApi();
  return useQuery({
    queryKey: keys.devices,
    staleTime: 30_000,
    queryFn: async (): Promise<Device[]> => {
      if (!api) return mockDevices();
      const { data } = await api.GET("/api/v1/me/devices");
      return (data?.data ?? []).map((d) => ({
        id: d.id,
        name: d.name,
        lastSeenAt: d.last_seen_at,
        isThisDevice: d.current,
      }));
    },
  });
}

export function useRemoveDevice() {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (api) {
        await api.DELETE("/api/v1/me/devices/{device_id}", {
          params: { path: { device_id: id } },
        });
      } else {
        queryClient.setQueryData<Device[]>(keys.devices, (list) =>
          list?.filter((d) => d.id !== id),
        );
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.devices }),
  });
}

/** ACC-9.7: remember that the "second device" notice was seen. */
export function useDismissSecondDevice() {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (api) {
        await api.PUT("/api/v1/me/prompts/{prompt}/dismiss", {
          params: { path: { prompt: "second_device" } },
        });
      }
    },
    onSuccess: () =>
      queryClient.setQueryData<Profile>(keys.me, (me) =>
        me ? { ...me, secondDeviceNotice: false } : me,
      ),
  });
}

export function useCloseAccount() {
  const api = useApi();
  return useMutation({
    mutationFn: async (password: string) => {
      if (api) await api.POST("/api/v1/me/close", { body: { password } });
    },
  });
}

export function useChangePassword() {
  const api = useApi();
  return useMutation({
    mutationFn: async (input: { currentPassword: string; newPassword: string }) => {
      if (api) {
        await api.POST("/api/v1/me/password", {
          body: { current_password: input.currentPassword, new_password: input.newPassword },
        });
      }
    },
  });
}
