import "../../global.css";

import {
  Baloo2_400Regular,
  Baloo2_500Medium,
  Baloo2_600SemiBold,
  Baloo2_700Bold,
  useFonts,
} from "@expo-google-fonts/baloo-2";
import { fontFamily } from "@keoshaa/tokens";
import { Stack, router, usePathname } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";

import { SessionRoot, useSession } from "@/features/session";
import { useLocale } from "@/lib/locale";
import { defaultPreferences, loadPreferences } from "@/lib/preferences";
import type { Preferences } from "@/lib/preferences";
import { AppProviders } from "@/lib/providers";
import { useTheme } from "@/lib/theme";
import { useToast } from "@/lib/toast";

void SplashScreen.preventAutoHideAsync();

const fonts = {
  [fontFamily.regular]: Baloo2_400Regular,
  [fontFamily.medium]: Baloo2_500Medium,
  [fontFamily.semibold]: Baloo2_600SemiBold,
  [fontFamily.bold]: Baloo2_700Bold,
};

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(fonts);
  const [preferences, setPreferences] = useState<Preferences | null>(null);

  useEffect(() => {
    // A storage failure must never leave the app on the splash screen: fall back to defaults.
    loadPreferences()
      .catch(() => defaultPreferences)
      .then(setPreferences);
  }, []);

  const ready = (fontsLoaded || fontError !== null) && preferences !== null;

  useEffect(() => {
    if (ready) void SplashScreen.hide();
  }, [ready]);

  if (!ready) return null;
  return (
    <AppProviders initial={preferences}>
      <SessionRoot>
        <ThemedStack />
      </SessionRoot>
    </AppProviders>
  );
}

/** When the backend ends the session (another device, sign-out everywhere) go to the front door. */
function SessionWatcher() {
  const { status, endedCode } = useSession();
  const { t } = useLocale();
  const toast = useToast();
  const previous = useRef(status);
  const pathname = usePathname();
  useEffect(() => {
    // The "account closed" screen stays until its own button is pressed.
    if (previous.current === "signedIn" && status === "signedOut" && pathname !== "/me/close") {
      router.replace("/onboarding/welcome");
      if (endedCode)
        toast(
          t(
            endedCode === "SIGNED_OUT_FOR_DEVICE"
              ? "errors.SIGNED_OUT_FOR_DEVICE"
              : "errors.SESSION_ENDED",
          ),
        );
    }
    previous.current = status;
  }, [status, endedCode, pathname, t, toast]);
  return null;
}

function ThemedStack() {
  const { scheme } = useTheme();
  return (
    <>
      <SessionWatcher />
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}
