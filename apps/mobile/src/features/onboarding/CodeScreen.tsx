import { router } from "expo-router";
import { useEffect, useState } from "react";
import { View } from "react-native";

import { Banner, Header, LinkButton, Mascot, Screen, Text, Button } from "@/components/ui";
import { useRequestCode, useVerifySignIn } from "@/features/auth/api";
import { useSession } from "@/features/session";
import { isMockMode } from "@/lib/config";
import { errorMessage } from "@/lib/errors";
import { useLocale } from "@/lib/locale";
import { useToast } from "@/lib/toast";
import { isApiError } from "@keoshaa/core";

import { CodeInput } from "./components/CodeInput";
import { CODE_LENGTH, RESEND_SECONDS } from "./mock";

export type CodeNext = "signed-in" | "reset" | "signup";

interface CodeScreenProps {
  to: string;
  toParent: boolean;
  next: CodeNext;
}

export function CodeScreen({ to, toParent, next }: CodeScreenProps) {
  const { t, formatClock } = useLocale();
  const session = useSession();
  const toast = useToast();
  const verifySignIn = useVerifySignIn();
  const requestCode = useRequestCode();
  const [code, setCode] = useState("");
  const [resendIn, setResendIn] = useState(RESEND_SECONDS);

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = setTimeout(() => setResendIn(resendIn - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendIn]);

  const verify = (entered: string) => {
    if (next === "signed-in") {
      verifySignIn.mutate(entered, {
        onSuccess: (name) => {
          router.replace("/home");
          toast(t("auth.welcomeToast", { name }));
        },
        onError: () => setCode(""),
      });
      return;
    }
    // Sign-up and reset codes are checked when the account is made or the password is reset.
    session.setFlow({ code: entered });
    router.replace(next === "reset" ? "/onboarding/new-password" : "/onboarding/signup-password");
  };

  const change = (value: string) => {
    setCode(value);
    verifySignIn.reset();
    if (value.length === CODE_LENGTH) verify(value);
  };

  const error = verifySignIn.error ?? requestCode.error;
  const message = error ? errorMessage(error, t, formatClock) : "";
  const expired = isApiError(verifySignIn.error, "CHALLENGE_EXPIRED");

  if (expired) {
    return (
      <Screen
        edges={["top", "bottom"]}
        footer={
          <Button
            title={t("common.back")}
            variant="secondary"
            size="lg"
            onPress={() => router.back()}
          />
        }
      >
        <Header title={t("code.verification")} />
        <View className="items-center gap-3 pt-4">
          <Mascot mood="sleepy" size={110} />
          <Text variant="headline" accessibilityRole="header" className="text-center">
            {t("code.rateTitle")}
          </Text>
          <Text muted className="text-center">
            {message}
          </Text>
        </View>
      </Screen>
    );
  }
  const target = toParent && (isMockMode() || !to) ? t("auth.parentPhone") : to;
  const [before = "", after = ""] = t("code.sent", { to: target }).split(target);
  const sentParts = { before, target, after };
  return (
    <Screen scroll edges={["top", "bottom"]}>
      <Header title={t("code.title")} />
      <Text muted>
        {sentParts.before}
        <Text className="font-ui-bold text-text">{sentParts.target}</Text>
        {sentParts.after}
      </Text>
      <CodeInput value={code} onChange={change} />
      {message ? <Banner tone="danger">{message}</Banner> : null}
      {next === "signed-in" && !isMockMode() ? null : (
        <LinkButton
          title={
            resendIn > 0 ? t("code.resendIn", { time: formatClock(resendIn) }) : t("code.resend")
          }
          disabled={resendIn > 0}
          className="mt-4 self-center"
          onPress={() => {
            setResendIn(RESEND_SECONDS);
            requestCode.mutate(
              {
                purpose: next === "reset" ? "reset" : "signup",
                identifier: session.flow.identifier,
              },
              { onSuccess: () => toast(t("code.newCode")) },
            );
          }}
        />
      )}
      {isMockMode() ? (
        <View className="mt-4 rounded-lg border-2 border-dashed border-border p-3">
          <Text variant="caption">{t("code.demo")}</Text>
        </View>
      ) : null}
    </Screen>
  );
}
