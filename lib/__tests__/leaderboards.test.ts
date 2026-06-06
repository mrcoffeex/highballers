import { describe, expect, it } from "vitest";

import {
  buildClubLeaderboard,
  buildPlayerStatLeaderboard,
  filterStatRecordsByPeriod,
} from "../leaderboards";
import { GameStatRecord } from "../types";
import { mockClub, mockEvent, mockUser } from "./fixtures";

const NOW = new Date(2026, 5, 15, 12, 0, 0);

function mockStat(overrides: Partial<GameStatRecord> = {}): GameStatRecord {
  return {
    id: overrides.id ?? "stat-1",
    eventId: overrides.eventId ?? "event-1",
    userId: overrides.userId ?? "user-1",
    stats: overrides.stats ?? {
      points: 10,
      rebounds: 2,
      assists: 1,
      blocks: 0,
      steals: 0,
    },
    recordedAt:
      overrides.recordedAt ?? new Date(2026, 5, 15, 10, 0, 0).toISOString(),
  };
}

describe("filterStatRecordsByPeriod", () => {
  const events = [
    mockEvent({
      id: "event-today",
      dateTime: new Date(2026, 5, 15, 18, 0, 0).toISOString(),
    }),
    mockEvent({
      id: "event-old",
      dateTime: new Date(2026, 0, 10, 18, 0, 0).toISOString(),
    }),
  ];

  const records = [
    mockStat({ id: "today", eventId: "event-today", userId: "a" }),
    mockStat({ id: "old", eventId: "event-old", userId: "b" }),
  ];

  it("filters to daily records", () => {
    const filtered = filterStatRecordsByPeriod(records, events, "day", NOW);
    expect(filtered.map((record) => record.id)).toEqual(["today"]);
  });

  it("filters to yearly records", () => {
    const filtered = filterStatRecordsByPeriod(records, events, "year", NOW);
    expect(filtered.map((record) => record.id)).toEqual(["today", "old"]);
  });
});

describe("buildPlayerStatLeaderboard", () => {
  const users = [
    mockUser({ id: "a", name: "Alpha" }),
    mockUser({ id: "b", name: "Beta" }),
  ];
  const events = [
    mockEvent({
      id: "event-today",
      dateTime: new Date(2026, 5, 15, 18, 0, 0).toISOString(),
    }),
    mockEvent({
      id: "event-old",
      dateTime: new Date(2026, 0, 10, 18, 0, 0).toISOString(),
    }),
  ];
  const records = [
    mockStat({
      id: "today-a",
      eventId: "event-today",
      userId: "a",
      stats: {
        points: 20,
        rebounds: 0,
        assists: 0,
        blocks: 0,
        steals: 0,
      },
    }),
    mockStat({
      id: "old-b",
      eventId: "event-old",
      userId: "b",
      stats: {
        points: 50,
        rebounds: 0,
        assists: 0,
        blocks: 0,
        steals: 0,
      },
    }),
  ];

  it("ranks players by points within the selected period", () => {
    const daily = buildPlayerStatLeaderboard(
      users,
      records,
      events,
      "points",
      "day",
      50,
      NOW,
    );
    expect(daily).toHaveLength(1);
    expect(daily[0]?.user.id).toBe("a");
    expect(daily[0]?.value).toBe(20);

    const yearly = buildPlayerStatLeaderboard(
      users,
      records,
      events,
      "points",
      "year",
      50,
      NOW,
    );
    expect(yearly).toHaveLength(2);
    expect(yearly[0]?.user.id).toBe("b");
    expect(yearly[0]?.value).toBe(50);
  });
});

describe("buildClubLeaderboard", () => {
  it("only includes clubs with games in the selected period", () => {
    const club = mockClub({ id: "club-1" });
    const events = [
      mockEvent({
        id: "event-today",
        clubId: "club-1",
        dateTime: new Date(2026, 5, 15, 18, 0, 0).toISOString(),
      }),
    ];
    const records = [
      mockStat({
        eventId: "event-today",
        userId: "member-1",
        stats: {
          points: 12,
          rebounds: 0,
          assists: 0,
          blocks: 0,
          steals: 0,
        },
      }),
    ];

    const daily = buildClubLeaderboard([club], events, records, "day", 50, NOW);
    expect(daily).toHaveLength(1);
    expect(daily[0]?.totalPoints).toBe(12);

    const emptyDay = buildClubLeaderboard(
      [club],
      events,
      records,
      "day",
      50,
      new Date(2026, 6, 1, 12, 0, 0),
    );
    expect(emptyDay).toHaveLength(0);
  });
});
