import { describe, expect, it } from "vitest";

import {
  clampPlayersPerGame,
  describeCourtCapacity,
  formatGameSizeLabel,
  getPlayersPerGame,
  getTeamSize,
} from "../gameFormats";
import { mockEvent } from "./fixtures";

describe("gameFormats", () => {
  it("formats game size labels", () => {
    expect(formatGameSizeLabel(10)).toBe("5v5");
    expect(getTeamSize(8)).toBe(4);
  });

  it("clamps players per game to presets", () => {
    expect(clampPlayersPerGame(7, 20)).toBe(6);
    expect(clampPlayersPerGame(3, 20)).toBe(4);
    expect(clampPlayersPerGame(99, 8)).toBe(8);
  });

  it("reads players per game from event", () => {
    expect(getPlayersPerGame(mockEvent({ playersPerGame: 8 }))).toBe(8);
    expect(
      getPlayersPerGame(
        mockEvent({
          courtGames: [{ teamA: ["a", "b", "c", "d"], teamB: ["e", "f", "g", "h"] }],
        }),
      ),
    ).toBe(8);
    expect(getPlayersPerGame(mockEvent({}))).toBe(10);
  });

  it("describes court capacity", () => {
    expect(describeCourtCapacity(22, 10)).toEqual({
      courtCount: 2,
      assignedCount: 20,
      unassignedCount: 2,
    });
  });
});
