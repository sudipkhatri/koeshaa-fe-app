import { TextField } from "@/components/ui";
import { useLocale } from "@/lib/locale";

import { kindOf } from "../rules";

interface IdentifierFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string | undefined;
}

/** Phone, email or username: shows +977 and what we recognised as the user types. */
export function IdentifierField({ label, value, onChangeText, error }: IdentifierFieldProps) {
  const { t } = useLocale();
  const kind = kindOf(value);
  const hint = {
    email: t("auth.kindEmail"),
    phone: t("auth.kindPhone"),
    user: t("auth.kindUser"),
    "": undefined,
  }[kind];
  return (
    <TextField
      label={label}
      value={value}
      onChangeText={onChangeText}
      prefix={kind === "phone" ? "+977" : undefined}
      hint={hint}
      error={error}
      autoComplete="username"
    />
  );
}
