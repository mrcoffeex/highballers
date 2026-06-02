import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "@/lib/expoRouter";
import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AuthLegalFooter } from "../components/AuthLegalFooter";
import { Button, Input } from "../components/ui";
import { getAppDisplayName } from "../lib/clubInvite";
import {
  getOAuthRedirectUri,
  getOAuthRedirectUriHints,
} from "../lib/googleAuth";
import { isSupabaseEnabled } from "../lib/config";
import { normalizeEmailOtpCode, EMAIL_OTP_LENGTH } from "../lib/emailOtpCode";
import { validateSupabaseConnection } from "../lib/validateSupabase";
import { useTheme, useThemedStyles } from "../lib/ThemeProvider";
import {
  getAuthGradient,
  radius,
  spacing,
  typography,
  withAlpha,
  type ThemeColors,
} from "../lib/theme";
import { useAppStore } from "../store/useAppStore";

type EmailOtpStep = "closed" | "email" | "otp";

export default function AuthScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const signInWithGoogle = useAppStore((state) => state.signInWithGoogle);
  const sendEmailOtp = useAppStore((state) => state.sendEmailOtp);
  const verifyEmailOtp = useAppStore((state) => state.verifyEmailOtp);
  const finishOAuthSignIn = useAppStore((state) => state.finishOAuthSignIn);
  const session = useAppStore((state) => state.session);
  const authChecked = useAppStore((state) => state.authChecked);
  const authReady = useAppStore((state) => state.authReady);
  const syncSessionFromSupabase = useAppStore(
    (state) => state.syncSessionFromSupabase,
  );

  const [emailOtpStep, setEmailOtpStep] = useState<EmailOtpStep>("closed");
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseEnabled) return;

    validateSupabaseConnection().then((message) => {
      if (message) setConfigError(message);
    });
  }, []);

  useEffect(() => {
    if (authChecked && session && authReady) {
      router.replace("/");
    }
  }, [authChecked, authReady, router, session]);

  const completeSignIn = async () => {
    await syncSessionFromSupabase();
    router.replace("/");
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setInfo(null);
    setEmailOtpStep("closed");
    setGoogleLoading(true);

    if (Platform.OS !== "web") {
      router.push("/oauth-callback");
    }

    const message = await signInWithGoogle();
    if (message) {
      setGoogleLoading(false);
      if (Platform.OS !== "web") {
        router.replace("/auth");
      }
      setError(message);
      return;
    }

    if (Platform.OS === "web") {
      return;
    }

    const session = await finishOAuthSignIn();
    setGoogleLoading(false);
    if (session) {
      router.replace("/");
    }
  };

  const handleSendOtp = async () => {
    setError(null);
    setInfo(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError("Enter your email address.");
      return;
    }

    setOtpLoading(true);
    const message = await sendEmailOtp(trimmedEmail);
    setOtpLoading(false);

    if (message) {
      setError(message);
      return;
    }

    setOtpCode("");
    setEmailOtpStep("otp");
    setInfo(`Check your email for a ${EMAIL_OTP_LENGTH}-digit sign-in code.`);
  };

  const handleVerifyOtp = async () => {
    setError(null);
    setInfo(null);

    const trimmedEmail = email.trim();
    const trimmedCode = normalizeEmailOtpCode(otpCode);
    if (!trimmedEmail || trimmedCode.length !== EMAIL_OTP_LENGTH) {
      setError(`Enter the ${EMAIL_OTP_LENGTH}-digit code from your email.`);
      return;
    }

    setOtpLoading(true);
    const message = await verifyEmailOtp(trimmedEmail, trimmedCode);
    setOtpLoading(false);

    if (message) {
      setError(message);
      return;
    }

    await completeSignIn();
  };

  const openEmailOtp = () => {
    setError(null);
    setInfo(null);
    setEmailOtpStep("email");
  };

  const continueOffline = () => {
    router.replace("/onboarding");
  };

  return (
    <LinearGradient
      colors={getAuthGradient(colors)}
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

          {isSupabaseEnabled ? (
            <>
              <Button
                title="Continue with Google"
                onPress={handleGoogleSignIn}
                loading={googleLoading}
                disabled={googleLoading || otpLoading || !!configError}
                variant="outline"
                size="lg"
                icon={
                  <Ionicons name="logo-google" size={20} color={colors.text} />
                }
                style={styles.authBtn}
              />

              {emailOtpStep === "closed" ? (
                <Button
                  title="Continue with Email (OTP)"
                  onPress={openEmailOtp}
                  disabled={googleLoading || otpLoading || !!configError}
                  variant="outline"
                  size="lg"
                  icon={
                    <Ionicons name="mail-outline" size={20} color={colors.text} />
                  }
                  style={styles.authBtn}
                />
              ) : (
                <View style={styles.emailOtpPanel}>
                  <Text style={styles.emailOtpTitle}>Email sign-in code</Text>

                  <Input
                    placeholder="Email"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    editable={emailOtpStep === "email"}
                    style={styles.field}
                  />

                  {emailOtpStep === "otp" ? (
                    <Input
                      placeholder="6-digit code"
                      value={otpCode}
                      onChangeText={(value) =>
                        setOtpCode(normalizeEmailOtpCode(value))
                      }
                      autoCapitalize="none"
                      autoComplete="one-time-code"
                      textContentType="oneTimeCode"
                      keyboardType="number-pad"
                      maxLength={EMAIL_OTP_LENGTH}
                      style={styles.field}
                    />
                  ) : null}

                  <Button
                    title={
                      emailOtpStep === "otp" ? "Verify code" : "Send code"
                    }
                    onPress={
                      emailOtpStep === "otp" ? handleVerifyOtp : handleSendOtp
                    }
                    loading={otpLoading}
                    disabled={googleLoading || !!configError}
                    size="lg"
                    style={styles.emailOtpSubmit}
                  />

                  {emailOtpStep === "otp" ? (
                    <Button
                      title="Resend code"
                      onPress={handleSendOtp}
                      disabled={otpLoading || googleLoading}
                      variant="ghost"
                      size="sm"
                    />
                  ) : null}

                  <Button
                    title="Back"
                    onPress={() => {
                      setEmailOtpStep("closed");
                      setError(null);
                      setInfo(null);
                    }}
                    disabled={otpLoading || googleLoading}
                    variant="ghost"
                    size="sm"
                  />
                </View>
              )}
            </>
          ) : null}

          {configError ? (
            <Text style={styles.configError}>{configError}</Text>
          ) : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}
          {info ? <Text style={styles.info}>{info}</Text> : null}

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
          ) : null}

          <AuthLegalFooter />
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
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
      maxWidth: 320,
    },
    authBtn: {
      marginBottom: spacing.md,
    },
    emailOtpPanel: {
      marginBottom: spacing.md,
      padding: spacing.md,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.outlineVariant,
      backgroundColor: colors.surface,
      gap: spacing.sm,
    },
    emailOtpTitle: {
      ...typography.caption,
      color: colors.textMuted,
      fontWeight: "700",
      textAlign: "center",
      marginBottom: spacing.xs,
    },
    field: {
      marginBottom: spacing.xs,
    },
    emailOtpSubmit: {
      marginTop: spacing.xs,
    },
    error: {
      ...typography.caption,
      color: colors.error,
      marginBottom: spacing.sm,
    },
    info: {
      ...typography.caption,
      color: colors.success,
      marginBottom: spacing.sm,
    },
    configError: {
      ...typography.body,
      color: colors.error,
      backgroundColor: withAlpha(colors.error, 0.08),
      borderWidth: 1,
      borderColor: withAlpha(colors.error, 0.28),
      borderRadius: radius.md,
      padding: spacing.md,
      marginBottom: spacing.md,
      textAlign: "center",
    },
    note: {
      ...typography.caption,
      color: colors.textDim,
      textAlign: "center",
      marginBottom: spacing.md,
    },
  });
}
