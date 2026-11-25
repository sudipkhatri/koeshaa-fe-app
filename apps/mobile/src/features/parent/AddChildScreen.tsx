import { router } from "expo-router";
import { useState } from "react";
import { View } from "react-native";

import { Banner, Button, Header, LinkButton, Screen, Text, TextField } from "@/components/ui";
import { SelectField } from "@/features/onboarding/components/SelectField";
import { errorMessage, isNetworkError } from "@/lib/errors";
import { useLocale } from "@/lib/locale";
import type { MessageKey } from "@keoshaa/i18n";

import { useAddChild } from "./api";
import { addChildSchema } from "./schemas";
import type { AddChildValues, Relationship } from "./schemas";

const monthKeys = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
] as const;

const FIRST_YEAR = 2005;
const LAST_YEAR = 2022;

const RELATIONSHIPS: Relationship[] = ["mother", "father", "guardian"];

export function AddChildScreen() {
  const { t, formatDigits, formatClock } = useLocale();
  const add = useAddChild();
  const [values, setValues] = useState<AddChildValues>({
    name: "",
    day: "",
    month: "",
    year: "",
    relationship: "mother",
    identifier: "",
    password: "",
  });
  const [fieldError, setFieldError] = useState<Partial<Record<keyof AddChildValues, string>>>({});

  const range = (from: number, to: number) =>
    Array.from({ length: Math.abs(to - from) + 1 }, (_, i) => (from <= to ? from + i : from - i));
  const numbers = (list: number[]) =>
    list.map((n) => ({ value: String(n), label: formatDigits(n) }));

  const set = <K extends keyof AddChildValues>(key: K, value: AddChildValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setFieldError((prev) => ({ ...prev, [key]: undefined }));
    add.reset();
  };

  const submit = () => {
    const parsed = addChildSchema.safeParse(values);
    if (!parsed.success) {
      const next: Partial<Record<keyof AddChildValues, string>> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (typeof key === "string" && !(key in next)) {
          next[key as keyof AddChildValues] = t(issue.message as MessageKey);
        }
      }
      setFieldError(next);
      return;
    }
    add.mutate(parsed.data, {
      onSuccess: (child) => {
        if (child.id) {
          router.replace({ pathname: "/parent/child/[id]", params: { id: child.id } });
        } else {
          router.back();
        }
      },
    });
  };

  const serverError = add.error ? errorMessage(add.error, t, formatClock) : "";
  const noConnection = add.isError && isNetworkError(add.error);

  return (
    <Screen
      scroll
      edges={["top", "bottom"]}
      footer={
        <View className="gap-2">
          <Button
            title={noConnection ? t("common.noConnection") : t("parent.addSubmit")}
            size="lg"
            loading={add.isPending}
            disabled={add.isPending}
            onPress={submit}
          />
          <LinkButton title={t("parent.addSkip")} onPress={() => router.back()} />
        </View>
      }
    >
      <Header title={t("parent.addTitle")} onBack={() => router.back()} />
      <Text variant="headline" accessibilityRole="header" className="mt-2">
        {t("parent.addTitle")}
      </Text>
      <Text muted className="mb-4 mt-2">
        {t("parent.addBody")}
      </Text>

      <TextField
        label={t("parent.addName")}
        value={values.name}
        onChangeText={(name) => set("name", name)}
        error={fieldError.name}
        autoComplete="name"
      />

      <Text className="mb-2 mt-4 font-ui-semibold">{t("parent.addBirthday")}</Text>
      <View className="flex-row gap-2">
        <SelectField
          className="w-24"
          label={t("signup.day")}
          value={values.day}
          options={numbers(range(1, 31))}
          onChange={(day) => set("day", day)}
        />
        <SelectField
          className="flex-1"
          label={t("signup.month")}
          value={values.month}
          options={monthKeys.map((key, i) => ({
            value: String(i + 1),
            label: t(`months.${key}` as MessageKey),
          }))}
          onChange={(month) => set("month", month)}
        />
        <SelectField
          className="w-28"
          label={t("signup.year")}
          value={values.year}
          options={numbers(range(LAST_YEAR, FIRST_YEAR))}
          onChange={(year) => set("year", year)}
        />
      </View>
      {fieldError.day || fieldError.month || fieldError.year ? (
        <Text variant="small" className="mt-1 text-danger">
          {fieldError.day || fieldError.month || fieldError.year}
        </Text>
      ) : null}

      <View className="mt-4">
        <SelectField
          label={t("parent.addYouAre")}
          value={values.relationship}
          options={RELATIONSHIPS.map((value) => ({
            value,
            label: t(`parent.relationshipTitle.${value}` as MessageKey),
          }))}
          onChange={(relationship) => set("relationship", relationship as Relationship)}
        />
      </View>

      <View className="mt-4">
        <TextField
          label={t("parent.addIdentifier")}
          value={values.identifier}
          onChangeText={(identifier) => set("identifier", identifier)}
          error={fieldError.identifier}
          autoCapitalize="none"
          autoCorrect={false}
          hint={t("parent.addIdentifierHint")}
        />
      </View>

      <View className="mt-4">
        <TextField
          label={t("parent.addPassword")}
          value={values.password}
          onChangeText={(password) => set("password", password)}
          error={fieldError.password}
          secureTextEntry
          autoComplete="new-password"
          hint={t("parent.addPasswordHint")}
        />
      </View>

      <Banner icon="info" className="mt-4">
        {t("parent.addLinkedNote")}
      </Banner>
      {serverError ? (
        <Banner tone="danger" className="mt-3">
          {serverError}
        </Banner>
      ) : null}
    </Screen>
  );
}
