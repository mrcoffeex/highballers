import { Redirect, useGlobalSearchParams } from "@/lib/expoRouter";

import { AppSplashScreen } from "../components/AppSplashScreen";
import { isSupabaseEnabled } from "../lib/config";
import { paramsHaveOAuthPayload } from "../lib/googleAuth";
import { useAppStore } from "../store/useAppStore";

export default function Index() {
  const params = useGlobalSearchParams();
  const session = useAppStore((state) => state.session);
  const authReady = useAppStore((state) => state.authReady);
  const onboardingComplete = useAppStore((state) => state.onboardingComplete);

  if (paramsHaveOAuthPayload(params)) {
    if (session) {
      return <Redirect href="/" />;
    }

    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      const next = Array.isArray(value) ? value[0] : value;
      if (typeof next === "string") query.set(key, next);
    }
    const qs = query.toString();
    return <Redirect href={qs ? `/oauth-callback?${qs}` : "/oauth-callback"} />;
  }

  if (isSupabaseEnabled && !session) {
    return <Redirect href="/auth" />;
  }

  if (isSupabaseEnabled && session && !authReady) {
    return <AppSplashScreen message="Loading your profile…" />;
  }

  if (!onboardingComplete) {
    return <Redirect href="/onboarding" />;
  }

  return <Redirect href="/(tabs)" />;
}
