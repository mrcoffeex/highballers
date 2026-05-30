import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ChatMessageBubble } from "../../../components/ChatMessageBubble";
import { AllStarPromoCard } from "../../../components/AllStarPromoCard";
import { UpgradeModal } from "../../../components/UpgradeModal";
import {
  ChatThreadSkeleton,
  LoadMoreSkeleton,
  SkeletonCircle,
} from "../../../components/ui";
import { shouldShowEntitySkeleton } from "../../../lib/entityLoading";
import { isSupabaseEnabled } from "../../../lib/config";
import { getRemoteCache, setRemoteCache } from "../../../lib/remoteCache";
import { canAccessFeature } from "../../../lib/subscription";
import { useUpgradePrompt } from "../../../lib/useUpgradePrompt";
import {
  CLUB_CHAT_PAGE_SIZE,
  fetchClubChatMessagesPage,
  sendClubChatMessage,
  subscribeToClubChat,
} from "../../../lib/supabaseSync";
import { colors, radius, spacing, typography } from "../../../lib/theme";
import { ClubChatMessage } from "../../../lib/types";
import { useClub, useSubscriptionTier } from "../../../store/hooks";
import { useAppStore } from "../../../store/useAppStore";

export default function ClubChatScreen() {
  const { clubId } = useLocalSearchParams<{ clubId: string }>();
  const club = useClub(clubId);
  const clubs = useAppStore((state) => state.clubs);
  const hydrated = useAppStore((state) => state.hydrated);
  const users = useAppStore((state) => state.users);
  const currentUserId = useAppStore((state) => state.currentUserId);
  const upgradeToAllStar = useAppStore((state) => state.upgradeToAllStar);
  const tier = useSubscriptionTier();
  const canSendChat = canAccessFeature(tier, "send_chat");
  const {
    upgradeVisible,
    upgradeReason,
    promptUpgrade,
    closeUpgrade,
    handleSubscriptionError,
  } = useUpgradePrompt();
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<ClubChatMessage>>(null);

  const cacheKey = clubId ? `club-chat:${clubId}` : "";
  const cachedMessages = cacheKey
    ? getRemoteCache<ClubChatMessage[]>(cacheKey)
    : undefined;

  const [messages, setMessages] = useState<ClubChatMessage[]>(
    cachedMessages ?? [],
  );
  const [loading, setLoading] = useState(
    Boolean(clubId && isSupabaseEnabled && !cachedMessages),
  );
  const [loadingMore, setLoadingMore] = useState(false);
  const [sending, setSending] = useState(false);
  const [draft, setDraft] = useState("");
  const [hasMore, setHasMore] = useState(false);
  const endReachedGuard = useRef(false);

  const isMember = club?.memberIds.includes(currentUserId ?? "") ?? false;

  const loadInitial = useCallback(
    async (silent = false) => {
      if (!clubId || !isSupabaseEnabled) {
        setLoading(false);
        return;
      }

      if (!silent && !getRemoteCache<ClubChatMessage[]>(cacheKey)) {
        setLoading(true);
      }

      try {
        const page = await fetchClubChatMessagesPage(
          clubId,
          CLUB_CHAT_PAGE_SIZE,
        );
        setMessages(page);
        setRemoteCache(cacheKey, page);
        setHasMore(page.length >= CLUB_CHAT_PAGE_SIZE);
      } finally {
        setLoading(false);
      }
    },
    [cacheKey, clubId],
  );

  const loadOlder = useCallback(async () => {
    if (
      !clubId ||
      !isSupabaseEnabled ||
      loadingMore ||
      !hasMore ||
      messages.length === 0
    )
      return;

    setLoadingMore(true);
    try {
      const older = await fetchClubChatMessagesPage(
        clubId,
        CLUB_CHAT_PAGE_SIZE,
        messages[0]?.createdAt,
      );
      if (older.length === 0) {
        setHasMore(false);
        return;
      }
      setMessages((prev) => [...older, ...prev]);
      setHasMore(older.length >= CLUB_CHAT_PAGE_SIZE);
    } finally {
      setLoadingMore(false);
      endReachedGuard.current = false;
    }
  }, [clubId, hasMore, loadingMore, messages]);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  useEffect(() => {
    if (!clubId || !isSupabaseEnabled) return undefined;

    return subscribeToClubChat(clubId, (message) => {
      setMessages((prev) => {
        if (prev.some((item) => item.id === message.id)) return prev;
        const next = [...prev, message];
        setRemoteCache(cacheKey, next);
        return next;
      });
    });
  }, [cacheKey, clubId]);

  useEffect(() => {
    if (messages.length === 0 || !cacheKey) return;
    setRemoteCache(cacheKey, messages);
  }, [cacheKey, messages]);

  useEffect(() => {
    if (messages.length === 0) return;
    listRef.current?.scrollToEnd({ animated: true });
  }, [messages.length]);

  const handleSend = async () => {
    if (!clubId || !currentUserId || !draft.trim() || sending) return;
    if (!canSendChat) {
      promptUpgrade("Sending club chat messages is All-Star only.");
      return;
    }

    setSending(true);
    try {
      const message = await sendClubChatMessage(clubId, currentUserId, draft);
      setDraft("");
      setMessages((prev) => {
        if (prev.some((item) => item.id === message.id)) return prev;
        return [...prev, message];
      });
    } catch (error) {
      handleSubscriptionError(error, "Could not send message.");
    } finally {
      setSending(false);
    }
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (event.nativeEvent.contentOffset.y <= 24 && hasMore && !loadingMore) {
      if (endReachedGuard.current) return;
      endReachedGuard.current = true;
      loadOlder();
    }
  };

  if (!club) {
    if (shouldShowEntitySkeleton(club, hydrated, clubs.length === 0)) {
      return <ChatThreadSkeleton count={6} />;
    }

    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Club not found</Text>
      </View>
    );
  }

  if (!isMember) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>
          Join this club to enter the group chat.
        </Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerTitle: club.name }} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 88 : 0}
      >
        {loading && messages.length === 0 ? (
          <ChatThreadSkeleton count={6} />
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(item) => item.id}
            style={styles.list}
            contentContainerStyle={[
              styles.listContent,
              messages.length === 0 && styles.listEmpty,
            ]}
            renderItem={({ item, index }) => {
              const previous = messages[index - 1];
              const isMine = item.userId === currentUserId;
              const sender = users.find((user) => user.id === item.userId);
              const showAvatar = !previous || previous.userId !== item.userId;

              return (
                <ChatMessageBubble
                  message={item}
                  sender={sender}
                  isMine={isMine}
                  showAvatar={showAvatar}
                />
              );
            }}
            ListEmptyComponent={
              <Text style={styles.emptyText}>
                Be the first to drop a message in {club.name}.
              </Text>
            }
            ListHeaderComponent={
              loadingMore ? <LoadMoreSkeleton rows={1} /> : null
            }
            onScroll={handleScroll}
            scrollEventThrottle={16}
            onContentSizeChange={() => {
              if (messages.length > 0) {
                listRef.current?.scrollToEnd({ animated: false });
              }
            }}
          />
        )}

        <View
          style={[
            styles.composer,
            { paddingBottom: Math.max(insets.bottom, spacing.sm) },
          ]}
        >
          {!canSendChat ? (
            <AllStarPromoCard
              variant="compact"
              onPress={() =>
                promptUpgrade("Sending club chat messages is All-Star only.")
              }
            />
          ) : null}
          <View
            style={[
              styles.inputShell,
              !canSendChat && styles.inputShellDisabled,
            ]}
          >
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder={
                canSendChat
                  ? "Message the squad..."
                  : "Read-only on Basic Baller"
              }
              placeholderTextColor={colors.textDim}
              style={styles.input}
              multiline
              maxLength={2000}
              editable={!sending && isSupabaseEnabled && canSendChat}
              textAlignVertical="center"
              underlineColorAndroid="transparent"
              selectionColor={colors.primary}
            />
            <Pressable
              style={[
                styles.sendBtn,
                (!draft.trim() || sending || !canSendChat) &&
                  styles.sendBtnDisabled,
              ]}
              disabled={!draft.trim() || sending || !canSendChat}
              onPress={handleSend}
              hitSlop={8}
            >
              {sending ? (
                <SkeletonCircle size={18} />
              ) : (
                <Ionicons name="send" size={18} color={colors.text} />
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>

      <UpgradeModal
        visible={upgradeVisible}
        reason={upgradeReason}
        onClose={closeUpgrade}
        onPurchased={() => {
          void upgradeToAllStar();
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.background,
  },
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
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  errorText: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: "center",
  },
  emptyText: {
    ...typography.body,
    color: colors.textDim,
    textAlign: "center",
  },
  composer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
    backgroundColor: colors.surface,
    gap: spacing.sm,
  },
  inputShell: {
    flexDirection: "row",
    alignItems: "flex-end",
    minHeight: 48,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.card,
    paddingLeft: spacing.md,
    paddingRight: spacing.xs,
    paddingVertical: spacing.xs,
    gap: spacing.xs,
    overflow: "hidden",
  },
  inputShellDisabled: {
    opacity: 0.72,
  },
  input: {
    flex: 1,
    minHeight: 36,
    maxHeight: 120,
    paddingTop: Platform.OS === "ios" ? 8 : 6,
    paddingBottom: Platform.OS === "ios" ? 8 : 6,
    paddingRight: spacing.xs,
    color: colors.text,
    fontSize: 16,
    lineHeight: 20,
    borderWidth: 0,
    backgroundColor: "transparent",
    ...(Platform.OS === "web" ? { outlineWidth: 0 } : {}),
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 1,
  },
  sendBtnDisabled: {
    opacity: 0.45,
  },
});
