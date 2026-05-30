import { useCallback, useEffect, useState } from "react";

import {
  loadViewedStorySlideIds,
  markStorySlideViewed,
} from "./activityStoryViews";

export function useActivityStoryViews() {
  const [viewedSlideIds, setViewedSlideIds] = useState<Set<string>>(new Set());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    loadViewedStorySlideIds().then((ids) => {
      if (!active) return;
      setViewedSlideIds(ids);
      setReady(true);
    });
    return () => {
      active = false;
    };
  }, []);

  const onViewedChange = useCallback((ids: Set<string>) => {
    setViewedSlideIds(ids);
  }, []);

  const markViewed = useCallback(
    async (slideId: string) => {
      const next = await markStorySlideViewed(slideId, viewedSlideIds);
      setViewedSlideIds(next);
      return next;
    },
    [viewedSlideIds],
  );

  return {
    viewedSlideIds,
    onViewedChange,
    markViewed,
    ready,
  };
}
