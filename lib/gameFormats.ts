import { CourtGame, GameEvent } from "./types";

export const DEFAULT_PLAYERS_PER_GAME = 10;
export const MIN_PLAYERS_PER_GAME = 4;
/** Largest supported court size (5v5). */
export const MAX_PLAYERS_PER_GAME = 10;

/** 2v2 through 5v5 only — no 6v6 / 7v7 / 8v8. */
export const PLAYERS_PER_GAME_PRESETS = [4, 6, 8, 10] as const;

export function getPlayersPerGame(
  event: Pick<GameEvent, "playersPerGame" | "courtGames" | "maxPlayers">,
): number {
  if (event.playersPerGame) {
    return clampPlayersPerGame(event.playersPerGame, event.maxPlayers);
  }

  const firstGame = event.courtGames?.[0];
  if (
    firstGame?.teamA.length &&
    firstGame.teamA.length === firstGame.teamB.length
  ) {
    return clampPlayersPerGame(firstGame.teamA.length * 2, event.maxPlayers);
  }

  return DEFAULT_PLAYERS_PER_GAME;
}

export function getTeamSize(playersPerGame: number): number {
  return playersPerGame / 2;
}

export function formatGameSizeLabel(playersPerGame: number): string {
  const perTeam = getTeamSize(playersPerGame);
  return `${perTeam}v${perTeam}`;
}

export function clampPlayersPerGame(
  value: number,
  maxPlayers?: number,
): number {
  const presets = getAvailablePlayersPerGamePresets(
    maxPlayers ?? MAX_PLAYERS_PER_GAME,
  );
  if (presets.length === 0) return DEFAULT_PLAYERS_PER_GAME;

  const capped = Math.min(
    Math.max(value, MIN_PLAYERS_PER_GAME),
    presets[presets.length - 1],
  );

  const sorted = [...presets].sort((a, b) => b - a);
  return sorted.find((preset) => preset <= capped) ?? presets[0];
}

export function getAvailablePlayersPerGamePresets(
  maxPlayers: number,
): number[] {
  return PLAYERS_PER_GAME_PRESETS.filter((preset) => preset <= maxPlayers);
}

export function describeCourtCapacity(
  participantCount: number,
  playersPerGame: number,
): { courtCount: number; assignedCount: number; unassignedCount: number } {
  const courtCount = Math.floor(participantCount / playersPerGame);
  const assignedCount = courtCount * playersPerGame;
  return {
    courtCount,
    assignedCount,
    unassignedCount: participantCount - assignedCount,
  };
}
