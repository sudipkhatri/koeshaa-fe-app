import { normaliseIdentifier } from "@keoshaa/core";
import { router } from "expo-router";
import { useState } from "react";

import { Banner, Button, Header, LinkButton, Screen, Text } from "@/components/ui";
import { useRequestCode } from "@/features/auth/api";
import { errorMessage, isNetworkError } from "@/lib/errors";
import { useLocale } from "@/lib/locale";

import { IdentifierField } from "./components/IdentifierField";
import { displayDestination, kindOf, maskContact } from "./rules";

export function ForgotScreen() {
  const { t, formatClock } = useLocale();
  const requestCode = useRequestCode();
  const [id, setId] = useState("");
  const [message, setMessage] = useState("");
  const send = () => {
    if (!id.trim()) return setMessage(t("forgot.needId"));
    if (!normaliseIdentifier(id)) return setMessage(t("identifier.invalid"));
    const kind = kindOf(id);
    requestCode.mutate(
      { purpose: "reset", identifier: id },
      {
        onSuccess: (sent) =>
          router.push({
            pathname: "/onboarding/code",
            params: {
              to: displayDestination(sent.sentTo, maskContact(id, kind)),
              child: kind === "user" ? "1" : "0",
              next: "reset",
              step: "code",
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
        <Button
          title={isNetworkError(requestCode.error) ? t("common.noConnection") : t("forgot.send")}
          size="lg"
          loading={requestCode.isPending}
          onPress={send}
        />
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
      <LinkButton
        title={t("forgot.recoveryLink")}
        className="mt-4 self-start"
        onPress={() => router.push("/onboarding/recovery")}
      />
    </Screen>
  );
}
