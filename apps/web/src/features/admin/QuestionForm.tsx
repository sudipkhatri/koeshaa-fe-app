"use client";

import { NetworkError } from "@keoshaa/core";
import type { MessageKey } from "@keoshaa/i18n";
import { zodResolver } from "@hookform/resolvers/zod";
import { useId, useState, type TextareaHTMLAttributes } from "react";
import { useForm } from "react-hook-form";

import { ChoiceField } from "@/components/ui/ChoiceField";
import { fieldText, recordFormFailure } from "@/lib/form-errors";
import { useMessages } from "@/lib/locale";

import { AdminTextInput, ApiNote, FieldLabel } from "./admin-ui";
import { useCreateQuestion } from "./content-new-api";
import { questionSchema, type QuestionValues } from "./content-new-schemas";
import { StatusPill } from "./DataTable";

const FORM_ID = "add-question";

const kindLabel: Record<QuestionValues["kind"], MessageKey> = {
  single: "admin.kindSingle",
  multi: "admin.kindMulti",
  blank: "admin.kindBlank",
  answer_reason: "admin.kindReason",
  written: "admin.kindWritten",
  numerical: "admin.kindNumerical",
};

const sourceLabel: Record<QuestionValues["source"], MessageKey> = {
  book: "admin.sourceBook",
  past_paper: "admin.sourcePaper",
  authored: "admin.sourceAuthored",
};

export function QuestionForm({
  ideaId,
  organisationId,
  create,
  onOffline,
}: {
  ideaId: string;
  organisationId: string;
  create: ReturnType<typeof useCreateQuestion>;
  onOffline: (offline: boolean) => void;
}) {
  const { locale, translate } = useMessages();
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correct, setCorrect] = useState<number[]>([]);
  const [optionError, setOptionError] = useState("");
  const [saved, setSaved] = useState<"closed" | "open" | null>(null);
  const [kind, setKind] = useState<QuestionValues["kind"]>("single");
  const [source, setSource] = useState<QuestionValues["source"]>("book");
  const [language, setLanguage] = useState<QuestionValues["language"]>("en");
  const form = useForm<QuestionValues>({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      kind: "single",
      source: "book",
      language: "en",
      marks: "",
      stem: "",
      explanation: "",
      answer: "",
      reason: "",
    },
  });
  const choosing = kind === "single" || kind === "multi";
  const errors = form.formState.errors;

  return (
    <form
      id={FORM_ID}
      noValidate
      className="rounded-xl border border-admin-border bg-admin-surface p-5"
      onSubmit={form.handleSubmit(async (values) => {
        setSaved(null);
        onOffline(false);
        if (ideaId === "" || organisationId === "") {
          form.setError("root", { message: translate("admin.placeRequired") });
          return;
        }
        const filled = options
          .map((text, index) => ({ text: text.trim(), index }))
          .filter((item) => item.text !== "");
        const answerIndexes = filled.flatMap((item, position) =>
          correct.includes(item.index) ? [position] : [],
        );
        if (choosing && (filled.length < 2 || answerIndexes.length < 1)) {
          setOptionError(translate("admin.optionsRequired"));
          return;
        }
        if (kind === "single" && answerIndexes.length !== 1) {
          setOptionError(translate("admin.oneAnswerRequired"));
          return;
        }
        setOptionError("");
        try {
          const result = await create.mutateAsync({
            idea_id: ideaId,
            organisation_id: organisationId,
            kind,
            source,
            language,
            stem: values.stem.trim(),
            explanation: values.explanation.trim() || null,
            marks: values.marks === "" ? null : Number(values.marks),
            ...(choosing
              ? {
                  options: { choices: filled.map((item) => item.text) },
                  answer_key: { correct: answerIndexes },
                }
              : kind === "answer_reason"
                ? {
                    options: null,
                    answer_key: { answer: values.answer.trim(), reason: values.reason.trim() },
                  }
                : { options: null, answer_key: { text: values.answer.trim() } }),
          });
          setSaved(result.reviewClosed ? "closed" : "open");
          if (!result.reviewClosed) return;
          form.reset();
          setOptions(["", "", "", ""]);
          setCorrect([]);
          setKind("single");
          setSource("book");
          setLanguage("en");
        } catch (error) {
          recordFormFailure(error, form.setError, translate, locale);
          onOffline(error instanceof NetworkError);
        }
      })}
    >
      <h2 className="mb-4 text-body font-semibold">{translate("admin.theQuestion")}</h2>
      <div className="mb-4 flex flex-wrap gap-3">
        <ChoiceField
          label={translate("admin.kind")}
          value={kind}
          onChange={(event) => {
            const next = event.target.value as QuestionValues["kind"];
            setKind(next);
            form.setValue("kind", next);
          }}
        >
          {(Object.keys(kindLabel) as QuestionValues["kind"][]).map((item) => (
            <option key={item} value={item}>
              {translate(kindLabel[item])}
            </option>
          ))}
        </ChoiceField>
        <ChoiceField
          label={translate("admin.source")}
          value={source}
          onChange={(event) => {
            const next = event.target.value as QuestionValues["source"];
            setSource(next);
            form.setValue("source", next);
          }}
        >
          {(Object.keys(sourceLabel) as QuestionValues["source"][]).map((item) => (
            <option key={item} value={item}>
              {translate(sourceLabel[item])}
            </option>
          ))}
        </ChoiceField>
        <ChoiceField
          label={translate("admin.language")}
          value={language}
          onChange={(event) => {
            const next = event.target.value as QuestionValues["language"];
            setLanguage(next);
            form.setValue("language", next);
          }}
        >
          <option value="en">{translate("admin.englishName")}</option>
          <option value="ne">{translate("admin.nepaliName")}</option>
        </ChoiceField>
        <AdminTextInput
          label={translate("admin.marks")}
          inputMode="numeric"
          error={fieldText(errors.marks?.message, translate)}
          {...form.register("marks")}
        />
      </div>
      <TextArea
        label={translate("admin.questionText")}
        error={fieldText(errors.stem?.message, translate)}
        {...form.register("stem")}
      />
      {choosing ? (
        <OptionList
          kind={kind}
          options={options}
          correct={correct}
          error={optionError}
          onOptions={setOptions}
          onCorrect={setCorrect}
        />
      ) : (
        <div className="mt-4 flex flex-col gap-3">
          <TextArea
            label={translate("admin.answer")}
            error={fieldText(errors.answer?.message, translate)}
            {...form.register("answer")}
          />
          {kind === "answer_reason" ? (
            <TextArea
              label={translate("admin.reason")}
              error={fieldText(errors.reason?.message, translate)}
              {...form.register("reason")}
            />
          ) : null}
        </div>
      )}
      <div className="mt-4">
        <TextArea
          label={translate("admin.whyAnswer")}
          hint={translate("admin.whyAnswerHint")}
          error={fieldText(errors.explanation?.message, translate)}
          {...form.register("explanation")}
        />
      </div>
      <LabelField />
      {errors.root?.message ? (
        <p className="mt-3 text-caption text-admin-danger">{errors.root.message}</p>
      ) : null}
      {saved === "closed" ? <p className="mt-3">{translate("admin.questionAdded")}</p> : null}
      {saved === "open" ? (
        <p className="mt-3 text-on-reward-tint">{translate("admin.reviewLeftOpen")}</p>
      ) : null}
    </form>
  );
}

function OptionList({
  kind,
  options,
  correct,
  error,
  onOptions,
  onCorrect,
}: {
  kind: QuestionValues["kind"];
  options: string[];
  correct: number[];
  error: string;
  onOptions: (options: string[]) => void;
  onCorrect: (correct: number[]) => void;
}) {
  const { translate } = useMessages();
  return (
    <fieldset className="mt-4">
      <legend className="mb-2 text-caption font-semibold">{translate("admin.options")}</legend>
      <ul className="flex flex-col gap-2">
        {options.map((option, index) => (
          <li key={index} className="flex items-center gap-2.5">
            <input
              type={kind === "single" ? "radio" : "checkbox"}
              name="correct"
              className="size-4 accent-primary"
              checked={correct.includes(index)}
              aria-label={translate("admin.markCorrect", { number: String(index + 1) })}
              onChange={() =>
                onCorrect(
                  kind === "single"
                    ? [index]
                    : correct.includes(index)
                      ? correct.filter((item) => item !== index)
                      : [...correct, index],
                )
              }
            />
            <input
              value={option}
              aria-label={translate("admin.optionText", { number: String(index + 1) })}
              onChange={(event) =>
                onOptions(
                  options.map((item, itemIndex) =>
                    itemIndex === index ? event.target.value : item,
                  ),
                )
              }
              className={`min-h-12 min-w-0 grow rounded-square border bg-admin-surface px-3 md:min-h-9 ${correct.includes(index) ? "border-primary" : "border-admin-border"}`}
            />
            {correct.includes(index) ? (
              <StatusPill tone="success">{translate("admin.correct")}</StatusPill>
            ) : null}
          </li>
        ))}
      </ul>
      {error ? <p className="mt-2 text-micro text-admin-danger">{error}</p> : null}
    </fieldset>
  );
}

function LabelField() {
  const { translate } = useMessages();
  const [labels, setLabels] = useState("");
  return (
    <div className="mt-4">
      <AdminTextInput
        label={translate("admin.labels")}
        value={labels}
        onChange={(event) => setLabels(event.target.value)}
      />
      <div className="mt-2">
        <ApiNote what={translate("admin.labelsNote")} />
      </div>
    </div>
  );
}
function TextArea({
  label,
  hint,
  error,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  hint?: string;
  error?: string | undefined;
}) {
  const id = useId();
  const note = error ?? hint;
  return (
    <div className="flex flex-col gap-1.5">
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <textarea
        id={id}
        rows={2}
        aria-invalid={error ? true : undefined}
        className={`min-h-20 resize-y rounded-square border bg-admin-surface px-3 py-2.5 text-admin-ink md:min-h-16 ${error ? "border-admin-danger" : "border-admin-border"}`}
        {...props}
      />
      {note ? (
        <p className={`text-micro ${error ? "text-admin-danger" : "text-admin-soft"}`}>{note}</p>
      ) : null}
    </div>
  );
}
