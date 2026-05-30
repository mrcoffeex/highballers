import { useEffect, useMemo } from "react";

import { warmChatPreviewsCache } from "../lib/tabCache";
import { useMyClubs } from "../store/hooks";
import { useAppStore } from "../store/useAppStore";

/** Prefetch tab data once so switching tabs can show cache immediately (Strava-style). */
export function TabCacheWarmup() {
  const hydrated = useAppStore((state) => state.hydrated);
  const authReady = useAppStore((state) => state.authReady);
  const myClubs = useMyClubs();
  const clubIdsKey = useMemo(
    () =>
      myClubs
        .map((club) => club.id)
        .sort()
        .join(","),
    [myClubs],
  );

  useEffect(() => {
    if (!hydrated || !authReady || !clubIdsKey) return;
    void warmChatPreviewsCache(clubIdsKey.split(","));
  }, [authReady, clubIdsKey, hydrated]);

  return null;
}
