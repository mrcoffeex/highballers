import { canLeadClub, isClubCaptain } from "./clubRoles";
import { Club, GameEvent, GameStatRecord } from "./types";

/** Club fields needed to resolve captain / sub-captain game permissions. */
export type EventClubContext = Pick<Club, "adminId" | "subCaptainIds">;

export type EventStatus = "upcoming" | "ongoing" | "done";

/** Game options lock 12 hours after the scheduled start time. */
export const GAME_OPTIONS_LOCK_MS = 12 * 60 * 60 * 1000;

export function getEventStartTime(event: GameEvent): number {
  return new Date(event.dateTime).getTime();
}

export function getEventLockTime(event: GameEvent): number {
  return getEventStartTime(event) + GAME_OPTIONS_LOCK_MS;
}

export function hasEventStarted(event: GameEvent): boolean {
  return Date.now() >= getEventStartTime(event);
}

export function getEventStatus(event: GameEvent): EventStatus {
  if (event.finishedAt || isEventOptionsLocked(event)) return "done";
  if (hasEventStarted(event)) return "ongoing";
  return "upcoming";
}

export function getMsUntilTipOff(event: GameEvent): number {
  return Math.max(0, getEventStartTime(event) - Date.now());
}

export function formatCountdown(ms: number): string {
  const totalSeconds = Math.ceil(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${String(minutes).padStart(2, "0")}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${String(seconds).padStart(2, "0")}s`;
  }
  return `${seconds}s`;
}

export function isEventOptionsLocked(event: GameEvent): boolean {
  if (event.finishedAt) return true;
  return Date.now() >= getEventLockTime(event);
}

/** True when any box score has been saved for this game. */
export function eventHasRecordedStats(
  eventId: string,
  records: GameStatRecord[],
): boolean {
  return records.some((record) => record.eventId === eventId);
}

export function canManageEvent(
  event: GameEvent,
  userId: string | null | undefined,
  club?: EventClubContext | null,
): boolean {
  if (!userId) return false;
  if (userId === event.createdBy) return true;
  if (!club) return false;
  return canLeadClub(club as Club, userId);
}

export function canControlEvent(
  event: GameEvent,
  userId: string | null | undefined,
  club?: EventClubContext | null,
): boolean {
  if (!userId) return false;
  if (userId === event.createdBy) return true;
  if (!club) return false;
  return isClubCaptain(club as Club, userId);
}

export function canManageEventStats(
  event: GameEvent,
  userId: string | null | undefined,
  club?: EventClubContext | null,
): boolean {
  if (isEventOptionsLocked(event)) return false;
  return canControlEvent(event, userId, club);
}

export function canMarkEventFinished(
  event: GameEvent,
  userId: string | null | undefined,
  club?: EventClubContext | null,
): boolean {
  if (isEventOptionsLocked(event)) return false;
  if (!hasEventStarted(event)) return false;
  return canControlEvent(event, userId, club);
}

export function canEditEvent(
  event: GameEvent,
  userId: string | null | undefined,
  club?: EventClubContext | null,
): boolean {
  if (isEventOptionsLocked(event)) return false;
  return canControlEvent(event, userId, club);
}

/** Remove a scheduled game before it is marked finished. */
export function canCancelEvent(
  event: GameEvent,
  userId: string | null | undefined,
  club?: EventClubContext | null,
): boolean {
  if (event.finishedAt) return false;
  return canManageEvent(event, userId, club);
}

export function canRecordEventStats(
  event: GameEvent,
  userId: string | null | undefined,
  club?: EventClubContext | null,
): boolean {
  return (
    canManageEventStats(event, userId, club) &&
    event.participantIds.length > 0
  );
}
