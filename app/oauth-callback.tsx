import { useLinkingURL } from "expo-linking";
import * as Linking from "expo-linking";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { AppSplashScreen } from "../components/AppSplashScreen";

import {
  clearOAuthCallbackUrl,
  createSessionFromUrl,
  getOAuthRedirectUri,
  paramsHaveOAuthPayload,
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
  const processingKeyRef = useRef<string | null>(null);

  const finishOAuthSignInRef = useRef(finishOAuthSignIn);
  finishOAuthSignInRef.current = finishOAuthSignIn;
  const routerRef = useRef(router);
  routerRef.current = router;
  const linkingUrlRef = useRef(linkingUrl);
  linkingUrlRef.current = linkingUrl;
  const paramsRef = useRef(params);
  paramsRef.current = params;

  const oauthParamsKey = serializeOAuthParams(params);

  const completeSignIn = async (): Promise<boolean> => {
    const session = await finishOAuthSignInRef.current();
    if (!session) return false;

    finishedRef.current = true;
    clearOAuthCallbackUrl();
    routerRef.current.replace("/");
    return true;
  };

  useEffect(() => {
    let cancelled = false;
    let timeout: ReturnType<typeof setTimeout> | null = null;

    const finish = async (incomingUrl?: string | null) => {
      if (finishedRef.current || cancelled) return;

      const currentParams = paramsRef.current;
      const paramsKey = serializeOAuthParams(currentParams);
      const hasPayload =
        paramsHaveOAuthPayload(currentParams) ||
        (incomingUrl ? urlHasOAuthPayload(incomingUrl) : false) ||
        (Platform.OS === "web" &&
          typeof window !== "undefined" &&
          urlHasOAuthPayload(window.location.href));

      if (!hasPayload) return;

      if (processingKeyRef.current === paramsKey) return;
      processingKeyRef.current = paramsKey;

      try {
        if (await completeSignIn()) return;

        const href = await resolveOAuthCallbackHref({
          linkingUrl: incomingUrl ?? linkingUrlRef.current,
          params: currentParams,
        });

        if (!href || !urlHasOAuthPayload(href)) return;

        const message = await createSessionFromUrl(href);
        if (message) {
          if (!cancelled) setError(message);
          return;
        }

        const hasSession = await waitForSupabaseSession();
        if (!hasSession) {
          if (!cancelled) {
            setError(
              "Signed in with Google but no session was created. Please try again.",
            );
          }
          return;
        }

        if (!(await completeSignIn()) && !cancelled) {
          setError(
            "Signed in with Google but no session was created. Please try again.",
          );
        }
      } finally {
        if (processingKeyRef.current === paramsKey) {
          processingKeyRef.current = null;
        }
      }
    };

    void finish();

    timeout = setTimeout(() => {
      if (!finishedRef.current && !cancelled) {
        setError(
          `Sign in timed out. Add this redirect URL in Supabase Auth → URL Configuration:\n${getOAuthRedirectUri()}`,
        );
      }
    }, 20000);

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
      if (timeout) clearTimeout(timeout);
      subscription.remove();
      removeHashListener?.();
    };
  }, [oauthParamsKey]);

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
        <AppSplashScreen message="Finishing Google sign in…" />
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
