import { Image } from "expo-image";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { getAppDisplayName } from "../lib/clubInvite";
import { useTheme, useThemedStyles } from "../lib/ThemeProvider";
import { spacing, typography, type ThemeColors } from "../lib/theme";

interface AppSplashScreenProps {
  message?: string;
}

export function AppSplashScreen({
  message = "Loading your greatness…",
}: AppSplashScreenProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

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

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
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
      letterSpacing: 0.5,
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
}
