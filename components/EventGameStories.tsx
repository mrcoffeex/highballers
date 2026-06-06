import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { buildEventStoryGroups } from "../lib/activityStories";
import { useActivityStoryViews } from "../lib/useActivityStoryViews";
import { useTheme, useThemedStyles } from "../lib/ThemeProvider";
import { spacing, typography, withAlpha, type ThemeColors } from "../lib/theme";
import { Club, GameEvent } from "../lib/types";
import { useAppStore } from "../store/useAppStore";
import { ActivityStoriesBar } from "./ActivityStoriesBar";
import { ActivityStoriesViewer } from "./ActivityStoriesViewer";
import { Button } from "./ui";

interface EventGameStoriesProps {
  event: GameEvent;
  club?: Club;
}

export function EventGameStories({ event, club }: EventGameStoriesProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const currentUserId = useAppStore((state) => state.currentUserId);
  const users = useAppStore((state) => state.users);
  const gameStatRecords = useAppStore((state) => state.gameStatRecords);
  const { viewedSlideIds, onViewedChange, ready } = useActivityStoryViews();
  const [storiesOpen, setStoriesOpen] = useState(false);
  const [storiesGroupIndex, setStoriesGroupIndex] = useState(0);
  const [storiesSlideIndex, setStoriesSlideIndex] = useState(0);

  const groups = useMemo(() => {
    if (!currentUserId || !ready) return [];
    return buildEventStoryGroups(
      event.id,
      currentUserId,
      users,
      club,
      event,
      gameStatRecords,
      viewedSlideIds,
    );
  }, [
    club,
    currentUserId,
    event,
    gameStatRecords,
    ready,
    users,
    viewedSlideIds,
  ]);

  const myGroupIndex = groups.findIndex((group) => group.isOwn);
  const myGroup = myGroupIndex >= 0 ? groups[myGroupIndex] : null;

  const openStories = (groupIndex: number, slideIndex = 0) => {
    setStoriesGroupIndex(groupIndex);
    setStoriesSlideIndex(slideIndex);
    setStoriesOpen(true);
  };

  if (!ready || groups.length === 0) {
    return null;
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Ionicons name="albums-outline" size={20} color={colors.primary} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>Game stories</Text>
          <Text style={styles.subtitle}>
            Share box scores like social stories
          </Text>
        </View>
      </View>

      <ActivityStoriesBar
        groups={groups}
        currentUserId={currentUserId ?? ""}
        onOpenGroup={openStories}
        compact
      />

      {myGroup ? (
        <Button
          title="Share your story"
          variant="secondary"
          size="sm"
          onPress={() => openStories(myGroupIndex)}
          icon={
            <Ionicons
              name="paper-plane-outline"
              size={16}
              color={colors.text}
            />
          }
          style={styles.shareBtn}
        />
      ) : null}

      <ActivityStoriesViewer
        visible={storiesOpen}
        groups={groups}
        initialGroupIndex={storiesGroupIndex}
        initialSlideIndex={storiesSlideIndex}
        viewedSlideIds={viewedSlideIds}
        onViewedChange={onViewedChange}
        onClose={() => setStoriesOpen(false)}
      />
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    wrap: {
      marginBottom: spacing.lg,
      padding: spacing.md,
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      marginBottom: spacing.sm,
    },
    headerIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: withAlpha(colors.primary, 0.09),
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: withAlpha(colors.primary, 0.2),
    },
    headerText: {
      flex: 1,
    },
    title: {
      ...typography.heading,
      color: colors.text,
      fontSize: 17,
    },
    subtitle: {
      ...typography.caption,
      color: colors.textMuted,
      marginTop: 2,
    },
    shareBtn: {
      marginTop: spacing.sm,
    },
  });
}
