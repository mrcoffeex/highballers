import AsyncStorage from "@react-native-async-storage/async-storage";

const VIEWED_KEY = "activity-story-viewed-ids";

export async function loadViewedStorySlideIds(): Promise<Set<string>> {
  try {
    const raw = await AsyncStorage.getItem(VIEWED_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as string[];
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

export async function saveViewedStorySlideIds(ids: Set<string>) {
  await AsyncStorage.setItem(VIEWED_KEY, JSON.stringify([...ids]));
}

export async function markStorySlideViewed(
  slideId: string,
  existing: Set<string>,
): Promise<Set<string>> {
  if (existing.has(slideId)) return existing;
  const next = new Set(existing);
  next.add(slideId);
  await saveViewedStorySlideIds(next);
  return next;
}
