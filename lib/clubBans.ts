import { ClubBan } from "./types";

export function isUserBannedFromClub(
  clubId: string,
  userId: string,
  bans: ClubBan[],
): boolean {
  return bans.some((ban) => ban.clubId === clubId && ban.userId === userId);
}

export function getClubBansForClub(clubId: string, bans: ClubBan[]): ClubBan[] {
  return bans.filter((ban) => ban.clubId === clubId);
}
