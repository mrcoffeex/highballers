import {
  Club,
  ClubBan,
  DEFAULT_STATS,
  GameEvent,
  UserProfile,
} from "../types";

let idCounter = 0;

function nextId(prefix: string) {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
}

export function mockUser(overrides: Partial<UserProfile> = {}): UserProfile {
  const id = overrides.id ?? nextId("user");
  return {
    id,
    name: overrides.name ?? `Player ${id}`,
    position: "SG",
    avatarColor: "#FF6B2C",
    stats: { ...DEFAULT_STATS },
    joinedAt: "2025-01-01T00:00:00.000Z",
    subscriptionTier: "basic",
    ...overrides,
  };
}

export function mockClub(overrides: Partial<Club> = {}): Club {
  const id = overrides.id ?? nextId("club");
  const adminId = overrides.adminId ?? "captain-1";
  return {
    id,
    name: overrides.name ?? "Test Club",
    description: "Test",
    location: "Court",
    adminId,
    subCaptainIds: [],
    iconColor: "#FF6B2C",
    visibility: "open",
    memberIds: [adminId, "member-1"],
    createdAt: "2025-01-01T00:00:00.000Z",
    ...overrides,
  };
}

export function mockEvent(overrides: Partial<GameEvent> = {}): GameEvent {
  const id = overrides.id ?? nextId("event");
  return {
    id,
    clubId: overrides.clubId ?? "club-1",
    title: overrides.title ?? "Pickup Run",
    description: "Test game",
    location: "Main Court",
    dateTime: overrides.dateTime ?? "2030-06-15T18:00:00.000Z",
    maxPlayers: overrides.maxPlayers ?? 10,
    participantIds: overrides.participantIds ?? ["creator-1"],
    shuffled: false,
    createdBy: overrides.createdBy ?? "creator-1",
    visibility: "open",
    ...overrides,
  };
}

export function mockBan(overrides: Partial<ClubBan> = {}): ClubBan {
  return {
    clubId: overrides.clubId ?? "club-1",
    userId: overrides.userId ?? "banned-1",
    bannedBy: overrides.bannedBy ?? "captain-1",
    createdAt: overrides.createdAt ?? "2025-01-01T00:00:00.000Z",
    ...overrides,
  };
}
