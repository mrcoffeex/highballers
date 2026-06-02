import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "@/lib/expoRouter";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppSplashScreen } from "../components/AppSplashScreen";
import { LegalConsent } from "../components/LegalConsent";
import { SignOutButton } from "../components/SignOutButton";
import { StatSlider } from "../components/StatSlider";
import {
  hasAcceptedCurrentLegal,
  setAcceptedLegalVersion,
} from "../lib/legalAcceptance";
import { ImagePickerField } from "../components/ImagePickerField";
import { Avatar, Button, Input } from "../components/ui";
import { getGoogleProfileHints } from "../lib/googleAuth";
import { isSupabaseEnabled } from "../lib/config";
import { colors, radius, spacing, typography } from "../lib/theme";
import { POSITIONS, Position } from "../lib/types";
import { createDefaultProfile, useAppStore } from "../store/useAppStore";

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const completeOnboarding = useAppStore((state) => state.completeOnboarding);
  const signOut = useAppStore((state) => state.signOut);
  const authReady = useAppStore((state) => state.authReady);
  const onboardingComplete = useAppStore((state) => state.onboardingComplete);
  const session = useAppStore((state) => state.session);
  const googleHints = useMemo(() => getGoogleProfileHints(session), [session]);

  const [step, setStep] = useState(0);
  const [name, setName] = useState(googleHints.name);
  const [nickname, setNickname] = useState("");
  const [position, setPosition] = useState<Position>("SG");
  const [stats, setStats] = useState(createDefaultProfile("", "SG").stats);
  const [avatarUri, setAvatarUri] = useState<string | undefined>(
    googleHints.avatarUrl,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [legalAccepted, setLegalAccepted] = useState(false);
  const [legalError, setLegalError] = useState<string | null>(null);
  const [legalAlreadyAccepted, setLegalAlreadyAccepted] = useState(false);

  const canContinue = name.trim().length >= 2;

  useEffect(() => {
    hasAcceptedCurrentLegal().then((accepted) => {
      setLegalAlreadyAccepted(accepted);
      if (accepted) setLegalAccepted(true);
    });
  }, []);

  useEffect(() => {
    if (authReady && onboardingComplete) {
      router.replace("/(tabs)");
    }
  }, [authReady, onboardingComplete, router]);

  if (!authReady) {
    return <AppSplashScreen message="Loading your profile…" />;
  }

  if (onboardingComplete) {
    return null;
  }

  const handleFinish = async () => {
    setError(null);
    setLegalError(null);

    if (!legalAlreadyAccepted && !legalAccepted) {
      setLegalError(
        "You must accept the Terms & Conditions and Privacy Policy.",
      );
      return;
    }

    setLoading(true);

    try {
      await completeOnboarding(
        {
          ...createDefaultProfile(name.trim(), position),
          nickname: nickname.trim() || undefined,
          stats,
        },
        avatarUri,
      );
      if (!legalAlreadyAccepted) {
        await setAcceptedLegalVersion();
      }
      router.replace("/(tabs)");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not save your profile. Try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleUseDifferentAccount = async () => {
    await signOut();
    router.replace("/auth");
  };

  return (
    <LinearGradient
      colors={["#0A0E14", "#141C28", "#0A0E14"]}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          {
            paddingTop: insets.top + spacing.lg,
            paddingBottom: insets.bottom + spacing.lg,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <View style={styles.logoCircle}>
            <Ionicons name="basketball" size={40} color={colors.primary} />
          </View>
          <Text style={styles.brand}>HighBallers</Text>
          <Text style={styles.tagline}>
            Your court. Your crew. Balanced games.
          </Text>
        </View>

        <View style={styles.steps}>
          {[0, 1, 2].map((index) => (
            <View
              key={index}
              style={[styles.stepDot, step >= index && styles.stepDotActive]}
            />
          ))}
        </View>

        {step === 0 && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Who&apos;s ballin&apos;?</Text>
            <Text style={styles.stepDesc}>
              Set up your player profile to join clubs and games.
            </Text>
            <Input
              placeholder="Full name"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              style={styles.input}
            />
            <Input
              placeholder="Nickname (optional)"
              value={nickname}
              onChangeText={setNickname}
              style={styles.input}
            />
            <Button
              title="Continue"
              onPress={() => setStep(1)}
              disabled={!canContinue}
              size="lg"
              style={styles.cta}
            />
          </View>
        )}

        {step === 1 && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Pick your position</Text>
            <Text style={styles.stepDesc}>
              Where do you make your mark on the court?
            </Text>
            <View style={styles.positionGrid}>
              {POSITIONS.map((pos) => (
                <Pressable
                  key={pos}
                  onPress={() => setPosition(pos)}
                  style={[
                    styles.positionCard,
                    position === pos && styles.positionCardActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.positionText,
                      position === pos && styles.positionTextActive,
                    ]}
                  >
                    {pos}
                  </Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.navRow}>
              <Button title="Back" variant="ghost" onPress={() => setStep(0)} />
              <Button
                title="Continue"
                onPress={() => setStep(2)}
                size="lg"
                style={styles.flexBtn}
              />
            </View>
          </View>
        )}

        {step === 2 && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Physical stats</Text>
            <Text style={styles.stepDesc}>
              These help balance teams when shuffling players for games.
            </Text>
            <ImagePickerField
              label="Profile Photo"
              imageUri={avatarUri}
              fallbackName={name || "Player"}
              fallbackColor={colors.primary}
              onPick={setAvatarUri}
            />
            <StatSlider
              label="Height"
              value={stats.height}
              onChange={(height) => setStats({ ...stats, height })}
              min={150}
              max={220}
              unit="cm"
              step={1}
            />
            <StatSlider
              label="Weight"
              value={stats.weight}
              onChange={(weight) => setStats({ ...stats, weight })}
              min={50}
              max={130}
              unit="kg"
              step={1}
            />
            <StatSlider
              label="Speed"
              value={stats.speed}
              onChange={(speed) => setStats({ ...stats, speed })}
            />
            <StatSlider
              label="Strength"
              value={stats.strength}
              onChange={(strength) => setStats({ ...stats, strength })}
            />
            <StatSlider
              label="Shooting"
              value={stats.shooting}
              onChange={(shooting) => setStats({ ...stats, shooting })}
            />
            <StatSlider
              label="Defense"
              value={stats.defense}
              onChange={(defense) => setStats({ ...stats, defense })}
            />
            <StatSlider
              label="Stamina"
              value={stats.stamina}
              onChange={(stamina) => setStats({ ...stats, stamina })}
            />
            <View style={styles.preview}>
              <Avatar
                name={name || "Player"}
                color={colors.primary}
                size={56}
                imageUrl={avatarUri}
              />
              <View>
                <Text style={styles.previewName}>{name || "Your Name"}</Text>
                <Text style={styles.previewMeta}>
                  {position} · Ready to hoop
                </Text>
              </View>
            </View>
            {!legalAlreadyAccepted ? (
              <LegalConsent
                checked={legalAccepted}
                onCheckedChange={(value) => {
                  setLegalAccepted(value);
                  if (value) setLegalError(null);
                }}
                error={legalError ?? undefined}
              />
            ) : null}
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <View style={styles.navRow}>
              <Button title="Back" variant="ghost" onPress={() => setStep(1)} />
              <Button
                title="Start Playing"
                onPress={handleFinish}
                loading={loading}
                disabled={!legalAlreadyAccepted && !legalAccepted}
                size="lg"
                style={styles.flexBtn}
              />
            </View>
          </View>
        )}
        {isSupabaseEnabled && session ? (
          <SignOutButton onSignOut={handleUseDifferentAccount} />
        ) : null}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: spacing.lg,
  },
  hero: {
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${colors.primary}20`,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: `${colors.primary}40`,
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
  steps: {
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  stepDot: {
    width: 32,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.cardBorder,
  },
  stepDotActive: {
    backgroundColor: colors.primary,
  },
  stepContent: {
    gap: spacing.sm,
  },
  stepTitle: {
    ...typography.title,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  stepDesc: {
    ...typography.body,
    color: colors.textMuted,
    marginBottom: spacing.lg,
  },
  input: {
    marginBottom: spacing.sm,
  },
  cta: {
    marginTop: spacing.lg,
  },
  positionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  positionCard: {
    width: "30%",
    flexGrow: 1,
    paddingVertical: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.cardBorder,
    alignItems: "center",
  },
  positionCardActive: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}15`,
  },
  positionText: {
    ...typography.heading,
    color: colors.textMuted,
    fontSize: 20,
  },
  positionTextActive: {
    color: colors.primary,
  },
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  flexBtn: {
    flex: 1,
  },
  error: {
    ...typography.caption,
    color: colors.error,
    textAlign: "center",
    marginTop: spacing.sm,
  },
  preview: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.lg,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  previewName: {
    ...typography.heading,
    color: colors.text,
  },
  previewMeta: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
});
