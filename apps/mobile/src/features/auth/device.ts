import * as Device from "expo-device";

/** A label for this install. Never a token or an account id. */
export function deviceName(): string | null {
  return Device.deviceName ?? Device.modelName ?? null;
}
