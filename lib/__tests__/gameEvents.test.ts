import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  canCancelEvent,
  canEditEvent,
  canManageEvent,
  canMarkEventFinished,
  canRecordEventStats,
  eventHasRecordedStats,
  formatCountdown,
  GAME_OPTIONS_LOCK_MS,
  getEventStatus,
  hasEventStarted,
  isEventOptionsLocked,
} from "../gameEvents";
import { mockClub, mockEvent } from "./fixtures";

describe("gameEvents", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2030-06-15T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const futureEvent = mockEvent({
    dateTime: "2030-06-15T18:00:00.000Z",
    createdBy: "creator-1",
  });

  it("formats countdown strings", () => {
    expect(formatCountdown(90_000)).toBe("1m 30s");
    expect(formatCountdown(3_600_000)).toBe("1h 00m");
    expect(formatCountdown(5_000)).toBe("5s");
  });

  it("detects started and locked events", () => {
    expect(hasEventStarted(futureEvent)).toBe(false);
    expect(isEventOptionsLocked(futureEvent)).toBe(false);

    vi.setSystemTime(new Date("2030-06-15T19:00:00.000Z"));
    expect(hasEventStarted(futureEvent)).toBe(true);
    expect(isEventOptionsLocked(futureEvent)).toBe(false);

    vi.setSystemTime(
      new Date(futureEvent.dateTime).getTime() + GAME_OPTIONS_LOCK_MS + 1,
    );
    expect(isEventOptionsLocked(futureEvent)).toBe(true);
    expect(getEventStatus(futureEvent)).toBe("done");
  });

  it("marks finished events as done and locked", () => {
    const finished = mockEvent({
      ...futureEvent,
      finishedAt: "2030-06-16T00:00:00.000Z",
    });
    expect(getEventStatus(finished)).toBe("done");
    expect(isEventOptionsLocked(finished)).toBe(true);
  });

  const club = mockClub({ adminId: "captain-1", subCaptainIds: ["sub-1"] });

  it("allows creator, captain, and sub-captain to manage", () => {
    expect(canManageEvent(futureEvent, "creator-1", club)).toBe(true);
    expect(canManageEvent(futureEvent, "captain-1", club)).toBe(true);
    expect(canManageEvent(futureEvent, "sub-1", club)).toBe(true);
    expect(canManageEvent(futureEvent, "other", club)).toBe(false);
    expect(canEditEvent(futureEvent, "creator-1", club)).toBe(true);
  });

  it("blocks edits after options lock", () => {
    vi.setSystemTime(
      new Date(futureEvent.dateTime).getTime() + GAME_OPTIONS_LOCK_MS + 1,
    );
    expect(canEditEvent(futureEvent, "creator-1", club)).toBe(false);
    expect(canMarkEventFinished(futureEvent, "creator-1", club)).toBe(false);
  });

  it("allows scorekeeper when players joined without shuffle", () => {
    const unshuffled = mockEvent({
      ...futureEvent,
      participantIds: ["p1", "p2"],
      shuffled: false,
      courtGames: undefined,
    });
    expect(canRecordEventStats(unshuffled, "captain-1", club)).toBe(true);
    expect(canRecordEventStats(unshuffled, "other", club)).toBe(false);
    expect(
      canRecordEventStats(
        { ...unshuffled, participantIds: [] },
        "captain-1",
        club,
      ),
    ).toBe(false);
  });

  it("allows cancel before finish", () => {
    expect(canCancelEvent(futureEvent, "creator-1", club)).toBe(true);
    expect(
      canCancelEvent(
        { ...futureEvent, finishedAt: "2030-06-16T00:00:00.000Z" },
        "creator-1",
        club,
      ),
    ).toBe(false);
  });

  it("detects saved box scores for an event", () => {
    expect(eventHasRecordedStats("event-1", [])).toBe(false);
    expect(
      eventHasRecordedStats("event-1", [
        {
          id: "stat-1",
          eventId: "event-1",
          userId: "p1",
          stats: {
            points: 0,
            rebounds: 0,
            assists: 0,
            blocks: 0,
            steals: 0,
          },
          recordedAt: "2030-06-15T20:00:00.000Z",
        },
      ]),
    ).toBe(true);
    expect(
      eventHasRecordedStats("event-1", [
        {
          id: "stat-1",
          eventId: "event-2",
          userId: "p1",
          stats: {
            points: 10,
            rebounds: 0,
            assists: 0,
            blocks: 0,
            steals: 0,
          },
          recordedAt: "2030-06-15T20:00:00.000Z",
        },
      ]),
    ).toBe(false);
  });
});
