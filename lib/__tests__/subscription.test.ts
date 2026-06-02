import { describe, expect, it } from "vitest";

import {
  assertFeatureAccess,
  BASIC_MAX_JOINED_CLUBS,
  BASIC_MAX_OWNED_CLUBS,
  canCreateClub,
  canJoinClub,
  canJoinEvent,
  countJoinedClubs,
  countOwnedClubs,
  getClubMemberCap,
  isAllStar,
  SubscriptionError,
} from "../subscription";
import { mockClub, mockEvent, mockUser } from "./fixtures";

describe("subscription", () => {
  const basicUser = mockUser({ id: "basic-1", subscriptionTier: "basic" });
  const proUser = mockUser({ id: "pro-1", subscriptionTier: "all_star" });

  it("detects All-Star tier", () => {
    expect(isAllStar(proUser)).toBe(true);
    expect(isAllStar(basicUser)).toBe(false);
    expect(getClubMemberCap(basicUser)).toBe(100);
    expect(getClubMemberCap(proUser)).toBe(Number.MAX_SAFE_INTEGER);
  });

  it("limits basic users to one owned club", () => {
    const clubs = [
      mockClub({ adminId: "basic-1", memberIds: ["basic-1"] }),
    ];
    expect(countOwnedClubs(clubs, "basic-1")).toBe(1);
    expect(canCreateClub("basic", clubs, "basic-1").ok).toBe(false);
    expect(canCreateClub("all_star", clubs, "basic-1").ok).toBe(true);
  });

  it("limits basic users to five joined clubs (non-owned)", () => {
    const owned = mockClub({
      id: "owned",
      adminId: "basic-1",
      memberIds: ["basic-1"],
    });
    const joined = Array.from({ length: 5 }, (_, i) =>
      mockClub({
        id: `joined-${i}`,
        adminId: `cap-${i}`,
        memberIds: ["basic-1", `cap-${i}`],
        visibility: "open",
      }),
    );
    const clubs = [owned, ...joined];
    expect(countJoinedClubs(clubs, "basic-1")).toBe(5);
    const sixth = mockClub({
      id: "sixth",
      adminId: "cap-6",
      memberIds: ["cap-6"],
      visibility: "open",
    });
    expect(canJoinClub("basic", [...clubs, sixth], "basic-1", sixth, basicUser).ok).toBe(
      false,
    );
    expect(
      canJoinClub("basic", clubs.slice(0, 2), "basic-1", joined[0], basicUser).ok,
    ).toBe(true);
  });

  it("blocks basic users from joining private clubs", () => {
    const privateClub = mockClub({
      visibility: "private",
      adminId: "cap",
      memberIds: ["cap"],
    });
    expect(
      canJoinClub("basic", [], "basic-1", privateClub, proUser).ok,
    ).toBe(false);
  });

  it("limits basic users to events with 100 players or fewer", () => {
    const overCap = mockEvent({ maxPlayers: 120 });
    const atCap = mockEvent({ maxPlayers: 100 });
    const mid = mockEvent({ maxPlayers: 50 });
    expect(canJoinEvent("basic", overCap).ok).toBe(false);
    expect(canJoinEvent("basic", atCap).ok).toBe(true);
    expect(canJoinEvent("basic", mid).ok).toBe(true);
    expect(canJoinEvent("all_star", overCap).ok).toBe(true);
  });

  it("assertFeatureAccess throws SubscriptionError for locked features", () => {
    expect(() => assertFeatureAccess("basic", "full_game_history")).toThrow(
      SubscriptionError,
    );
    expect(() =>
      assertFeatureAccess("all_star", "full_game_history"),
    ).not.toThrow();
  });

  it("documents basic club limits", () => {
    expect(BASIC_MAX_OWNED_CLUBS).toBe(1);
    expect(BASIC_MAX_JOINED_CLUBS).toBe(5);
  });
});
