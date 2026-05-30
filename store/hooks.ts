import { useMemo } from "react";

import {
  Club,
  GameEvent,
  GameStatRecord,
  SubscriptionTier,
  UserProfile,
} from "../lib/types";
import { getUserTier, isAllStar } from "../lib/subscription";
import {
  normalizeEventCourts,
  resolveActiveRosterPlayers,
  resolveCourtGames,
  resolveWaitlistPlayers,
} from "../lib/eventRoster";
import { useAppStore } from "./useAppStore";

export function useCurrentUser(): UserProfile | null {
  const currentUserId = useAppStore((state) => state.currentUserId);
  const users = useAppStore((state) => state.users);

  return useMemo(
    () => users.find((user) => user.id === currentUserId) ?? null,
    [users, currentUserId],
  );
}

export function useSubscriptionTier(): SubscriptionTier {
  const user = useCurrentUser();
  return getUserTier(user);
}

export function useIsAllStar(): boolean {
  const user = useCurrentUser();
  return isAllStar(user);
}

export function useMyClubs(): Club[] {
  const currentUserId = useAppStore((state) => state.currentUserId);
  const clubs = useAppStore((state) => state.clubs);

  return useMemo(() => {
    if (!currentUserId) return [];
    return clubs.filter((club) => club.memberIds.includes(currentUserId));
  }, [clubs, currentUserId]);
}

export function useUpcomingEvents(): GameEvent[] {
  const events = useAppStore((state) => state.events);

  return useMemo(() => {
    const now = Date.now();
    return events
      .filter((event) => new Date(event.dateTime).getTime() >= now)
      .sort(
        (a, b) =>
          new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime(),
      );
  }, [events]);
}

export function useClub(clubId: string): Club | undefined {
  return useAppStore((state) => state.clubs.find((club) => club.id === clubId));
}

export function useEvent(eventId: string): GameEvent | undefined {
  const event = useAppStore((state) =>
    state.events.find((item) => item.id === eventId),
  );

  return useMemo(
    () => (event ? normalizeEventCourts(event) : undefined),
    [event],
  );
}

export function useUser(userId: string): UserProfile | undefined {
  return useAppStore((state) => state.users.find((user) => user.id === userId));
}

export function useClubJoinRequests(clubId: string) {
  return useAppStore((state) =>
    state.joinRequests.filter((request) => request.clubId === clubId),
  );
}

export function useMyJoinRequest(clubId: string) {
  const currentUserId = useAppStore((state) => state.currentUserId);
  const joinRequests = useAppStore((state) => state.joinRequests);

  return useMemo(
    () =>
      joinRequests.find(
        (request) =>
          request.clubId === clubId && request.userId === currentUserId,
      ) ?? null,
    [clubId, currentUserId, joinRequests],
  );
}

export function usePlayerGameHistory(
  userId: string,
): Array<GameStatRecord & { event?: GameEvent }> {
  const gameStatRecords = useAppStore((state) => state.gameStatRecords);
  const events = useAppStore((state) => state.events);

  return useMemo(() => {
    return gameStatRecords
      .filter((record) => record.userId === userId)
      .map((record) => ({
        ...record,
        event: events.find((event) => event.id === record.eventId),
      }))
      .sort(
        (a, b) =>
          new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime(),
      );
  }, [gameStatRecords, events, userId]);
}

export function useActiveRoster(
  event: GameEvent | undefined,
  users: UserProfile[],
  courtGameIndex = 0,
) {
  return useMemo(() => {
    if (!event) return [];
    return resolveActiveRosterPlayers(event, users, courtGameIndex);
  }, [event, users, courtGameIndex]);
}

export function useCourtGames(
  event: GameEvent | undefined,
  users: UserProfile[],
) {
  return useMemo(() => {
    if (!event) return [];
    return resolveCourtGames(event, users);
  }, [event, users]);
}

export function useEventWaitlist(
  event: GameEvent | undefined,
  users: UserProfile[],
) {
  return useMemo(() => {
    if (!event) return [];
    return resolveWaitlistPlayers(event, users);
  }, [event, users]);
}
