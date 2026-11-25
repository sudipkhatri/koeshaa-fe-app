import { LocaleProvider } from "@/lib/locale";

import { LandingPage } from "@/features/home/LandingPage";

export default function Home() {
  return (
    <LocaleProvider>
      <LandingPage />
    </LocaleProvider>
  );
}
