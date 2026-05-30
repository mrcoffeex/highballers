export type Position = "PG" | "SG" | "SF" | "PF" | "C";

export type SubscriptionTier = "basic" | "all_star";

export interface PlayerStats {
  height: number;
  weight: number;
  speed: number;
  strength: number;
  shooting: number;
  defense: number;
  stamina: number;
}

export interface BoxScoreStats {
  points: number;
  rebounds: number;
  assists: number;
  blocks: number;
  steals: number;
}

export interface GameStatRecord {
  id: string;
  eventId: string;
  userId: string;
  stats: BoxScoreStats;
  recordedAt: string;
}

export interface UserProfile {
  id: string;
  name: string;
  nickname?: string;
  position: Position;
  avatarColor: string;
  avatarUrl?: string;
  stats: PlayerStats;
  bio?: string;
  joinedAt: string;
  subscriptionTier?: SubscriptionTier;
}

export type ClubVisibility = "open" | "private";

export interface ClubJoinRequest {
  id: string;
  clubId: string;
  userId: string;
  createdAt: string;
}

export interface Club {
  id: string;
  name: string;
  description: string;
  location: string;
  memberIds: string[];
  adminId: string;
  iconColor: string;
  iconUrl?: string;
  visibility: ClubVisibility;
  createdAt: string;
}

export interface ClubChatMessage {
  id: string;
  clubId: string;
  userId: string;
  body: string;
  createdAt: string;
}

export interface ClubChatPreview {
  clubId: string;
  lastMessage?: ClubChatMessage;
}

export interface CourtGame {
  teamA: string[];
  teamB: string[];
}

export interface GameEvent {
  id: string;
  clubId: string;
  title: string;
  description: string;
  location: string;
  latitude?: number;
  longitude?: number;
  dateTime: string;
  maxPlayers: number;
  /** Total players assigned to each court when shuffling (even, min 4). Default 10 = 5v5. */
  playersPerGame?: number;
  participantIds: string[];
  courtGames?: CourtGame[];
  shuffled: boolean;
  createdBy: string;
  finishedAt?: string;
}

export interface BalancedTeams {
  teamA: UserProfile[];
  teamB: UserProfile[];
  ratingA: number;
  ratingB: number;
}

export const POSITIONS: Position[] = ["PG", "SG", "SF", "PF", "C"];

export const POSITION_LABELS: Record<Position, string> = {
  PG: "Point Guard",
  SG: "Shooting Guard",
  SF: "Small Forward",
  PF: "Power Forward",
  C: "Center",
};

export const DEFAULT_STATS: PlayerStats = {
  height: 180,
  weight: 75,
  speed: 5,
  strength: 5,
  shooting: 5,
  defense: 5,
  stamina: 5,
};

export const EMPTY_BOX_SCORE: BoxScoreStats = {
  points: 0,
  rebounds: 0,
  assists: 0,
  blocks: 0,
  steals: 0,
};

export const BOX_SCORE_FIELDS: (keyof BoxScoreStats)[] = [
  "points",
  "rebounds",
  "assists",
  "blocks",
  "steals",
];

export const BOX_SCORE_LABELS: Record<keyof BoxScoreStats, string> = {
  points: "PTS",
  rebounds: "REB",
  assists: "AST",
  blocks: "BLK",
  steals: "STL",
};
