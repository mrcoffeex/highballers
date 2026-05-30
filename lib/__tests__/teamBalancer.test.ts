import { describe, expect, it } from "vitest";

import { balanceTeams, calculatePlayerRating } from "../teamBalancer";
import { mockUser } from "./fixtures";

describe("teamBalancer", () => {
  it("calculates a positive player rating", () => {
    const user = mockUser();
    expect(calculatePlayerRating(user.stats)).toBeGreaterThan(0);
  });

  it("balances teams with snake draft", () => {
    const players = [
      mockUser({ id: "1", stats: { ...mockUser().stats, shooting: 90 } }),
      mockUser({ id: "2", stats: { ...mockUser().stats, shooting: 80 } }),
      mockUser({ id: "3", stats: { ...mockUser().stats, shooting: 70 } }),
      mockUser({ id: "4", stats: { ...mockUser().stats, shooting: 60 } }),
    ];
    const { teamA, teamB, ratingA, ratingB } = balanceTeams(players);
    expect(teamA).toHaveLength(2);
    expect(teamB).toHaveLength(2);
    expect(ratingA).toBeGreaterThan(0);
    expect(ratingB).toBeGreaterThan(0);
  });

  it("handles single player", () => {
    const player = mockUser({ id: "solo" });
    const result = balanceTeams([player]);
    expect(result.teamA).toHaveLength(1);
    expect(result.teamB).toHaveLength(0);
  });
});
