"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ApiError, NetworkError, normalisePhone } from "@keoshaa/core";
import type { MessageKey } from "@keoshaa/i18n";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/Button";
import { PageContainer } from "@/components/ui/PageContainer";
import { TextArea, TextField } from "@/components/ui/TextField";
import { Check } from "@/features/home/Check";
import { SiteHeader } from "@/features/home/SiteHeader";
import { api } from "@/lib/api";
import { errorMessage, formatRetryTime } from "@/lib/errors";
import { applyFieldErrors, fieldText } from "@/lib/form-errors";
import { useMessages } from "@/lib/locale";

import { publicLeadSchema, type PublicLeadValues } from "./schemas";

const receiptSchema = z.object({
  id: z.string().regex(/^[0-9A-HJKMNP-TV-Z]{26}$/),
  status: z.enum(["new", "contacted", "won", "lost"]),
});

export function PublicLeadScreen() {
  const { locale, translate } = useMessages();
  const [receiptId, setReceiptId] = useState<string | null>(null);
  const [failure, setFailure] = useState<unknown>(null);
  const form = useForm<PublicLeadValues>({
    resolver: zodResolver(publicLeadSchema),
    defaultValues: { contact_name: "", school_name: "", phone: "", message: "", website: "" },
  });
  const offline = failure instanceof NetworkError;

  const benefits = [
    ["landing.seatsTitle", "landing.seatsBody"],
    ["landing.listTitle", "landing.listBody"],
    ["landing.topicsTitle", "landing.topicsBody"],
  ] as const;
  const after = ["landing.after1", "landing.after2", "landing.after3"] as const;

  return (
    <div className="min-h-dvh bg-canvas text-text">
      <SiteHeader />
      <main>
        <PageContainer className="flex flex-wrap gap-8 py-10 sm:gap-12 sm:py-14">
          <div className="flex min-w-0 flex-1 basis-96 flex-col gap-6">
            <p className="text-xs font-semibold tracking-widest text-primary uppercase">
              {translate("landing.schoolsEyebrow")}
            </p>
            <h1 className="text-4xl font-extrabold">{translate("admin.publicLeadTitle")}</h1>
            <p className="text-lg text-ink-soft">{translate("admin.publicLeadBody")}</p>
            <div className="flex flex-col gap-4 rounded-2xl bg-mist p-6">
              <h2 className="text-lg font-semibold">{translate("landing.schoolGets")}</h2>
              <ul className="flex flex-col gap-3">
                {benefits.map(([title, body]) => (
                  <li key={title} className="flex gap-3">
                    <Check />
                    <span>
                      <strong>{translate(title)}</strong> {translate(body)}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="border-t border-line pt-3 text-sm text-ink-soft">
                {translate("landing.seatNote")}
              </p>
            </div>
          </div>
          <div className="flex min-w-0 flex-1 basis-80 flex-col gap-5">
            <form
              className="flex flex-col gap-4 rounded-2xl border border-line bg-canvas p-5 shadow-card sm:p-7"
              onSubmit={form.handleSubmit(async (values) => {
                setFailure(null);
                if (values.website.trim() !== "") {
                  setReceiptId("");
                  return;
                }
                try {
                  const phone = normalisePhone(values.phone);
                  if (!phone)
                    throw new ApiError(400, {
                      code: "VALIDATION_ERROR",
                      message: "VALIDATION_ERROR",
                    });
                  const { data } = await api.POST("/api/v1/public/school-leads", {
                    body: {
                      contact_name: values.contact_name,
                      school_name: values.school_name,
                      phone,
                      ...(values.message.trim() ? { message: values.message.trim() } : {}),
                    },
                  });
                  const receipt = receiptSchema.safeParse(data?.data);
                  if (!receipt.success)
                    throw new ApiError(500, { code: "HTTP_500", message: "HTTP_500" });
                  setReceiptId(receipt.data.id);
                  form.reset();
                } catch (error) {
                  setFailure(error);
                  applyFieldErrors(error, form.setError, translate);
                }
              })}
            >
              <h2 className="text-xl font-semibold">{translate("landing.leaveDetails")}</h2>
              <TextField
                label={translate("landing.yourName")}
                autoComplete="name"
                error={fieldText(form.formState.errors.contact_name?.message, translate)}
                {...form.register("contact_name")}
              />
              <TextField
                label={translate("admin.school")}
                error={fieldText(form.formState.errors.school_name?.message, translate)}
                {...form.register("school_name")}
              />
              <TextField
                label={translate("admin.phone")}
                inputMode="tel"
                autoComplete="tel"
                error={fieldText(form.formState.errors.phone?.message, translate)}
                {...form.register("phone")}
              />
              <TextArea
                label={translate("landing.messageOptional")}
                placeholder={translate("landing.messageHint")}
                error={fieldText(form.formState.errors.message?.message, translate)}
                {...form.register("message")}
              />
              <div className="sr-only" aria-hidden="true">
                <label>
                  Website
                  <input tabIndex={-1} autoComplete="off" {...form.register("website")} />
                </label>
              </div>
              {failure ? (
                <p role="alert">
                  {errorMessage(failure, translate, (seconds) => formatRetryTime(seconds, locale))}
                </p>
              ) : null}
              <Button type="submit" pending={form.formState.isSubmitting}>
                {translate(offline ? "common.noConnection" : "admin.publicLeadSend")}
              </Button>
              <p className="text-sm text-ink-soft">{translate("landing.leadPrivacy")}</p>
            </form>
            <AfterSending receiptId={receiptId} steps={after} />
          </div>
        </PageContainer>
      </main>
      <EnquiryFooter />
    </div>
  );
}

function AfterSending({
  receiptId,
  steps,
}: {
  receiptId: string | null;
  steps: readonly MessageKey[];
}) {
  const { translate } = useMessages();
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-dashed border-line p-6">
      <p className="text-xs font-semibold tracking-widest text-ink-soft uppercase">
        {translate("landing.afterSending")}
      </p>
      {receiptId === null ? null : (
        <div
          role="status"
          className="flex gap-3 rounded-xl bg-success-tint p-4 text-on-success-tint"
        >
          <Check className="mt-0.5 text-on-success-tint" />
          <div>
            <p className="font-semibold">{translate("admin.publicLeadReceived")}</p>
            {receiptId ? <p>{translate("admin.publicLeadSent", { id: receiptId })}</p> : null}
          </div>
        </div>
      )}
      <ol className="flex list-decimal flex-col gap-2 pl-5 text-ink-soft">
        {steps.map((step) => (
          <li key={step}>{translate(step)}</li>
        ))}
      </ol>
    </div>
  );
}

function EnquiryFooter() {
  const { translate } = useMessages();
  return (
    <footer className="border-t border-line bg-mist">
      <PageContainer className="flex flex-wrap items-center gap-5 py-7">
        <p className="min-w-0 flex-1 text-sm text-ink-soft">{translate("landing.schoolsFoot")}</p>
        <Link href="/admin" className="text-sm font-semibold text-ink-soft hover:text-primary">
          {translate("landing.staffSignIn")}
        </Link>
      </PageContainer>
    </footer>
  );
}
