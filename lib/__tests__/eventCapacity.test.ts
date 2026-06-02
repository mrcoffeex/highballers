import { describe, expect, it } from "vitest";

import {
  assertEventMaxPlayersAllowed,
  clampEventMaxPlayers,
  getAllowedMaxPlayerPresets,
  getMaxEventPlayersForTier,
  parseEventMaxPlayersInput,
} from "../eventCapacity";
import { SubscriptionError } from "../subscription";

describe("eventCapacity", () => {
  it("caps basic and all-star at 100 for scheduling", () => {
    expect(getMaxEventPlayersForTier("basic")).toBe(100);
    expect(getMaxEventPlayersForTier("all_star")).toBe(100);
    expect(getAllowedMaxPlayerPresets("basic")).toEqual([
      10, 20, 30, 40, 50, 60, 80, 100,
    ]);
    expect(getAllowedMaxPlayerPresets("all_star")).toEqual([
      10, 20, 30, 40, 50, 60, 80, 100,
    ]);
  });

  it("clamps custom input to tier cap", () => {
    expect(clampEventMaxPlayers(75, "basic")).toBe(75);
    expect(parseEventMaxPlayersInput("85", "basic")).toBe(85);
    expect(parseEventMaxPlayersInput("150", "basic")).toBe(100);
    expect(parseEventMaxPlayersInput("15", "basic")).toBe(15);
  });

  it("rejects over-cap saves", () => {
    expect(() => assertEventMaxPlayersAllowed("basic", 120)).toThrow(
      SubscriptionError,
    );
    expect(() => assertEventMaxPlayersAllowed("all_star", 100)).not.toThrow();
  });
});
