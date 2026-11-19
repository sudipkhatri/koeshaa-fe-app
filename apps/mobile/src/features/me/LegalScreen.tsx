import { useState } from "react";
import { ScrollView } from "react-native";

import {
  Button,
  Group,
  GroupRow,
  Header,
  Screen,
  Sheet,
  StateView,
  Text,
  useQueryStateKind,
} from "@/components/ui";
import { useLegalPage } from "@/features/legal/api";
import { isMockMode } from "@/lib/config";
import { useLocale } from "@/lib/locale";

type Doc = "terms" | "privacy";

/** Terms and Privacy summaries in a sheet; shared with the consents step through `LegalSheet`. */
export function LegalSheet({ doc, onClose }: { doc: Doc | null; onClose: () => void }) {
  const { t } = useLocale();
  const page = useLegalPage(doc ?? "terms", doc !== null);
  const published = page.data;
  const queryKind = useQueryStateKind({ ...page, hasData: !!published || doc === null });
  const kind = queryKind === "loading" && isMockMode() ? null : queryKind;
  return (
    <Sheet
      visible={doc !== null}
      onClose={onClose}
      title={doc ? (published?.title ?? t(`legal.${doc}`)) : undefined}
    >
      {kind !== null ? (
        <StateView kind={kind} onRetry={() => void page.refetch()} />
      ) : published ? (
        <>
          <ScrollView className="max-h-96">
            <Text>{published.body}</Text>
          </ScrollView>
          <Text variant="small">{t("legal.version", { version: published.version })}</Text>
        </>
      ) : (
        <>
          <Text>{doc ? t(doc === "terms" ? "legal.termsBody" : "legal.privacyBody") : ""}</Text>
          <Text variant="small">{t(isMockMode() ? "legal.note" : "legal.summaryNote")}</Text>
        </>
      )}
      <Button title={t("common.gotIt")} onPress={onClose} />
    </Sheet>
  );
}

export function LegalScreen() {
  const { t } = useLocale();
  const [doc, setDoc] = useState<Doc | null>(null);
  return (
    <Screen scroll edges={["top"]}>
      <Header title={t("me.legal")} />
      <Group>
        <GroupRow
          first
          icon="notes"
          iconTone="neutral"
          title={t("legal.terms")}
          onPress={() => setDoc("terms")}
        />
        <GroupRow
          icon="shield"
          iconTone="green"
          title={t("legal.privacy")}
          onPress={() => setDoc("privacy")}
        />
      </Group>
      <LegalSheet doc={doc} onClose={() => setDoc(null)} />
    </Screen>
  );
}
