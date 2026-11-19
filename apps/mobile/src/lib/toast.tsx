import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { View } from "react-native";

import { Text } from "@/components/ui/Text";

const TOAST_MS = 2300;
const ToastContext = createContext<(message: string) => void>(() => undefined);

/** Short confirmation at the bottom of the screen; one at a time, gone after a moment. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const show = useCallback((next: string) => {
    clearTimeout(timer.current);
    setMessage(next);
    timer.current = setTimeout(() => setMessage(null), TOAST_MS);
  }, []);
  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <ToastContext value={show}>
      {children}
      {message ? (
        <View
          pointerEvents="none"
          accessible
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
          className="absolute bottom-24 left-4 right-4 rounded-lg bg-text px-4 py-3"
        >
          <Text className="text-center font-ui-semibold text-background">{message}</Text>
        </View>
      ) : null}
    </ToastContext>
  );
}

export const useToast = () => useContext(ToastContext);
