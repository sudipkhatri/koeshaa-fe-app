"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { components } from "@keoshaa/api-client";
import { codeSchema, signInSchema, type SignInValues } from "@keoshaa/core";
import type { MessageKey } from "@keoshaa/i18n";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/Button";
import { LocaleSwitch } from "@/components/ui/LocaleSwitch";
import { Mark } from "@/components/ui/Mark";
import { TextField } from "@/components/ui/TextField";
import { fieldText, recordFormFailure } from "@/lib/form-errors";
import { useMessages } from "@/lib/locale";

import { acceptTokens, requestSignIn, verifySignIn } from "./api";
import { AuthenticatorKey } from "./AuthenticatorQr";
import { ForgotPasswordPanel } from "./ForgotPasswordPanel";
import { RecoveryCodes } from "./RecoveryCodes";

type ChallengeRead = components["schemas"]["ChallengeRead"];
type SignInStep = ChallengeRead["step"] | "password" | "recovery" | "forgot";

const deviceCodeSchema = z.object({ code: codeSchema });
const authenticatorCodeSchema = z.object({
  code: z
    .string()
    .trim()
    .min(6, { error: "admin.authenticatorCode" })
    .max(20, { error: "admin.authenticatorCode" }),
});

export function SignInScreen({ onSignedIn }: { onSignedIn: () => void }) {
  const { locale, translate } = useMessages();
  const [challenge, setChallenge] = useState<ChallengeRead | null>(null);
  const [recoveryCodes, setRecoveryCodes] = useState<readonly string[] | null>(null);
  const [forgot, setForgot] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const signInForm = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { identifier: "", password: "" },
  });
  const codeForm = useForm<{ code: string }>({
    resolver: zodResolver(challenge?.step === "code" ? deviceCodeSchema : authenticatorCodeSchema),
    defaultValues: { code: "" },
  });
  const step: SignInStep = forgot
    ? "forgot"
    : recoveryCodes
      ? "recovery"
      : (challenge?.step ?? "password");

  function completeSignIn(result: components["schemas"]["SignInRead"]) {
    const codes = result.tokens?.recovery_codes?.filter((code) => code.length > 0) ?? [];
    if (result.tokens?.access_token) {
      acceptTokens(result.tokens);
      setChallenge(null);
      if (codes.length > 0) {
        setRecoveryCodes(codes);
        return;
      }
      onSignedIn();
      return;
    }
    if (result.challenge) {
      signInForm.reset({ identifier: signInForm.getValues("identifier"), password: "" });
      setChallenge(result.challenge);
      codeForm.reset({ code: "" });
    }
  }

  async function submitPassword(values: SignInValues) {
    try {
      completeSignIn(await requestSignIn(values));
    } catch (error) {
      recordFormFailure(error, signInForm.setError, translate, locale);
    }
  }

  async function submitCode(values: { code: string }) {
    if (!challenge) return;
    try {
      completeSignIn(await verifySignIn(challenge.challenge, values.code.trim()));
    } catch (error) {
      recordFormFailure(error, codeForm.setError, translate, locale);
    }
  }

  const signInOffline = signInForm.formState.errors.root?.type === "offline";
  const codeOffline = codeForm.formState.errors.root?.type === "offline";
  const aside = asideCopy(step);

  return (
    <main className="flex min-h-dvh flex-wrap bg-canvas text-text">
      <section className="flex min-w-0 flex-1 basis-80 flex-col justify-between gap-10 bg-primary px-6 py-10 text-on-primary sm:px-10 sm:py-14 lg:basis-96">
        <p className="flex items-center gap-2 text-lg font-bold">
          <Mark tone="inverse" />
          {translate("app.name")}
        </p>
        <div className="flex max-w-xs flex-col gap-4">
          <h1 className="text-4xl font-bold tracking-tight">{translate(aside.title)}</h1>
          <p className="text-base text-on-primary/80">{translate(aside.body)}</p>
        </div>
        {step === "password" ? (
          <p>
            <span className="block text-2xl font-bold">{translate("auth.staffAsideRange")}</span>
            <span className="text-sm text-on-primary/80">
              {translate("auth.staffAsideRangeNote")}
            </span>
          </p>
        ) : (
          <p className="text-sm text-on-primary/80">{translate(aside.note)}</p>
        )}
      </section>
      <section className="flex min-w-0 flex-1 basis-80 flex-col items-center justify-center gap-6 bg-mist px-4 py-10 sm:px-6 sm:py-14 lg:basis-96">
        {step === "password" || step === "forgot" ? (
          <div className="flex w-full max-w-md justify-end">
            <LocaleSwitch variant="panel" />
          </div>
        ) : null}
        {step === "code" ? (
          <div className="w-full max-w-md">
            <button
              type="button"
              className="inline-flex min-h-12 cursor-pointer items-center text-sm font-semibold text-primary"
              onClick={() => setChallenge(null)}
            >
              {translate("auth.backToSignIn")}
            </button>
          </div>
        ) : null}
        {recoveryCodes ? (
          <RecoveryCodes codes={recoveryCodes} onSaved={onSignedIn} />
        ) : forgot ? (
          <ForgotPasswordPanel
            initialIdentifier={signInForm.getValues("identifier")}
            onCancel={() => setForgot(false)}
            onDone={(identifier) => {
              signInForm.reset({ identifier, password: "" });
              setForgot(false);
            }}
          />
        ) : (
          <div className="flex w-full max-w-md flex-col gap-5 rounded-2xl border border-line bg-canvas p-5 shadow-card sm:p-8">
            <div className="flex flex-col gap-1">
              <h2 className="text-2xl font-semibold">{translate(cardTitle(step))}</h2>
              {step === "code" && !challenge?.sent_to ? null : (
                <p className="text-ink-soft">
                  {translate(cardBody(step), cardBodyValues(challenge))}
                </p>
              )}
            </div>
            {challenge ? (
              <form className="flex flex-col gap-4" onSubmit={codeForm.handleSubmit(submitCode)}>
                {challenge.step === "mfa_setup" && challenge.authenticator_secret ? (
                  <AuthenticatorKey
                    secret={challenge.authenticator_secret}
                    uri={challenge.authenticator_uri}
                  />
                ) : null}
                <TextField
                  label={translate("admin.codeLabel")}
                  autoComplete="one-time-code"
                  inputMode={challenge.step === "code" ? "numeric" : "text"}
                  error={fieldText(codeForm.formState.errors.code?.message, translate)}
                  {...codeForm.register("code")}
                />
                {codeForm.formState.errors.root?.message ? (
                  <p role="alert">{codeForm.formState.errors.root.message}</p>
                ) : null}
                <Button type="submit" pending={codeForm.formState.isSubmitting}>
                  {codeOffline
                    ? translate("common.noConnection")
                    : translate(challenge.step === "mfa_setup" ? "auth.mfaVerify" : "admin.verify")}
                </Button>
              </form>
            ) : (
              <form
                className="flex flex-col gap-4"
                onSubmit={signInForm.handleSubmit(submitPassword)}
              >
                <TextField
                  label={translate("auth.idLabel")}
                  autoComplete="username"
                  error={fieldText(signInForm.formState.errors.identifier?.message, translate)}
                  {...signInForm.register("identifier")}
                />
                <TextField
                  label={translate("auth.passwordLabel")}
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  error={fieldText(signInForm.formState.errors.password?.message, translate)}
                  trailing={
                    <button
                      type="button"
                      className="inline-flex size-12 cursor-pointer items-center justify-center rounded-lg text-ink-soft"
                      aria-label={translate(showPassword ? "ui.hidePassword" : "ui.showPassword")}
                      onClick={() => setShowPassword((current) => !current)}
                    >
                      <EyeIcon hidden={showPassword} />
                    </button>
                  }
                  {...signInForm.register("password")}
                />
                {signInForm.formState.errors.root?.message ? (
                  <p role="alert">{signInForm.formState.errors.root.message}</p>
                ) : null}
                <Button type="submit" pending={signInForm.formState.isSubmitting}>
                  {signInOffline ? translate("common.noConnection") : translate("auth.signIn")}
                </Button>
                <button
                  type="button"
                  className="inline-flex min-h-12 cursor-pointer items-center justify-start text-sm font-semibold text-primary"
                  onClick={() => setForgot(true)}
                >
                  {translate("auth.forgotLink")}
                </button>
                <p className="border-t border-line pt-3 text-sm text-ink-soft">
                  {translate("auth.staffFoot")}
                </p>
              </form>
            )}
          </div>
        )}
        {step === "password" || step === "code" ? (
          <p className="text-center text-sm text-ink-soft">
            <Link className="font-semibold text-primary" href="/schools">
              {translate("auth.askCallback")}
            </Link>
          </p>
        ) : null}
      </section>
    </main>
  );
}

function asideCopy(step: SignInStep): { title: MessageKey; body: MessageKey; note: MessageKey } {
  if (step === "code") {
    return {
      title: "auth.codeAsideTitle",
      body: "auth.codeAsideBody",
      note: "auth.codeAsideNote",
    };
  }
  if (step === "forgot") {
    return {
      title: "forgot.title",
      body: "forgot.intro",
      note: "auth.codeAsideNote",
    };
  }
  if (step === "mfa_setup" || step === "totp" || step === "recovery") {
    return {
      title: "auth.mfaAsideTitle",
      body: "auth.mfaAsideBody",
      note: "auth.mfaAsideNote",
    };
  }
  return {
    title: "auth.staffAsideTitle",
    body: "auth.staffAsideBody",
    note: "auth.staffAsideRange",
  };
}

function cardTitle(step: SignInStep): MessageKey {
  if (step === "mfa_setup") return "auth.mfaTitle";
  if (step === "totp") return "auth.totpTitle";
  if (step === "code") return "code.title";
  return "auth.welcomeBack";
}

function cardBody(step: SignInStep): MessageKey {
  if (step === "mfa_setup") return "auth.mfaBody";
  if (step === "totp") return "auth.totpBody";
  if (step === "code") return "code.sent";
  return "auth.staffSignInHint";
}

function cardBodyValues(challenge: ChallengeRead | null): { to: string } | undefined {
  if (challenge?.step !== "code") return undefined;
  return { to: challenge.sent_to ?? "" };
}

function EyeIcon({ hidden }: { hidden: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M1.8 10S4.9 4.8 10 4.8 18.2 10 18.2 10 15.1 15.2 10 15.2 1.8 10 1.8 10Z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <circle cx="10" cy="10" r="2.4" stroke="currentColor" strokeWidth="1.6" />
      {hidden ? (
        <path d="M4 16 16 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      ) : null}
    </svg>
  );
}
