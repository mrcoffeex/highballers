import { isUserBannedFromClub } from "./clubBans";
import { canUserJoinEvent, isPrivateEvent } from "./eventAccess";
import { canControlEvent, isEventOptionsLocked } from "./gameEvents";
import { canJoinEvent, getUserTier } from "./subscription";
import { Club, ClubBan, GameEvent, UserProfile } from "./types";

export type InvitePlayerResult = {
  addedIds: string[];
  skipped: Array<{ userId: string; reason: string }>;
};

export function canInvitePlayersToEvent(
  event: GameEvent,
  userId: string | null | undefined,
  club?: Pick<Club, "adminId" | "subCaptainIds"> | null,
): boolean {
  if (isEventOptionsLocked(event)) return false;
  if (event.participantIds.length >= event.maxPlayers) return false;
  return canControlEvent(event, userId, club);
}

export function getSpotsLeft(event: GameEvent): number {
  return Math.max(0, event.maxPlayers - event.participantIds.length);
}

/** Club members who can be added to the game roster by an organizer. */
export function getInviteableClubMembers(
  event: GameEvent,
  club: Club | undefined,
  users: UserProfile[],
  clubBans: ClubBan[],
  excludeUserId?: string | null,
): UserProfile[] {
  if (!club) return [];

  const participantSet = new Set(event.participantIds);

  return club.memberIds
    .filter((memberId) => memberId !== excludeUserId)
    .filter((memberId) => !participantSet.has(memberId))
    .filter((memberId) => !isUserBannedFromClub(club.id, memberId, clubBans))
    .map((memberId) => users.find((user) => user.id === memberId))
    .filter((user): user is UserProfile => Boolean(user));
}

export function resolvePlayersToInvite(
  event: GameEvent,
  club: Club | undefined,
  users: UserProfile[],
  clubBans: ClubBan[],
  candidateIds: string[],
): InvitePlayerResult {
  const spotsLeft = getSpotsLeft(event);
  const addedIds: string[] = [];
  const skipped: Array<{ userId: string; reason: string }> = [];

  if (spotsLeft === 0) {
    return {
      addedIds,
      skipped: candidateIds.map((userId) => ({
        userId,
        reason: "This game is full.",
      })),
    };
  }

  const seen = new Set<string>();

  for (const userId of candidateIds) {
    if (seen.has(userId)) continue;
    seen.add(userId);

    if (event.participantIds.includes(userId)) {
      skipped.push({ userId, reason: "Already in this game." });
      continue;
    }

    if (!club?.memberIds.includes(userId)) {
      skipped.push({ userId, reason: "Not a club member." });
      continue;
    }

    if (isUserBannedFromClub(event.clubId, userId, clubBans)) {
      skipped.push({ userId, reason: "Banned from this club." });
      continue;
    }

    const player = users.find((user) => user.id === userId);
    const projectedEvent: GameEvent = {
      ...event,
      participantIds: [...event.participantIds, ...addedIds],
      invitedMemberIds: isPrivateEvent(event)
        ? [...new Set([...(event.invitedMemberIds ?? []), userId])]
        : event.invitedMemberIds,
    };
    const access = canUserJoinEvent(userId, projectedEvent);
    if (!access.ok) {
      skipped.push({
        userId,
        reason: access.reason ?? "Cannot join this game.",
      });
      continue;
    }

    const tierCheck = canJoinEvent(getUserTier(player), event);
    if (!tierCheck.ok) {
      skipped.push({
        userId,
        reason: tierCheck.reason ?? "Player cannot join on their plan.",
      });
      continue;
    }

    if (addedIds.length >= spotsLeft) {
      skipped.push({ userId, reason: "No spots left." });
      continue;
    }

    addedIds.push(userId);
  }

  return { addedIds, skipped };
}
