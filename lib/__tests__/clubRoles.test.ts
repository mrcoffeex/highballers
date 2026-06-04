import { describe, expect, it } from "vitest";

import {
  canCreatePrivateGame,
  canLeadClub,
  canLeaveClub,
  canTransferClubCaptain,
  getClubCaptainId,
  getClubRoleLabel,
  isClubCaptain,
  isClubSubCaptain,
  MAX_SUB_CAPTAINS,
} from "../clubRoles";
import { mockClub } from "./fixtures";

describe("clubRoles", () => {
  const club = mockClub({
    id: "club-1",
    adminId: "captain-1",
    subCaptainIds: ["sub-1"],
    memberIds: ["captain-1", "sub-1", "member-1"],
  });

  it("exposes max sub-captains as 2", () => {
    expect(MAX_SUB_CAPTAINS).toBe(2);
  });

  it("identifies captain and sub-captain", () => {
    expect(getClubCaptainId(club)).toBe("captain-1");
    expect(isClubCaptain(club, "captain-1")).toBe(true);
    expect(isClubCaptain(club, "member-1")).toBe(false);
    expect(isClubSubCaptain(club, "sub-1")).toBe(true);
    expect(isClubSubCaptain(club, "member-1")).toBe(false);
  });

  it("canLeadClub and canCreatePrivateGame include captain and sub-captain", () => {
    expect(canLeadClub(club, "captain-1")).toBe(true);
    expect(canLeadClub(club, "sub-1")).toBe(true);
    expect(canLeadClub(club, "member-1")).toBe(false);
    expect(canCreatePrivateGame(club, "member-1")).toBe(false);
  });

  it("returns role labels", () => {
    expect(getClubRoleLabel(club, "captain-1")).toBe("Captain");
    expect(getClubRoleLabel(club, "sub-1")).toBe("Sub-Captain");
    expect(getClubRoleLabel(club, "member-1")).toBeUndefined();
  });

  it("handles empty subCaptainIds", () => {
    const noSubs = mockClub({ subCaptainIds: [] });
    expect(isClubSubCaptain(noSubs, "member-1")).toBe(false);
  });

  it("blocks captains from leaving until leadership is transferred", () => {
    expect(canLeaveClub(club, "captain-1")).toBe(false);
    expect(canLeaveClub(club, "member-1")).toBe(true);
    expect(canTransferClubCaptain(club, "captain-1")).toBe(true);
    expect(canTransferClubCaptain(club, "member-1")).toBe(false);

    const soloCaptain = mockClub({
      adminId: "captain-1",
      memberIds: ["captain-1"],
      subCaptainIds: [],
    });
    expect(canTransferClubCaptain(soloCaptain, "captain-1")).toBe(false);
    expect(canLeaveClub(soloCaptain, "captain-1")).toBe(false);
  });
});
