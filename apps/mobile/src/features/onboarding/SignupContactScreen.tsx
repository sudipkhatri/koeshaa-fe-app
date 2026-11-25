import { normaliseIdentifier } from "@keoshaa/core";
import { router } from "expo-router";
import { useState } from "react";

import { Banner, Button, Header, Screen, Text, TextField } from "@/components/ui";
import { useRequestCode } from "@/features/auth/api";
import { useSession } from "@/features/session";
import { errorMessage, isNetworkError } from "@/lib/errors";
import { useLocale } from "@/lib/locale";

import { StepBar } from "./components/StepBar";
import { displayDestination, kindOf, maskContact } from "./rules";

export function SignupContactScreen() {
  const { t, formatClock } = useLocale();
  const requestCode = useRequestCode();
  const { signup, updateSignup } = useSession();
  const [message, setMessage] = useState("");
  const kind = kindOf(signup.contact);
  const send = () => {
    const normalised = normaliseIdentifier(signup.contact);
    if (!normalised || normalised.kind === "username") return setMessage(t("signup.contactError"));
    requestCode.mutate(
      { purpose: "signup", identifier: signup.contact },
      {
        onSuccess: (sent) =>
          router.push({
            pathname: "/onboarding/code",
            params: {
              to: displayDestination(sent.sentTo, maskContact(signup.contact, kind)),
              child: "0",
              next: "signup",
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
      <Header title={t("signup.title")} />
      <StepBar step={2} />
      <Text variant="headline" accessibilityRole="header" className="my-2">
        {t("signup.contactTitle")}
      </Text>
      <Text muted className="mb-3">
        {t("signup.contactIntro")}
      </Text>
      <TextField
        label={t("signup.contactLabel")}
        value={signup.contact}
        onChangeText={(contact) => {
          updateSignup({ contact });
          setMessage("");
          requestCode.reset();
        }}
        prefix={kind === "phone" ? "+977" : undefined}
        hint={
          kind === "phone"
            ? t("auth.kindPhone")
            : kind === "email"
              ? t("auth.kindEmail")
              : undefined
        }
        autoComplete="username"
      />
      {message || requestCode.error ? (
        <Banner tone="danger" className="mt-3">
          {message || errorMessage(requestCode.error, t, formatClock)}
        </Banner>
      ) : null}
    </Screen>
  );
}
