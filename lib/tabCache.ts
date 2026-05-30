import { isSupabaseEnabled } from "./config";
import { fetchChatPreviews } from "./supabaseSync";
import { getRemoteCache, setRemoteCache } from "./remoteCache";
import type { ClubChatPreview } from "./types";

export function chatPreviewsCacheKey(clubIds: string[]) {
  return `chat-previews:${[...clubIds].sort().join(",")}`;
}

export async function warmChatPreviewsCache(clubIds: string[]) {
  if (!isSupabaseEnabled || clubIds.length === 0) return;

  const cacheKey = chatPreviewsCacheKey(clubIds);
  if (getRemoteCache<ClubChatPreview[]>(cacheKey) !== undefined) return;

  try {
    const previews = await fetchChatPreviews(clubIds);
    setRemoteCache(cacheKey, previews);
  } catch {
    setRemoteCache(
      cacheKey,
      clubIds.map((clubId) => ({ clubId })),
    );
  }
}
