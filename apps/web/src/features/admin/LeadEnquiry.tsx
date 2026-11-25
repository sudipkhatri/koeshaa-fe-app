"use client";

import type { components } from "@keoshaa/api-client";
import type { MessageKey } from "@keoshaa/i18n";
import type { ReactNode } from "react";

import { useMessages } from "@/lib/locale";

import { formatDay, formatPhone, formatWhen } from "./format";

type SchoolLead = components["schemas"]["SchoolLeadRead"];
type StepState = "done" | "current" | "upcoming";

export function DetailSection({
  title,
  roomy = false,
  aside,
  children,
}: {
  title: string;
  roomy?: boolean;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section
      className={`flex flex-col rounded-xl border border-admin-border bg-admin-surface ${roomy ? "gap-4.5 px-6 py-5.5" : "gap-4 p-5"}`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="grow text-body font-semibold">{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

function DetailLabel({ children }: { children: ReactNode }) {
  return (
    <span className="text-micro font-semibold tracking-widest text-admin-soft uppercase">
      {children}
    </span>
  );
}

export function LeadEnquiry({ lead }: { lead: SchoolLead }) {
  const { locale, translate } = useMessages();
  const facts: { label: MessageKey; value: ReactNode; numeric?: boolean }[] = [
    { label: "admin.contact", value: lead.contact_name },
    {
      label: "admin.phone",
      value: (
        <a className="text-primary underline hover:text-primary-pressed" href={`tel:${lead.phone}`}>
          {formatPhone(lead.phone)}
        </a>
      ),
      numeric: true,
    },
    { label: "admin.school", value: lead.school_name },
    { label: "admin.created", value: formatWhen(lead.created_at, locale), numeric: true },
  ];
  return (
    <DetailSection title={translate("admin.enquiry")} roomy>
      <dl className="grid grid-cols-1 gap-x-6 gap-y-4.5 sm:grid-cols-2">
        {facts.map((fact) => (
          <div key={fact.label}>
            <dt>
              <DetailLabel>{translate(fact.label)}</DetailLabel>
            </dt>
            <dd className={`mt-1 ${fact.numeric ? "tabular-nums" : ""}`}>{fact.value}</dd>
          </div>
        ))}
      </dl>
      {lead.message ? (
        <div className="flex flex-col gap-1.5">
          <DetailLabel>{translate("admin.message")}</DetailLabel>
          <p className="rounded-square bg-admin-page px-4 py-3.5">{lead.message}</p>
        </div>
      ) : null}
    </DetailSection>
  );
}

function callDetail(lead: SchoolLead): MessageKey {
  if (lead.organisation_id || lead.status === "won") return "admin.stepDone";
  if (lead.status === "lost") return "admin.stepCallLost";
  if (lead.status === "contacted") return "admin.stepCallContacted";
  return "admin.stepCallWaiting";
}

export function leadSteps(lead: SchoolLead): StepState[] {
  const agreed = lead.status === "won" || lead.organisation_id != null;
  const linked = lead.organisation_id != null;
  if (lead.status === "lost" && !linked) return ["done", "current", "upcoming", "upcoming"];
  return [
    "done",
    agreed ? "done" : "current",
    linked ? "done" : agreed ? "current" : "upcoming",
    linked ? "current" : "upcoming",
  ];
}

const markerTone: Record<StepState, string> = {
  done: "bg-primary text-on-primary",
  current: "border-2 border-primary bg-admin-surface text-primary",
  upcoming: "border-2 border-admin-border bg-admin-surface text-admin-hint",
};

export function LeadNextSteps({ lead }: { lead: SchoolLead }) {
  const { locale, translate } = useMessages();
  const states = leadSteps(lead);
  const steps: { title: MessageKey; detail: string }[] = [
    {
      title: "admin.stepReceived",
      detail: translate("admin.stepReceivedDetail", { date: formatDay(lead.created_at, locale) }),
    },
    { title: "admin.stepCall", detail: translate(callDetail(lead)) },
    { title: "admin.stepCreate", detail: translate("admin.stepCreateDetail") },
    { title: "admin.stepHandOver", detail: translate("admin.stepHandOverDetail") },
  ];
  return (
    <DetailSection title={translate("admin.nextSteps")} roomy>
      <ol className="flex flex-col">
        {steps.map((step, index) => {
          const state = states[index] ?? "upcoming";
          const last = index === steps.length - 1;
          return (
            <li
              key={step.title}
              className="flex gap-3.5"
              aria-current={state === "current" ? "step" : undefined}
            >
              <span className="flex shrink-0 flex-col items-center">
                <span
                  className={`flex size-6 items-center justify-center rounded-full text-micro font-semibold ${markerTone[state]}`}
                >
                  {index + 1}
                </span>
                {last ? null : <span className="my-1 w-0.5 grow bg-admin-border" />}
              </span>
              <span className={last ? "" : "pb-4.5"}>
                <span
                  className={`block font-semibold ${state === "upcoming" ? "text-admin-soft" : ""}`}
                >
                  {translate(step.title)}
                </span>
                <span className="block text-caption text-admin-soft">{step.detail}</span>
              </span>
            </li>
          );
        })}
      </ol>
    </DetailSection>
  );
}
