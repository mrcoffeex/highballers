import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { colors, spacing, typography } from "../lib/theme";

interface AuthLegalFooterProps {
  mode?: "signIn" | "signUp";
}

export function AuthLegalFooter({ mode = "signIn" }: AuthLegalFooterProps) {
  const router = useRouter();

  return (
    <View style={styles.wrap}>
      {mode === "signIn" ? (
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
      ) : null}
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

const styles = StyleSheet.create({
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
