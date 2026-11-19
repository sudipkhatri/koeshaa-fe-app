import { router } from "expo-router";

import { useSession } from "@/features/session";
import { useLocale } from "@/lib/locale";

import { StepBar } from "./components/StepBar";
import { PasswordStep } from "./NewPasswordScreen";

export function SignupPasswordScreen() {
  const { t } = useLocale();
  const { updateSignup } = useSession();
  return (
    <PasswordStep
      title={t("signup.title")}
      step={<StepBar step={3} />}
      intro={t("password.makeSub")}
      label={t("auth.passwordLabel")}
      actionLabel={t("common.next")}
      onDone={(password) => {
        updateSignup({ password });
        router.push("/onboarding/consents");
      }}
    />
  );
}
