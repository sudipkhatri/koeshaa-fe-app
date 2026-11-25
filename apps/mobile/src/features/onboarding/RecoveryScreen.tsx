import { zodResolver } from "@hookform/resolvers/zod";
import type { MessageKey } from "@keoshaa/i18n";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { View } from "react-native";

import { Banner, Button, Header, Screen, Text, TextField } from "@/components/ui";
import { useRecoveryRequest } from "@/features/auth/api";
import { recoverySchema } from "@/features/auth/schemas";
import type { RecoveryValues } from "@/features/auth/schemas";
import { errorMessage, isNetworkError } from "@/lib/errors";
import { useLocale } from "@/lib/locale";

import { IdentifierField } from "./components/IdentifierField";

const fieldMessages: Record<string, MessageKey> = {
  "recovery.nameShort": "recovery.nameShort",
  "recovery.nameLong": "recovery.nameLong",
  "recovery.noteLong": "recovery.noteLong",
  "identifier.invalid": "identifier.invalid",
};

/** Ask support to call back. Nothing here proves who the person is (ACC-13.2). */
export function RecoveryScreen() {
  const { t, formatClock } = useLocale();
  const request = useRecoveryRequest();
  const [reference, setReference] = useState<string | null>(null);
  const { control, handleSubmit } = useForm<RecoveryValues>({
    resolver: zodResolver(recoverySchema),
    defaultValues: { name: "", callbackPhone: "", knownIdentifier: "", note: "" },
  });

  const fieldError = (message?: string) => {
    const key = message ? fieldMessages[message] : undefined;
    return key ? t(key) : undefined;
  };

  if (reference) {
    return (
      <Screen edges={["top", "bottom"]}>
        <Header title={t("recovery.doneTitle")} />
        <Text muted className="mb-4">
          {t("recovery.doneBody")}
        </Text>
        <Text variant="caption">{t("recovery.referenceLabel")}</Text>
        <Text selectable variant="title" className="mt-1">
          {reference}
        </Text>
      </Screen>
    );
  }

  return (
    <Screen
      scroll
      edges={["top", "bottom"]}
      footer={
        <Button
          title={isNetworkError(request.error) ? t("common.noConnection") : t("recovery.send")}
          size="lg"
          loading={request.isPending}
          onPress={handleSubmit((values) =>
            request.mutate(values, { onSuccess: (result) => setReference(result.reference) }),
          )}
        />
      }
    >
      <Header title={t("recovery.title")} />
      <Text muted className="mb-4">
        {t("recovery.intro")}
      </Text>
      <View className="gap-3">
        <Controller
          control={control}
          name="name"
          render={({ field, fieldState }) => (
            <TextField
              label={t("recovery.name")}
              value={field.value}
              onChangeText={field.onChange}
              autoComplete="name"
              error={fieldError(fieldState.error?.message)}
            />
          )}
        />
        <Controller
          control={control}
          name="callbackPhone"
          render={({ field, fieldState }) => (
            <TextField
              label={t("recovery.phone")}
              value={field.value}
              onChangeText={field.onChange}
              keyboardType="phone-pad"
              autoComplete="tel"
              error={fieldError(fieldState.error?.message)}
            />
          )}
        />
        <Controller
          control={control}
          name="knownIdentifier"
          render={({ field, fieldState }) => (
            <IdentifierField
              label={t("recovery.known")}
              value={field.value}
              onChangeText={field.onChange}
              error={fieldError(fieldState.error?.message)}
            />
          )}
        />
        <Controller
          control={control}
          name="note"
          render={({ field, fieldState }) => (
            <TextField
              label={t("recovery.note")}
              value={field.value}
              onChangeText={field.onChange}
              error={fieldError(fieldState.error?.message)}
            />
          )}
        />
      </View>
      {request.error ? (
        <Banner tone="danger" className="mt-3">
          {errorMessage(request.error, t, formatClock)}
        </Banner>
      ) : null}
    </Screen>
  );
}
