import { Redirect } from 'expo-router';

import { isSupabaseEnabled } from '../lib/config';
import { useAppStore } from '../store/useAppStore';

export default function Index() {
  const session = useAppStore((state) => state.session);
  const onboardingComplete = useAppStore((state) => state.onboardingComplete);

  if (isSupabaseEnabled && !session) {
    return <Redirect href="/auth" />;
  }

  if (!onboardingComplete) {
    return <Redirect href="/onboarding" />;
  }

  return <Redirect href="/(tabs)" />;
}
