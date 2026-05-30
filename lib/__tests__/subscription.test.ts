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
    expect(getClubMemberCap(basicUser)).toBe(20);
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

  it("limits basic users to one joined club (non-owned)", () => {
    const clubs = [
      mockClub({
        id: "owned",
        adminId: "basic-1",
        memberIds: ["basic-1"],
      }),
      mockClub({
        id: "other",
        adminId: "other-captain",
        memberIds: ["basic-1", "other-captain"],
      }),
    ];
    expect(countJoinedClubs(clubs, "basic-1")).toBe(1);
    const third = mockClub({
      id: "third",
      adminId: "cap-3",
      memberIds: ["cap-3"],
      visibility: "open",
    });
    expect(
      canJoinClub("basic", [...clubs, third], "basic-1", third, basicUser).ok,
    ).toBe(false);
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

  it("limits basic users to smaller events", () => {
    const large = mockEvent({ maxPlayers: 20 });
    const small = mockEvent({ maxPlayers: 10 });
    expect(canJoinEvent("basic", large).ok).toBe(false);
    expect(canJoinEvent("basic", small).ok).toBe(true);
    expect(canJoinEvent("all_star", large).ok).toBe(true);
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
    expect(BASIC_MAX_JOINED_CLUBS).toBe(1);
  });
});
