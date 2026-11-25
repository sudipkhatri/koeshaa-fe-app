import { useMutation } from "@tanstack/react-query";

import { useApi } from "@/features/session/use-api";
import { useSession } from "@/features/session";

import { identifierForApi, phoneForApi } from "./identifier";
import { apiError, requireAccessToken, signupFields } from "./request";

/** Parent sign-up. Children are added later; this call does not create one. */
export function useRegisterParent() {
  const api = useApi();
  const session = useSession();
  return useMutation({
    mutationFn: async () => {
      if (!api || !session.core) {
        await session.signIn(null);
        return;
      }
      const { signup, flow } = session;
      const { data } = await api.POST("/api/v1/auth/register/parent", {
        body: await signupFields(api, signup, flow.code, await session.core.getDeviceId()),
      });
      await session.signIn(requireAccessToken(data?.data.tokens));
      session.updateSignup({ password: "" });
    },
  });
}

/** Support call-back when the account has no phone or email. Does not sign anyone in. */
export function useRecoveryRequest() {
  const api = useApi();
  return useMutation({
    mutationFn: async (input: {
      name: string;
      callbackPhone: string;
      knownIdentifier: string;
      note: string;
    }) => {
      const knownIdentifier = input.knownIdentifier.trim();
      const note = input.note.trim();
      if (!api) return { reference: "DEMO" };
      const { data } = await api.POST("/api/v1/auth/recovery-requests", {
        body: {
          name: input.name.trim(),
          callback_phone: phoneForApi(input.callbackPhone),
          ...(knownIdentifier ? { known_identifier: identifierForApi(knownIdentifier) } : {}),
          ...(note ? { note } : {}),
        },
      });
      const reference = data?.data.reference;
      if (!reference) throw apiError(500, "HTTP_500");
      return { reference };
    },
  });
}
