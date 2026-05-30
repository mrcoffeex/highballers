import { Club } from "./types";

export const MAX_SUB_CAPTAINS = 2;

/** Club owner (stored as adminId in the database). */
export function getClubCaptainId(club: Club): string {
  return club.adminId;
}

export function isClubCaptain(
  club: Club,
  userId: string | null | undefined,
): boolean {
  return Boolean(userId && club.adminId === userId);
}

export function isClubSubCaptain(
  club: Club,
  userId: string | null | undefined,
): boolean {
  return Boolean(userId && (club.subCaptainIds ?? []).includes(userId));
}

/** Captain or sub-captain — can run private games and club leadership actions. */
export function canLeadClub(
  club: Club,
  userId: string | null | undefined,
): boolean {
  return isClubCaptain(club, userId) || isClubSubCaptain(club, userId);
}

export function canCreatePrivateGame(
  club: Club,
  userId: string | null | undefined,
): boolean {
  return canLeadClub(club, userId);
}

export function getClubRoleLabel(
  club: Club,
  userId: string,
): "Captain" | "Sub-Captain" | undefined {
  if (isClubCaptain(club, userId)) return "Captain";
  if (isClubSubCaptain(club, userId)) return "Sub-Captain";
  return undefined;
}
