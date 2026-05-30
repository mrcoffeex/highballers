import { subHours } from "date-fns";

import { GameWithEvent, gamePerformanceScore } from "./playerStats";
import { Club, GameEvent, GameStatRecord, UserProfile } from "./types";

/** Stories expire after 48 hours, like typical social story windows. */
export const STORY_WINDOW_HOURS = 48;

export interface ActivityStorySlide {
  id: string;
  userId: string;
  recordedAt: string;
  game: GameWithEvent;
  performanceScore: number;
  clubName?: string;
}

export interface ActivityStoryGroup {
  userId: string;
  user: UserProfile;
  slides: ActivityStorySlide[];
  latestAt: string;
  isOwn: boolean;
  hasUnviewed: boolean;
}

function gameTimestamp(game: GameWithEvent): number {
  return new Date(game.event?.dateTime ?? game.recordedAt).getTime();
}

export function isWithinStoryWindow(iso: string, now = Date.now()): boolean {
  return new Date(iso).getTime() >= subHours(now, STORY_WINDOW_HOURS).getTime();
}

export function buildActivityStoryGroups(
  currentUserId: string,
  users: UserProfile[],
  clubs: Club[],
  events: GameEvent[],
  gameStatRecords: GameStatRecord[],
  viewedSlideIds: Set<string>,
): ActivityStoryGroup[] {
  const myClubIds = new Set(
    clubs
      .filter((club) => club.memberIds.includes(currentUserId))
      .map((club) => club.id),
  );

  const connectedUserIds = new Set<string>([currentUserId]);
  for (const club of clubs) {
    if (!myClubIds.has(club.id)) continue;
    for (const memberId of club.memberIds) {
      connectedUserIds.add(memberId);
    }
  }

  const eventsById = new Map(events.map((event) => [event.id, event]));
  const clubsById = new Map(clubs.map((club) => [club.id, club]));
  const usersById = new Map(users.map((user) => [user.id, user]));

  const slidesByUser = new Map<string, ActivityStorySlide[]>();

  for (const record of gameStatRecords) {
    if (!connectedUserIds.has(record.userId)) continue;

    const recordedAt = record.recordedAt;
    if (!isWithinStoryWindow(recordedAt)) continue;

    const event = eventsById.get(record.eventId);
    const game: GameWithEvent = { ...record, event };
    const user = usersById.get(record.userId);
    if (!user) continue;

    const club = event ? clubsById.get(event.clubId) : undefined;
    const slide: ActivityStorySlide = {
      id: record.id,
      userId: record.userId,
      recordedAt,
      game,
      performanceScore: gamePerformanceScore(record.stats),
      clubName: club?.name,
    };

    const existing = slidesByUser.get(record.userId) ?? [];
    existing.push(slide);
    slidesByUser.set(record.userId, existing);
  }

  const groups: ActivityStoryGroup[] = [];

  for (const [userId, slides] of slidesByUser) {
    const user = usersById.get(userId);
    if (!user || slides.length === 0) continue;

    slides.sort((a, b) => gameTimestamp(b.game) - gameTimestamp(a.game));
    const hasUnviewed = slides.some((slide) => !viewedSlideIds.has(slide.id));

    groups.push({
      userId,
      user,
      slides,
      latestAt: slides[0].recordedAt,
      isOwn: userId === currentUserId,
      hasUnviewed,
    });
  }

  groups.sort((a, b) => {
    if (a.isOwn !== b.isOwn) return a.isOwn ? -1 : 1;
    if (a.hasUnviewed !== b.hasUnviewed) return a.hasUnviewed ? -1 : 1;
    return new Date(b.latestAt).getTime() - new Date(a.latestAt).getTime();
  });

  return groups;
}

/** Story groups for a single game — everyone with box scores on this event. */
export function buildEventStoryGroups(
  eventId: string,
  currentUserId: string,
  users: UserProfile[],
  club: Club | undefined,
  event: GameEvent,
  gameStatRecords: GameStatRecord[],
  viewedSlideIds: Set<string>,
): ActivityStoryGroup[] {
  const usersById = new Map(users.map((user) => [user.id, user]));
  const slidesByUser = new Map<string, ActivityStorySlide[]>();

  for (const record of gameStatRecords) {
    if (record.eventId !== eventId) continue;

    const user = usersById.get(record.userId);
    if (!user) continue;

    const game: GameWithEvent = { ...record, event };
    const slide: ActivityStorySlide = {
      id: record.id,
      userId: record.userId,
      recordedAt: record.recordedAt,
      game,
      performanceScore: gamePerformanceScore(record.stats),
      clubName: club?.name,
    };

    slidesByUser.set(record.userId, [slide]);
  }

  const groups: ActivityStoryGroup[] = [];

  for (const [userId, slides] of slidesByUser) {
    const user = usersById.get(userId);
    if (!user) continue;

    groups.push({
      userId,
      user,
      slides,
      latestAt: slides[0].recordedAt,
      isOwn: userId === currentUserId,
      hasUnviewed: slides.some((slide) => !viewedSlideIds.has(slide.id)),
    });
  }

  groups.sort((a, b) => {
    if (a.isOwn !== b.isOwn) return a.isOwn ? -1 : 1;
    if (a.hasUnviewed !== b.hasUnviewed) return a.hasUnviewed ? -1 : 1;
    return b.slides[0].performanceScore - a.slides[0].performanceScore;
  });

  return groups;
}

export function findStoryIndices(
  groups: ActivityStoryGroup[],
  groupUserId: string,
  slideId?: string,
): { groupIndex: number; slideIndex: number } {
  const groupIndex = groups.findIndex((group) => group.userId === groupUserId);
  if (groupIndex < 0) return { groupIndex: 0, slideIndex: 0 };

  const group = groups[groupIndex];
  if (!slideId) return { groupIndex, slideIndex: 0 };

  const slideIndex = Math.max(
    0,
    group.slides.findIndex((slide) => slide.id === slideId),
  );

  return { groupIndex, slideIndex: slideIndex < 0 ? 0 : slideIndex };
}
