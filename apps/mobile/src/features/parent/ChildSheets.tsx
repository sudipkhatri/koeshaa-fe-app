import { View } from "react-native";

import { Banner, Button, Sheet, Text, TextField } from "@/components/ui";
import { useLocale } from "@/lib/locale";

import type { ChildDevice } from "./api";

export function SignOutDeviceSheet({
  device,
  loading,
  onClose,
  onConfirm,
}: {
  device: ChildDevice | null;
  loading: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const { t } = useLocale();
  return (
    <Sheet
      visible={device !== null}
      onClose={onClose}
      title={device ? t("devices.askTitle", { device: device.name }) : undefined}
    >
      <Text muted>{t("devices.askBody")}</Text>
      <Button
        title={t("devices.yes")}
        variant="danger"
        className="mt-4"
        loading={loading}
        onPress={onConfirm}
      />
      <Button title={t("devices.keep")} variant="ghost" className="mt-2" onPress={onClose} />
    </Sheet>
  );
}

export function ChildPasswordSheet({
  visible,
  newPassword,
  parentPassword,
  error,
  loading,
  onChangeNew,
  onChangeParent,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  newPassword: string;
  parentPassword: string;
  error: string;
  loading: boolean;
  onChangeNew: (value: string) => void;
  onChangeParent: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  const { t } = useLocale();
  return (
    <Sheet visible={visible} onClose={onClose} title={t("parent.detailSetPassword")}>
      <TextField
        label={t("parent.detailNewPassword")}
        value={newPassword}
        onChangeText={onChangeNew}
        secureTextEntry
        autoComplete="new-password"
      />
      <View className="mt-3">
        <TextField
          label={t("parent.detailParentPassword")}
          value={parentPassword}
          onChangeText={onChangeParent}
          secureTextEntry
        />
      </View>
      {error ? (
        <Banner tone="danger" className="mt-3">
          {error}
        </Banner>
      ) : null}
      <Button
        title={t("parent.detailSetPassword")}
        className="mt-4"
        loading={loading}
        onPress={onSubmit}
      />
    </Sheet>
  );
}

export function ChildCloseSheet({
  visible,
  password,
  error,
  loading,
  onChangePassword,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  password: string;
  error: string;
  loading: boolean;
  onChangePassword: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  const { t } = useLocale();
  return (
    <Sheet visible={visible} onClose={onClose} title={t("parent.detailCloseConfirm")}>
      <Text muted className="mb-3">
        {t("parent.detailCloseBody")}
      </Text>
      <TextField
        label={t("closeAccount.passwordLabel")}
        value={password}
        onChangeText={onChangePassword}
        secureTextEntry
      />
      {error ? (
        <Banner tone="danger" className="mt-3">
          {error}
        </Banner>
      ) : null}
      <Button
        title={t("parent.detailCloseConfirm")}
        variant="danger"
        className="mt-4"
        loading={loading}
        onPress={onSubmit}
      />
    </Sheet>
  );
}
