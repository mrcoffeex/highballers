import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "@/lib/expoRouter";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme, useThemedStyles } from "../lib/ThemeProvider";
import {
  radius,
  spacing,
  typography,
  withAlpha,
  type ThemeColors,
} from "../lib/theme";
import { useClubMembershipLimits } from "../store/hooks";

interface CreateTabSheetProps {
  visible: boolean;
  onClose: () => void;
}

export function CreateTabSheet({ visible, onClose }: CreateTabSheetProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const limits = useClubMembershipLimits();
  const clubCreateDisabled = !limits.canCreateClub;

  const handleNewGame = () => {
    onClose();
    router.push("/event/create");
  };

  const handleNewClub = () => {
    if (clubCreateDisabled) return;

    onClose();
    router.push("/(tabs)/clubs/create");
  };

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
          <Text style={styles.title}>Create something new</Text>
          <Text style={styles.subtitle}>
            Start a pickup run or build your crew
          </Text>

          <Pressable style={styles.option} onPress={handleNewGame}>
            <View
              style={[
                styles.optionIcon,
                { backgroundColor: withAlpha(colors.accent, 0.12) },
              ]}
            >
              <Ionicons
                name="basketball-outline"
                size={24}
                color={colors.accent}
              />
            </View>
            <View style={styles.optionText}>
              <Text style={styles.optionTitle}>New Game</Text>
              <Text style={styles.optionDescription}>
                Schedule a run and invite ballers
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textDim} />
          </Pressable>

          <Pressable
            style={[styles.option, clubCreateDisabled && styles.optionDisabled]}
            onPress={handleNewClub}
            disabled={clubCreateDisabled}
            accessibilityState={{ disabled: clubCreateDisabled }}
          >
            <View
              style={[
                styles.optionIcon,
                {
                  backgroundColor: withAlpha(
                    colors.primary,
                    clubCreateDisabled ? 0.06 : 0.12,
                  ),
                },
              ]}
            >
              <Ionicons
                name={clubCreateDisabled ? "lock-closed" : "people-outline"}
                size={24}
                color={clubCreateDisabled ? colors.textDim : colors.primary}
              />
            </View>
            <View style={styles.optionText}>
              <Text
                style={[
                  styles.optionTitle,
                  clubCreateDisabled && styles.optionTitleDisabled,
                ]}
              >
                New Club
              </Text>
              <Text style={styles.optionDescription}>
                {clubCreateDisabled
                  ? "You've already created your club"
                  : "Create a club for your pickup crew"}
              </Text>
            </View>
            {clubCreateDisabled ? null : (
              <Ionicons
                name="chevron-forward"
                size={18}
                color={colors.textDim}
              />
            )}
          </Pressable>

          <Pressable style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: colors.overlay,
      justifyContent: "flex-end",
    },
    sheet: {
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
    title: {
      ...typography.heading,
      color: colors.text,
      textAlign: "center",
    },
    subtitle: {
      ...typography.caption,
      color: colors.textMuted,
      textAlign: "center",
      marginTop: spacing.xs,
      marginBottom: spacing.lg,
    },
    option: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      padding: spacing.md,
      marginBottom: spacing.sm,
    },
    optionIcon: {
      width: 48,
      height: 48,
      borderRadius: radius.md,
      alignItems: "center",
      justifyContent: "center",
    },
    optionText: {
      flex: 1,
      minWidth: 0,
    },
    optionTitle: {
      ...typography.heading,
      color: colors.text,
      fontSize: 16,
    },
    optionDescription: {
      ...typography.caption,
      color: colors.textMuted,
      marginTop: 2,
    },
    optionDisabled: {
      opacity: 0.72,
    },
    optionTitleDisabled: {
      color: colors.textMuted,
    },
    cancelBtn: {
      alignItems: "center",
      paddingVertical: spacing.md,
      marginTop: spacing.sm,
    },
    cancelText: {
      ...typography.body,
      color: colors.textMuted,
      fontWeight: "600",
    },
  });
}
