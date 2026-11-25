"use client";

import type { components } from "@keoshaa/api-client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { ChoiceField } from "@/components/ui/ChoiceField";
import { fieldText, recordFormFailure } from "@/lib/form-errors";
import { useMessages } from "@/lib/locale";

import { AdminButton, AdminTextInput } from "./admin-ui";
import { subjectSchema, type SubjectValues } from "./subject-schemas";
import { useCreateSubject } from "./subjects-api";

type Grade = components["schemas"]["GradeLevelRead"];
type Stream = components["schemas"]["StreamRead"];

export function SubjectForm({
  grades,
  streams,
  gradeId,
  streamId,
  onDone,
}: {
  grades: Grade[];
  streams: Stream[];
  gradeId: string;
  streamId: string;
  onDone: () => void;
}) {
  const { locale, translate } = useMessages();
  const create = useCreateSubject();
  const [confirming, setConfirming] = useState(false);
  const initialGrade = gradeId === "all" ? (grades[0]?.id ?? "") : gradeId;
  const initialNeeds = grades.some((grade) => grade.id === initialGrade && grade.has_streams);
  const form = useForm<SubjectValues>({
    resolver: zodResolver(subjectSchema),
    defaultValues: {
      name: "",
      code: "",
      order: "",
      gradeId: initialGrade,
      streamId: initialNeeds && streamId !== "all" ? streamId : "",
      needsStream: initialNeeds,
    },
  });
  const errors = form.formState.errors;
  const [chosenGrade, setChosenGrade] = useState(initialGrade);
  const [streamValue, setStreamValue] = useState(
    initialNeeds && streamId !== "all" ? streamId : "",
  );
  const needsStream = grades.some((grade) => grade.id === chosenGrade && grade.has_streams);

  return (
    <form
      noValidate
      aria-label={translate("admin.addSubject")}
      className="flex flex-col gap-4 rounded-xl border border-admin-border bg-admin-surface p-5"
      onSubmit={form.handleSubmit(async (values) => {
        if (!confirming) {
          setConfirming(true);
          return;
        }
        try {
          await create.mutateAsync({ ...values, needsStream });
          onDone();
        } catch (error) {
          setConfirming(false);
          recordFormFailure(error, form.setError, translate, locale);
        }
      })}
    >
      <AdminTextInput
        label={translate("admin.name")}
        error={fieldText(errors.name?.message, translate)}
        {...form.register("name", { onChange: () => setConfirming(false) })}
      />
      <div className="flex flex-wrap gap-4">
        <AdminTextInput
          label={translate("admin.code")}
          className="w-full sm:w-45"
          error={fieldText(errors.code?.message, translate)}
          {...form.register("code", { onChange: () => setConfirming(false) })}
        />
        <AdminTextInput
          label={translate("admin.order")}
          inputMode="numeric"
          className="w-full sm:w-32"
          error={fieldText(errors.order?.message, translate)}
          {...form.register("order", { onChange: () => setConfirming(false) })}
        />
      </div>
      <div className="flex flex-wrap gap-4">
        <ChoiceField
          label={translate("admin.grade")}
          value={chosenGrade}
          error={fieldText(errors.gradeId?.message, translate)}
          onChange={(event) => {
            const next = event.target.value;
            const needs = grades.some((grade) => grade.id === next && grade.has_streams);
            setChosenGrade(next);
            form.setValue("gradeId", next);
            form.setValue("needsStream", needs);
            if (!needs) {
              setStreamValue("");
              form.setValue("streamId", "");
            }
            setConfirming(false);
          }}
        >
          {grades.map((grade) => (
            <option key={grade.id} value={grade.id}>
              {grade.name}
            </option>
          ))}
        </ChoiceField>
        {needsStream ? (
          <ChoiceField
            label={translate("admin.stream")}
            value={streamValue}
            error={fieldText(errors.streamId?.message, translate)}
            onChange={(event) => {
              setStreamValue(event.target.value);
              form.setValue("streamId", event.target.value);
              setConfirming(false);
            }}
          >
            <option value="">{translate("admin.streamRequired")}</option>
            {streams.map((stream) => (
              <option key={stream.id} value={stream.id}>
                {stream.name}
              </option>
            ))}
          </ChoiceField>
        ) : null}
      </div>
      {confirming ? (
        <p className="text-caption text-admin-soft">
          {translate("admin.addSubjectConfirm", { name: form.getValues("name") })}
        </p>
      ) : null}
      {errors.root?.message ? (
        <p role="alert" className="text-caption text-admin-danger">
          {errors.root.message}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2.5">
        <AdminButton type="submit" pending={form.formState.isSubmitting}>
          {translate(
            errors.root?.type === "offline"
              ? "common.noConnection"
              : confirming
                ? "admin.addIt"
                : "admin.addSubject",
          )}
        </AdminButton>
        <AdminButton type="button" tone="quiet" onClick={onDone}>
          {translate("admin.cancel")}
        </AdminButton>
      </div>
    </form>
  );
}
