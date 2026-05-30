import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { ScrollView, Pressable, StyleSheet, Text, View } from "react-native";

import { ActivityStoryGroup } from "../lib/activityStories";
import { colors, radius, spacing, typography } from "../lib/theme";
import { Avatar } from "./ui";

interface ActivityStoriesBarProps {
  groups: ActivityStoryGroup[];
  currentUserId: string;
  onOpenGroup: (groupIndex: number) => void;
  compact?: boolean;
}

export function ActivityStoriesBar({
  groups,
  currentUserId,
  onOpenGroup,
  compact,
}: ActivityStoriesBarProps) {
  if (groups.length === 0) {
    return null;
  }

  return (
    <View style={[styles.wrap, compact && styles.wrapCompact]}>
      {compact ? null : <Text style={styles.heading}>Stories</Text>}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {groups.map((group, index) => (
          <Pressable
            key={group.userId}
            style={styles.item}
            onPress={() => onOpenGroup(index)}
            accessibilityLabel={`View ${group.user.nickname ?? group.user.name} story`}
          >
            <StoryAvatarRing
              user={group.user}
              hasUnviewed={group.hasUnviewed}
              isOwn={group.userId === currentUserId}
            />
            <Text style={styles.name} numberOfLines={1}>
              {group.isOwn
                ? "Your story"
                : (group.user.nickname ?? group.user.name).split(" ")[0]}
            </Text>
            <Text style={styles.count}>{group.slides.length}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

function StoryAvatarRing({
  user,
  hasUnviewed,
  isOwn,
}: {
  user: ActivityStoryGroup["user"];
  hasUnviewed: boolean;
  isOwn: boolean;
}) {
  const ringColors: [string, string, ...string[]] = hasUnviewed
    ? [colors.primary, colors.secondary, colors.accent]
    : [colors.cardBorder, colors.cardBorder];

  return (
    <LinearGradient
      colors={ringColors}
      style={styles.ring}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View style={styles.ringInner}>
        <Avatar
          name={user.name}
          color={user.avatarColor}
          size={56}
          imageUrl={user.avatarUrl}
        />
        {isOwn ? (
          <View style={styles.ownBadge}>
            <Ionicons name="add" size={12} color={colors.text} />
          </View>
        ) : null}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.lg,
  },
  wrapCompact: {
    marginBottom: 0,
  },
  heading: {
    ...typography.label,
    color: colors.textDim,
    marginBottom: spacing.sm,
  },
  row: {
    gap: spacing.md,
    paddingRight: spacing.md,
  },
  item: {
    alignItems: "center",
    width: 72,
  },
  ring: {
    width: 68,
    height: 68,
    borderRadius: radius.full,
    padding: 3,
    marginBottom: spacing.xs,
  },
  ringInner: {
    flex: 1,
    borderRadius: radius.full,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  ownBadge: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 20,
    height: 20,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.background,
  },
  name: {
    ...typography.caption,
    color: colors.text,
    fontWeight: "600",
    fontSize: 11,
    maxWidth: 72,
    textAlign: "center",
  },
  count: {
    ...typography.label,
    color: colors.textDim,
    fontSize: 9,
  },
  emptyWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.lg,
    padding: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  emptyRing: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    borderWidth: 2,
    borderColor: colors.cardBorder,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyLabel: {
    ...typography.caption,
    color: colors.text,
    fontWeight: "700",
  },
  emptyHint: {
    ...typography.caption,
    color: colors.textDim,
    flex: 1,
  },
});
