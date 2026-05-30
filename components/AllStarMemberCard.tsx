import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, Text, View } from "react-native";

import { ALL_STAR_FEATURES } from "../lib/subscription";
import { colors, radius, spacing, typography } from "../lib/theme";

export function AllStarMemberCard() {
  return (
    <LinearGradient
      colors={[`${colors.secondary}24`, `${colors.primary}10`, colors.card]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      <View style={styles.header}>
        <View style={styles.iconWrap}>
          <Ionicons name="star" size={22} color={colors.secondary} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.kicker}>MEMBERSHIP</Text>
          <Text style={styles.title}>All-Star Baller</Text>
          <Text style={styles.sub}>Captain tools unlocked</Text>
        </View>
      </View>

      <View style={styles.featureGrid}>
        {ALL_STAR_FEATURES.slice(0, 6).map((feature) => (
          <View key={feature.label} style={styles.featureItem}>
            <Ionicons
              name="checkmark-circle"
              size={14}
              color={colors.success}
            />
            <Text style={styles.featureText} numberOfLines={1}>
              {feature.label}
            </Text>
          </View>
        ))}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: `${colors.secondary}55`,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    backgroundColor: `${colors.secondary}22`,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: `${colors.secondary}44`,
  },
  headerText: {
    flex: 1,
  },
  kicker: {
    ...typography.label,
    color: colors.secondary,
    fontSize: 9,
  },
  title: {
    ...typography.heading,
    color: colors.text,
    fontSize: 20,
  },
  sub: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  featureGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    width: "48%",
  },
  featureText: {
    ...typography.caption,
    color: colors.textMuted,
    flex: 1,
    fontSize: 11,
  },
});
