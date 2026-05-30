import { describe, expect, it } from "vitest";

import { buildMemberRemovalUpdate } from "../memberRemoval";
import { mockBan, mockClub, mockEvent } from "./fixtures";

describe("memberRemoval", () => {
  it("removes member and sub-captain role from club", () => {
    const clubs = [
      mockClub({
        id: "club-1",
        memberIds: ["cap", "sub", "target"],
        subCaptainIds: ["sub", "target"],
      }),
    ];
    const result = buildMemberRemovalUpdate(
      clubs,
      [],
      [],
      [],
      "club-1",
      "target",
    );
    const club = result.clubs[0];
    expect(club?.memberIds).toEqual(["cap", "sub"]);
    expect(club?.subCaptainIds).toEqual(["sub"]);
  });

  it("removes user from club events and join requests", () => {
    const events = [
      mockEvent({
        clubId: "club-1",
        participantIds: ["target", "other"],
      }),
    ];
    const joinRequests = [
      {
        id: "jr-1",
        clubId: "club-1",
        userId: "target",
        createdAt: "2025-01-01",
      },
    ];
    const result = buildMemberRemovalUpdate(
      [mockClub({ id: "club-1", memberIds: ["target"] })],
      events,
      joinRequests,
      [],
      "club-1",
      "target",
    );
    expect(result.events[0]?.participantIds).toEqual(["other"]);
    expect(result.joinRequests).toHaveLength(0);
    expect(result.pendingRequests).toHaveLength(1);
  });

  it("adds ban record when provided", () => {
    const ban = mockBan({ userId: "target" });
    const result = buildMemberRemovalUpdate(
      [mockClub({ memberIds: ["target"] })],
      [],
      [],
      [],
      "club-1",
      "target",
      ban,
    );
    expect(result.clubBans).toContainEqual(ban);
  });
});
