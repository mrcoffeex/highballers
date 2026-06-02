import {
  BASIC_MAX_EVENT_SIZE,
  SubscriptionError,
} from "./subscription";
import type { SubscriptionTier } from "./types";

export const EVENT_MIN_PLAYERS = 10;
export const ALL_STAR_MAX_EVENT_PLAYERS = 100;
export const EVENT_MAX_PLAYER_PRESETS = [
  10, 20, 30, 40, 50, 60, 80, 100,
] as const;

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
      `Max players cannot exceed ${cap} for your plan.`,
    );
  }
}
