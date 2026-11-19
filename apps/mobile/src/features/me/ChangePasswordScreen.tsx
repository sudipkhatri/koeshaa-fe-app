import { zodResolver } from "@hookform/resolvers/zod";
import { passwordSchema } from "@keoshaa/core";
import type { MessageKey } from "@keoshaa/i18n";
import { router } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { View } from "react-native";
import { z } from "zod";

import { Banner, Button, Header, Screen, Text, TextField } from "@/components/ui";
import { errorMessage } from "@/lib/errors";
import { useLocale } from "@/lib/locale";
import { useToast } from "@/lib/toast";

import { useChangePassword } from "./api";

const schema = z
  .object({
    current: z.string().min(1, { error: "identifier.required" }),
    next: passwordSchema,
    again: z.string(),
  })
  .refine((v) => v.next === v.again, { path: ["again"], error: "password.mismatch" });
type Values = z.infer<typeof schema>;

export function ChangePasswordScreen() {
  const { t, formatClock } = useLocale();
  const toast = useToast();
  const change = useChangePassword();
  const { control, handleSubmit } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { current: "", next: "", again: "" },
  });
  const submit = handleSubmit((v) =>
    change.mutate(
      { currentPassword: v.current, newPassword: v.next },
      {
        onSuccess: () => {
          toast(t("password.changed"));
          router.back();
        },
      },
    ),
  );
  const field = (
    name: keyof Values,
    label: string,
    autoComplete: "current-password" | "new-password",
  ) => (
    <Controller
      control={control}
      name={name}
      render={({ field: f, fieldState }) => (
        <TextField
          label={label}
          secureTextEntry
          value={f.value}
          onChangeText={(text) => {
            f.onChange(text);
            change.reset();
          }}
          autoComplete={autoComplete}
          error={fieldState.error ? t(fieldState.error.message as MessageKey) : undefined}
        />
      )}
    />
  );
  return (
    <Screen
      scroll
      edges={["top", "bottom"]}
      footer={
        <Button
          title={t("password.changeButton")}
          size="lg"
          loading={change.isPending}
          onPress={submit}
        />
      }
    >
      <Header title={t("password.changeTitle")} />
      <Text muted className="mb-3 mt-2">
        {t("password.changeIntro")}
      </Text>
      <View className="gap-4">
        {field("current", t("password.currentLabel"), "current-password")}
        {field("next", t("password.newLabel"), "new-password")}
        {field("again", t("password.confirmLabel"), "new-password")}
      </View>
      {change.error ? (
        <Banner tone="danger" className="mt-3">
          {errorMessage(change.error, t, formatClock)}
        </Banner>
      ) : null}
    </Screen>
  );
}
