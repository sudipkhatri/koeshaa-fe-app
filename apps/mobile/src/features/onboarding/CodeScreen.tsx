import { router } from "expo-router";
import { useEffect, useState } from "react";
import { View } from "react-native";

import {
  Banner,
  Button,
  Card,
  Header,
  LinkButton,
  Mascot,
  Screen,
  Text,
  TextField,
} from "@/components/ui";
import { useRequestCode, useVerifySignIn } from "@/features/auth/api";
import { useSession, type AuthStep } from "@/features/session";
import { isMockMode } from "@/lib/config";
import { errorMessage, retryAfterSeconds } from "@/lib/errors";
import { useLocale } from "@/lib/locale";
import { useToast } from "@/lib/toast";
import { isApiError } from "@keoshaa/core";

import { BackupCodes } from "./components/BackupCodes";
import { CodeInput } from "./components/CodeInput";
import { CODE_LENGTH, RESEND_SECONDS } from "./mock";

export type CodeNext = "signed-in" | "reset" | "signup";

interface CodeScreenProps {
  to: string;
  toParent: boolean;
  next: CodeNext;
  step?: AuthStep;
}

const RECOVERY_CODE_MIN = 6;
const RECOVERY_CODE_MAX = 20;

export function CodeScreen({ to, toParent, next, step = "code" }: CodeScreenProps) {
  const { t, formatClock } = useLocale();
  const session = useSession();
  const setupSecret = step === "mfa_setup" ? session.flow.setupSecret : null;
  const toast = useToast();
  const verifySignIn = useVerifySignIn();
  const requestCode = useRequestCode();
  const [code, setCode] = useState("");
  const [resendIn, setResendIn] = useState(RESEND_SECONDS);
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [recoveryCode, setRecoveryCode] = useState("");
  const [codesToSave, setCodesToSave] = useState<{ name: string; codes: string[] } | null>(null);
  const authenticator = step === "totp" || step === "mfa_setup";

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = setTimeout(() => setResendIn(resendIn - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendIn]);

  const openHome = (name: string) => {
    setCodesToSave(null);
    verifySignIn.reset();
    router.replace("/home");
    toast(t("auth.welcomeToast", { name }));
  };

  const verify = (entered: string) => {
    if (next === "signed-in") {
      if (verifySignIn.isPending) return;
      verifySignIn.mutate(entered, {
        onSuccess: (result) => {
          if (result.recoveryCodes.length > 0) {
            setCodesToSave({ name: result.name, codes: result.recoveryCodes });
            return;
          }
          openHome(result.name);
        },
        onError: () => {
          if (!recoveryMode) setCode("");
        },
      });
      return;
    }
    // Sign-up and reset codes are checked when the account is made or the password is reset.
    session.setFlow({ code: entered });
    router.replace(next === "reset" ? "/onboarding/new-password" : "/onboarding/signup-password");
  };

  const onCodeChange = (value: string) => {
    setCode(value);
    if (verifySignIn.isPending) return;
    verifySignIn.reset();
    if (value.length === CODE_LENGTH) verify(value);
  };

  const error = verifySignIn.error ?? requestCode.error;
  const message = error ? errorMessage(error, t, formatClock) : "";
  const expired = isApiError(verifySignIn.error, "CHALLENGE_EXPIRED");

  if (codesToSave) {
    return <BackupCodes codes={codesToSave.codes} onSaved={() => openHome(codesToSave.name)} />;
  }

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
  const title =
    step === "mfa_setup"
      ? t("auth.mfaTitle")
      : step === "totp"
        ? t("auth.totpTitle")
        : t("code.title");
  return (
    <Screen scroll edges={["top", "bottom"]}>
      <Header title={title} />
      {step === "totp" ? (
        <Text muted>{t("auth.totpBody")}</Text>
      ) : step === "mfa_setup" ? (
        <View className="gap-3">
          <Text muted>{t("auth.mfaBody")}</Text>
          {setupSecret ? (
            <Card>
              <Text variant="caption">{t("auth.mfaSecret")}</Text>
              <Text selectable variant="section" className="mt-1">
                {setupSecret}
              </Text>
              <Text variant="small" className="mt-2">
                {t("auth.mfaOnce")}
              </Text>
            </Card>
          ) : (
            <Banner tone="danger">{t("auth.mfaMissing")}</Banner>
          )}
        </View>
      ) : (
        <Text muted>
          {sentParts.before}
          <Text className="font-ui-bold text-text">{sentParts.target}</Text>
          {sentParts.after}
        </Text>
      )}
      {authenticator && recoveryMode ? (
        <View className="mt-4 gap-3">
          <TextField
            label={t("auth.recoveryCode")}
            hint={t("auth.recoveryCodeHint")}
            value={recoveryCode}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="off"
            maxLength={RECOVERY_CODE_MAX}
            onChangeText={(value) => {
              setRecoveryCode(value.replace(/\s/g, "").slice(0, RECOVERY_CODE_MAX));
              if (!verifySignIn.isPending) verifySignIn.reset();
            }}
          />
          <Button
            title={t("common.continue")}
            size="lg"
            loading={verifySignIn.isPending}
            disabled={recoveryCode.trim().length < RECOVERY_CODE_MIN}
            onPress={() => verify(recoveryCode.trim())}
          />
        </View>
      ) : (
        <CodeInput value={code} onChange={onCodeChange} />
      )}
      {message ? <Banner tone="danger">{message}</Banner> : null}
      {authenticator ? (
        <LinkButton
          title={recoveryMode ? t("auth.useAuthenticator") : t("auth.useRecoveryCode")}
          className="mt-4 self-center"
          onPress={() => {
            setRecoveryMode((current) => !current);
            setRecoveryCode("");
            setCode("");
            verifySignIn.reset();
          }}
        />
      ) : null}
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
              {
                onSuccess: () => toast(t("code.newCode")),
                onError: (requestError) => {
                  const wait = retryAfterSeconds(requestError);
                  if (wait > 0) setResendIn(wait);
                },
              },
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
