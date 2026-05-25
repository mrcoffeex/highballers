import { CourtGame, GameEvent } from './types';

export const DEFAULT_PLAYERS_PER_GAME = 10;
export const MIN_PLAYERS_PER_GAME = 4;
export const MAX_PLAYERS_PER_GAME = 20;

export const PLAYERS_PER_GAME_PRESETS = [4, 6, 8, 10, 12, 14, 16] as const;

export function getPlayersPerGame(
  event: Pick<GameEvent, 'playersPerGame' | 'courtGames'>,
): number {
  if (event.playersPerGame) return event.playersPerGame;

  const firstGame = event.courtGames?.[0];
  if (firstGame?.teamA.length && firstGame.teamA.length === firstGame.teamB.length) {
    return firstGame.teamA.length * 2;
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

export function clampPlayersPerGame(value: number, maxPlayers?: number): number {
  const upper = maxPlayers != null
    ? Math.min(MAX_PLAYERS_PER_GAME, maxPlayers)
    : MAX_PLAYERS_PER_GAME;
  const clamped = Math.min(Math.max(value, MIN_PLAYERS_PER_GAME), upper);
  return clamped % 2 === 0 ? clamped : clamped - 1;
}

export function getAvailablePlayersPerGamePresets(maxPlayers: number): number[] {
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
