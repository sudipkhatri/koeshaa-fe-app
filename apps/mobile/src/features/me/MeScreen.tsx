import { router } from "expo-router";
import { useState } from "react";
import { View } from "react-native";

import {
  Button,
  Card,
  Group,
  GroupRow,
  Screen,
  Sheet,
  StateView,
  Text,
  useQueryStateKind,
} from "@/components/ui";
import { useSubjects } from "@/features/learn/api";
import { chaptersDoneTotal } from "@/features/learn/progress";
import { ClassPill, MAX_DEVICES, useSession } from "@/features/session";
import { isMockMode } from "@/lib/config";
import { useLocale } from "@/lib/locale";
import { useToast } from "@/lib/toast";

import { useDevices, useProfile } from "./api";
import { STATS } from "./mock";

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View className="flex-1 items-center rounded-lg bg-surface-muted px-1 py-3">
      <Text variant="title">{value}</Text>
      <Text variant="caption">{label}</Text>
    </View>
  );
}

export function MeScreen() {
  const { t, formatNumber } = useLocale();
  const session = useSession();
  const toast = useToast();
  const profile = useProfile();
  const devices = useDevices();
  const { subjects } = useSubjects();
  const [askOpen, setAskOpen] = useState(false);

  const signOut = (everywhere: boolean) => {
    setAskOpen(false);
    const done = everywhere ? session.signOutEverywhere() : session.signOut().then(() => true);
    void done.then((confirmed) => {
      router.replace("/onboarding/welcome");
      toast(t(confirmed ? "me.signedOutToast" : "me.signOutEverywhereFailed"));
    });
  };

  const kind = useQueryStateKind({ ...profile, hasData: !!profile.data });
  if (!profile.data) {
    return (
      <Screen edges={["top"]}>
        <StateView kind={kind ?? "loading"} onRetry={() => void profile.refetch()} />
      </Screen>
    );
  }
  const name = profile.data.name;

  return (
    <Screen scroll edges={["top"]}>
      <View className="min-h-14 justify-center">
        <Text variant="title" accessibilityRole="header">
          {t("me.title")}
        </Text>
      </View>
      <Card>
        <View className="flex-row items-center gap-4">
          <View className="h-16 w-16 items-center justify-center rounded-full bg-reward">
            <Text className="text-avatar font-ui-bold text-on-reward">
              {(name[0] ?? "A").toUpperCase()}
            </Text>
          </View>
          <View className="flex-1">
            <Text variant="title">{name}</Text>
            <ClassPill onPress={() => router.push("/me/enrolment")} />
          </View>
        </View>
        {isMockMode() ? (
          <View className="mt-4 flex-row gap-2">
            <Stat value={formatNumber(chaptersDoneTotal(subjects))} label={t("me.chaptersDone")} />
            <Stat value={formatNumber(STATS.minutes)} label={t("me.minutes")} />
            <Stat value={formatNumber(STATS.streak)} label={t("me.dayStreak")} />
          </View>
        ) : null}
      </Card>

      <Text variant="caption" className="mx-1 mb-2 mt-5 font-ui-bold">
        {t("me.account")}
      </Text>
      <Group>
        <GroupRow
          first
          icon="cap"
          iconTone="primary"
          title={t("me.enrolment")}
          subtitle={t("me.enrolmentSub")}
          onPress={() => router.push("/me/enrolment")}
        />
        <GroupRow
          icon="phone"
          iconTone="sky"
          title={t("me.devices")}
          subtitle={t("me.devicesInUse", {
            n: devices.data ? formatNumber(devices.data.length) : "-",
            max: formatNumber(MAX_DEVICES),
          })}
          onPress={() => router.push("/me/devices")}
        />
        <GroupRow
          icon="shield"
          iconTone="green"
          title={t("me.changePassword")}
          subtitle={t("me.changePasswordSub")}
          onPress={() => router.push("/me/password")}
        />
        <GroupRow
          icon="link"
          iconTone="grape"
          title={t("me.linkedParent")}
          subtitle={session.parent.sent ? t("me.inviteSent") : t("me.notLinked")}
          onPress={() => router.push("/me/parent")}
        />
      </Group>

      <Text variant="caption" className="mx-1 mb-2 mt-5 font-ui-bold">
        {t("me.preferences")}
      </Text>
      <Group>
        <GroupRow
          first
          icon="globe"
          iconTone="sky"
          title={t("me.settings")}
          subtitle={t("me.settingsSub")}
          onPress={() => router.push("/me/settings")}
        />
        <GroupRow
          icon="shield"
          iconTone="green"
          title={t("me.legal")}
          onPress={() => router.push("/me/legal")}
        />
      </Group>

      <Text variant="caption" className="mx-1 mb-2 mt-5 font-ui-bold">
        {t("me.dangerZone")}
      </Text>
      <Group>
        <GroupRow
          first
          danger
          icon="trash"
          iconTone="danger"
          title={t("me.closeAccount")}
          onPress={() => router.push("/me/close")}
        />
      </Group>

      <Button
        title={t("me.signOut")}
        icon="logout"
        variant="secondary"
        size="lg"
        className="mt-6"
        onPress={() => setAskOpen(true)}
      />

      <Sheet visible={askOpen} onClose={() => setAskOpen(false)} title={t("me.signOutTitle")}>
        <Text muted>{t("me.signOutBody")}</Text>
        <Button title={t("me.signOut")} onPress={() => signOut(false)} />
        <Button
          title={t("me.signOutEverywhere")}
          variant="secondary"
          onPress={() => signOut(true)}
        />
        <Button title={t("me.stay")} variant="ghost" onPress={() => setAskOpen(false)} />
      </Sheet>
    </Screen>
  );
}
