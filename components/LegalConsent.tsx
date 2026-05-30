import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, spacing, typography } from "@/lib/theme";

interface LegalConsentProps {
  checked: boolean;
  onCheckedChange: (value: boolean) => void;
  error?: string;
}

export function LegalConsent({
  checked,
  onCheckedChange,
  error,
}: LegalConsentProps) {
  const router = useRouter();

  return (
    <View style={styles.wrap}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked }}
        onPress={() => onCheckedChange(!checked)}
        style={styles.row}
      >
        <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
          {checked ? (
            <Ionicons name="checkmark" size={14} color={colors.background} />
          ) : null}
        </View>
        <Text style={styles.label}>
          I agree to the{" "}
          <Text
            style={styles.link}
            onPress={(e) => {
              e.stopPropagation?.();
              router.push("/legal/terms");
            }}
          >
            Terms & Conditions
          </Text>{" "}
          and{" "}
          <Text
            style={styles.link}
            onPress={(e) => {
              e.stopPropagation?.();
              router.push("/legal/privacy");
            }}
          >
            Privacy Policy
          </Text>
          .
        </Text>
      </Pressable>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.cardBorder,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  label: {
    ...typography.caption,
    flex: 1,
    color: colors.textMuted,
    lineHeight: 20,
    fontSize: 14,
  },
  link: {
    color: colors.accent,
    textDecorationLine: "underline",
  },
  error: {
    ...typography.caption,
    color: colors.error,
    marginTop: spacing.xs,
    marginLeft: 30,
  },
});
