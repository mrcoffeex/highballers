import { describe, expect, it } from "vitest";

import { getClubBansForClub, isUserBannedFromClub } from "../clubBans";
import { mockBan } from "./fixtures";

describe("clubBans", () => {
  const bans = [
    mockBan({ clubId: "club-1", userId: "banned-1" }),
    mockBan({ clubId: "club-2", userId: "banned-2" }),
  ];

  it("detects ban for club and user", () => {
    expect(isUserBannedFromClub("club-1", "banned-1", bans)).toBe(true);
    expect(isUserBannedFromClub("club-1", "other", bans)).toBe(false);
    expect(isUserBannedFromClub("club-3", "banned-1", bans)).toBe(false);
  });

  it("filters bans by club", () => {
    expect(getClubBansForClub("club-1", bans)).toHaveLength(1);
    expect(getClubBansForClub("club-2", bans)[0]?.userId).toBe("banned-2");
  });
});
