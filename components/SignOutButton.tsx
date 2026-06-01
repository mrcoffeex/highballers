import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { colors, radius, spacing, typography } from "../lib/theme";
import { ConfirmModal } from "./ConfirmModal";

interface SignOutButtonProps {
  onSignOut: () => void | Promise<void>;
}

export function SignOutButton({ onSignOut }: SignOutButtonProps) {
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onSignOut();
      setConfirmVisible(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Sign out"
        accessibilityHint="Ends your session on this device"
        disabled={loading}
        onPress={() => setConfirmVisible(true)}
        style={({ pressed }) => [
          styles.card,
          pressed && !loading && styles.cardPressed,
          loading && styles.cardDisabled,
        ]}
      >
        <View style={styles.iconWrap}>
          {loading ? (
            <ActivityIndicator size="small" color={colors.error} />
          ) : (
            <Ionicons name="log-out-outline" size={22} color={colors.error} />
          )}
        </View>

        <View style={styles.copy}>
          <Text style={styles.title}>Sign out</Text>
          <Text style={styles.subtitle}>End session on this device</Text>
        </View>

        {!loading ? (
          <Ionicons name="chevron-forward" size={18} color={colors.textDim} />
        ) : null}
      </Pressable>

      <ConfirmModal
        visible={confirmVisible}
        title="Sign out?"
        message="You'll need to sign in again to sync clubs, games, and stats."
        confirmLabel="Sign out"
        cancelLabel="Cancel"
        loading={loading}
        onClose={() => {
          if (!loading) setConfirmVisible(false);
        }}
        onConfirm={() => void handleConfirm()}
      />
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.lg,
    backgroundColor: `${colors.error}0D`,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: `${colors.error}33`,
  },
  cardPressed: {
    backgroundColor: `${colors.error}18`,
    borderColor: `${colors.error}55`,
  },
  cardDisabled: {
    opacity: 0.85,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: `${colors.error}1A`,
    borderWidth: 1,
    borderColor: `${colors.error}33`,
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  title: {
    ...typography.body,
    color: colors.text,
    fontWeight: "600",
    fontSize: 16,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 12,
    textTransform: "none",
    letterSpacing: 0,
  },
});
