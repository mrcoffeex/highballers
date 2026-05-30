const cache = new Map<string, unknown>();

export function getRemoteCache<T>(key: string): T | undefined {
  return cache.get(key) as T | undefined;
}

export function setRemoteCache<T>(key: string, data: T) {
  cache.set(key, data);
}

export function clearRemoteCache(key?: string) {
  if (key) {
    cache.delete(key);
    return;
  }
  cache.clear();
}
