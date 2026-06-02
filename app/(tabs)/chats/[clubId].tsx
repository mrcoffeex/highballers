import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams } from "@/lib/expoRouter";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { v4 as uuidv4 } from "uuid";

import { ChatEmojiPicker } from "../../../components/ChatEmojiPicker";
import { ChatGifPicker } from "../../../components/ChatGifPicker";
import { ChatThreadList } from "../../../components/ChatThreadList";
import { FloatingAlert } from "../../../components/FloatingAlert";
import { ChatThreadSkeleton, SkeletonCircle } from "../../../components/ui";
import { shouldShowEntitySkeleton } from "../../../lib/entityLoading";
import { isSupabaseEnabled } from "../../../lib/config";
import { getRemoteCache, setRemoteCache } from "../../../lib/remoteCache";
import { encodeGifMessage } from "../../../lib/chatMessageContent";
import { isPendingChatMessageId } from "../../../lib/chatThread";
import { pushRecentChatEmoji } from "../../../lib/chatEmojis";
import type { GiphyGif } from "../../../lib/giphy";
import { formatSyncError } from "../../../lib/syncErrors";
import { useFloatingAlert } from "../../../lib/useFloatingAlert";
import {
  CLUB_CHAT_PAGE_SIZE,
  fetchClubChatMessagesPage,
  sendClubChatMessage,
  subscribeToClubChat,
} from "../../../lib/supabaseSync";
import { colors, radius, spacing, typography } from "../../../lib/theme";
import type { ChatListItem } from "../../../lib/chatThread";
import { ClubChatMessage } from "../../../lib/types";
import { useClub } from "../../../store/hooks";
import { useAppStore } from "../../../store/useAppStore";

function persistMessages(cacheKey: string, messages: ClubChatMessage[]) {
  if (!cacheKey) return;
  setRemoteCache(cacheKey, messages);
}

export default function ClubChatScreen() {
  const { clubId } = useLocalSearchParams<{ clubId: string }>();
  const club = useClub(clubId);
  const clubs = useAppStore((state) => state.clubs);
  const hydrated = useAppStore((state) => state.hydrated);
  const users = useAppStore((state) => state.users);
  const currentUserId = useAppStore((state) => state.currentUserId);
  const insets = useSafeAreaInsets();
  const floatingAlert = useFloatingAlert();
  const listRef = useRef<FlatList<ChatListItem>>(null);

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
  const [composerPanel, setComposerPanel] = useState<"none" | "emoji" | "gif">(
    "none",
  );
  const [recentEmojis, setRecentEmojis] = useState<string[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  const isMember = club?.memberIds.includes(currentUserId ?? "") ?? false;

  const setThreadMessages = useCallback(
    (updater: (prev: ClubChatMessage[]) => ClubChatMessage[]) => {
      setMessages((prev) => {
        const next = updater(prev);
        persistMessages(cacheKey, next);
        return next;
      });
    },
    [cacheKey],
  );

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
        persistMessages(cacheKey, page);
        setHasMore(page.length >= CLUB_CHAT_PAGE_SIZE);
      } finally {
        setLoading(false);
      }
    },
    [cacheKey, clubId],
  );

  const loadOlder = useCallback(async () => {
    const oldest = messagesRef.current[0]?.createdAt;
    if (!clubId || !isSupabaseEnabled || loadingMore || !hasMore || !oldest) {
      return;
    }

    setLoadingMore(true);
    try {
      const older = await fetchClubChatMessagesPage(
        clubId,
        CLUB_CHAT_PAGE_SIZE,
        oldest,
      );
      if (older.length === 0) {
        setHasMore(false);
        return;
      }
      setThreadMessages((prev) => [...older, ...prev]);
      setHasMore(older.length >= CLUB_CHAT_PAGE_SIZE);
    } finally {
      setLoadingMore(false);
    }
  }, [clubId, hasMore, loadingMore, setThreadMessages]);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  useEffect(() => {
    if (!clubId || !isSupabaseEnabled || !currentUserId) return undefined;

    return subscribeToClubChat(
      clubId,
      (message) => {
        setThreadMessages((prev) => {
          if (prev.some((item) => item.id === message.id)) return prev;
          const withoutPending = prev.filter(
            (item) =>
              !(
                isPendingChatMessageId(item.id) &&
                item.userId === message.userId &&
                item.body === message.body
              ),
          );
          return [...withoutPending, message];
        });
      },
      (status) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          void loadInitial(true);
        }
      },
    );
  }, [clubId, currentUserId, loadInitial, setThreadMessages]);

  const postMessage = async (body: string) => {
    if (
      !clubId ||
      !currentUserId ||
      !body.trim() ||
      sending ||
      !isSupabaseEnabled
    ) {
      return;
    }

    const trimmed = body.trim();
    const pendingId = `pending-${uuidv4()}`;
    const optimistic: ClubChatMessage = {
      id: pendingId,
      clubId,
      userId: currentUserId,
      body: trimmed,
      createdAt: new Date().toISOString(),
    };

    setSending(true);
    floatingAlert.dismiss();
    setThreadMessages((prev) => [...prev, optimistic]);

    try {
      const message = await sendClubChatMessage(clubId, currentUserId, trimmed);
      setThreadMessages((prev) => {
        const withoutPending = prev.filter((item) => item.id !== pendingId);
        if (withoutPending.some((item) => item.id === message.id)) {
          return withoutPending;
        }
        return [...withoutPending, message];
      });
    } catch (error) {
      setThreadMessages((prev) => prev.filter((item) => item.id !== pendingId));
      floatingAlert.show(
        formatSyncError(error, "Could not send message."),
        "error",
      );
      throw error;
    } finally {
      setSending(false);
    }
  };

  const handleSend = async () => {
    if (!draft.trim()) return;

    const text = draft;
    setDraft("");
    setComposerPanel("none");
    try {
      await postMessage(text);
    } catch {
      setDraft(text);
    }
  };

  const handleSendGif = async (gif: GiphyGif) => {
    let body: string;
    try {
      body = encodeGifMessage(gif);
    } catch (error) {
      floatingAlert.show(
        error instanceof Error ? error.message : "Could not send GIF.",
        "error",
      );
      return;
    }

    try {
      await postMessage(body);
      setComposerPanel("none");
    } catch {
      // Error alert already shown in postMessage.
    }
  };

  const handlePickEmoji = (emoji: string) => {
    setDraft((current) => `${current}${emoji}`);
    setRecentEmojis((current) => pushRecentChatEmoji(current, emoji));
  };

  const toggleComposerPanel = (panel: "emoji" | "gif") => {
    setComposerPanel((current) => (current === panel ? "none" : panel));
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
        <FloatingAlert
          message={floatingAlert.message}
          variant={floatingAlert.variant}
          bottomInset={insets.bottom}
          onDismiss={floatingAlert.dismiss}
        />
        {loading && messages.length === 0 ? (
          <ChatThreadSkeleton count={6} />
        ) : (
          <ChatThreadList
            listRef={listRef}
            messages={messages}
            users={users}
            currentUserId={currentUserId}
            clubName={club.name}
            loadingMore={loadingMore}
            hasMore={hasMore}
            onLoadOlder={loadOlder}
          />
        )}

        {composerPanel === "emoji" ? (
          <ChatEmojiPicker
            recentEmojis={recentEmojis}
            onPick={handlePickEmoji}
          />
        ) : null}
        {composerPanel === "gif" ? (
          <ChatGifPicker onPick={(gif) => void handleSendGif(gif)} />
        ) : null}

        <View
          style={[
            styles.composer,
            { paddingBottom: Math.max(insets.bottom, spacing.sm) },
          ]}
        >
          <View style={styles.composerRow}>
            <Pressable
              onPress={() => toggleComposerPanel("emoji")}
              style={[
                styles.accessoryBtn,
                composerPanel === "emoji" && styles.accessoryBtnActive,
              ]}
              hitSlop={8}
              accessibilityLabel="Emoji picker"
            >
              <Ionicons
                name="happy-outline"
                size={22}
                color={
                  composerPanel === "emoji" ? colors.primary : colors.textMuted
                }
              />
            </Pressable>
            <Pressable
              onPress={() => toggleComposerPanel("gif")}
              style={[
                styles.accessoryBtn,
                composerPanel === "gif" && styles.accessoryBtnActive,
              ]}
              hitSlop={8}
              accessibilityLabel="GIF picker"
            >
              <Ionicons
                name="images-outline"
                size={22}
                color={
                  composerPanel === "gif" ? colors.primary : colors.textMuted
                }
              />
            </Pressable>
            <View style={styles.inputShell}>
              <TextInput
                value={draft}
                onChangeText={setDraft}
                placeholder={
                  isSupabaseEnabled
                    ? "Message the squad..."
                    : "Chat unavailable offline"
                }
                placeholderTextColor={colors.textDim}
                style={styles.input}
                multiline
                maxLength={2000}
                editable={!sending && isSupabaseEnabled}
                textAlignVertical="center"
                underlineColorAndroid="transparent"
                selectionColor={colors.primary}
              />
              <Pressable
                style={[
                  styles.sendBtn,
                  (!draft.trim() || sending || !isSupabaseEnabled) &&
                    styles.sendBtnDisabled,
                ]}
                disabled={!draft.trim() || sending || !isSupabaseEnabled}
                onPress={() => void handleSend()}
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
        </View>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    position: "relative",
    backgroundColor: colors.background,
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
  composer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
    backgroundColor: colors.surface,
    gap: spacing.sm,
  },
  composerRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.xs,
  },
  accessoryBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginBottom: 1,
  },
  accessoryBtnActive: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}18`,
  },
  inputShell: {
    flex: 1,
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
