"use client";

import { useState } from "react";

import { useMessages } from "@/lib/locale";

import { AdminPage } from "./AdminPage";
import { useSubjectReleases } from "./content-api";
import { useCreateQuestion } from "./content-new-api";
import { useGradeLevels } from "./curriculum-api";
import { useMySchools } from "./organisations-api";
import { PlacePicker } from "./PlacePicker";
import { QueryGate } from "./QueryGate";
import { ReviewBox, WhatSavingDoes } from "./QuestionAside";
import { QuestionForm } from "./QuestionForm";
import { useSubjectDirectory } from "./subjects-api";

export function ContentNewScreen() {
  const { translate } = useMessages();
  const subjects = useSubjectDirectory();
  const grades = useGradeLevels();
  const schools = useMySchools();
  const create = useCreateQuestion();
  const [offline, setOffline] = useState(false);
  const [subjectId, setSubjectId] = useState("");
  const [chapterId, setChapterId] = useState("");
  const [topicId, setTopicId] = useState("");
  const [ideaId, setIdeaId] = useState("");
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const releases = useSubjectReleases(subjectId);
  const open = [...(releases.data ?? [])]
    .filter((release) => release.published_at === null)
    .sort((left, right) => right.version - left.version)[0];
  const school =
    schools.data?.find((item) => item.organisation_id === schoolId) ?? schools.data?.[0];

  return (
    <AdminPage
      title={translate("admin.addQuestion")}
      back={{ href: "/admin/content", label: translate("admin.content") }}
    >
      <QueryGate
        query={subjects}
        isEmpty={false}
        emptyTitle="admin.emptySubjects"
        emptyMessage="admin.emptySubjectsBody"
      >
        <div className="flex flex-wrap items-start gap-5">
          <div className="flex min-w-0 grow basis-110 flex-col gap-5">
            <PlacePicker
              subjects={subjects.data ?? []}
              gradeName={(gradeId) => grades.data?.find((grade) => grade.id === gradeId)?.name}
              subjectId={subjectId}
              chapterId={chapterId}
              topicId={topicId}
              ideaId={ideaId}
              onSubject={setSubjectId}
              onChapter={setChapterId}
              onTopic={setTopicId}
              onIdea={setIdeaId}
            />
            <QuestionForm
              ideaId={ideaId}
              organisationId={school?.organisation_id ?? ""}
              create={create}
              onOffline={setOffline}
            />
          </div>
          <aside className="flex w-full min-w-0 flex-col gap-4 sm:w-75">
            <ReviewBox
              schools={schools.data ?? []}
              schoolId={school?.organisation_id ?? ""}
              onSchool={setSchoolId}
            />
            <WhatSavingDoes version={open?.version} pending={create.isPending} offline={offline} />
          </aside>
        </div>
      </QueryGate>
    </AdminPage>
  );
}
