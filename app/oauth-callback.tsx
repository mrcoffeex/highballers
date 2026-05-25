import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import {
  clearOAuthCallbackUrl,
  createSessionFromUrl,
  getOAuthCallbackUrl,
} from '../lib/googleAuth';
import { colors, spacing, typography } from '../lib/theme';
import { useAppStore } from '../store/useAppStore';

export default function OAuthCallbackScreen() {
  const router = useRouter();
  const syncSessionFromSupabase = useAppStore((state) => state.syncSessionFromSupabase);
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const timeout = setTimeout(() => {
      setError('Sign in timed out. Please try again.');
    }, 30000);

    (async () => {
      try {
        const href = await getOAuthCallbackUrl();

        if (!href || !href.includes('oauth-callback')) {
          setError('Missing OAuth redirect. Please try signing in again.');
          return;
        }

        const message = await createSessionFromUrl(href);
        if (message) {
          setError(message);
          return;
        }

        const session = await syncSessionFromSupabase();
        if (!session) {
          setError('Signed in with Google but no session was created. Please try again.');
          return;
        }

        clearOAuthCallbackUrl();
        router.replace('/');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Google sign in failed.');
      } finally {
        clearTimeout(timeout);
      }
    })();

    return () => {
      clearTimeout(timeout);
    };
  }, [router, syncSessionFromSupabase]);

  return (
    <View style={styles.container}>
      {error ? (
        <>
          <Text style={styles.errorTitle}>Sign in failed</Text>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={() => router.replace('/auth')} style={styles.retryBtn}>
            <Text style={styles.retryText}>Back to sign in</Text>
          </Pressable>
        </>
      ) : (
        <>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Finishing Google sign in...</Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  loadingText: {
    ...typography.body,
    color: colors.textMuted,
    marginTop: spacing.md,
  },
  errorTitle: {
    ...typography.heading,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  errorText: {
    ...typography.body,
    color: colors.error,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  retryBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  retryText: {
    ...typography.heading,
    color: colors.primary,
    fontSize: 16,
  },
});
