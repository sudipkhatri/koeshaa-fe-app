import type { Locale } from "@keoshaa/i18n";

import type { Bilingual } from "./types";

export const localized = (text: Bilingual, locale: Locale): string => text[locale];
