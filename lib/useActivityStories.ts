import { useMemo } from "react";

import { buildActivityStoryGroups } from "./activityStories";
import { useActivityStoryViews } from "./useActivityStoryViews";
import { useAppStore } from "../store/useAppStore";

export function useActivityStories() {
  const currentUserId = useAppStore((state) => state.currentUserId);
  const users = useAppStore((state) => state.users);
  const clubs = useAppStore((state) => state.clubs);
  const events = useAppStore((state) => state.events);
  const gameStatRecords = useAppStore((state) => state.gameStatRecords);
  const { viewedSlideIds, onViewedChange, ready } = useActivityStoryViews();

  const groups = useMemo(() => {
    if (!currentUserId || !ready) return [];
    return buildActivityStoryGroups(
      currentUserId,
      users,
      clubs,
      events,
      gameStatRecords,
      viewedSlideIds,
    );
  }, [
    currentUserId,
    users,
    clubs,
    events,
    gameStatRecords,
    viewedSlideIds,
    ready,
  ]);

  return {
    groups,
    viewedSlideIds,
    onViewedChange,
    ready,
  };
}
