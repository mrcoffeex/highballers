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
  it("caps basic users at 20 and all-star at 40", () => {
    expect(getMaxEventPlayersForTier("basic")).toBe(20);
    expect(getMaxEventPlayersForTier("all_star")).toBe(40);
    expect(getAllowedMaxPlayerPresets("basic")).toEqual([10, 20]);
    expect(getAllowedMaxPlayerPresets("all_star")).toEqual([10, 20, 30, 40]);
  });

  it("clamps custom input to tier cap", () => {
    expect(clampEventMaxPlayers(30, "basic")).toBe(20);
    expect(parseEventMaxPlayersInput("35", "basic")).toBe(20);
    expect(parseEventMaxPlayersInput("15", "basic")).toBe(15);
  });

  it("rejects over-cap saves for basic", () => {
    expect(() => assertEventMaxPlayersAllowed("basic", 30)).toThrow(
      SubscriptionError,
    );
    expect(() => assertEventMaxPlayersAllowed("all_star", 30)).not.toThrow();
  });
});
