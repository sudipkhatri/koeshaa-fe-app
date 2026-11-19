import type { ReactNode } from "react";
import { router } from "expo-router";
import type { Href } from "expo-router";
import { useState } from "react";

import { Banner, Button, Header, LinkButton, Screen, Text, TextField } from "@/components/ui";
import { useResetPassword } from "@/features/auth/api";
import { errorMessage } from "@/lib/errors";
import { useLocale } from "@/lib/locale";

import { PasswordMeter } from "./components/PasswordMeter";
import { MIN_PASSWORD_LENGTH } from "./rules";

interface NewPasswordScreenProps {
  title: string;
  intro: string;
  label: string;
  actionLabel: string;
  onDone: (password: string) => void;
  step?: ReactNode;
  busy?: boolean;
  /** Where "Get a new code" goes. */
  restartHref?: Href;
  /** A failed request to show above the button, with a way back to get a new code. */
  error?: unknown;
}

/** Password field with the strength meter; used for reset and for creating an account. */
export function PasswordStep({
  title,
  intro,
  label,
  actionLabel,
  onDone,
  step,
  busy,
  error,
  restartHref = "/onboarding/forgot",
}: NewPasswordScreenProps) {
  const { t, formatClock } = useLocale();
  const [password, setPassword] = useState("");
  return (
    <Screen
      scroll
      edges={["top", "bottom"]}
      footer={
        <Button
          title={actionLabel}
          size="lg"
          disabled={password.length < MIN_PASSWORD_LENGTH}
          loading={busy ?? false}
          onPress={() => onDone(password)}
        />
      }
    >
      <Header title={title} />
      {step}
      <Text muted className="my-3">
        {intro}
      </Text>
      <TextField
        label={label}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        autoComplete="new-password"
      />
      <PasswordMeter value={password} />
      {error ? (
        <>
          <Banner tone="danger" className="mt-3">
            {errorMessage(error, t, formatClock)}
          </Banner>
          <LinkButton
            title={t("code.getNew")}
            className="mt-2 self-start"
            onPress={() => router.replace(restartHref)}
          />
        </>
      ) : null}
    </Screen>
  );
}

export function NewPasswordScreen() {
  const { t } = useLocale();
  const reset = useResetPassword();
  return (
    <PasswordStep
      title={t("forgot.newTitle")}
      intro={t("forgot.newIntro")}
      label={t("password.newLabel")}
      actionLabel={t("forgot.save")}
      busy={reset.isPending}
      error={reset.error}
      onDone={(password) =>
        reset.mutate(password, { onSuccess: () => router.replace("/onboarding/password-changed") })
      }
    />
  );
}
