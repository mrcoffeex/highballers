import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  canCancelEvent,
  canEditEvent,
  canManageEvent,
  canMarkEventFinished,
  formatCountdown,
  GAME_OPTIONS_LOCK_MS,
  getEventStatus,
  hasEventStarted,
  isEventOptionsLocked,
} from "../gameEvents";
import { mockEvent } from "./fixtures";

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

  it("allows creator and club captain to manage", () => {
    expect(canManageEvent(futureEvent, "creator-1", "captain-1")).toBe(true);
    expect(canManageEvent(futureEvent, "captain-1", "captain-1")).toBe(true);
    expect(canManageEvent(futureEvent, "other", "captain-1")).toBe(false);
    expect(canEditEvent(futureEvent, "creator-1", "captain-1")).toBe(true);
  });

  it("blocks edits after options lock", () => {
    vi.setSystemTime(
      new Date(futureEvent.dateTime).getTime() + GAME_OPTIONS_LOCK_MS + 1,
    );
    expect(canEditEvent(futureEvent, "creator-1", "captain-1")).toBe(false);
    expect(canMarkEventFinished(futureEvent, "creator-1", "captain-1")).toBe(
      false,
    );
  });

  it("allows cancel before finish", () => {
    expect(canCancelEvent(futureEvent, "creator-1", "captain-1")).toBe(true);
    expect(
      canCancelEvent(
        { ...futureEvent, finishedAt: "2030-06-16T00:00:00.000Z" },
        "creator-1",
        "captain-1",
      ),
    ).toBe(false);
  });
});
