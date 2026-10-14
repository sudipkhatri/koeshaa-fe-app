import { defaultLocale, t } from "@keoshaa/i18n";
import { color, fontSize, space } from "@keoshaa/tokens";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.content}>
        <Text accessibilityRole="header" style={styles.title}>
          {t(defaultLocale, "app.name")}
        </Text>
        <Text style={styles.tagline}>{t(defaultLocale, "app.tagline")}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.background },
  content: { flex: 1, justifyContent: "center", gap: space[3], paddingHorizontal: space[5] },
  title: { fontSize: fontSize.xxl, fontWeight: "600", color: color.brand },
  tagline: { fontSize: fontSize.lg, color: color.textMuted },
});
