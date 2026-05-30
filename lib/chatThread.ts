import { ClubChatMessage, UserProfile } from "./types";

export type ChatListItem = {
  message: ClubChatMessage;
  isMine: boolean;
  showAvatar: boolean;
  sender?: UserProfile;
};

/** Newest-first order for an inverted message list. */
export function toInvertedMessageList(
  messages: ClubChatMessage[],
): ClubChatMessage[] {
  if (messages.length <= 1) return [...messages];
  return [...messages].reverse();
}

export function buildUsersById(users: UserProfile[]): Map<string, UserProfile> {
  return new Map(users.map((user) => [user.id, user]));
}

export function buildChatListItems(
  messagesOldestFirst: ClubChatMessage[],
  currentUserId: string | null | undefined,
  usersById: Map<string, UserProfile>,
): ChatListItem[] {
  const inverted = toInvertedMessageList(messagesOldestFirst);

  return inverted.map((message, index) => {
    const newer = inverted[index - 1];
    const isMine = message.userId === currentUserId;
    const showAvatar = !isMine && (!newer || newer.userId !== message.userId);

    return {
      message,
      isMine,
      showAvatar,
      sender: usersById.get(message.userId),
    };
  });
}

export function isPendingChatMessageId(id: string): boolean {
  return id.startsWith("pending-");
}
