import {
  BASIC_MAX_EVENT_SIZE,
  SubscriptionError,
  type SubscriptionTier,
} from "./subscription";

export const EVENT_MIN_PLAYERS = 10;
export const ALL_STAR_MAX_EVENT_PLAYERS = 40;
export const EVENT_MAX_PLAYER_PRESETS = [10, 20, 30, 40] as const;

export function getMaxEventPlayersForTier(tier: SubscriptionTier): number {
  return tier === "all_star" ? ALL_STAR_MAX_EVENT_PLAYERS : BASIC_MAX_EVENT_SIZE;
}

export function getAllowedMaxPlayerPresets(tier: SubscriptionTier): number[] {
  const cap = getMaxEventPlayersForTier(tier);
  return EVENT_MAX_PLAYER_PRESETS.filter((count) => count <= cap);
}

export function isEventMaxPlayerPreset(count: number): boolean {
  return EVENT_MAX_PLAYER_PRESETS.includes(
    count as (typeof EVENT_MAX_PLAYER_PRESETS)[number],
  );
}

export function canSelectEventMaxPlayers(
  tier: SubscriptionTier,
  count: number,
): boolean {
  return count <= getMaxEventPlayersForTier(tier);
}

export function clampEventMaxPlayers(
  value: number,
  tier: SubscriptionTier,
): number {
  const cap = getMaxEventPlayersForTier(tier);
  return Math.min(Math.max(value, EVENT_MIN_PLAYERS), cap);
}

export function parseEventMaxPlayersInput(
  text: string,
  tier: SubscriptionTier,
  floor = EVENT_MIN_PLAYERS,
): number | null {
  const parsed = Number.parseInt(text, 10);
  if (Number.isNaN(parsed)) return null;
  const cap = getMaxEventPlayersForTier(tier);
  const min = Math.max(EVENT_MIN_PLAYERS, floor);
  return Math.min(Math.max(parsed, min), cap);
}

export function assertEventMaxPlayersAllowed(
  tier: SubscriptionTier,
  maxPlayers: number,
): void {
  const cap = getMaxEventPlayersForTier(tier);
  if (maxPlayers > cap) {
    throw new SubscriptionError(
      `Basic Ballers can schedule games up to ${cap} players. Upgrade to All-Star for larger runs.`,
    );
  }
}
