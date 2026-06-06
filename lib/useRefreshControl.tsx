import { useCallback, useMemo, useState } from "react";
import { RefreshControl } from "react-native";

import { isSupabaseEnabled } from "./config";
import { useTheme } from "./ThemeProvider";
import { useAppStore } from "../store/useAppStore";

type RefreshFn = () => void | Promise<void>;

export function useRefreshControl(onRefreshExtra?: RefreshFn, enabled = true) {
  const { colors } = useTheme();
  const refreshFromServer = useAppStore((state) => state.refreshFromServer);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    if (!enabled) return;

    setRefreshing(true);
    try {
      const tasks: Promise<void>[] = [];

      if (isSupabaseEnabled) {
        tasks.push(refreshFromServer());
      }

      if (onRefreshExtra) {
        const result = onRefreshExtra();
        if (result instanceof Promise) {
          tasks.push(result);
        }
      }

      await Promise.all(tasks);
    } finally {
      setRefreshing(false);
    }
  }, [enabled, onRefreshExtra, refreshFromServer]);

  const refreshControl = useMemo(() => {
    if (!enabled) return undefined;
    if (!isSupabaseEnabled && !onRefreshExtra) return undefined;

    return (
      <RefreshControl
        refreshing={refreshing}
        onRefresh={onRefresh}
        tintColor={colors.primary}
        colors={[colors.primary]}
        progressBackgroundColor={colors.surface}
      />
    );
  }, [
    colors,
    enabled,
    isSupabaseEnabled,
    onRefreshExtra,
    onRefresh,
    refreshing,
  ]);

  return { refreshControl, refreshing, onRefresh };
}
