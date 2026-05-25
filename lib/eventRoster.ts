import { CourtGame, GameEvent, UserProfile } from './types';
import {
  DEFAULT_PLAYERS_PER_GAME,
  getPlayersPerGame,
  getTeamSize,
} from './gameFormats';
import { balanceTeams, calculatePlayerRating } from './teamBalancer';

/** @deprecated Use DEFAULT_PLAYERS_PER_GAME or event.playersPerGame */
export const GAME_ROSTER_SIZE = DEFAULT_PLAYERS_PER_GAME;
/** @deprecated Use getTeamSize(getPlayersPerGame(event)) */
export const TEAM_SIZE = DEFAULT_PLAYERS_PER_GAME / 2;
/** Scorekeeper tab index for players not assigned to a full court after shuffle. */
export const UNASSIGNED_ROSTER_INDEX = -1;
export const UNASSIGNED_ROSTER_LABEL = 'Unassigned';

export function getCourtPlayersPerGame(game: CourtGame): number {
  return game.teamA.length + game.teamB.length;
}

export function isValidCourtGame(
  game: CourtGame | null | undefined,
  playersPerGame?: number,
): boolean {
  if (!game) return false;
  if (game.teamA.length !== game.teamB.length || game.teamA.length === 0) return false;

  const actual = getCourtPlayersPerGame(game);
  if (playersPerGame != null) {
    return actual === playersPerGame;
  }

  return actual >= 4 && actual % 2 === 0;
}

/** Accept camelCase or snake_case keys from Supabase JSON. */
export function normalizeCourtGame(raw: unknown): CourtGame | null {
  if (!raw || typeof raw !== 'object') return null;

  const game = raw as Record<string, unknown>;
  const teamA = (game.teamA ?? game.team_a) as string[] | undefined;
  const teamB = (game.teamB ?? game.team_b) as string[] | undefined;

  if (!Array.isArray(teamA) || !Array.isArray(teamB)) return null;

  return {
    teamA: teamA.filter((id): id is string => typeof id === 'string'),
    teamB: teamB.filter((id): id is string => typeof id === 'string'),
  };
}

export function normalizeCourtGames(
  raw: unknown,
  playersPerGame?: number,
): CourtGame[] | undefined {
  if (!Array.isArray(raw)) return undefined;

  const games = raw
    .map(normalizeCourtGame)
    .filter((game): game is CourtGame => isValidCourtGame(game, playersPerGame));

  return games.length > 0 ? games : undefined;
}

/** Migrate legacy teamA/teamB fields from persisted events. */
export function normalizeEventCourts(event: GameEvent): GameEvent {
  const playersPerGame = getPlayersPerGame(event);
  const normalized = normalizeCourtGames(event.courtGames, playersPerGame);
  if (normalized) {
    return {
      ...event,
      courtGames: normalized,
      shuffled: event.shuffled && normalized.length > 0,
    };
  }

  const legacy = event as GameEvent & { teamA?: string[]; teamB?: string[] };
  if (legacy.teamA?.length && legacy.teamB?.length) {
    const courtGames = normalizeCourtGames([{ teamA: legacy.teamA, teamB: legacy.teamB }]);
    if (courtGames) {
      return { ...event, courtGames, shuffled: true };
    }
  }

  return event;
}

export function hasActiveRoster(event: GameEvent): boolean {
  const eventCourts = normalizeEventCourts(event);
  const playersPerGame = getPlayersPerGame(eventCourts);
  return Boolean(
    eventCourts.shuffled
    && eventCourts.courtGames?.some((game) => isValidCourtGame(game, playersPerGame)),
  );
}

export function getCourtGameCount(event: GameEvent): number {
  const courts = normalizeEventCourts(event);
  const playersPerGame = getPlayersPerGame(courts);
  return courts.courtGames?.filter((game) => isValidCourtGame(game, playersPerGame)).length ?? 0;
}

export function getUnassignedRosterIds(event: GameEvent): string[] {
  const assignedIds = new Set(getAllCourtPlayerIds(event));

  return event.participantIds.filter((id) => !assignedIds.has(id));
}

export function getCourtGameRosterIds(event: GameEvent, courtGameIndex = 0): string[] {
  if (courtGameIndex === UNASSIGNED_ROSTER_INDEX) {
    return getUnassignedRosterIds(event);
  }

  const courts = normalizeEventCourts(event);
  const game = courts.courtGames?.[courtGameIndex];
  const playersPerGame = getPlayersPerGame(courts);
  if (!game || !isValidCourtGame(game, playersPerGame)) return [];
  return [...game.teamA, ...game.teamB];
}

export function getAllCourtPlayerIds(event: GameEvent): string[] {
  const courts = normalizeEventCourts(event);
  const playersPerGame = getPlayersPerGame(courts);
  if (!courts.courtGames) return [];
  return courts.courtGames.flatMap((game) =>
    isValidCourtGame(game, playersPerGame) ? [...game.teamA, ...game.teamB] : [],
  );
}

export function canShuffleEvent(event: GameEvent, playersPerGame?: number): boolean {
  const size = playersPerGame ?? getPlayersPerGame(event);
  return event.participantIds.length >= size;
}

/** Shuffle joined players into balanced court games. */
export function buildCourtGames(
  players: UserProfile[],
  playersPerGame = DEFAULT_PLAYERS_PER_GAME,
): CourtGame[] {
  const teamSize = getTeamSize(playersPerGame);
  const shuffled = [...players].sort(() => Math.random() - 0.5);
  const fullGameCount = Math.floor(shuffled.length / playersPerGame);
  const games: CourtGame[] = [];

  for (let index = 0; index < fullGameCount; index += 1) {
    const start = index * playersPerGame;
    const roster = shuffled.slice(start, start + playersPerGame);
    const { teamA, teamB } = balanceTeams(roster);

    games.push({
      teamA: teamA.slice(0, teamSize).map((player) => player.id),
      teamB: teamB.slice(0, teamSize).map((player) => player.id),
    });
  }

  return games;
}

export function resolveCourtGamePlayers(
  game: CourtGame | undefined,
  users: UserProfile[],
): { teamA: UserProfile[]; teamB: UserProfile[] } {
  if (!game || game.teamA.length === 0 || game.teamB.length === 0) {
    return { teamA: [], teamB: [] };
  }

  const teamA = game.teamA
    .map((id) => users.find((user) => user.id === id))
    .filter((player): player is UserProfile => Boolean(player));
  const teamB = game.teamB
    .map((id) => users.find((user) => user.id === id))
    .filter((player): player is UserProfile => Boolean(player));

  return { teamA, teamB };
}

export function resolveCourtGames(
  event: GameEvent,
  users: UserProfile[],
): Array<{ index: number; label: string; teamA: UserProfile[]; teamB: UserProfile[] }> {
  const courts = normalizeEventCourts(event);

  return (courts.courtGames ?? [])
    .map((game, index) => {
      const teams = resolveCourtGamePlayers(game, users);
      return {
        index,
        label: `Game ${index + 1}`,
        ...teams,
      };
    })
    .filter((game) => game.teamA.length > 0 && game.teamB.length > 0);
}

export function resolveActiveRosterPlayers(
  event: GameEvent,
  users: UserProfile[],
  courtGameIndex = 0,
): UserProfile[] {
  if (courtGameIndex === UNASSIGNED_ROSTER_INDEX) {
    return resolveWaitlistPlayers(event, users);
  }

  const rosterIds = getCourtGameRosterIds(event, courtGameIndex);
  return rosterIds
    .map((id) => users.find((user) => user.id === id))
    .filter((player): player is UserProfile => Boolean(player));
}

export function resolveWaitlistPlayers(event: GameEvent, users: UserProfile[]): UserProfile[] {
  const assignedIds = new Set(getAllCourtPlayerIds(event));

  return event.participantIds
    .filter((id) => !assignedIds.has(id))
    .map((id) => users.find((user) => user.id === id))
    .filter((player): player is UserProfile => Boolean(player));
}

export function formatRosterRating(players: UserProfile[]): number {
  return players.reduce((sum, player) => sum + calculatePlayerRating(player.stats), 0);
}

export function getCourtGameLabel(index: number): string {
  return `Game ${index + 1}`;
}
