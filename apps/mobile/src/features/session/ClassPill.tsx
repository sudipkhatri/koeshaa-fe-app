import { Chip } from "@/components/ui";
import { useLocale } from "@/lib/locale";

import { useClassInfo } from "@/features/enrollment/api";

/** "Class 7" (with the stream for 11 and 12); taps through to change it when `onPress` is given. */
export function ClassPill({
  onPress,
  chevron,
}: {
  onPress?: () => void;
  /** Learn header: a down chevron instead of the cap icon. */
  chevron?: boolean;
}) {
  const { t, formatNumber } = useLocale();
  const { data } = useClassInfo();
  if (!data?.grade) {
    return <Chip label={t("learn.pickClassAction")} icon="cap" onPress={onPress} />;
  }
  const { grade, stream } = data;
  const n = formatNumber(grade);
  const label = stream
    ? t("common.classStream", { n, stream: t(`pick.${stream}`) })
    : t("common.classN", { n });
  return (
    <Chip
      label={label}
      icon={chevron ? undefined : "cap"}
      trailingIcon={chevron ? "chevd" : undefined}
      onPress={onPress}
      accessibilityLabel={t("common.yourClass", { class: label })}
    />
  );
}
