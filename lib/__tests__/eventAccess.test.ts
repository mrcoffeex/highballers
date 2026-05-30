import { describe, expect, it } from "vitest";

import {
  canUserJoinEvent,
  getEventVisibility,
  isPrivateEvent,
} from "../eventAccess";
import { mockEvent } from "./fixtures";

describe("eventAccess", () => {
  it("defaults visibility to open", () => {
    const event = mockEvent({ visibility: undefined });
    expect(getEventVisibility(event)).toBe("open");
    expect(isPrivateEvent(event)).toBe(false);
  });

  it("allows anyone to join open games with space", () => {
    const event = mockEvent({
      visibility: "open",
      participantIds: ["a"],
      maxPlayers: 10,
    });
    expect(canUserJoinEvent("b", event)).toEqual({ ok: true });
  });

  it("blocks join when game is full", () => {
    const event = mockEvent({
      participantIds: ["a", "b"],
      maxPlayers: 2,
    });
    expect(canUserJoinEvent("c", event)).toEqual({
      ok: false,
      reason: "This game is full.",
    });
  });

  it("allows existing participants regardless of visibility", () => {
    const event = mockEvent({
      visibility: "private",
      participantIds: ["a"],
      invitedMemberIds: [],
    });
    expect(canUserJoinEvent("a", event)).toEqual({ ok: true });
  });

  it("restricts private games to creator and invitees", () => {
    const event = mockEvent({
      visibility: "private",
      createdBy: "creator-1",
      participantIds: ["creator-1"],
      invitedMemberIds: ["invited-1"],
      maxPlayers: 10,
    });

    expect(canUserJoinEvent("creator-1", event)).toEqual({ ok: true });
    expect(canUserJoinEvent("invited-1", event)).toEqual({ ok: true });
    expect(canUserJoinEvent("stranger", event)).toEqual({
      ok: false,
      reason: "This is a private game. Only invited members can join.",
    });
  });
});
