import { render } from "@testing-library/react-native";
import type { ReactElement } from "react";

import { SessionRoot } from "@/features/session";
import type { SessionCore } from "@/features/session/core";

import { AppProviders } from "@/lib/providers";
import { defaultPreferences } from "@/lib/preferences";
import type { Preferences } from "@/lib/preferences";

/** Renders inside the same providers the app uses; pass preferences to start in Nepali or dark. */
export function renderWithProviders(
  ui: ReactElement,
  preferences?: Partial<Preferences>,
  core?: SessionCore | null,
) {
  return render(
    <AppProviders initial={{ ...defaultPreferences, ...preferences }} retryQueries={false}>
      <SessionRoot {...(core !== undefined ? { core } : {})}>{ui}</SessionRoot>
    </AppProviders>,
  );
}
