import { useLinkingURL } from "expo-linking";
import * as Linking from "expo-linking";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { Skeleton, SkeletonCircle } from "../components/ui";

import {
  clearOAuthCallbackUrl,
  createSessionFromUrl,
  getOAuthRedirectUri,
  resolveOAuthCallbackHref,
  serializeOAuthParams,
  urlHasOAuthPayload,
  waitForSupabaseSession,
} from "../lib/googleAuth";
import { colors, spacing, typography } from "../lib/theme";
import { useAppStore } from "../store/useAppStore";

export default function OAuthCallbackScreen() {
  const router = useRouter();
  const linkingUrl = useLinkingURL();
  const params = useLocalSearchParams();
  const finishOAuthSignIn = useAppStore((state) => state.finishOAuthSignIn);
  const [error, setError] = useState<string | null>(null);
  const finishedRef = useRef(false);
  const processingRef = useRef(false);

  const oauthParamsKey = serializeOAuthParams(params);

  const tryNavigateHome = async (): Promise<boolean> => {
    const session = await finishOAuthSignIn();
    if (!session) return false;

    finishedRef.current = true;
    clearOAuthCallbackUrl();
    router.replace("/");
    return true;
  };

  useEffect(() => {
    let cancelled = false;

    const finish = async (incomingUrl?: string | null) => {
      if (finishedRef.current || cancelled || processingRef.current) return;
      processingRef.current = true;

      try {
        if (!finishedRef.current && (await tryNavigateHome())) {
          return;
        }

        const href = await resolveOAuthCallbackHref({
          linkingUrl: incomingUrl ?? linkingUrl,
          params,
        });

        if (!href || !urlHasOAuthPayload(href)) {
          return;
        }

        const message = await createSessionFromUrl(href);
        if (message) {
          if (!cancelled) setError(message);
          return;
        }

        const hasSession = await waitForSupabaseSession(12, 300);
        if (!hasSession) {
          if (!cancelled) {
            setError(
              "Signed in with Google but no session was created. Please try again.",
            );
          }
          return;
        }

        if (!(await tryNavigateHome()) && !cancelled) {
          setError(
            "Signed in with Google but no session was created. Please try again.",
          );
        }
      } finally {
        processingRef.current = false;
      }
    };

    const timeout = setTimeout(() => {
      if (!finishedRef.current && !cancelled) {
        setError(
          `Sign in timed out. Add this redirect URL in Supabase Auth → URL Configuration:\n${getOAuthRedirectUri()}`,
        );
      }
    }, 15000);

    void finish();

    const subscription = Linking.addEventListener("url", ({ url }) => {
      void finish(url);
    });

    let removeHashListener: (() => void) | undefined;
    if (Platform.OS === "web" && typeof window !== "undefined") {
      const onRouteChange = () => void finish();
      window.addEventListener("hashchange", onRouteChange);
      removeHashListener = () =>
        window.removeEventListener("hashchange", onRouteChange);
    }

    return () => {
      cancelled = true;
      clearTimeout(timeout);
      subscription.remove();
      removeHashListener?.();
    };
  }, [linkingUrl, oauthParamsKey, finishOAuthSignIn, router]);

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
