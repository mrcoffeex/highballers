import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useMemo } from "react";
import { StyleSheet, Text } from "react-native";

import { ChatListItem } from "../../../components/ChatListItem";
import { Screen } from "../../../components/Screen";
import { TabSkeletonOverlay } from "../../../components/TabSkeletonOverlay";
import { ChatListSkeleton, EmptyState } from "../../../components/ui";
import { isSupabaseEnabled } from "../../../lib/config";
import { chatPreviewsCacheKey } from "../../../lib/tabCache";
import { fetchChatPreviews } from "../../../lib/supabaseSync";
import { getRemoteCache } from "../../../lib/remoteCache";
import { colors, spacing, typography } from "../../../lib/theme";
import { useCachedFetch } from "../../../lib/useCachedFetch";
import { ClubChatPreview } from "../../../lib/types";
import { useMyClubs } from "../../../store/hooks";
import { useAppStore } from "../../../store/useAppStore";

export default function ChatsScreen() {
  const router = useRouter();
  const myClubs = useMyClubs();
  const users = useAppStore((state) => state.users);
  const clubIds = useMemo(() => myClubs.map((club) => club.id), [myClubs]);
  const cacheKey = useMemo(() => chatPreviewsCacheKey(clubIds), [clubIds]);
  const fallbackPreviews = useMemo<ClubChatPreview[]>(
    () => myClubs.map((club) => ({ clubId: club.id })),
    [myClubs],
  );

  const fetchPreviews = useCallback(async () => {
    const clubIds = myClubs.map((club) => club.id);
    try {
      return await fetchChatPreviews(clubIds);
    } catch {
      return fallbackPreviews;
    }
  }, [fallbackPreviews, myClubs]);

  const {
    data: previews,
    isInitialLoading,
    refreshSilently,
  } = useCachedFetch({
    cacheKey,
    enabled: isSupabaseEnabled && myClubs.length > 0,
    initialData: fallbackPreviews,
    fetch: fetchPreviews,
  });

  const sortedClubs = useMemo(() => {
    const previewMap = new Map(
      previews.map((preview) => [preview.clubId, preview]),
    );

    return [...myClubs].sort((a, b) => {
      const aTime = previewMap.get(a.id)?.lastMessage?.createdAt ?? a.createdAt;
      const bTime = previewMap.get(b.id)?.lastMessage?.createdAt ?? b.createdAt;
      return new Date(bTime).getTime() - new Date(aTime).getTime();
    });
  }, [myClubs, previews]);

  const showDataLoading =
    isSupabaseEnabled &&
    isInitialLoading &&
    getRemoteCache<ClubChatPreview[]>(cacheKey) === undefined &&
    myClubs.length > 0;

  return (
    <TabSkeletonOverlay
      showDataLoading={showDataLoading}
      skeleton={
        <>
          <Text style={styles.title}>Chats</Text>
          <Text style={styles.subtitle}>
            Group threads for every club you&apos;re in
          </Text>
          <ChatListSkeleton count={5} />
        </>
      }
    >
      <Screen onRefreshExtra={refreshSilently}>
        <Text style={styles.title}>Chats</Text>
        <Text style={styles.subtitle}>
          Group threads for every club you&apos;re in
        </Text>

        {sortedClubs.length === 0 ? (
          <EmptyState
            icon={
              <Ionicons
                name="chatbubbles-outline"
                size={28}
                color={colors.textDim}
              />
            }
            title="No club chats yet"
            description="Join or create a club to unlock group chat."
          />
        ) : (
          sortedClubs.map((club) => {
            const preview = previews.find(
              (item) => item.clubId === club.id,
            ) ?? { clubId: club.id };
            const sender = preview.lastMessage
              ? users.find((user) => user.id === preview.lastMessage?.userId)
              : undefined;

            return (
              <ChatListItem
                key={club.id}
                club={club}
                preview={preview}
                sender={sender}
                onPress={() => router.push(`/chats/${club.id}`)}
              />
            );
          })
        )}
      </Screen>
    </TabSkeletonOverlay>
  );
}

const styles = StyleSheet.create({
  title: {
    ...typography.title,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.textMuted,
    marginBottom: spacing.lg,
  },
});
