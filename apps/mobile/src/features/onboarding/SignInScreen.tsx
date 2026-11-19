import { zodResolver } from "@hookform/resolvers/zod";
import { detectIdentifier, signInSchema } from "@keoshaa/core";
import type { SignInValues } from "@keoshaa/core";
import type { MessageKey } from "@keoshaa/i18n";
import { router } from "expo-router";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { View } from "react-native";

import {
  Banner,
  Button,
  Header,
  LinkButton,
  Mascot,
  Screen,
  Text,
  TextField,
} from "@/components/ui";
import { isLockedError, resetMockAuth, useSignIn } from "@/features/auth/api";
import { isMockMode } from "@/lib/config";
import { errorMessage, retryAfterSeconds } from "@/lib/errors";
import { useLocale } from "@/lib/locale";
import { useToast } from "@/lib/toast";

import { IdentifierField } from "./components/IdentifierField";
import { useCountdownUntil } from "./useCountdown";

/** The messages `signInSchema` can produce, as catalog keys. */
const fieldMessages: Record<string, MessageKey> = {
  "password.tooShort": "password.tooShort",
  "password.tooLong": "password.tooLong",
  "identifier.required": "identifier.required",
  "identifier.invalid": "identifier.invalid",
};

export function SignInScreen() {
  const { t, formatClock } = useLocale();
  const toast = useToast();
  const signIn = useSignIn();
  const [lockedUntil, setLockedUntil] = useState(0);
  const secondsLeft = useCountdownUntil(lockedUntil);
  const { control, handleSubmit } = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { identifier: "", password: "" },
  });

  const submit = handleSubmit((values) => {
    signIn.mutate(values, {
      onSuccess: (result) => {
        if (result.kind === "signedIn") {
          router.replace("/home");
          toast(t("auth.welcomeToast", { name: result.name }));
        } else {
          router.push({
            pathname: "/onboarding/code",
            params: {
              to: result.sentTo,
              child: detectIdentifier(values.identifier) === "username" ? "1" : "0",
              next: "signed-in",
            },
          });
        }
      },
      onError: (error) => {
        const wait = retryAfterSeconds(error);
        if (wait > 0 && isLockedError(error)) setLockedUntil(Date.now() + wait * 1000);
      },
    });
  });

  if (secondsLeft > 0) {
    return (
      <Screen
        edges={["top", "bottom"]}
        footer={
          isMockMode() ? (
            <Button
              title={t("auth.skipWait")}
              variant="secondary"
              size="lg"
              onPress={() => {
                resetMockAuth();
                setLockedUntil(0);
              }}
            />
          ) : undefined
        }
      >
        <Header title={t("auth.signIn")} />
        <View className="items-center gap-3 pt-4">
          <Mascot mood="sleepy" size={110} />
          <Text variant="headline" accessibilityRole="header" className="text-center">
            {t("auth.lockTitle")}
          </Text>
          <Text muted className="text-center">
            {t("auth.lockBody")}
          </Text>
          <Text
            variant="display"
            accessibilityLabel={t("auth.lockTimer", { time: formatClock(secondsLeft) })}
          >
            {formatClock(secondsLeft)}
          </Text>
          <LinkButton
            title={t("auth.forgotInstead")}
            onPress={() => router.push("/onboarding/forgot")}
          />
        </View>
      </Screen>
    );
  }

  const fieldError = (message?: string) => {
    const key = message ? fieldMessages[message] : undefined;
    return key ? t(key) : undefined;
  };

  return (
    <Screen
      scroll
      edges={["top", "bottom"]}
      footer={
        <Button title={t("auth.signIn")} size="lg" loading={signIn.isPending} onPress={submit} />
      }
    >
      <Header title={t("auth.welcomeBack")} />
      <View className="gap-4 pt-2">
        <Controller
          control={control}
          name="identifier"
          render={({ field, fieldState }) => (
            <IdentifierField
              label={t("auth.idLabel")}
              value={field.value}
              onChangeText={(v) => {
                field.onChange(v);
                signIn.reset();
              }}
              error={fieldError(fieldState.error?.message)}
            />
          )}
        />
        <Controller
          control={control}
          name="password"
          render={({ field, fieldState }) => (
            <TextField
              label={t("auth.passwordLabel")}
              secureTextEntry
              value={field.value}
              onChangeText={(v) => {
                field.onChange(v);
                signIn.reset();
              }}
              autoComplete="current-password"
              onSubmitEditing={submit}
              error={fieldError(fieldState.error?.message)}
            />
          )}
        />
        {signIn.error ? (
          <Banner tone="danger">{errorMessage(signIn.error, t, formatClock)}</Banner>
        ) : null}
        <LinkButton
          title={t("auth.forgotLink")}
          className="-mt-2 self-start"
          onPress={() => router.push("/onboarding/forgot")}
        />
        {isMockMode() ? (
          <View className="rounded-lg border-2 border-dashed border-border p-3">
            <Text variant="caption">{t("auth.demoSignIn")}</Text>
          </View>
        ) : null}
      </View>
    </Screen>
  );
}
