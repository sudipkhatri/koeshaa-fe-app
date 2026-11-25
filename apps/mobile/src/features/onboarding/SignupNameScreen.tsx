import { router } from "expo-router";
import { useState } from "react";
import { View } from "react-native";

import { Banner, Button, Header, Screen, Text, TextField } from "@/components/ui";
import { useSession } from "@/features/session";
import { useLocale } from "@/lib/locale";
import type { MessageKey } from "@keoshaa/i18n";

import { SelectField } from "./components/SelectField";
import { StepBar } from "./components/StepBar";
import { UNDER_AGE, ageFrom } from "./rules";

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

export function SignupNameScreen() {
  const { t, formatDigits } = useLocale();
  const { signup, updateSignup } = useSession();
  const [message, setMessage] = useState("");
  const range = (from: number, to: number) =>
    Array.from({ length: Math.abs(to - from) + 1 }, (_, i) => (from <= to ? from + i : from - i));
  const numbers = (list: number[]) =>
    list.map((n) => ({ value: String(n), label: formatDigits(n) }));

  const parent = signup.role === "parent";
  const next = () => {
    if (!signup.name.trim()) return setMessage(t("signup.fillName"));
    if (parent) return router.push("/onboarding/signup-contact");
    if (!signup.day || !signup.month || !signup.year) return setMessage(t("signup.fillAll"));
    const age = ageFrom(Number(signup.year), Number(signup.month), Number(signup.day));
    router.push(age < UNDER_AGE ? "/onboarding/under-13" : "/onboarding/signup-contact");
  };

  return (
    <Screen
      scroll
      edges={["top", "bottom"]}
      footer={<Button title={t("common.next")} size="lg" onPress={next} />}
    >
      <Header title={t("signup.title")} />
      <StepBar step={1} />
      <Text variant="headline" accessibilityRole="header" className="my-2">
        {t("signup.niceTitle")}
      </Text>
      <TextField
        label={t("signup.nameLabel")}
        placeholder={t("signup.namePlaceholder")}
        value={signup.name}
        onChangeText={(name) => {
          updateSignup({ name });
          setMessage("");
        }}
        autoComplete="given-name"
      />
      {parent ? null : (
        <>
          <Text className="mb-2 mt-4 font-ui-semibold">{t("signup.birthdayLabel")}</Text>
          <View className="flex-row gap-2">
            <SelectField
              className="w-24"
              label={t("signup.day")}
              value={signup.day}
              options={numbers(range(1, 31))}
              onChange={(day) => updateSignup({ day })}
            />
            <SelectField
              className="flex-1"
              label={t("signup.month")}
              value={signup.month}
              options={monthKeys.map((key, i) => ({
                value: String(i + 1),
                label: t(`months.${key}` as MessageKey),
              }))}
              onChange={(month) => updateSignup({ month })}
            />
            <SelectField
              className="w-28"
              label={t("signup.year")}
              value={signup.year}
              options={numbers(range(LAST_YEAR, FIRST_YEAR))}
              onChange={(year) => updateSignup({ year })}
            />
          </View>
          <Text variant="small" className="mt-2">
            {t("signup.birthHint")}
          </Text>
        </>
      )}
      {message ? (
        <Banner tone="danger" className="mt-3">
          {message}
        </Banner>
      ) : null}
    </Screen>
  );
}
