import { describe, expect, it } from "vitest";

import {
  isActiveCourtGame,
  isValidCourtGame,
  normalizeCourtGame,
  normalizeCourtGames,
} from "../eventRoster";

describe("eventRoster", () => {
  it("normalizes snake_case court games", () => {
    const game = normalizeCourtGame({
      team_a: ["a", "b"],
      team_b: ["c", "d"],
    });
    expect(game).toEqual({ teamA: ["a", "b"], teamB: ["c", "d"] });
  });

  it("validates balanced court rosters", () => {
    const game = { teamA: ["a", "b", "c", "d"], teamB: ["e", "f", "g", "h"] };
    expect(isValidCourtGame(game, 8)).toBe(true);
    expect(isValidCourtGame(game, 10)).toBe(false);
    expect(isActiveCourtGame(game, 8)).toBe(true);
  });

  it("filters invalid games from arrays", () => {
    const games = normalizeCourtGames(
      [
        { teamA: ["a"], teamB: ["b"] },
        { teamA: ["a", "b", "c", "d"], teamB: ["e", "f", "g", "h"] },
      ],
      8,
    );
    expect(games).toHaveLength(1);
  });
});
