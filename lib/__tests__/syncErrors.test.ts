import { describe, expect, it } from "vitest";

import { formatSyncError } from "../syncErrors";

describe("syncErrors", () => {
  it("maps known database errors to actionable messages", () => {
    expect(
      formatSyncError({ message: "row-level security policy for events" }),
    ).toContain("Could not create this game");

    expect(formatSyncError({ message: "relation club_sub_captains" })).toContain(
      "club-sub-captains",
    );

    expect(formatSyncError(new Error("Cloud sync timed out"))).toBe(
      "Save timed out. Check your connection and try again.",
    );
  });

  it("uses fallback when message is empty", () => {
    expect(formatSyncError(null, "Fallback")).toBe("Fallback");
    expect(formatSyncError({ message: "Something custom" })).toBe(
      "Something custom",
    );
  });
});
