import { Image } from "expo-image";
import { ReactNode } from "react";
import {
  Pressable,
  PressableProps,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from "react-native";

import { useTheme, useThemedStyles } from "../../lib/ThemeProvider";
import {
  radius,
  shadows,
  spacing,
  typography,
  withAlpha,
  type ThemeColors,
} from "../../lib/theme";
import { SkeletonButtonLabel } from "./Skeleton";

interface ButtonProps extends PressableProps {
  title: string;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "tonal";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: ReactNode;
}

export function Button({
  title,
  variant = "primary",
  size = "md",
  loading,
  icon,
  disabled,
  style,
  ...props
}: ButtonProps) {
  const styles = useThemedStyles(createButtonStyles);
  const isDisabled = disabled || loading;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        styles[`size_${size}`],
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        style as ViewStyle,
      ]}
      disabled={isDisabled}
      {...props}
    >
      {loading ? (
        <SkeletonButtonLabel size={size} />
      ) : (
        <>
          {icon}
          <Text
            style={[
              styles.text,
              styles[`text_${variant}`],
              icon ? styles.textWithIcon : undefined,
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </Pressable>
  );
}

export function Input({ style, ...props }: TextInputProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createInputStyles);

  return (
    <TextInput
      placeholderTextColor={colors.textMuted}
      style={[styles.input, style]}
      {...props}
    />
  );
}

interface CardProps {
  children: ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
}

export function Card({ children, style, onPress }: CardProps) {
  const styles = useThemedStyles(createCardStyles);

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.card,
          pressed && styles.cardPressed,
          style,
        ]}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={[styles.card, style]}>{children}</View>;
}

interface BadgeProps {
  label: string;
  color?: string;
}

export function Badge({ label, color }: BadgeProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createBadgeStyles);
  const badgeColor = color ?? colors.primary;

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: withAlpha(badgeColor, 0.14),
          borderColor: withAlpha(badgeColor, 0.4),
        },
      ]}
    >
      <Text style={[styles.badgeText, { color: badgeColor }]}>{label}</Text>
    </View>
  );
}

interface AvatarProps {
  name: string;
  color: string;
  size?: number;
  imageUrl?: string;
}

export function Avatar({ name, color, size = 48, imageUrl }: AvatarProps) {
  const styles = useThemedStyles(createAvatarStyles);
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (imageUrl) {
    return (
      <Image
        source={{ uri: imageUrl }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
        contentFit="cover"
      />
    );
  }

  return (
    <View
      style={[
        styles.avatar,
        {
          backgroundColor: color,
          width: size,
          height: size,
          borderRadius: size / 2,
        },
      ]}
    >
      <Text style={[styles.avatarText, { fontSize: size * 0.35 }]}>
        {initials}
      </Text>
    </View>
  );
}

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export function SectionHeader({ title, subtitle, action }: SectionHeaderProps) {
  const styles = useThemedStyles(createSectionHeaderStyles);

  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionHeaderText}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {subtitle ? (
          <Text style={styles.sectionSubtitle}>{subtitle}</Text>
        ) : null}
      </View>
      {action}
    </View>
  );
}

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
}

export function EmptyState({ icon, title, description }: EmptyStateProps) {
  const styles = useThemedStyles(createEmptyStateStyles);

  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>{icon}</View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyDescription}>{description}</Text>
    </View>
  );
}

function createButtonStyles(colors: ThemeColors) {
  return StyleSheet.create({
    base: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: radius.md,
      gap: spacing.sm,
      minHeight: 48,
      overflow: "hidden",
    },
    primary: {
      backgroundColor: colors.primary,
      ...shadows.level1,
    },
    secondary: {
      backgroundColor: colors.tertiary,
    },
    tonal: {
      backgroundColor: colors.primaryContainer,
    },
    outline: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.outlineVariant,
    },
    ghost: {
      backgroundColor: "transparent",
    },
    size_sm: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs + 2,
    },
    size_md: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm + 2,
    },
    size_lg: {
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.md,
    },
    pressed: {
      opacity: 0.88,
    },
    disabled: {
      opacity: 0.38,
    },
    text: {
      ...typography.button,
    },
    text_primary: {
      color: colors.onPrimary,
    },
    text_secondary: {
      color: colors.onTertiary,
    },
    text_tonal: {
      color: colors.onPrimaryContainer,
    },
    text_outline: {
      color: colors.primary,
    },
    text_ghost: {
      color: colors.primary,
    },
    textWithIcon: {
      marginLeft: spacing.xs,
    },
  });
}

function createInputStyles(colors: ThemeColors) {
  return StyleSheet.create({
    input: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.outlineVariant,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      color: colors.text,
      fontSize: 16,
      minHeight: 48,
    },
  });
}

function createCardStyles(colors: ThemeColors) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.outlineVariant,
      ...shadows.card,
    },
    cardPressed: {
      backgroundColor: colors.surfaceContainerLow,
      borderColor: colors.borderAccent,
    },
  });
}

function createBadgeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    badge: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: radius.full,
      borderWidth: 1,
      alignSelf: "center",
    },
    badgeText: {
      ...typography.label,
      fontSize: 11,
    },
  });
}

function createAvatarStyles(colors: ThemeColors) {
  return StyleSheet.create({
    avatar: {
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.outlineVariant,
    },
    avatarText: {
      color: colors.text,
      fontWeight: "700",
    },
  });
}

function createSectionHeaderStyles(colors: ThemeColors) {
  return StyleSheet.create({
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: spacing.md,
    },
    sectionHeaderText: {
      flex: 1,
    },
    sectionTitle: {
      ...typography.heading,
      color: colors.text,
    },
    sectionSubtitle: {
      ...typography.caption,
      color: colors.textMuted,
      marginTop: 2,
    },
  });
}

function createEmptyStateStyles(colors: ThemeColors) {
  return StyleSheet.create({
    emptyState: {
      alignItems: "center",
      paddingVertical: spacing.xxl,
      paddingHorizontal: spacing.lg,
    },
    emptyIcon: {
      width: 64,
      height: 64,
      borderRadius: radius.lg,
      backgroundColor: colors.primaryContainer,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: spacing.md,
    },
    emptyTitle: {
      ...typography.heading,
      color: colors.text,
      marginBottom: spacing.sm,
      textAlign: "center",
    },
    emptyDescription: {
      ...typography.body,
      color: colors.textMuted,
      textAlign: "center",
    },
  });
}

export * from "./Skeleton";
