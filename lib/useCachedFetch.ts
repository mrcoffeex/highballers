import { useCallback, useEffect, useRef, useState } from "react";

import { getRemoteCache, setRemoteCache } from "./remoteCache";

export type CachedFetchStatus = "idle" | "loading" | "refreshing";

/** Tracks keys that already ran their first fetch this session (avoids refetch on tab revisit). */
const initializedCacheKeys = new Set<string>();

export function clearTabFetchSession() {
  initializedCacheKeys.clear();
}

interface UseCachedFetchOptions<T> {
  cacheKey: string;
  enabled?: boolean;
  fetch: () => Promise<T>;
  initialData: T;
}

export function useCachedFetch<T>({
  cacheKey,
  enabled = true,
  fetch,
  initialData,
}: UseCachedFetchOptions<T>) {
  const fetchRef = useRef(fetch);
  fetchRef.current = fetch;

  const readCache = useCallback(() => getRemoteCache<T>(cacheKey), [cacheKey]);

  const [data, setData] = useState<T>(() => readCache() ?? initialData);
  const [status, setStatus] = useState<CachedFetchStatus>(() => {
    if (!enabled) return "idle";
    return readCache() === undefined ? "loading" : "idle";
  });
  const mounted = useRef(true);

  const runFetch = useCallback(
    async (mode: "initial" | "refresh" | "silent" = "initial") => {
      if (!enabled) {
        setStatus("idle");
        return;
      }

      const hasCachedData = readCache() !== undefined;
      let fetchMode = mode;

      if (fetchMode === "initial" && hasCachedData) {
        fetchMode = "silent";
      }

      if (fetchMode === "initial") {
        setStatus("loading");
      } else if (fetchMode === "refresh") {
        setStatus("refreshing");
      }

      try {
        const result = await fetchRef.current();
        if (!mounted.current) return;
        setRemoteCache(cacheKey, result);
        setData(result);
      } finally {
        if (mounted.current) {
          setStatus("idle");
        }
      }
    },
    [cacheKey, enabled, readCache],
  );

  useEffect(() => {
    const cached = readCache();
    if (cached !== undefined) {
      setData(cached);
      setStatus("idle");
      return;
    }
    setData(initialData);
  }, [cacheKey, initialData, readCache]);

  useEffect(() => {
    mounted.current = true;

    if (!enabled) {
      setStatus("idle");
      return () => {
        mounted.current = false;
      };
    }

    if (initializedCacheKeys.has(cacheKey)) {
      return () => {
        mounted.current = false;
      };
    }

    initializedCacheKeys.add(cacheKey);
    const cached = readCache();
    void runFetch(cached !== undefined ? "silent" : "initial");

    return () => {
      mounted.current = false;
    };
  }, [cacheKey, enabled, readCache, runFetch]);

  const hasCache = readCache() !== undefined;

  return {
    data,
    setData,
    status,
    hasCache,
    isInitialLoading: status === "loading",
    isRefreshing: status === "refreshing",
    reload: () => runFetch("refresh"),
    refreshSilently: () => runFetch("silent"),
  };
}
