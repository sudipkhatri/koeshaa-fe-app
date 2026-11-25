"use client";

import type { components } from "@keoshaa/api-client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { ChoiceField } from "@/components/ui/ChoiceField";
import { fieldText, recordFormFailure } from "@/lib/form-errors";
import { useMessages } from "@/lib/locale";

import { AdminButton, AdminTextInput, ApiNote } from "./admin-ui";
import { useCreateChapter, useCreateIdea, useCreateTopic } from "./content-new-api";
import {
  chapterSchema,
  ideaSchema,
  topicSchema,
  type ChapterValues,
  type IdeaValues,
  type TopicValues,
} from "./content-new-schemas";

interface Named {
  id: string;
  label: string;
}

export function PlacePicker({
  subjects,
  gradeName,
  subjectId,
  onSubject,
  chapterId,
  onChapter,
  topicId,
  onTopic,
  ideaId,
  onIdea,
}: {
  subjects: components["schemas"]["SubjectRead"][];
  gradeName: (gradeId: string) => string | undefined;
  subjectId: string;
  onSubject: (subjectId: string) => void;
  chapterId: string;
  onChapter: (chapterId: string) => void;
  topicId: string;
  onTopic: (topicId: string) => void;
  ideaId: string;
  onIdea: (ideaId: string) => void;
}) {
  const { translate } = useMessages();
  const [chapters, setChapters] = useState<Named[]>([]);
  const [topics, setTopics] = useState<Named[]>([]);
  const [ideas, setIdeas] = useState<Named[]>([]);

  return (
    <section className="rounded-xl border border-admin-border bg-admin-surface p-5">
      <h2 className="text-body font-semibold">{translate("admin.whereItGoes")}</h2>
      <p className="mt-1 mb-4 text-caption text-admin-soft">{translate("admin.whereItGoesHelp")}</p>
      <div className="flex flex-wrap gap-3">
        <ChoiceField
          label={translate("admin.subject")}
          value={subjectId}
          onChange={(event) => {
            onSubject(event.target.value);
            onChapter("");
            onTopic("");
            onIdea("");
            setChapters([]);
            setTopics([]);
            setIdeas([]);
          }}
        >
          <option value="">{translate("admin.chooseSubject")}</option>
          {subjects.map((subject) => (
            <option key={subject.id} value={subject.id}>
              {subjectLabel(subject, gradeName(subject.grade_level_id))}
            </option>
          ))}
        </ChoiceField>
        <LevelSelect
          label={translate("admin.chapter")}
          value={chapterId}
          items={chapters}
          empty={translate("admin.addChapterFirst")}
          onChange={(id) => {
            onChapter(id);
            onTopic("");
            onIdea("");
            setTopics([]);
            setIdeas([]);
          }}
        />
        <LevelSelect
          label={translate("admin.topic")}
          value={topicId}
          items={topics}
          empty={translate("admin.addTopicFirst")}
          onChange={(id) => {
            onTopic(id);
            onIdea("");
            setIdeas([]);
          }}
        />
        <LevelSelect
          label={translate("admin.idea")}
          value={ideaId}
          items={ideas}
          empty={translate("admin.addIdeaFirst")}
          onChange={onIdea}
        />
      </div>
      <div className="mt-4">
        <ApiNote what={translate("admin.levelsNote")} />
      </div>
      {subjectId !== "" && chapters.length === 0 ? (
        <ChapterForm
          subjectId={subjectId}
          onCreated={(item) => {
            setChapters([item]);
            onChapter(item.id);
          }}
        />
      ) : null}
      {chapterId !== "" && topics.length === 0 ? (
        <TopicForm
          chapterId={chapterId}
          onCreated={(item) => {
            setTopics([item]);
            onTopic(item.id);
          }}
        />
      ) : null}
      {topicId !== "" && ideas.length === 0 ? (
        <IdeaForm
          topicId={topicId}
          onCreated={(item) => {
            setIdeas([item]);
            onIdea(item.id);
          }}
        />
      ) : null}
    </section>
  );
}

export function subjectLabel(
  subject: components["schemas"]["SubjectRead"],
  gradeName: string | undefined,
): string {
  return gradeName ? `${subject.name} · ${gradeName}` : subject.name;
}

function LevelSelect({
  label,
  value,
  items,
  empty,
  onChange,
}: {
  label: string;
  value: string;
  items: Named[];
  empty: string;
  onChange: (id: string) => void;
}) {
  return (
    <ChoiceField label={label} value={value} onChange={(event) => onChange(event.target.value)}>
      <option value="">{items.length === 0 ? empty : label}</option>
      {items.map((item) => (
        <option key={item.id} value={item.id}>
          {item.label}
        </option>
      ))}
    </ChoiceField>
  );
}

function ChapterForm({
  subjectId,
  onCreated,
}: {
  subjectId: string;
  onCreated: (item: Named) => void;
}) {
  const { locale, translate } = useMessages();
  const create = useCreateChapter();
  const form = useForm<ChapterValues>({
    resolver: zodResolver(chapterSchema),
    defaultValues: { number: "", name: "" },
  });
  return (
    <form
      noValidate
      className="mt-4 flex flex-wrap items-end gap-3"
      onSubmit={form.handleSubmit(async (values) => {
        try {
          const result = await create.mutateAsync({
            subject_id: subjectId,
            number: Number(values.number),
            name: values.name.trim(),
            in_free_slice: false,
          });
          onCreated({ id: result.created.id, label: `${values.number} · ${values.name.trim()}` });
        } catch (error) {
          recordFormFailure(error, form.setError, translate, locale);
        }
      })}
    >
      <AdminTextInput
        label={translate("admin.chapterNumber")}
        error={fieldText(form.formState.errors.number?.message, translate)}
        inputMode="numeric"
        {...form.register("number")}
      />
      <AdminTextInput
        label={translate("admin.name")}
        error={fieldText(form.formState.errors.name?.message, translate)}
        {...form.register("name")}
      />
      <AdminButton type="submit" pending={create.isPending} disabled={create.isPending}>
        {translate("admin.addChapter")}
      </AdminButton>
      {form.formState.errors.root?.message ? (
        <p className="text-caption text-admin-danger">{form.formState.errors.root.message}</p>
      ) : null}
    </form>
  );
}

function TopicForm({
  chapterId,
  onCreated,
}: {
  chapterId: string;
  onCreated: (item: Named) => void;
}) {
  const { locale, translate } = useMessages();
  const create = useCreateTopic();
  const form = useForm<TopicValues>({
    resolver: zodResolver(topicSchema),
    defaultValues: { number: "", name: "", slug: "", question: "", overview: "" },
  });
  return (
    <form
      noValidate
      className="mt-4 flex flex-col gap-3"
      onSubmit={form.handleSubmit(async (values) => {
        try {
          const result = await create.mutateAsync({
            chapter_id: chapterId,
            number: Number(values.number),
            name: values.name.trim(),
            slug: values.slug.trim(),
            question: values.question.trim(),
            overview: values.overview.trim(),
          });
          onCreated({
            id: result.created.id,
            label: `${values.number} · ${values.name.trim()}`,
          });
        } catch (error) {
          recordFormFailure(error, form.setError, translate, locale);
        }
      })}
    >
      <p className="text-caption text-admin-soft">{translate("admin.topicExtra")}</p>
      <div className="flex flex-wrap gap-3">
        <AdminTextInput
          label={translate("admin.chapterNumber")}
          error={fieldText(form.formState.errors.number?.message, translate)}
          inputMode="numeric"
          {...form.register("number")}
        />
        <AdminTextInput
          label={translate("admin.name")}
          error={fieldText(form.formState.errors.name?.message, translate)}
          {...form.register("name")}
        />
        <AdminTextInput
          label={translate("admin.topicSlug")}
          error={fieldText(form.formState.errors.slug?.message, translate)}
          {...form.register("slug")}
        />
      </div>
      <AdminTextInput
        label={translate("admin.topicQuestion")}
        error={fieldText(form.formState.errors.question?.message, translate)}
        {...form.register("question")}
      />
      <AdminTextInput
        label={translate("admin.overview")}
        error={fieldText(form.formState.errors.overview?.message, translate)}
        {...form.register("overview")}
      />
      <AdminButton type="submit" pending={create.isPending} disabled={create.isPending}>
        {translate("admin.addTopic")}
      </AdminButton>
      {form.formState.errors.root?.message ? (
        <p className="text-caption text-admin-danger">{form.formState.errors.root.message}</p>
      ) : null}
    </form>
  );
}

function IdeaForm({ topicId, onCreated }: { topicId: string; onCreated: (item: Named) => void }) {
  const { locale, translate } = useMessages();
  const create = useCreateIdea();
  const form = useForm<IdeaValues>({
    resolver: zodResolver(ideaSchema),
    defaultValues: { title: "" },
  });
  return (
    <form
      noValidate
      className="mt-4 flex flex-wrap items-end gap-3"
      onSubmit={form.handleSubmit(async (values) => {
        try {
          const result = await create.mutateAsync({
            topic_id: topicId,
            title: values.title.trim(),
          });
          onCreated({ id: result.created.id, label: values.title.trim() });
        } catch (error) {
          recordFormFailure(error, form.setError, translate, locale);
        }
      })}
    >
      <AdminTextInput
        label={translate("admin.idea")}
        error={fieldText(form.formState.errors.title?.message, translate)}
        {...form.register("title")}
      />
      <AdminButton type="submit" pending={create.isPending} disabled={create.isPending}>
        {translate("admin.addIdea")}
      </AdminButton>
      {form.formState.errors.root?.message ? (
        <p className="text-caption text-admin-danger">{form.formState.errors.root.message}</p>
      ) : null}
    </form>
  );
}
