import { router } from "expo-router";
import { useState } from "react";
import { Pressable, View } from "react-native";

import {
  Banner,
  Button,
  Header,
  Screen,
  Segmented,
  StateView,
  Text,
  TextField,
  useQueryStateKind,
} from "@/components/ui";
import { cx } from "@/components/ui/cx";
import { streamIds, type StreamId } from "@/features/session/mock";
import { errorMessage } from "@/lib/errors";
import { useLocale } from "@/lib/locale";
import { useToast } from "@/lib/toast";
import type { MessageKey } from "@keoshaa/i18n";

import { useClassInfo, useSubjectPool } from "./api";
import {
  useSubmitChangeRequest,
  type ChangeReasonCode,
  type ChangeRequestType,
} from "./change-request-api";

const TYPES: ChangeRequestType[] = ["change_class", "change_stream", "change_optionals"];
const REASONS: ChangeReasonCode[] = [
  "wrong_class",
  "wrong_stream",
  "wrong_optionals",
  "school_change",
  "other",
];
const STREAM_FROM = 11;

export function AskChangeScreen() {
  const { t, formatNumber, formatClock } = useLocale();
  const toast = useToast();
  const info = useClassInfo();
  const submit = useSubmitChangeRequest();
  const [type, setType] = useState<ChangeRequestType>("change_class");
  const [reason, setReason] = useState<ChangeReasonCode>("wrong_class");
  const [reasonText, setReasonText] = useState("");
  const [grade, setGrade] = useState(0);
  const [stream, setStream] = useState<StreamId | null>(null);
  const [picked, setPicked] = useState<string[]>([]);

  const kind = useQueryStateKind({ ...info, hasData: info.data !== undefined });
  const data = info.data;
  const effectiveGrade = grade || data?.grade || 0;
  const pool = useSubjectPool(
    effectiveGrade,
    type === "change_stream" ? (stream ?? data?.stream ?? null) : stream,
    type === "change_optionals" && effectiveGrade > 0,
  );

  if (kind !== null || !data?.enrollmentId) {
    return (
      <Screen scroll edges={["top"]}>
        <Header title={t("enrolment.askAction")} onBack={() => router.back()} />
        {kind ? (
          <StateView kind={kind} onRetry={() => void info.refetch()} />
        ) : (
          <StateView
            kind="empty"
            title={t("enrolment.emptyTitle")}
            message={t("enrolment.emptyBody")}
          />
        )}
      </Screen>
    );
  }

  const needsText = reason === "other";
  const canSend =
    !submit.isPending &&
    (!needsText || reasonText.trim().length > 0) &&
    (type !== "change_class" || grade > 0) &&
    (type !== "change_stream" || !!stream) &&
    (type !== "change_optionals" || picked.length > 0);

  const send = () => {
    submit.mutate(
      {
        enrollmentId: data.enrollmentId!,
        type,
        reasonCode: reason,
        reasonText: reasonText.trim() || undefined,
        grade: type === "change_class" ? grade : data.grade,
        stream:
          type === "change_optionals"
            ? data.stream
            : type === "change_stream"
              ? stream
              : grade >= STREAM_FROM
                ? stream
                : null,
        optionalSubjectIds: type === "change_optionals" ? picked : undefined,
      },
      {
        onSuccess: () => {
          toast(t("enrolment.askSent"));
          router.back();
        },
      },
    );
  };

  return (
    <Screen
      scroll
      edges={["top", "bottom"]}
      footer={
        <Button
          title={t("enrolment.askSubmit")}
          size="lg"
          disabled={!canSend}
          loading={submit.isPending}
          onPress={send}
        />
      }
    >
      <Header title={t("enrolment.askAction")} onBack={() => router.back()} />
      <Text muted className="mb-4 mt-2">
        {t("enrolment.askFormBody")}
      </Text>
      {submit.error ? (
        <Banner tone="danger" className="mb-3">
          {errorMessage(submit.error, t, formatClock)}
        </Banner>
      ) : null}

      <Text className="mb-2 font-ui-semibold">{t("enrolment.askType")}</Text>
      <Segmented
        label={t("enrolment.askType")}
        value={type}
        onChange={setType}
        options={TYPES.map((value) => ({
          value,
          label: t(`enrolment.type.${value}` as MessageKey),
        }))}
      />

      <Text className="mb-2 mt-5 font-ui-semibold">{t("enrolment.askReason")}</Text>
      <View className="flex-row flex-wrap gap-2">
        {REASONS.map((code) => {
          const on = reason === code;
          return (
            <Pressable
              key={code}
              accessibilityRole="radio"
              accessibilityState={{ checked: on }}
              onPress={() => setReason(code)}
              className={cx(
                "min-h-11 rounded-full border px-3.5 py-2",
                on ? "border-primary bg-primary-tint" : "border-border bg-surface",
              )}
            >
              <Text className={on ? "font-ui-semibold text-primary" : undefined}>
                {t(`enrolment.reason.${code}` as MessageKey)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {needsText ? (
        <View className="mt-4">
          <TextField
            label={t("enrolment.askWhy")}
            value={reasonText}
            onChangeText={setReasonText}
          />
        </View>
      ) : null}

      {type === "change_class" ? (
        <View className="mt-5 gap-2">
          <Text className="font-ui-semibold">{t("enrolment.askNewClass")}</Text>
          <View className="flex-row flex-wrap gap-2">
            {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => {
              const on = grade === n;
              return (
                <Pressable
                  key={n}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                  onPress={() => {
                    setGrade(n);
                    if (n < STREAM_FROM) setStream(null);
                  }}
                  className={cx(
                    "h-12 w-12 items-center justify-center rounded-lg border",
                    on ? "border-primary bg-primary-tint" : "border-border bg-surface",
                  )}
                >
                  <Text className="font-ui-bold">{formatNumber(n)}</Text>
                </Pressable>
              );
            })}
          </View>
          {grade >= STREAM_FROM ? <StreamPick value={stream} onChange={setStream} /> : null}
        </View>
      ) : null}

      {type === "change_stream" ? <StreamPick value={stream} onChange={setStream} /> : null}

      {type === "change_optionals" ? (
        <View className="mt-5 gap-2">
          <Text className="font-ui-semibold">{t("enrolment.askOptionals")}</Text>
          {pool.isError ? (
            <StateView kind="error" onRetry={() => void pool.refetch()} />
          ) : (
            (pool.data?.optional ?? []).map((subject) => {
              const on = picked.includes(subject.id);
              return (
                <Pressable
                  key={subject.id}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: on }}
                  onPress={() =>
                    setPicked((prev) =>
                      on ? prev.filter((id) => id !== subject.id) : [...prev, subject.id],
                    )
                  }
                  className={cx(
                    "min-h-12 justify-center rounded-lg border px-3 py-2",
                    on ? "border-primary bg-primary-tint" : "border-border bg-surface",
                  )}
                >
                  <Text className="font-ui-semibold">{subject.name}</Text>
                </Pressable>
              );
            })
          )}
        </View>
      ) : null}
    </Screen>
  );
}

function StreamPick({
  value,
  onChange,
}: {
  value: StreamId | null;
  onChange: (stream: StreamId) => void;
}) {
  const { t } = useLocale();
  return (
    <View className="mt-3 gap-2">
      <Text className="font-ui-semibold">{t("enrolment.askStream")}</Text>
      {streamIds.map((id) => {
        const on = value === id;
        return (
          <Pressable
            key={id}
            accessibilityRole="radio"
            accessibilityState={{ checked: on }}
            onPress={() => onChange(id)}
            className={cx(
              "min-h-12 justify-center rounded-lg border px-3 py-2",
              on ? "border-primary bg-primary-tint" : "border-border bg-surface",
            )}
          >
            <Text className="font-ui-semibold">{t(`pick.${id}`)}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
