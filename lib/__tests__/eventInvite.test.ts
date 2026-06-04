import { describe, expect, it } from "vitest";

import {
  canInvitePlayersToEvent,
  getInviteableClubMembers,
  resolvePlayersToInvite,
} from "../eventInvite";
import { mockClub, mockEvent, mockUser } from "./fixtures";

describe("eventInvite", () => {
  const club = mockClub({
    memberIds: ["captain-1", "creator-1", "member-1", "member-2"],
  });

  const event = mockEvent({
    createdBy: "creator-1",
    participantIds: ["creator-1"],
    maxPlayers: 10,
    visibility: "open",
  });

  it("allows creator and club captain to add players when spots remain", () => {
    const clubWithSub = mockClub({
      ...club,
      subCaptainIds: ["sub-1"],
      memberIds: [...club.memberIds, "sub-1"],
    });

    expect(canInvitePlayersToEvent(event, "creator-1", clubWithSub)).toBe(true);
    expect(canInvitePlayersToEvent(event, "captain-1", clubWithSub)).toBe(true);
    expect(canInvitePlayersToEvent(event, "sub-1", clubWithSub)).toBe(false);
    expect(canInvitePlayersToEvent(event, "member-1", clubWithSub)).toBe(false);
  });

  it("lists club members not already in the game", () => {
    const users = [
      mockUser({ id: "creator-1" }),
      mockUser({ id: "member-1" }),
      mockUser({ id: "member-2" }),
    ];
    const inviteable = getInviteableClubMembers(
      event,
      club,
      users,
      [],
      "creator-1",
    );
    expect(inviteable.map((user) => user.id).sort()).toEqual([
      "member-1",
      "member-2",
    ]);
  });

  it("adds valid members and skips full roster", () => {
    const users = [
      mockUser({ id: "creator-1" }),
      mockUser({ id: "member-1" }),
      mockUser({ id: "member-2" }),
    ];
    const full = mockEvent({
      ...event,
      maxPlayers: 2,
      participantIds: ["creator-1", "member-1"],
    });

    const result = resolvePlayersToInvite(
      full,
      club,
      users,
      [],
      ["member-2"],
    );
    expect(result.addedIds).toEqual([]);
    expect(result.skipped[0]?.reason).toMatch(/full/i);
  });

  it("adds members to private invite list context via join access", () => {
    const privateEvent = mockEvent({
      ...event,
      visibility: "private",
      invitedMemberIds: [],
    });
    const users = [mockUser({ id: "member-1" })];
    const result = resolvePlayersToInvite(
      privateEvent,
      club,
      users,
      [],
      ["member-1"],
    );
    expect(result.addedIds).toEqual(["member-1"]);
  });
});
