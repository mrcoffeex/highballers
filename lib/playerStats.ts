import {
  endOfMonth,
  endOfWeek,
  endOfYear,
  format,
  isWithinInterval,
  startOfMonth,
  startOfWeek,
  startOfYear,
  subWeeks,
} from "date-fns";

import {
  BOX_SCORE_FIELDS,
  BOX_SCORE_LABELS,
  BoxScoreStats,
  EMPTY_BOX_SCORE,
  GameEvent,
  GameStatRecord,
} from "./types";

export type StatsPeriod = "week" | "month" | "year" | "all";

export const STATS_PERIOD_LABELS: Record<StatsPeriod, string> = {
  week: "This week",
  month: "This month",
  year: "This year",
  all: "All time",
};

export type GameWithEvent = GameStatRecord & { event?: GameEvent };

export interface PeriodSummary {
  games: number;
  totals: BoxScoreStats;
  averages: BoxScoreStats;
}

export interface PersonalRecord {
  field: keyof BoxScoreStats;
  label: string;
  value: number;
  game: GameWithEvent;
}

export interface WeekActivity {
  label: string;
  games: number;
  points: number;
}

function gameDate(game: GameWithEvent): Date {
  return new Date(game.event?.dateTime ?? game.recordedAt);
}

function periodRange(
  period: StatsPeriod,
  now = new Date(),
): { start: Date; end: Date } | null {
  if (period === "all") return null;

  if (period === "week") {
    return {
      start: startOfWeek(now, { weekStartsOn: 1 }),
      end: endOfWeek(now, { weekStartsOn: 1 }),
    };
  }

  if (period === "month") {
    return { start: startOfMonth(now), end: endOfMonth(now) };
  }

  return { start: startOfYear(now), end: endOfYear(now) };
}

export function filterGamesByPeriod(
  games: GameWithEvent[],
  period: StatsPeriod,
  now = new Date(),
): GameWithEvent[] {
  const range = periodRange(period, now);
  if (!range) return games;

  return games.filter((game) =>
    isWithinInterval(gameDate(game), { start: range.start, end: range.end }),
  );
}

export function sumBoxScores(games: GameWithEvent[]): BoxScoreStats {
  return games.reduce(
    (acc, game) => {
      for (const field of BOX_SCORE_FIELDS) {
        acc[field] += game.stats[field];
      }
      return acc;
    },
    { ...EMPTY_BOX_SCORE },
  );
}

export function averageBoxScores(
  totals: BoxScoreStats,
  games: number,
): BoxScoreStats {
  if (games === 0) return { ...EMPTY_BOX_SCORE };

  return BOX_SCORE_FIELDS.reduce(
    (acc, field) => {
      acc[field] = Math.round((totals[field] / games) * 10) / 10;
      return acc;
    },
    { ...EMPTY_BOX_SCORE },
  );
}

export function buildPeriodSummary(games: GameWithEvent[]): PeriodSummary {
  const totals = sumBoxScores(games);
  return {
    games: games.length,
    totals,
    averages: averageBoxScores(totals, games.length),
  };
}

export function buildPersonalRecords(games: GameWithEvent[]): PersonalRecord[] {
  return BOX_SCORE_FIELDS.map((field) => {
    let best: GameWithEvent | null = null;
    let value = 0;

    for (const game of games) {
      const stat = game.stats[field];
      if (stat > value) {
        value = stat;
        best = game;
      }
    }

    return {
      field,
      label: BOX_SCORE_LABELS[field],
      value,
      game: best ?? games[0],
    };
  }).filter((record) => record.value > 0 && record.game);
}

export function buildWeeklyActivity(
  games: GameWithEvent[],
  weeks = 8,
  now = new Date(),
): WeekActivity[] {
  const buckets: WeekActivity[] = [];

  for (let index = weeks - 1; index >= 0; index -= 1) {
    const weekStart = startOfWeek(subWeeks(now, index), { weekStartsOn: 1 });
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
    const label = index === 0 ? "Now" : format(weekStart, "MMM d");

    const weekGames = games.filter((game) =>
      isWithinInterval(gameDate(game), { start: weekStart, end: weekEnd }),
    );

    buckets.push({
      label,
      games: weekGames.length,
      points: weekGames.reduce((sum, game) => sum + game.stats.points, 0),
    });
  }

  return buckets;
}

export function formatStatValue(value: number, decimals = 0): string {
  if (decimals > 0) {
    return Number.isInteger(value) ? String(value) : value.toFixed(1);
  }
  return String(Math.round(value));
}

export function gamePerformanceScore(stats: BoxScoreStats): number {
  return Math.round(
    stats.points +
      stats.rebounds +
      stats.assists * 1.5 +
      stats.steals * 2 +
      stats.blocks * 2,
  );
}
