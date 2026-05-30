import { describe, expect, it } from "vitest";

import { getClubInvitePath } from "../clubPaths";

describe("clubInvite paths", () => {
  it("builds invite path for a club", () => {
    expect(getClubInvitePath("abc-123")).toBe("/clubs/abc-123");
  });
});
