import { Image } from "expo-image";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { getAppDisplayName } from "../lib/clubInvite";
import { colors, spacing, typography } from "../lib/theme";

interface AppSplashScreenProps {
  message?: string;
}

export function AppSplashScreen({
  message = "Loading your run…",
}: AppSplashScreenProps) {
  return (
    <View style={styles.container}>
      <Image
        source={require("../assets/splash-icon.png")}
        style={styles.logo}
        contentFit="contain"
        accessibilityLabel={`${getAppDisplayName()} logo`}
      />
      <Text style={styles.title}>{getAppDisplayName()}</Text>
      <ActivityIndicator
        size="large"
        color={colors.primary}
        style={styles.spinner}
      />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
  },
  logo: {
    width: 200,
    height: 200,
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.title,
    color: colors.text,
    letterSpacing: 1,
    marginBottom: spacing.xl,
  },
  spinner: {
    marginBottom: spacing.md,
  },
  message: {
    ...typography.caption,
    color: colors.textMuted,
  },
});
