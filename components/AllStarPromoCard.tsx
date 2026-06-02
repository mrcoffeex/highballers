import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Pressable, StyleSheet, Text, View } from "react-native";

import {
  ALL_STAR_TAGLINE,
  PROMO_FEATURE_PILLS,
  TIER_COMPARISON,
} from "../lib/subscription";
import { useTheme, useThemedStyles } from "../lib/ThemeProvider";
import { radius, spacing, typography, type ThemeColors } from "../lib/theme";
import { Button } from "./ui";

interface AllStarPromoCardProps {
  variant?: "hero" | "compact" | "banner";
  onPress: () => void;
  onCompare?: () => void;
}

export function AllStarPromoCard({
  variant = "hero",
  onPress,
  onCompare,
}: AllStarPromoCardProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  if (variant === "banner") {
    return (
      <Pressable onPress={onPress} style={styles.bannerWrap}>
        <LinearGradient
          colors={[`${colors.secondary}30`, `${colors.primary}18`]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.bannerGradient}
        >
          <View style={styles.bannerIcon}>
            <Ionicons name="star" size={18} color={colors.secondary} />
          </View>
          <View style={styles.bannerText}>
            <Text style={styles.bannerTitle}>Upgrade to All-Star Baller</Text>
            <Text style={styles.bannerSub} numberOfLines={1}>
              Games, scorekeeper, chat & more
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.secondary} />
        </LinearGradient>
      </Pressable>
    );
  }

  if (variant === "compact") {
    return (
      <Pressable onPress={onPress} style={styles.compactWrap}>
        <LinearGradient
          colors={[`${colors.secondary}22`, `${colors.primary}10`]}
          style={styles.compactGradient}
        >
          <View style={styles.compactTop}>
            <View style={styles.compactBadge}>
              <Ionicons name="star" size={12} color={colors.secondary} />
              <Text style={styles.compactBadgeText}>All-Star Baller</Text>
            </View>
            <Ionicons
              name="arrow-forward-circle"
              size={22}
              color={colors.secondary}
            />
          </View>
          <Text style={styles.compactTitle}>{ALL_STAR_TAGLINE}</Text>
          <Text style={styles.compactSub}>
            Unlock captain tools for your pickup crew.
          </Text>
        </LinearGradient>
      </Pressable>
    );
  }

  return (
    <LinearGradient
      colors={[`${colors.secondary}28`, `${colors.primary}14`, colors.card]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.heroCard}
    >
      <View style={styles.heroGlow} />
      <View style={styles.heroHeader}>
        <View style={styles.heroBadge}>
          <Ionicons name="star" size={14} color={colors.secondary} />
          <Text style={styles.heroBadgeText}>All-Star Baller</Text>
        </View>
        <Text style={styles.heroKicker}>MEMBERSHIP</Text>
      </View>

      <Text style={styles.heroTitle}>{ALL_STAR_TAGLINE}</Text>
      <Text style={styles.heroSub}>
        Everything Basic Baller gets, plus the tools to schedule runs, track
        stats, and lead your club.
      </Text>

      <View style={styles.pillGrid}>
        {PROMO_FEATURE_PILLS.map((feature) => (
          <View key={feature.label} style={styles.pill}>
            <Ionicons
              name={feature.icon as keyof typeof Ionicons.glyphMap}
              size={14}
              color={colors.secondary}
            />
            <Text style={styles.pillText} numberOfLines={2}>
              {feature.label}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.comparePreview}>
        {TIER_COMPARISON.slice(0, 3).map((row) => (
          <View key={row.label} style={styles.compareRow}>
            <Text style={styles.compareLabel}>{row.label}</Text>
            <Text style={styles.compareBasic} numberOfLines={1}>
              {row.basic}
            </Text>
            <Text style={styles.comparePro} numberOfLines={1}>
              {row.allStar}
            </Text>
          </View>
        ))}
      </View>

      <Button
        title="Upgrade to All-Star"
        onPress={onPress}
        icon={<Ionicons name="star" size={18} color={colors.text} />}
        style={styles.heroBtn}
      />
      {onCompare ? (
        <Pressable onPress={onCompare} style={styles.compareLink}>
          <Text style={styles.compareLinkText}>Compare all plans</Text>
        </Pressable>
      ) : null}
    </LinearGradient>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
  heroCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: `${colors.secondary}44`,
    padding: spacing.lg,
    overflow: "hidden",
    marginBottom: spacing.lg,
  },
  heroGlow: {
    position: "absolute",
    top: -40,
    right: -20,
    width: 120,
    height: 120,
    borderRadius: radius.full,
    backgroundColor: `${colors.secondary}18`,
  },
  heroHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
    backgroundColor: `${colors.secondary}22`,
    borderWidth: 1,
    borderColor: `${colors.secondary}55`,
  },
  heroBadgeText: {
    ...typography.label,
    color: colors.secondary,
    fontSize: 10,
  },
  heroKicker: {
    ...typography.label,
    color: colors.textDim,
    fontSize: 9,
  },
  heroTitle: {
    ...typography.title,
    color: colors.text,
    fontSize: 22,
    marginBottom: spacing.xs,
  },
  heroSub: {
    ...typography.body,
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  pillGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  pill: {
    width: "48%",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: `${colors.background}88`,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  pillText: {
    ...typography.caption,
    color: colors.text,
    flex: 1,
    fontSize: 11,
    lineHeight: 14,
  },
  comparePreview: {
    backgroundColor: `${colors.background}66`,
    borderRadius: radius.md,
    padding: spacing.sm,
    gap: spacing.xs,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  compareRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  compareLabel: {
    width: 72,
    ...typography.label,
    color: colors.textDim,
    fontSize: 9,
  },
  compareBasic: {
    flex: 1,
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 10,
  },
  comparePro: {
    flex: 1,
    ...typography.caption,
    color: colors.secondary,
    fontSize: 10,
    fontWeight: "700",
    textAlign: "right",
  },
  heroBtn: {
    marginBottom: spacing.xs,
  },
  compareLink: {
    alignItems: "center",
    paddingVertical: spacing.xs,
  },
  compareLinkText: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: "600",
  },
  compactWrap: {
    marginBottom: spacing.md,
  },
  compactGradient: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: `${colors.secondary}44`,
    padding: spacing.md,
  },
  compactTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  compactBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
    backgroundColor: `${colors.secondary}20`,
  },
  compactBadgeText: {
    ...typography.label,
    color: colors.secondary,
    fontSize: 9,
  },
  compactTitle: {
    ...typography.heading,
    color: colors.text,
    fontSize: 16,
  },
  compactSub: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  bannerWrap: {
    marginBottom: spacing.lg,
  },
  bannerGradient: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: `${colors.secondary}44`,
    padding: spacing.md,
  },
  bannerIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: `${colors.secondary}22`,
    alignItems: "center",
    justifyContent: "center",
  },
  bannerText: {
    flex: 1,
    minWidth: 0,
  },
  bannerTitle: {
    ...typography.heading,
    color: colors.text,
    fontSize: 15,
  },
  bannerSub: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 1,
  },
  });
}
