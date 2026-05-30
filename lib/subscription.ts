import { Club, GameEvent, SubscriptionTier, UserProfile } from "./types";

export const TIER_LABELS: Record<SubscriptionTier, string> = {
  basic: "Basic Baller",
  all_star: "All-Star Baller",
};

/** @deprecated Use BASIC_MAX_OWNED_CLUBS — basic users may belong to at most 2 clubs (1 created + 1 joined). */
export const BASIC_MAX_CLUBS = 1;
export const BASIC_MAX_OWNED_CLUBS = 1;
export const BASIC_MAX_JOINED_CLUBS = 1;
export const BASIC_MAX_CLUB_MEMBERS = 20;
export const BASIC_MAX_EVENT_SIZE = 10;
export const BASIC_MAX_GAME_HISTORY = 3;

export type ProFeature =
  | "create_event"
  | "private_clubs"
  | "shuffle_teams"
  | "edit_courts"
  | "scorekeeper"
  | "send_chat"
  | "push_notifications"
  | "invite_players"
  | "approve_join_requests"
  | "full_game_history"
  | "join_large_events"
  | "join_multiple_clubs"
  | "create_multiple_clubs";

export class SubscriptionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SubscriptionError";
  }
}

export function getUserTier(
  user: UserProfile | null | undefined,
): SubscriptionTier {
  return user?.subscriptionTier ?? "basic";
}

export function isAllStar(user: UserProfile | null | undefined): boolean {
  return getUserTier(user) === "all_star";
}

export function getTierLabel(tier: SubscriptionTier): string {
  return TIER_LABELS[tier];
}

const BASIC_FEATURES: ProFeature[] = [
  "create_event",
  "scorekeeper",
  "send_chat",
  "invite_players",
  "push_notifications",
  "private_clubs",
  "shuffle_teams",
  "edit_courts",
];

export function canAccessFeature(
  tier: SubscriptionTier,
  feature: ProFeature,
): boolean {
  if (tier === "all_star") return true;
  return BASIC_FEATURES.includes(feature);
}

export function assertFeatureAccess(
  tier: SubscriptionTier,
  feature: ProFeature,
  message?: string,
): void {
  if (!canAccessFeature(tier, feature)) {
    throw new SubscriptionError(
      message ?? `${TIER_LABELS.all_star} required for this feature.`,
    );
  }
}

export function countMyClubs(clubs: Club[], userId: string): number {
  return clubs.filter((club) => club.memberIds.includes(userId)).length;
}

export function countOwnedClubs(clubs: Club[], userId: string): number {
  return clubs.filter((club) => club.adminId === userId).length;
}

/** Clubs the user belongs to but does not captain. */
export function countJoinedClubs(clubs: Club[], userId: string): number {
  return clubs.filter(
    (club) => club.memberIds.includes(userId) && club.adminId !== userId,
  ).length;
}

export function getClubMemberCap(
  admin: UserProfile | null | undefined,
): number {
  return isAllStar(admin) ? Number.MAX_SAFE_INTEGER : BASIC_MAX_CLUB_MEMBERS;
}

export function canCreateClub(
  tier: SubscriptionTier,
  clubs: Club[],
  userId: string,
): { ok: boolean; reason?: string } {
  if (tier === "all_star") return { ok: true };
  if (countOwnedClubs(clubs, userId) >= BASIC_MAX_OWNED_CLUBS) {
    return {
      ok: false,
      reason: `Basic Ballers can create only ${BASIC_MAX_OWNED_CLUBS} club. Upgrade to All-Star to run multiple crews.`,
    };
  }
  return { ok: true };
}

export function canJoinClub(
  tier: SubscriptionTier,
  clubs: Club[],
  userId: string,
  club: Club,
  admin: UserProfile | null | undefined,
): { ok: boolean; reason?: string } {
  if (tier === "all_star") return { ok: true };
  if (club.memberIds.includes(userId)) return { ok: true };

  if (club.visibility === "private") {
    return {
      ok: false,
      reason: "Private clubs are All-Star only.",
    };
  }

  if (club.adminId === userId) {
    return { ok: true };
  }

  if (countJoinedClubs(clubs, userId) >= BASIC_MAX_JOINED_CLUBS) {
    return {
      ok: false,
      reason: `Basic Ballers can join only ${BASIC_MAX_JOINED_CLUBS} other club. Leave a club or upgrade to All-Star.`,
    };
  }

  const memberCap = getClubMemberCap(admin);
  if (club.memberIds.length >= memberCap) {
    return {
      ok: false,
      reason: `This club is full (${BASIC_MAX_CLUB_MEMBERS} member Basic Baller limit).`,
    };
  }

  return { ok: true };
}

export function canAddClubMember(
  admin: UserProfile | null | undefined,
  club: Club,
): { ok: boolean; reason?: string } {
  const memberCap = getClubMemberCap(admin);
  if (club.memberIds.length >= memberCap) {
    return {
      ok: false,
      reason: isAllStar(admin)
        ? "Club is at capacity."
        : `Basic Ballers can have up to ${BASIC_MAX_CLUB_MEMBERS} members. Upgrade to All-Star for larger crews.`,
    };
  }
  return { ok: true };
}

export function canJoinEvent(
  tier: SubscriptionTier,
  event: GameEvent,
): { ok: boolean; reason?: string } {
  if (tier === "all_star" || event.maxPlayers <= BASIC_MAX_EVENT_SIZE) {
    return { ok: true };
  }
  return {
    ok: false,
    reason: `Basic Ballers can join games up to ${BASIC_MAX_EVENT_SIZE} players. Upgrade to All-Star for larger runs.`,
  };
}

export const ALL_STAR_FEATURES: Array<{ icon: string; label: string }> = [
  { icon: "people-outline", label: "Unlimited clubs & large crews" },
  { icon: "lock-closed-outline", label: "Create private clubs" },
  { icon: "stats-chart-outline", label: "Full game history" },
  { icon: "basketball-outline", label: "Join large games (10+ cap)" },
];

export const ALL_STAR_TAGLINE = "Run your crew. Own game night.";

export const TIER_COMPARISON: Array<{
  label: string;
  basic: string;
  allStar: string;
}> = [
  {
    label: "Clubs",
    basic: "Create 1 · join 1 other · 20 members",
    allStar: "Unlimited",
  },
  { label: "Games", basic: "Create & join up to 10", allStar: "Join any size" },
  {
    label: "Organizer tools",
    basic: "Create · edit · finish · shuffle · courts",
    allStar: "Same — larger events & clubs",
  },
  {
    label: "Club chat & alerts",
    basic: "Read, send & push alerts",
    allStar: "Same for every club you're in",
  },
  {
    label: "Private clubs",
    basic: "Request to join",
    allStar: "Create private clubs",
  },
  { label: "History", basic: "Last 3 games", allStar: "Full career log" },
];

export const PROMO_FEATURE_PILLS = ALL_STAR_FEATURES.slice(0, 4);
