"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { codeSchema, identifierSchema, passwordSchema } from "@keoshaa/core";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { fieldText, recordFormFailure } from "@/lib/form-errors";
import { useMessages } from "@/lib/locale";

import { requestResetCode, resetPassword } from "./api";

type ForgotStep = "forgot" | "reset_code" | "new_password" | "done";

const identifierFormSchema = z.object({ identifier: identifierSchema });
const codeFormSchema = z.object({ code: codeSchema });
const passwordFormSchema = z.object({ password: passwordSchema });

type IdentifierValues = z.infer<typeof identifierFormSchema>;
type CodeValues = z.infer<typeof codeFormSchema>;
type PasswordValues = z.infer<typeof passwordFormSchema>;

export function ForgotPasswordPanel({
  initialIdentifier,
  onCancel,
  onDone,
}: {
  initialIdentifier: string;
  onCancel: () => void;
  onDone: (identifier: string) => void;
}) {
  const { locale, translate } = useMessages();
  const [step, setStep] = useState<ForgotStep>("forgot");
  const [identifier, setIdentifier] = useState(initialIdentifier);
  const [sentTo, setSentTo] = useState("");
  const [code, setCode] = useState("");

  const identifierForm = useForm<IdentifierValues>({
    resolver: zodResolver(identifierFormSchema),
    defaultValues: { identifier: initialIdentifier },
  });
  const codeForm = useForm<CodeValues>({
    resolver: zodResolver(codeFormSchema),
    defaultValues: { code: "" },
  });
  const passwordForm = useForm<PasswordValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: { password: "" },
  });

  async function submitIdentifier(values: IdentifierValues) {
    try {
      const sent = await requestResetCode(values.identifier);
      setIdentifier(values.identifier);
      setSentTo(sent.sent_to);
      codeForm.reset({ code: "" });
      setStep("reset_code");
    } catch (error) {
      recordFormFailure(error, identifierForm.setError, translate, locale);
    }
  }

  async function submitCode(values: CodeValues) {
    setCode(values.code.trim());
    passwordForm.reset({ password: "" });
    setStep("new_password");
  }

  async function submitPassword(values: PasswordValues) {
    try {
      await resetPassword({
        identifier,
        code,
        password: values.password,
      });
      setStep("done");
    } catch (error) {
      recordFormFailure(error, passwordForm.setError, translate, locale);
    }
  }

  const identifierOffline = identifierForm.formState.errors.root?.type === "offline";
  const passwordOffline = passwordForm.formState.errors.root?.type === "offline";

  return (
    <div className="flex w-full max-w-md flex-col gap-5 rounded-2xl border border-line bg-canvas p-5 shadow-card sm:p-8">
      {step !== "done" ? (
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-semibold">
            {translate(step === "new_password" ? "forgot.newTitle" : "forgot.title")}
          </h2>
          <p className="text-ink-soft">
            {step === "forgot"
              ? translate("forgot.intro")
              : step === "reset_code"
                ? translate("code.sent", { to: sentTo })
                : translate("forgot.newIntro")}
          </p>
        </div>
      ) : null}

      {step === "forgot" ? (
        <form
          className="flex flex-col gap-4"
          onSubmit={identifierForm.handleSubmit(submitIdentifier)}
        >
          <TextField
            label={translate("auth.idLabel")}
            autoComplete="username"
            error={fieldText(identifierForm.formState.errors.identifier?.message, translate)}
            {...identifierForm.register("identifier")}
          />
          {identifierForm.formState.errors.root?.message ? (
            <p role="alert">{identifierForm.formState.errors.root.message}</p>
          ) : null}
          <Button type="submit" pending={identifierForm.formState.isSubmitting}>
            {identifierOffline ? translate("common.noConnection") : translate("forgot.send")}
          </Button>
          <button
            type="button"
            className="inline-flex min-h-12 cursor-pointer items-center justify-center text-sm font-semibold text-primary"
            onClick={onCancel}
          >
            {translate("auth.backToSignIn")}
          </button>
        </form>
      ) : null}

      {step === "reset_code" ? (
        <form className="flex flex-col gap-4" onSubmit={codeForm.handleSubmit(submitCode)}>
          <TextField
            label={translate("admin.codeLabel")}
            autoComplete="one-time-code"
            inputMode="numeric"
            error={fieldText(codeForm.formState.errors.code?.message, translate)}
            {...codeForm.register("code")}
          />
          <Button type="submit">{translate("admin.verify")}</Button>
          <button
            type="button"
            className="inline-flex min-h-12 cursor-pointer items-center justify-center text-sm font-semibold text-primary"
            onClick={() => {
              codeForm.reset({ code: "" });
              setStep("forgot");
            }}
          >
            {translate("code.getNew")}
          </button>
        </form>
      ) : null}

      {step === "new_password" ? (
        <form className="flex flex-col gap-4" onSubmit={passwordForm.handleSubmit(submitPassword)}>
          <TextField
            label={translate("password.newLabel")}
            type="password"
            autoComplete="new-password"
            error={fieldText(passwordForm.formState.errors.password?.message, translate)}
            {...passwordForm.register("password")}
          />
          {passwordForm.formState.errors.root?.message ? (
            <p role="alert">{passwordForm.formState.errors.root.message}</p>
          ) : null}
          <Button type="submit" pending={passwordForm.formState.isSubmitting}>
            {passwordOffline ? translate("common.noConnection") : translate("forgot.save")}
          </Button>
          <button
            type="button"
            className="inline-flex min-h-12 cursor-pointer items-center justify-center text-sm font-semibold text-primary"
            onClick={() => {
              passwordForm.reset({ password: "" });
              setStep("reset_code");
            }}
          >
            {translate("code.getNew")}
          </button>
        </form>
      ) : null}

      {step === "done" ? (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-2xl font-semibold">{translate("forgot.doneTitle")}</h2>
            <p className="text-ink-soft">{translate("forgot.doneBody")}</p>
          </div>
          <Button type="button" onClick={() => onDone(identifier)}>
            {translate("auth.signIn")}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
