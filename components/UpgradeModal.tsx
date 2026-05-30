import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAllStarSubscription } from "@/hooks/useAllStarSubscription";
import {
  ALL_STAR_FEATURES,
  ALL_STAR_TAGLINE,
  TIER_COMPARISON,
  TIER_LABELS,
} from "@/lib/subscription";
import { colors, radius, spacing, typography } from "@/lib/theme";
import { Button } from "./ui";

interface UpgradeModalProps {
  visible: boolean;
  reason?: string;
  onClose: () => void;
  onPurchased?: () => void;
}

export function UpgradeModal({
  visible,
  reason,
  onClose,
  onPurchased,
}: UpgradeModalProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    storeAvailable,
    priceLabel,
    loadingProduct,
    purchasing,
    restoring,
    purchase,
    restore,
    manageSubscription,
    disclosure,
    reloadProduct,
  } = useAllStarSubscription();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setError(null);
      void reloadProduct();
    }
  }, [reloadProduct, visible]);

  const handlePurchase = useCallback(async () => {
    setError(null);
    try {
      await purchase();
      onPurchased?.();
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not complete purchase.",
      );
    }
  }, [onClose, onPurchased, purchase]);

  const handleRestore = useCallback(async () => {
    setError(null);
    try {
      await restore();
      onPurchased?.();
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not restore purchases.",
      );
    }
  }, [onClose, onPurchased, restore]);

  const handleManage = useCallback(async () => {
    setError(null);
    try {
      await manageSubscription();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not open subscription settings.",
      );
    }
  }, [manageSubscription]);

  const loading = purchasing || restoring;
  const priceText = loadingProduct
    ? "Loading price…"
    : priceLabel
      ? `${priceLabel}/month`
      : storeAvailable
        ? "Monthly subscription"
        : "Available on iOS & Android";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[
            styles.sheet,
            { paddingBottom: Math.max(insets.bottom, spacing.lg) },
          ]}
          onPress={(event) => event.stopPropagation()}
        >
          <View style={styles.handle} />

          <View style={styles.hero}>
            <View style={styles.heroIcon}>
              <Ionicons name="star" size={30} color={colors.secondary} />
            </View>
            <Text style={styles.title}>All-Star Baller</Text>
            <Text style={styles.tagline}>{ALL_STAR_TAGLINE}</Text>
            {reason ? <Text style={styles.reason}>{reason}</Text> : null}
          </View>

          <View style={styles.compareHeader}>
            <Text style={[styles.compareCol, styles.compareColFeature]}> </Text>
            <Text style={[styles.compareCol, styles.compareColBasic]}>
              {TIER_LABELS.basic}
            </Text>
            <Text style={[styles.compareCol, styles.compareColPro]}>
              {TIER_LABELS.all_star}
            </Text>
          </View>

          <ScrollView
            style={styles.compareList}
            showsVerticalScrollIndicator={false}
          >
            {TIER_COMPARISON.map((row) => (
              <View key={row.label} style={styles.compareRow}>
                <Text style={[styles.compareCol, styles.compareColFeature]}>
                  {row.label}
                </Text>
                <Text style={[styles.compareCol, styles.compareColBasic]}>
                  {row.basic}
                </Text>
                <Text style={[styles.compareCol, styles.compareColPro]}>
                  {row.allStar}
                </Text>
              </View>
            ))}

            <Text style={styles.featuresTitle}>Everything included</Text>
            {ALL_STAR_FEATURES.map((feature) => (
              <View key={feature.label} style={styles.featureRow}>
                <View style={styles.featureIcon}>
                  <Ionicons
                    name={feature.icon as keyof typeof Ionicons.glyphMap}
                    size={16}
                    color={colors.primary}
                  />
                </View>
                <Text style={styles.featureText}>{feature.label}</Text>
              </View>
            ))}
          </ScrollView>

          <View style={styles.footer}>
            <Text style={styles.priceNote}>{priceText}</Text>
            <Text style={styles.disclosure}>{disclosure}</Text>
            <Text style={styles.legalLinks}>
              By subscribing you agree to our{" "}
              <Text
                style={styles.link}
                onPress={() => router.push("/legal/terms")}
              >
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
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Button
              title={
                storeAvailable
                  ? "Subscribe to All-Star Baller"
                  : "Subscribe in the mobile app"
              }
              loading={purchasing}
              disabled={!storeAvailable || loading}
              onPress={handlePurchase}
              icon={<Ionicons name="star" size={18} color={colors.text} />}
              style={styles.upgradeBtn}
            />
            {storeAvailable ? (
              <>
                <Button
                  title="Restore purchases"
                  variant="outline"
                  loading={restoring}
                  disabled={loading}
                  onPress={handleRestore}
                />
                <Button
                  title="Manage subscription"
                  variant="ghost"
                  disabled={loading}
                  onPress={handleManage}
                />
              </>
            ) : null}
            <Button title="Not now" variant="ghost" onPress={onClose} />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: "flex-end",
  },
  sheet: {
    maxHeight: "92%",
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderBottomWidth: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  handle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: radius.full,
    backgroundColor: colors.cardBorder,
    marginBottom: spacing.md,
  },
  hero: {
    alignItems: "center",
    marginBottom: spacing.md,
  },
  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: radius.full,
    backgroundColor: `${colors.secondary}22`,
    borderWidth: 1,
    borderColor: `${colors.secondary}55`,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.title,
    color: colors.text,
    fontSize: 24,
  },
  tagline: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: spacing.xs,
    fontSize: 14,
  },
  reason: {
    ...typography.caption,
    color: colors.secondary,
    textAlign: "center",
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  compareHeader: {
    flexDirection: "row",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
    marginBottom: spacing.xs,
  },
  compareRow: {
    flexDirection: "row",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: `${colors.cardBorder}88`,
  },
  compareCol: {
    flex: 1,
    ...typography.caption,
    fontSize: 11,
  },
  compareColFeature: {
    flex: 1.1,
    color: colors.textDim,
    fontWeight: "600",
  },
  compareColBasic: {
    color: colors.textMuted,
    textAlign: "center",
  },
  compareColPro: {
    color: colors.secondary,
    textAlign: "center",
    fontWeight: "700",
  },
  compareList: {
    maxHeight: 280,
    marginBottom: spacing.sm,
  },
  featuresTitle: {
    ...typography.label,
    color: colors.textDim,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  featureIcon: {
    width: 28,
    height: 28,
    borderRadius: radius.full,
    backgroundColor: `${colors.primary}18`,
    alignItems: "center",
    justifyContent: "center",
  },
  featureText: {
    ...typography.body,
    color: colors.text,
    flex: 1,
    fontSize: 14,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
    paddingTop: spacing.sm,
  },
  priceNote: {
    ...typography.heading,
    color: colors.text,
    textAlign: "center",
    marginBottom: spacing.xs,
  },
  disclosure: {
    ...typography.caption,
    color: colors.textDim,
    textAlign: "center",
    marginBottom: spacing.sm,
    lineHeight: 18,
    fontSize: 11,
  },
  legalLinks: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: "center",
    marginBottom: spacing.sm,
    lineHeight: 18,
    fontSize: 11,
  },
  link: {
    color: colors.accent,
    textDecorationLine: "underline",
  },
  error: {
    ...typography.caption,
    color: colors.error,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  upgradeBtn: {
    marginBottom: spacing.xs,
  },
});
