import { router } from "expo-router";
import { useState } from "react";
import { Pressable, View } from "react-native";

import { Banner, Button, Header, Icon, LinkButton, Screen, Text } from "@/components/ui";
import { cx } from "@/components/ui/cx";
import { useRegisterStudent } from "@/features/auth/api";
import { LegalSheet } from "@/features/me/LegalScreen";
import { errorMessage } from "@/lib/errors";
import { useLocale } from "@/lib/locale";
import { useTheme } from "@/lib/theme";

import { StepBar } from "./components/StepBar";

type Doc = "terms" | "privacy";

function Consent({
  lead,
  doc,
  checked,
  onToggle,
  onOpen,
}: {
  lead: string;
  doc: Doc;
  checked: boolean;
  onToggle: () => void;
  onOpen: () => void;
}) {
  const { t } = useLocale();
  const { colors } = useTheme();
  const label = t(doc === "terms" ? "legal.terms" : "legal.privacy");
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={`${lead} ${label}`}
      onPress={onToggle}
      className="min-h-12 flex-row items-start gap-3 py-2"
    >
      <View
        className={cx(
          "mt-0.5 h-7 w-7 items-center justify-center rounded-md border-2",
          checked ? "border-primary bg-primary" : "border-text-muted",
        )}
      >
        {checked ? <Icon name="check" size={18} color={colors.onPrimary} /> : null}
      </View>
      <Text className="flex-1">
        {lead}{" "}
        <Text
          accessibilityRole="link"
          className="font-ui-semibold text-primary underline"
          onPress={onOpen}
        >
          {label}
        </Text>
      </Text>
    </Pressable>
  );
}

export function ConsentsScreen() {
  const { t, formatClock } = useLocale();
  const register = useRegisterStudent();
  const [terms, setTerms] = useState(false);
  const [privacy, setPrivacy] = useState(false);
  const [doc, setDoc] = useState<Doc | null>(null);
  return (
    <Screen
      scroll
      edges={["top", "bottom"]}
      footer={
        <Button
          title={t("signup.agreeButton")}
          size="lg"
          disabled={!(terms && privacy)}
          loading={register.isPending}
          onPress={() =>
            register.mutate(undefined, { onSuccess: () => router.replace("/onboarding/success") })
          }
        />
      }
    >
      <Header title={t("signup.almostThere")} />
      <StepBar step={4} />
      <Text variant="headline" accessibilityRole="header" className="my-2">
        {t("signup.agreeTitle")}
      </Text>
      <Consent
        lead={t("signup.iAgree")}
        doc="terms"
        checked={terms}
        onToggle={() => setTerms(!terms)}
        onOpen={() => setDoc("terms")}
      />
      <Consent
        lead={t("signup.iRead")}
        doc="privacy"
        checked={privacy}
        onToggle={() => setPrivacy(!privacy)}
        onOpen={() => setDoc("privacy")}
      />
      {register.error ? (
        <>
          <Banner tone="danger" className="mt-3">
            {errorMessage(register.error, t, formatClock)}
          </Banner>
          <LinkButton
            title={t("code.getNew")}
            className="mt-2 self-start"
            onPress={() => router.replace("/onboarding/signup-contact")}
          />
        </>
      ) : null}
      <LegalSheet doc={doc} onClose={() => setDoc(null)} />
    </Screen>
  );
}
