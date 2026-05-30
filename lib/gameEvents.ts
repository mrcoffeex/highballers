import { GameEvent } from "./types";
import { hasActiveRoster } from "./eventRoster";

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

export function canManageEvent(
  event: GameEvent,
  userId: string | null | undefined,
  clubAdminId?: string,
): boolean {
  if (!userId) return false;
  return userId === event.createdBy || userId === clubAdminId;
}

export function canManageEventStats(
  event: GameEvent,
  userId: string | null | undefined,
  clubAdminId?: string,
): boolean {
  if (isEventOptionsLocked(event)) return false;
  return canManageEvent(event, userId, clubAdminId);
}

export function canMarkEventFinished(
  event: GameEvent,
  userId: string | null | undefined,
  clubAdminId?: string,
): boolean {
  if (isEventOptionsLocked(event)) return false;
  if (!hasEventStarted(event)) return false;
  return canManageEvent(event, userId, clubAdminId);
}

export function canEditEvent(
  event: GameEvent,
  userId: string | null | undefined,
  clubAdminId?: string,
): boolean {
  if (isEventOptionsLocked(event)) return false;
  return canManageEvent(event, userId, clubAdminId);
}

/** Remove a scheduled game before it is marked finished. */
export function canCancelEvent(
  event: GameEvent,
  userId: string | null | undefined,
  clubAdminId?: string,
): boolean {
  if (event.finishedAt) return false;
  return canManageEvent(event, userId, clubAdminId);
}

export function canRecordEventStats(
  event: GameEvent,
  userId: string | null | undefined,
  clubAdminId?: string,
): boolean {
  return (
    canManageEventStats(event, userId, clubAdminId) && hasActiveRoster(event)
  );
}
