import { router } from "expo-router";
import { useState } from "react";

import { Banner, Button, Header, Screen, Text } from "@/components/ui";
import { useRequestCode } from "@/features/auth/api";
import { errorMessage } from "@/lib/errors";
import { useLocale } from "@/lib/locale";

import { IdentifierField } from "./components/IdentifierField";
import { kindOf, maskContact } from "./rules";

export function ForgotScreen() {
  const { t, formatClock } = useLocale();
  const requestCode = useRequestCode();
  const [id, setId] = useState("");
  const [message, setMessage] = useState("");
  const send = () => {
    if (!id.trim()) return setMessage(t("forgot.needId"));
    const kind = kindOf(id);
    requestCode.mutate(
      { purpose: "reset", identifier: id },
      {
        onSuccess: () =>
          router.push({
            pathname: "/onboarding/code",
            params: {
              to: maskContact(id, kind),
              child: kind === "user" ? "1" : "0",
              next: "reset",
            },
          }),
      },
    );
  };
  return (
    <Screen
      scroll
      edges={["top", "bottom"]}
      footer={
        <Button title={t("forgot.send")} size="lg" loading={requestCode.isPending} onPress={send} />
      }
    >
      <Header title={t("forgot.title")} />
      <Text muted className="mb-4">
        {t("forgot.intro")}
      </Text>
      <IdentifierField
        label={t("auth.idLabel")}
        value={id}
        onChangeText={(v) => {
          setId(v);
          setMessage("");
          requestCode.reset();
        }}
      />
      {message || requestCode.error ? (
        <Banner tone="danger" className="mt-3">
          {message || errorMessage(requestCode.error, t, formatClock)}
        </Banner>
      ) : null}
    </Screen>
  );
}
