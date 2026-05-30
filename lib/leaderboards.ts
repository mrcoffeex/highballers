import { calculatePlayerRating } from "./teamBalancer";
import {
  BOX_SCORE_LABELS,
  BoxScoreStats,
  Club,
  GameEvent,
  GameStatRecord,
  UserProfile,
} from "./types";

export type StatLeaderboardField = keyof BoxScoreStats;

export type LeaderboardCategory = "clubs" | "ovr" | StatLeaderboardField;

export interface LeaderboardTab {
  id: LeaderboardCategory;
  label: string;
  icon: string;
  unit?: string;
}

export const LEADERBOARD_TABS: LeaderboardTab[] = [
  { id: "clubs", label: "Clubs", icon: "people" },
  { id: "ovr", label: "OVR", icon: "star", unit: "OVR" },
  { id: "points", label: BOX_SCORE_LABELS.points, icon: "basketball" },
  { id: "rebounds", label: BOX_SCORE_LABELS.rebounds, icon: "arrow-up-circle" },
  {
    id: "assists",
    label: BOX_SCORE_LABELS.assists,
    icon: "git-network-outline",
  },
  { id: "steals", label: BOX_SCORE_LABELS.steals, icon: "flash" },
  { id: "blocks", label: BOX_SCORE_LABELS.blocks, icon: "shield-checkmark" },
];

export interface ClubLeaderboardEntry {
  rank: number;
  club: Club;
  totalPoints: number;
  memberCount: number;
  gamesPlayed: number;
  score: number;
}

export interface PlayerLeaderboardEntry {
  rank: number;
  user: UserProfile;
  value: number;
}

function assignRanks<T extends { rank: number }>(entries: T[]): T[] {
  return entries.map((entry, index) => ({ ...entry, rank: index + 1 }));
}

export function buildClubLeaderboard(
  clubs: Club[],
  events: GameEvent[],
  gameStatRecords: GameStatRecord[],
  limit = 50,
): ClubLeaderboardEntry[] {
  const eventsByClub = new Map<string, Set<string>>();
  for (const event of events) {
    const set = eventsByClub.get(event.clubId) ?? new Set<string>();
    set.add(event.id);
    eventsByClub.set(event.clubId, set);
  }

  const entries = clubs.map((club) => {
    const clubEventIds = eventsByClub.get(club.id) ?? new Set<string>();
    const records = gameStatRecords.filter((record) =>
      clubEventIds.has(record.eventId),
    );
    const totalPoints = records.reduce(
      (sum, record) => sum + record.stats.points,
      0,
    );
    const gamesPlayed = new Set(records.map((record) => record.eventId)).size;
    const memberCount = club.memberIds.length;
    const score = totalPoints + memberCount * 5 + gamesPlayed * 10;

    return {
      rank: 0,
      club,
      totalPoints,
      memberCount,
      gamesPlayed,
      score,
    };
  });

  entries.sort(
    (a, b) =>
      b.score - a.score ||
      b.totalPoints - a.totalPoints ||
      b.memberCount - a.memberCount,
  );

  return assignRanks(entries.slice(0, limit));
}

export function buildPlayerStatLeaderboard(
  users: UserProfile[],
  gameStatRecords: GameStatRecord[],
  field: StatLeaderboardField,
  limit = 50,
): PlayerLeaderboardEntry[] {
  const totals = new Map<string, number>();

  for (const record of gameStatRecords) {
    totals.set(
      record.userId,
      (totals.get(record.userId) ?? 0) + record.stats[field],
    );
  }

  const entries = users
    .map((user) => ({
      rank: 0,
      user,
      value: totals.get(user.id) ?? 0,
    }))
    .filter((entry) => entry.value > 0)
    .sort(
      (a, b) => b.value - a.value || a.user.name.localeCompare(b.user.name),
    );

  return assignRanks(entries.slice(0, limit));
}

export function buildOvrLeaderboard(
  users: UserProfile[],
  limit = 50,
): PlayerLeaderboardEntry[] {
  const entries = users
    .map((user) => ({
      rank: 0,
      user,
      value: calculatePlayerRating(user.stats),
    }))
    .sort(
      (a, b) => b.value - a.value || a.user.name.localeCompare(b.user.name),
    );

  return assignRanks(entries.slice(0, limit));
}

export function formatLeaderboardValue(
  category: LeaderboardCategory,
  value: number,
): string {
  if (category === "ovr") {
    return value.toFixed(1);
  }
  if (category === "clubs") {
    return String(Math.round(value));
  }
  return String(Math.round(value));
}

export function getLeaderboardValueLabel(
  category: LeaderboardCategory,
): string {
  const tab = LEADERBOARD_TABS.find((item) => item.id === category);
  if (category === "clubs") return "PTS";
  if (category === "ovr") return "OVR";
  return tab?.label ?? "Total";
}
