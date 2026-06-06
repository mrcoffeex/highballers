import { memo, useCallback, useMemo, useRef } from "react";
import { FlatList, Platform, StyleSheet, Text, View } from "react-native";

import { buildChatListItems, type ChatListItem } from "../lib/chatThread";
import { useThemedStyles } from "../lib/ThemeProvider";
import { spacing, typography, type ThemeColors } from "../lib/theme";
import { ClubChatMessage, UserProfile } from "../lib/types";
import { ChatMessageBubble } from "./ChatMessageBubble";
import { LoadMoreSkeleton } from "./ui";

type ChatThreadListProps = {
  messages: ClubChatMessage[];
  users: UserProfile[];
  currentUserId: string | null | undefined;
  clubName: string;
  loadingMore: boolean;
  hasMore: boolean;
  onLoadOlder: () => void;
  listRef: React.RefObject<FlatList<ChatListItem> | null>;
};

function ChatThreadListInner({
  messages,
  users,
  currentUserId,
  clubName,
  loadingMore,
  hasMore,
  onLoadOlder,
  listRef,
}: ChatThreadListProps) {
  const styles = useThemedStyles(createStyles);
  const endReachedGuard = useRef(false);
  const usersById = useMemo(
    () => new Map(users.map((u) => [u.id, u])),
    [users],
  );

  const listData = useMemo(
    () => buildChatListItems(messages, currentUserId, usersById),
    [messages, currentUserId, usersById],
  );

  const handleEndReached = useCallback(() => {
    if (!hasMore || loadingMore) return;
    if (endReachedGuard.current) return;
    endReachedGuard.current = true;
    onLoadOlder();
  }, [hasMore, loadingMore, onLoadOlder]);

  const renderItem = useCallback(
    ({ item }: { item: (typeof listData)[number] }) => (
      <ChatMessageBubble
        message={item.message}
        sender={item.sender}
        isMine={item.isMine}
        showAvatar={item.showAvatar}
      />
    ),
    [],
  );

  return (
    <FlatList
      ref={listRef}
      data={listData}
      inverted
      keyExtractor={(item) => item.message.id}
      style={styles.list}
      contentContainerStyle={[
        styles.listContent,
        listData.length === 0 && styles.listEmpty,
      ]}
      renderItem={renderItem}
      ListEmptyComponent={
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>
            Be the first to drop a message in {clubName}.
          </Text>
        </View>
      }
      ListFooterComponent={loadingMore ? <LoadMoreSkeleton rows={1} /> : null}
      onEndReached={handleEndReached}
      onEndReachedThreshold={0.15}
      onMomentumScrollBegin={() => {
        endReachedGuard.current = false;
      }}
      maintainVisibleContentPosition={
        Platform.OS === "web"
          ? undefined
          : { minIndexForVisible: 0, autoscrollToTopThreshold: 24 }
      }
      initialNumToRender={18}
      maxToRenderPerBatch={12}
      windowSize={9}
      removeClippedSubviews={Platform.OS === "android"}
      keyboardDismissMode="interactive"
      keyboardShouldPersistTaps="handled"
    />
  );
}

export const ChatThreadList = memo(ChatThreadListInner);

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    list: {
      flex: 1,
    },
    listContent: {
      padding: spacing.lg,
      paddingBottom: spacing.sm,
    },
    listEmpty: {
      flexGrow: 1,
      justifyContent: "center",
    },
    emptyWrap: {
      transform: [{ scaleY: -1 }],
    },
    emptyText: {
      ...typography.body,
      color: colors.textDim,
      textAlign: "center",
    },
  });
}
