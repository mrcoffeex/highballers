import { Club, ClubJoinRequest, CourtGame, DEFAULT_STATS, GameEvent, GameStatRecord, PlayerStats, Position, UserProfile, BoxScoreStats } from './types';
import { normalizeCourtGames } from './eventRoster';

interface ProfileRow {
  id: string;
  name: string;
  nickname: string | null;
  position: Position;
  avatar_color: string;
  avatar_url: string | null;
  bio: string | null;
  stats: PlayerStats;
  joined_at: string;
}

interface ClubRow {
  id: string;
  name: string;
  description: string;
  location: string;
  admin_id: string;
  icon_color: string;
  icon_url: string | null;
  visibility: 'open' | 'private' | null;
  created_at: string;
}

interface ClubJoinRequestRow {
  id: string;
  club_id: string;
  user_id: string;
  created_at: string;
}

interface ClubMemberRow {
  club_id: string;
  user_id: string;
}

interface EventRow {
  id: string;
  club_id: string;
  title: string;
  description: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
  date_time: string;
  max_players: number;
  players_per_game: number | null;
  created_by: string;
  shuffled: boolean;
  team_a: string[] | null;
  team_b: string[] | null;
  court_games: CourtGame[] | null;
  finished_at: string | null;
}

interface EventPlayerStatsRow {
  id: string;
  event_id: string;
  user_id: string;
  points: number;
  rebounds: number;
  assists: number;
  blocks: number;
  steals: number;
  recorded_at: string;
}

interface EventParticipantRow {
  event_id: string;
  user_id: string;
}

export function profileFromRow(row: ProfileRow): UserProfile {
  return {
    id: row.id,
    name: row.name,
    nickname: row.nickname ?? undefined,
    position: row.position,
    avatarColor: row.avatar_color,
    avatarUrl: row.avatar_url ?? undefined,
    stats: row.stats ?? { ...DEFAULT_STATS },
    bio: row.bio ?? undefined,
    joinedAt: row.joined_at,
  };
}

export function profileToRow(profile: UserProfile) {
  return {
    id: profile.id,
    name: profile.name,
    nickname: profile.nickname ?? null,
    position: profile.position,
    avatar_color: profile.avatarColor,
    avatar_url: profile.avatarUrl ?? null,
    bio: profile.bio ?? null,
    stats: profile.stats,
    joined_at: profile.joinedAt,
  };
}

export function clubFromRow(row: ClubRow, memberIds: string[]): Club {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    location: row.location,
    adminId: row.admin_id,
    iconColor: row.icon_color,
    iconUrl: row.icon_url ?? undefined,
    visibility: row.visibility ?? 'open',
    memberIds,
    createdAt: row.created_at,
  };
}

export function joinRequestFromRow(row: ClubJoinRequestRow): ClubJoinRequest {
  return {
    id: row.id,
    clubId: row.club_id,
    userId: row.user_id,
    createdAt: row.created_at,
  };
}

export function eventFromRow(row: EventRow, participantIds: string[]): GameEvent {
  const courtGames =
    normalizeCourtGames(row.court_games)
    ?? (row.team_a?.length && row.team_b?.length
      ? normalizeCourtGames([{ teamA: row.team_a, teamB: row.team_b }])
      : undefined);

  return {
    id: row.id,
    clubId: row.club_id,
    title: row.title,
    description: row.description,
    location: row.location,
    latitude: row.latitude ?? undefined,
    longitude: row.longitude ?? undefined,
    dateTime: row.date_time,
    maxPlayers: row.max_players,
    playersPerGame: row.players_per_game ?? undefined,
    createdBy: row.created_by,
    shuffled: row.shuffled,
    courtGames,
    participantIds,
    finishedAt: row.finished_at ?? undefined,
  };
}

export function gameStatFromRow(row: EventPlayerStatsRow): GameStatRecord {
  return {
    id: row.id,
    eventId: row.event_id,
    userId: row.user_id,
    stats: {
      points: row.points,
      rebounds: row.rebounds,
      assists: row.assists,
      blocks: row.blocks,
      steals: row.steals,
    },
    recordedAt: row.recorded_at,
  };
}

export function boxScoreToRow(eventId: string, userId: string, stats: BoxScoreStats, id?: string) {
  return {
    id,
    event_id: eventId,
    user_id: userId,
    points: stats.points,
    rebounds: stats.rebounds,
    assists: stats.assists,
    blocks: stats.blocks,
    steals: stats.steals,
  };
}

export type { ClubJoinRequestRow, ClubMemberRow, ClubRow, EventParticipantRow, EventPlayerStatsRow, EventRow, ProfileRow };
