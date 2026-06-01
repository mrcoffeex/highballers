import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AuthLegalFooter } from "../components/AuthLegalFooter";
import { LegalConsent } from "../components/LegalConsent";
import { Button, Input } from "../components/ui";
import { getAppDisplayName } from "../lib/clubInvite";
import { setAcceptedLegalVersion } from "../lib/legalAcceptance";
import { getOAuthRedirectUri } from "../lib/googleAuth";
import { isSupabaseEnabled } from "../lib/config";
import { validateSupabaseConnection } from "../lib/validateSupabase";
import { colors, radius, spacing, typography } from "../lib/theme";
import { useAppStore } from "../store/useAppStore";

export default function AuthScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const signIn = useAppStore((state) => state.signIn);
  const signUp = useAppStore((state) => state.signUp);
  const signInWithGoogle = useAppStore((state) => state.signInWithGoogle);
  const finishOAuthSignIn = useAppStore((state) => state.finishOAuthSignIn);
  const syncSessionFromSupabase = useAppStore(
    (state) => state.syncSessionFromSupabase,
  );

  const [mode, setMode] = useState<"signIn" | "signUp">("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);
  const [legalAccepted, setLegalAccepted] = useState(false);
  const [legalError, setLegalError] = useState<string | null>(null);

  const requiresLegalConsent = mode === "signUp";

  useEffect(() => {
    if (!isSupabaseEnabled) return;

    validateSupabaseConnection().then((message) => {
      if (message) setConfigError(message);
    });
  }, []);

  const handleSubmit = async () => {
    setError(null);
    setLegalError(null);

    if (requiresLegalConsent && !legalAccepted) {
      setLegalError(
        "You must accept the Terms & Conditions and Privacy Policy.",
      );
      return;
    }

    setLoading(true);

    const message =
      mode === "signIn"
        ? await signIn(email.trim(), password)
        : await signUp(email.trim(), password);

    setLoading(false);

    if (message) {
      setError(message);
      return;
    }

    if (requiresLegalConsent) {
      await setAcceptedLegalVersion();
    }

    await syncSessionFromSupabase();
    router.replace("/");
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setLegalError(null);

    if (requiresLegalConsent && !legalAccepted) {
      setLegalError(
        "You must accept the Terms & Conditions and Privacy Policy.",
      );
      return;
    }

    setGoogleLoading(true);

    const message = await signInWithGoogle();
    if (message) {
      setGoogleLoading(false);
      setError(message);
      return;
    }

    // Web navigates away to Google; mobile completes inline below.
    if (Platform.OS !== "web") {
      await finishOAuthSignIn();
      setGoogleLoading(false);
      if (requiresLegalConsent) {
        await setAcceptedLegalVersion();
      }
      router.replace("/");
    }
  };

  const continueOffline = () => {
    router.replace("/onboarding");
  };

  return (
    <LinearGradient
      colors={["#0A0E14", "#141C28", "#0A0E14"]}
      style={styles.container}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[
            styles.content,
            {
              paddingTop: insets.top + spacing.xl,
              paddingBottom: insets.bottom + spacing.lg,
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.hero}>
            <Image
              source={require("../assets/splash-icon.png")}
              style={styles.logo}
              contentFit="contain"
              accessibilityLabel={`${getAppDisplayName()} logo`}
            />
            <Text style={styles.brand}>HighBallers</Text>
            <Text style={styles.tagline}>
              Sign in to sync clubs and games across devices.
            </Text>
          </View>

          <View style={styles.tabs}>
            <Pressable
              onPress={() => {
                setMode("signIn");
                setLegalError(null);
              }}
              style={[styles.tab, mode === "signIn" && styles.tabActive]}
            >
              <Text
                style={[
                  styles.tabText,
                  mode === "signIn" && styles.tabTextActive,
                ]}
              >
                Sign In
              </Text>
            </Pressable>
            <Pressable
              onPress={() => {
                setMode("signUp");
                setLegalError(null);
              }}
              style={[styles.tab, mode === "signUp" && styles.tabActive]}
            >
              <Text
                style={[
                  styles.tabText,
                  mode === "signUp" && styles.tabTextActive,
                ]}
              >
                Sign Up
              </Text>
            </Pressable>
          </View>

          {requiresLegalConsent ? (
            <LegalConsent
              checked={legalAccepted}
              onCheckedChange={(value) => {
                setLegalAccepted(value);
                if (value) setLegalError(null);
              }}
              error={legalError ?? undefined}
            />
          ) : null}

          {isSupabaseEnabled ? (
            <>
              <Button
                title="Continue with Google"
                onPress={handleGoogleSignIn}
                loading={googleLoading}
                disabled={
                  loading ||
                  !!configError ||
                  (requiresLegalConsent && !legalAccepted)
                }
                variant="outline"
                size="lg"
                icon={
                  <Ionicons name="logo-google" size={20} color={colors.text} />
                }
                style={styles.googleBtn}
              />

              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or use email</Text>
                <View style={styles.dividerLine} />
              </View>
            </>
          ) : null}

          <Input
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            style={styles.field}
          />
          <Input
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={styles.field}
          />

          {configError ? (
            <Text style={styles.configError}>{configError}</Text>
          ) : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Button
            title={mode === "signIn" ? "Sign In" : "Create Account"}
            onPress={handleSubmit}
            loading={loading}
            disabled={
              googleLoading ||
              !!configError ||
              !email.trim() ||
              password.length < 6 ||
              (requiresLegalConsent && !legalAccepted)
            }
            size="lg"
            style={styles.submit}
          />

          {!isSupabaseEnabled ? (
            <>
              <Text style={styles.note}>
                Add Supabase env vars to enable cloud sync. You can still play
                locally.
              </Text>
              <Button
                title="Continue Offline"
                variant="outline"
                onPress={continueOffline}
              />
            </>
          ) : __DEV__ ? (
            <Text style={styles.note}>
              OAuth redirect: {getOAuthRedirectUri()}
            </Text>
          ) : null}

          <AuthLegalFooter mode={mode} />
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
  },
  hero: {
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  logo: {
    width: 96,
    height: 96,
    marginBottom: spacing.md,
  },
  brand: {
    ...typography.hero,
    color: colors.text,
  },
  tagline: {
    ...typography.body,
    color: colors.textMuted,
    marginTop: spacing.sm,
    textAlign: "center",
  },
  googleBtn: {
    marginBottom: spacing.lg,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.cardBorder,
  },
  dividerText: {
    ...typography.caption,
    color: colors.textDim,
  },
  tabs: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    alignItems: "center",
  },
  tabActive: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}15`,
  },
  tabText: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: "700",
  },
  tabTextActive: {
    color: colors.primary,
  },
  field: {
    marginBottom: spacing.sm,
  },
  error: {
    ...typography.caption,
    color: colors.error,
    marginBottom: spacing.sm,
  },
  configError: {
    ...typography.body,
    color: colors.error,
    backgroundColor: `${colors.error}15`,
    borderWidth: 1,
    borderColor: `${colors.error}40`,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    textAlign: "center",
  },
  submit: {
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  note: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: "center",
    marginBottom: spacing.md,
  },
});
