export type Position = 'PG' | 'SG' | 'SF' | 'PF' | 'C';

export interface PlayerStats {
  height: number;
  weight: number;
  speed: number;
  strength: number;
  shooting: number;
  defense: number;
  stamina: number;
}

export interface UserProfile {
  id: string;
  name: string;
  nickname?: string;
  position: Position;
  avatarColor: string;
  stats: PlayerStats;
  bio?: string;
  joinedAt: string;
}

export interface Club {
  id: string;
  name: string;
  description: string;
  location: string;
  memberIds: string[];
  adminId: string;
  iconColor: string;
  createdAt: string;
}

export interface GameEvent {
  id: string;
  clubId: string;
  title: string;
  description: string;
  location: string;
  dateTime: string;
  maxPlayers: number;
  participantIds: string[];
  teamA?: string[];
  teamB?: string[];
  shuffled: boolean;
  createdBy: string;
}

export interface BalancedTeams {
  teamA: UserProfile[];
  teamB: UserProfile[];
  ratingA: number;
  ratingB: number;
}

export const POSITIONS: Position[] = ['PG', 'SG', 'SF', 'PF', 'C'];

export const POSITION_LABELS: Record<Position, string> = {
  PG: 'Point Guard',
  SG: 'Shooting Guard',
  SF: 'Small Forward',
  PF: 'Power Forward',
  C: 'Center',
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
