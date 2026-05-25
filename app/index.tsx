import { Redirect } from 'expo-router';

import { useAppStore } from '../store/useAppStore';

export default function Index() {
  const onboardingComplete = useAppStore((state) => state.onboardingComplete);

  if (!onboardingComplete) {
    return <Redirect href="/onboarding" />;
  }

  return <Redirect href="/(tabs)" />;
}
