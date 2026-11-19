import AsyncStorage from "@react-native-async-storage/async-storage";

/** Non-secret preferences only (theme, language). Secrets go to `expo-secure-store`. */
const PREFIX = "keoshaa.pref.";

export async function readPreference(key: string): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(PREFIX + key);
  } catch {
    return null;
  }
}

export async function writePreference(key: string, value: string): Promise<void> {
  try {
    await AsyncStorage.setItem(PREFIX + key, value);
  } catch {
    // A preference that fails to save is not worth interrupting the user for.
  }
}
