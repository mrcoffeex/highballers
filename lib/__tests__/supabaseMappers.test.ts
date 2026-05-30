import { describe, expect, it } from "vitest";

import {
  clubBanFromRow,
  clubFromRow,
  eventFromRow,
  joinRequestFromRow,
} from "../supabaseMappers";

describe("supabaseMappers", () => {
  it("maps club rows with sub-captains", () => {
    const club = clubFromRow(
      {
        id: "c1",
        name: "Hoopers",
        description: "d",
        location: "Court",
        admin_id: "cap-1",
        icon_color: "#fff",
        icon_url: null,
        visibility: "private",
        created_at: "2025-01-01",
      },
      ["cap-1", "m1"],
      ["sub-1"],
    );
    expect(club.adminId).toBe("cap-1");
    expect(club.subCaptainIds).toEqual(["sub-1"]);
    expect(club.visibility).toBe("private");
    expect(club.memberIds).toEqual(["cap-1", "m1"]);
  });

  it("maps events with visibility and invites", () => {
    const event = eventFromRow(
      {
        id: "e1",
        club_id: "c1",
        title: "Run",
        description: "",
        location: "Gym",
        latitude: null,
        longitude: null,
        date_time: "2030-01-01T00:00:00Z",
        max_players: 10,
        players_per_game: 10,
        created_by: "u1",
        shuffled: false,
        team_a: null,
        team_b: null,
        court_games: null,
        finished_at: null,
        visibility: "private",
      },
      ["u1"],
      ["u2"],
    );
    expect(event.visibility).toBe("private");
    expect(event.invitedMemberIds).toEqual(["u2"]);
    expect(event.createdBy).toBe("u1");
  });

  it("maps join requests and bans", () => {
    expect(
      joinRequestFromRow({
        id: "jr1",
        club_id: "c1",
        user_id: "u1",
        created_at: "2025-01-01",
      }).clubId,
    ).toBe("c1");

    expect(
      clubBanFromRow({
        club_id: "c1",
        user_id: "u2",
        banned_by: "cap",
        created_at: "2025-01-01",
      }),
    ).toMatchObject({ clubId: "c1", userId: "u2", bannedBy: "cap" });
  });
});
