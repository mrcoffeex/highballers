import {
  endOfDay,
  endOfMonth,
  endOfWeek,
  endOfYear,
  isWithinInterval,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
} from "date-fns";

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

export type LeaderboardPeriod = "day" | "week" | "month" | "year";

export interface LeaderboardPeriodTab {
  id: LeaderboardPeriod;
  label: string;
}

export const LEADERBOARD_PERIOD_TABS: LeaderboardPeriodTab[] = [
  { id: "day", label: "Daily" },
  { id: "week", label: "Weekly" },
  { id: "month", label: "Monthly" },
  { id: "year", label: "Yearly" },
];

export const LEADERBOARD_PERIOD_LABELS: Record<LeaderboardPeriod, string> = {
  day: "Today",
  week: "This week",
  month: "This month",
  year: "This year",
};

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

function leaderboardPeriodRange(
  period: LeaderboardPeriod,
  now = new Date(),
): { start: Date; end: Date } {
  switch (period) {
    case "day":
      return { start: startOfDay(now), end: endOfDay(now) };
    case "week":
      return {
        start: startOfWeek(now, { weekStartsOn: 1 }),
        end: endOfWeek(now, { weekStartsOn: 1 }),
      };
    case "month":
      return { start: startOfMonth(now), end: endOfMonth(now) };
    case "year":
      return { start: startOfYear(now), end: endOfYear(now) };
  }
}

function statRecordDate(
  record: GameStatRecord,
  eventsById: Map<string, GameEvent>,
): Date {
  const event = eventsById.get(record.eventId);
  return new Date(event?.dateTime ?? record.recordedAt);
}

export function filterStatRecordsByPeriod(
  records: GameStatRecord[],
  events: GameEvent[],
  period: LeaderboardPeriod,
  now = new Date(),
): GameStatRecord[] {
  const range = leaderboardPeriodRange(period, now);
  const eventsById = new Map(events.map((event) => [event.id, event]));

  return records.filter((record) =>
    isWithinInterval(statRecordDate(record, eventsById), {
      start: range.start,
      end: range.end,
    }),
  );
}

export function buildClubLeaderboard(
  clubs: Club[],
  events: GameEvent[],
  gameStatRecords: GameStatRecord[],
  period: LeaderboardPeriod,
  limit = 50,
  now = new Date(),
): ClubLeaderboardEntry[] {
  const filteredRecords = filterStatRecordsByPeriod(
    gameStatRecords,
    events,
    period,
    now,
  );

  const eventsByClub = new Map<string, Set<string>>();
  for (const event of events) {
    const set = eventsByClub.get(event.clubId) ?? new Set<string>();
    set.add(event.id);
    eventsByClub.set(event.clubId, set);
  }

  const entries = clubs.map((club) => {
    const clubEventIds = eventsByClub.get(club.id) ?? new Set<string>();
    const records = filteredRecords.filter((record) =>
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

  return assignRanks(
    entries.filter((entry) => entry.gamesPlayed > 0).slice(0, limit),
  );
}

export function buildPlayerStatLeaderboard(
  users: UserProfile[],
  gameStatRecords: GameStatRecord[],
  events: GameEvent[],
  field: StatLeaderboardField,
  period: LeaderboardPeriod,
  limit = 50,
  now = new Date(),
): PlayerLeaderboardEntry[] {
  const filteredRecords = filterStatRecordsByPeriod(
    gameStatRecords,
    events,
    period,
    now,
  );
  const totals = new Map<string, number>();

  for (const record of filteredRecords) {
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

export function getLeaderboardListHeading(
  category: LeaderboardCategory,
  period: LeaderboardPeriod,
): string {
  const periodLabel = LEADERBOARD_PERIOD_LABELS[period].toLowerCase();

  if (category === "clubs") {
    return `Top clubs · ${periodLabel}`;
  }

  if (category === "ovr") {
    return "Highest overall ratings";
  }

  const tab = LEADERBOARD_TABS.find((item) => item.id === category);
  return `${LEADERBOARD_PERIOD_LABELS[period]} ${tab?.label ?? "stat"} leaders`;
}

export function getLeaderboardEmptyDescription(
  category: LeaderboardCategory,
  period: LeaderboardPeriod,
): string {
  const periodLabel = LEADERBOARD_PERIOD_LABELS[period].toLowerCase();

  if (category === "clubs") {
    return `No club activity recorded ${periodLabel}. Play games and log stats to appear here.`;
  }

  if (category === "ovr") {
    return "Player ratings come from profile skill stats.";
  }

  return `No box scores recorded ${periodLabel}. Use the scorekeeper during games to populate stat leaders.`;
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
