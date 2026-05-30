import { useLinkingURL } from "expo-linking";
import * as Linking from "expo-linking";
import { useGlobalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Skeleton, SkeletonCircle } from "../components/ui";

import {
  clearOAuthCallbackUrl,
  createSessionFromUrl,
  getOAuthRedirectUri,
  resolveOAuthCallbackHref,
  urlHasOAuthPayload,
} from "../lib/googleAuth";
import { colors, spacing, typography } from "../lib/theme";
import { useAppStore } from "../store/useAppStore";

export default function OAuthCallbackScreen() {
  const router = useRouter();
  const linkingUrl = useLinkingURL();
  const params = useGlobalSearchParams();
  const syncSessionFromSupabase = useAppStore(
    (state) => state.syncSessionFromSupabase,
  );
  const [error, setError] = useState<string | null>(null);
  const finishedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    const finish = async (incomingUrl?: string | null) => {
      if (finishedRef.current || cancelled) return;

      const href = await resolveOAuthCallbackHref({
        linkingUrl: incomingUrl ?? linkingUrl,
        params,
      });

      if (!href || !urlHasOAuthPayload(href)) {
        return;
      }

      finishedRef.current = true;

      const message = await createSessionFromUrl(href);
      if (message) {
        finishedRef.current = false;
        setError(message);
        return;
      }

      const session = await syncSessionFromSupabase();
      if (!session) {
        finishedRef.current = false;
        setError(
          "Signed in with Google but no session was created. Please try again.",
        );
        return;
      }

      clearOAuthCallbackUrl();
      router.replace("/");
    };

    const timeout = setTimeout(() => {
      if (!finishedRef.current && !cancelled) {
        setError(
          `Sign in timed out. Add this redirect URL in Supabase Auth settings: ${getOAuthRedirectUri()}`,
        );
      }
    }, 30000);

    void finish();

    const subscription = Linking.addEventListener("url", ({ url }) => {
      void finish(url);
    });

    return () => {
      cancelled = true;
      clearTimeout(timeout);
      subscription.remove();
    };
  }, [linkingUrl, params, router, syncSessionFromSupabase]);

  return (
    <View style={styles.container}>
      {error ? (
        <>
          <Text style={styles.errorTitle}>Sign in failed</Text>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable
            onPress={() => router.replace("/auth")}
            style={styles.retryBtn}
          >
            <Text style={styles.retryText}>Back to sign in</Text>
          </Pressable>
        </>
      ) : (
        <View style={styles.loadingWrap}>
          <SkeletonCircle size={64} />
          <Skeleton width={220} height={14} style={styles.loadingBar} />
          <Text style={styles.loadingText}>Finishing Google sign in...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
  },
  loadingWrap: {
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  loadingBar: {
    marginTop: spacing.lg,
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
    textAlign: "center",
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
