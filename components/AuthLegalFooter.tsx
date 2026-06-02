import { useRouter } from "@/lib/expoRouter";
import { StyleSheet, Text, View } from "react-native";

import { useThemedStyles } from "@/lib/ThemeProvider";
import { spacing, typography, type ThemeColors } from "../lib/theme";

export function AuthLegalFooter() {
  const router = useRouter();
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.wrap}>
      <Text style={styles.notice}>
        By signing in, you agree to our{" "}
        <Text style={styles.link} onPress={() => router.push("/legal/terms")}>
          Terms & Conditions
        </Text>{" "}
        and{" "}
        <Text
          style={styles.link}
          onPress={() => router.push("/legal/privacy")}
        >
          Privacy Policy
        </Text>
        .
      </Text>
      <Text style={styles.footer}>
        <Text style={styles.link} onPress={() => router.push("/legal/terms")}>
          Terms & Conditions
        </Text>
        {" · "}
        <Text style={styles.link} onPress={() => router.push("/legal/privacy")}>
          Privacy Policy
        </Text>
      </Text>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    wrap: {
      marginTop: spacing.sm,
      gap: spacing.xs,
    },
    notice: {
      ...typography.caption,
      color: colors.textDim,
      textAlign: "center",
      lineHeight: 18,
    },
    footer: {
      ...typography.caption,
      color: colors.textDim,
      textAlign: "center",
    },
    link: {
      color: colors.accent,
      textDecorationLine: "underline",
    },
  });
}
