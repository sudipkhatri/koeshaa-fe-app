"use client";

import { useMessages } from "@/lib/locale";

import { Check } from "./Check";

export function PhonePreview() {
  const { translate } = useMessages();
  const options = [
    translate("landing.phoneWrong1"),
    translate("landing.phoneRight"),
    translate("landing.phoneWrong2"),
  ];
  return (
    <div className="relative w-full max-w-xs">
      <div className="absolute -inset-4 rounded-3xl bg-canvas/50" aria-hidden="true" />
      <div className="relative rounded-3xl bg-text p-2 shadow-card">
        <div className="overflow-hidden rounded-2xl bg-canvas">
          <div className="bg-primary px-4 py-3 text-on-primary">
            <p className="text-xs">{translate("landing.phoneSubject")}</p>
            <p className="font-bold">{translate("landing.phoneChapter")}</p>
            <div className="mt-3 flex items-center gap-2">
              <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-on-primary/30">
                <span className="block h-full w-3/5 bg-reward" />
              </span>
              <span className="text-xs font-semibold">{translate("landing.phoneProgress")}</span>
            </div>
          </div>
          <div className="flex flex-col gap-3 p-4">
            <p className="text-sm font-semibold">{translate("landing.phoneQuestion")}</p>
            <ul className="flex flex-col gap-2">
              {options.map((option) => {
                const correct = option === translate("landing.phoneRight");
                return (
                  <li
                    key={option}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${correct ? "border-subject-science bg-success-tint font-semibold text-on-success-tint" : "border-line"}`}
                  >
                    {correct ? <Check className="text-on-success-tint" /> : null}
                    {option}
                  </li>
                );
              })}
            </ul>
            <p className="rounded-lg bg-background p-3 text-xs text-ink-soft">
              <strong className="text-text">{translate("landing.phoneWhy")}</strong>
            </p>
          </div>
          <p className="flex items-center gap-2 border-t border-line px-4 py-3 text-xs text-ink-soft">
            <span aria-hidden="true">🔥</span>
            {translate("landing.phoneStreak")}
          </p>
        </div>
      </div>
    </div>
  );
}
