import { getSupabase } from "./supabase";
import {
  clubFromRow,
  clubChatMessageFromRow,
  ClubChatMessageRow,
  ClubJoinRequestRow,
  ClubMemberRow,
  ClubRow,
  eventFromRow,
  EventParticipantRow,
  EventPlayerStatsRow,
  EventRow,
  clubBanFromRow,
  gameStatFromRow,
  joinRequestFromRow,
  profileFromRow,
  ProfileRow,
  boxScoreToRow,
} from "./supabaseMappers";
import {
  BoxScoreStats,
  Club,
  ClubChatMessage,
  ClubChatPreview,
  ClubBan,
  ClubJoinRequest,
  CourtGame,
  GameEvent,
  GameStatRecord,
  PlayerStats,
  SubscriptionTier,
  UserProfile,
} from "./types";

export const CLUB_MEMBERS_PAGE_SIZE = 20;
export const CLUB_CHAT_PAGE_SIZE = 40;

interface ClubMemberWithProfileRow {
  user_id: string;
  profiles: ProfileRow | ProfileRow[] | null;
}

export function getClubMembersPageFromStore(
  club: Club,
  users: UserProfile[],
  offset: number,
  limit: number = CLUB_MEMBERS_PAGE_SIZE,
): { members: UserProfile[]; total: number } {
  const ordered = club.memberIds
    .map((memberId) => users.find((user) => user.id === memberId))
    .filter((user): user is UserProfile => user != null);

  return {
    members: ordered.slice(offset, offset + limit),
    total: ordered.length,
  };
}

export async function fetchClubMembersPage(
  clubId: string,
  offset: number,
  limit: number = CLUB_MEMBERS_PAGE_SIZE,
  users: UserProfile[] = [],
): Promise<{ members: UserProfile[]; total: number }> {
  const supabase = getSupabase();
  if (!supabase) return { members: [], total: 0 };

  const { data, error, count } = await supabase
    .from("club_members")
    .select("user_id, profiles(*)", { count: "exact" })
    .eq("club_id", clubId)
    .order("joined_at", { ascending: true })
    .range(offset, offset + limit - 1);

  if (error) throw error;

  const members = ((data ?? []) as ClubMemberWithProfileRow[])
    .map((row) => {
      const profile = Array.isArray(row.profiles)
        ? row.profiles[0]
        : row.profiles;
      if (profile) return profileFromRow(profile);
      return users.find((user) => user.id === row.user_id) ?? null;
    })
    .filter((profile): profile is UserProfile => profile !== null);

  return { members, total: count ?? 0 };
}

export async function fetchAllData() {
  const supabase = getSupabase();
  if (!supabase) return null;

  const [
    profilesRes,
    clubsRes,
    membersRes,
    eventsRes,
    participantsRes,
    invitesRes,
    joinRequestsRes,
    bansRes,
    statsRes,
  ] = await Promise.all([
    supabase.from("profiles").select("*"),
    supabase.from("clubs").select("*"),
    supabase.from("club_members").select("club_id, user_id"),
    supabase.from("events").select("*"),
    supabase.from("event_participants").select("event_id, user_id"),
    supabase.from("event_invites").select("event_id, user_id"),
    supabase.from("club_join_requests").select("*"),
    supabase.from("club_bans").select("*"),
    supabase.from("event_player_stats").select("*"),
  ]);

  if (profilesRes.error) throw profilesRes.error;
  if (clubsRes.error) throw clubsRes.error;
  if (membersRes.error) throw membersRes.error;
  if (eventsRes.error) throw eventsRes.error;
  if (participantsRes.error) throw participantsRes.error;

  const membersByClub = groupMembers(membersRes.data as ClubMemberRow[]);
  const participantsByEvent = groupParticipants(
    participantsRes.data as EventParticipantRow[],
  );
  const invitesByEvent = groupEventInvites(
    invitesRes.error ? [] : (invitesRes.data ?? []),
  );
  const gameStatRecords = statsRes.error
    ? []
    : ((statsRes.data ?? []) as EventPlayerStatsRow[]).map(gameStatFromRow);

  return {
    users: (profilesRes.data as ProfileRow[]).map(profileFromRow),
    clubs: (clubsRes.data as ClubRow[]).map((row) =>
      clubFromRow(row, membersByClub.get(row.id) ?? []),
    ),
    events: (eventsRes.data as EventRow[]).map((row) =>
      eventFromRow(
        row,
        participantsByEvent.get(row.id) ?? [],
        invitesByEvent.get(row.id),
      ),
    ),
    joinRequests: joinRequestsRes.error
      ? []
      : ((joinRequestsRes.data ?? []) as ClubJoinRequestRow[]).map(
          joinRequestFromRow,
        ),
    clubBans: bansRes.error
      ? []
      : ((bansRes.data ?? []) as { club_id: string; user_id: string; banned_by: string | null; created_at: string }[]).map(
          clubBanFromRow,
        ),
    gameStatRecords,
  };
}

function groupMembers(rows: ClubMemberRow[]) {
  const map = new Map<string, string[]>();
  for (const row of rows) {
    const list = map.get(row.club_id) ?? [];
    list.push(row.user_id);
    map.set(row.club_id, list);
  }
  return map;
}

function groupParticipants(rows: EventParticipantRow[]) {
  const map = new Map<string, string[]>();
  for (const row of rows) {
    const list = map.get(row.event_id) ?? [];
    list.push(row.user_id);
    map.set(row.event_id, list);
  }
  return map;
}

function groupEventInvites(rows: { event_id: string; user_id: string }[]) {
  const map = new Map<string, string[]>();
  for (const row of rows) {
    const list = map.get(row.event_id) ?? [];
    list.push(row.user_id);
    map.set(row.event_id, list);
  }
  return map;
}

export async function upsertProfile(profile: UserProfile) {
  const supabase = getSupabase();
  if (!supabase) return;

  const { error } = await supabase.from("profiles").upsert({
    id: profile.id,
    name: profile.name,
    nickname: profile.nickname ?? null,
    position: profile.position,
    avatar_color: profile.avatarColor,
    avatar_url: profile.avatarUrl ?? null,
    bio: profile.bio ?? null,
    stats: profile.stats,
    joined_at: profile.joinedAt,
    subscription_tier: profile.subscriptionTier ?? "basic",
  });

  if (error) throw error;
}

export async function updateProfileStats(userId: string, stats: PlayerStats) {
  const supabase = getSupabase();
  if (!supabase) return;

  const { error } = await supabase
    .from("profiles")
    .update({ stats })
    .eq("id", userId);
  if (error) throw error;
}

export async function updateSubscriptionTier(
  userId: string,
  tier: SubscriptionTier,
) {
  const supabase = getSupabase();
  if (!supabase) return;

  const { error } = await supabase
    .from("profiles")
    .update({ subscription_tier: tier })
    .eq("id", userId);
  if (error) throw error;
}

export interface AllStarPurchasePayload {
  productId: string;
  transactionId: string;
  purchaseToken: string | null;
  platform: string;
  transactionDate: number;
  restored?: boolean;
}

export async function syncAllStarPurchase(
  payload: AllStarPurchasePayload,
): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) {
    throw new Error("Sign in to activate your All-Star subscription.");
  }

  const { data, error } = await supabase.functions.invoke(
    "verify-all-star-purchase",
    { body: payload },
  );

  if (error) throw error;
  if (data && typeof data === "object" && "error" in data && data.error) {
    throw new Error(String(data.error));
  }
}

export async function savePushToken(userId: string, pushToken: string) {
  const supabase = getSupabase();
  if (!supabase) return;

  const { error } = await supabase
    .from("profiles")
    .update({ push_token: pushToken })
    .eq("id", userId);
  if (error) throw error;
}

export async function insertClub(club: Club) {
  const supabase = getSupabase();
  if (!supabase) return;

  const { error: clubError } = await supabase.from("clubs").insert({
    id: club.id,
    name: club.name,
    description: club.description,
    location: club.location,
    admin_id: club.adminId,
    icon_color: club.iconColor,
    icon_url: club.iconUrl ?? null,
    visibility: club.visibility,
    created_at: club.createdAt,
  });
  if (clubError) throw clubError;

  const { error: memberError } = await supabase
    .from("club_members")
    .insert(
      club.memberIds.map((userId) => ({ club_id: club.id, user_id: userId })),
    );
  if (memberError) throw memberError;

  const { error: chatError } = await supabase
    .from("club_chats")
    .insert({ club_id: club.id });
  if (chatError && chatError.code !== "23505") throw chatError;
}

export async function updateClub(club: Club) {
  const supabase = getSupabase();
  if (!supabase) return;

  const { error } = await supabase
    .from("clubs")
    .update({
      name: club.name,
      description: club.description,
      location: club.location,
      icon_color: club.iconColor,
      icon_url: club.iconUrl ?? null,
      visibility: club.visibility,
    })
    .eq("id", club.id);

  if (error) throw error;
}

export async function joinClubRemote(clubId: string, userId: string) {
  const supabase = getSupabase();
  if (!supabase) return;

  const { error } = await supabase
    .from("club_members")
    .insert({ club_id: clubId, user_id: userId });
  if (error && error.code !== "23505") throw error;
}

export async function leaveClubRemote(clubId: string, userId: string) {
  const supabase = getSupabase();
  if (!supabase) return;

  const { error } = await supabase
    .from("club_members")
    .delete()
    .eq("club_id", clubId)
    .eq("user_id", userId);

  if (error) throw error;
}

export async function insertClubBan(ban: ClubBan) {
  const supabase = getSupabase();
  if (!supabase) return;

  const { error } = await supabase.from("club_bans").insert({
    club_id: ban.clubId,
    user_id: ban.userId,
    banned_by: ban.bannedBy,
    created_at: ban.createdAt,
  });

  if (error && error.code !== "23505") throw error;
}

export async function deleteClubBan(clubId: string, userId: string) {
  const supabase = getSupabase();
  if (!supabase) return;

  const { error } = await supabase
    .from("club_bans")
    .delete()
    .eq("club_id", clubId)
    .eq("user_id", userId);

  if (error) throw error;
}

function isMissingColumnError(error: unknown, column: string): boolean {
  const message = String(
    error && typeof error === "object" && "message" in error
      ? (error as { message?: string }).message
      : error,
  ).toLowerCase();

  return (
    message.includes(column.toLowerCase()) &&
    (message.includes("column") || message.includes("schema cache"))
  );
}

const OPTIONAL_EVENT_COLUMNS = [
  "players_per_game",
  "court_games",
  "finished_at",
  "latitude",
  "longitude",
  "team_a",
  "team_b",
  "visibility",
] as const;

const OPTIONAL_EVENT_INSERT_COLUMNS = OPTIONAL_EVENT_COLUMNS;

async function withTimeout<T>(promise: PromiseLike<T>, ms: number): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error("Cloud sync timed out")), ms);
  });

  try {
    return await Promise.race([Promise.resolve(promise), timeout]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

function buildEventInsertPayload(event: GameEvent): Record<string, unknown> {
  return {
    id: event.id,
    club_id: event.clubId,
    title: event.title,
    description: event.description,
    location: event.location,
    latitude: event.latitude ?? null,
    longitude: event.longitude ?? null,
    date_time: event.dateTime,
    max_players: event.maxPlayers,
    players_per_game: event.playersPerGame ?? null,
    created_by: event.createdBy,
    shuffled: event.shuffled,
    team_a: event.courtGames?.[0]?.teamA ?? null,
    team_b: event.courtGames?.[0]?.teamB ?? null,
    court_games: serializeCourtGamesForDb(event.courtGames),
    finished_at: event.finishedAt ?? null,
    visibility: event.visibility ?? "open",
  };
}

function serializeCourtGamesForDb(
  courtGames: CourtGame[] | undefined,
): Array<{ teamA: string[]; teamB: string[] }> | null {
  if (!courtGames?.length) return null;
  return courtGames.map((game) => ({
    teamA: [...game.teamA],
    teamB: [...game.teamB],
  }));
}

function buildEventUpdatePayload(event: GameEvent) {
  return {
    title: event.title,
    description: event.description,
    location: event.location,
    latitude: event.latitude ?? null,
    longitude: event.longitude ?? null,
    date_time: event.dateTime,
    max_players: event.maxPlayers,
    players_per_game: event.playersPerGame ?? null,
    shuffled: event.shuffled,
    team_a: event.courtGames?.[0]?.teamA ?? null,
    team_b: event.courtGames?.[0]?.teamB ?? null,
    court_games: serializeCourtGamesForDb(event.courtGames),
    finished_at: event.finishedAt ?? null,
  } satisfies Record<string, unknown>;
}

export async function insertEvent(event: GameEvent) {
  const supabase = getSupabase();
  if (!supabase) return;

  const payload = buildEventInsertPayload(event);

  while (true) {
    const { error: eventError } = await withTimeout(
      supabase.from("events").insert(payload),
      12_000,
    );

    if (!eventError) break;

    const missingColumn = OPTIONAL_EVENT_INSERT_COLUMNS.find(
      (column) => column in payload && isMissingColumnError(eventError, column),
    );

    if (missingColumn) {
      delete payload[missingColumn];
      continue;
    }

    throw eventError;
  }

  if (event.participantIds.length > 0) {
    const { error: participantError } = await withTimeout(
      supabase
        .from("event_participants")
        .insert(
          event.participantIds.map((userId) => ({
            event_id: event.id,
            user_id: userId,
          })),
        ),
      12_000,
    );

    if (participantError) throw participantError;
  }

  const inviteIds = (event.invitedMemberIds ?? []).filter(
    (userId) => userId !== event.createdBy,
  );
  if (inviteIds.length > 0) {
    const { error: inviteError } = await withTimeout(
      supabase.from("event_invites").insert(
        inviteIds.map((userId) => ({
          event_id: event.id,
          user_id: userId,
        })),
      ),
      12_000,
    );

    if (inviteError && inviteError.code !== "23505") throw inviteError;
  }

  await supabase.functions
    .invoke("notify-club-new-game", {
      body: { eventId: event.id },
    })
    .catch(() => undefined);
}

async function ensureSupabaseSession() {
  const supabase = getSupabase();
  if (!supabase) {
    throw new Error("Cloud sync is not configured.");
  }

  const {
    data: { session },
    error,
  } = await withTimeout(supabase.auth.getSession(), 8_000);

  if (error) throw error;
  if (!session) {
    throw new Error("Not signed in. Sign in again to save changes.");
  }

  return supabase;
}

async function runEventUpdate(
  eventId: string,
  payload: Record<string, unknown>,
): Promise<void> {
  const supabase = await ensureSupabaseSession();

  let attempts = 0;
  const maxAttempts = OPTIONAL_EVENT_COLUMNS.length + 2;

  while (attempts < maxAttempts) {
    attempts += 1;
    const { error } = await withTimeout(
      supabase
        .from("events")
        .update(payload)
        .eq("id", eventId)
        .select("id"),
      12_000,
    );

    if (!error) return;

    const missingColumn = OPTIONAL_EVENT_COLUMNS.find(
      (column) => column in payload && isMissingColumnError(error, column),
    );

    if (missingColumn) {
      delete payload[missingColumn];
      continue;
    }

    throw error;
  }

  throw new Error("Could not update event (schema retry limit).");
}

export async function updateEventCourts(
  event: Pick<GameEvent, "id" | "shuffled" | "courtGames" | "playersPerGame">,
) {
  const payload: Record<string, unknown> = {
    shuffled: event.shuffled,
    court_games: serializeCourtGamesForDb(event.courtGames),
    team_a: event.courtGames?.[0]?.teamA ?? null,
    team_b: event.courtGames?.[0]?.teamB ?? null,
    players_per_game: event.playersPerGame ?? null,
  };

  await runEventUpdate(event.id, payload);
}

export async function updateEvent(event: GameEvent) {
  await runEventUpdate(event.id, { ...buildEventUpdatePayload(event) });
}

export async function insertJoinRequest(request: ClubJoinRequest) {
  const supabase = getSupabase();
  if (!supabase) return;

  const { error } = await supabase.from("club_join_requests").insert({
    id: request.id,
    club_id: request.clubId,
    user_id: request.userId,
    created_at: request.createdAt,
  });

  if (error && error.code !== "23505") throw error;
}

export async function deleteJoinRequest(requestId: string) {
  const supabase = getSupabase();
  if (!supabase) return;

  const { error } = await supabase
    .from("club_join_requests")
    .delete()
    .eq("id", requestId);
  if (error) throw error;
}

export async function joinEventRemote(eventId: string, userId: string) {
  const supabase = getSupabase();
  if (!supabase) return;

  const { error } = await supabase
    .from("event_participants")
    .insert({ event_id: eventId, user_id: userId });

  if (error && error.code !== "23505") throw error;
}

export async function leaveEventRemote(eventId: string, userId: string) {
  const supabase = getSupabase();
  if (!supabase) return;

  const { error } = await supabase
    .from("event_participants")
    .delete()
    .eq("event_id", eventId)
    .eq("user_id", userId);

  if (error) throw error;
}

export async function upsertEventPlayerStats(records: GameStatRecord[]) {
  const supabase = getSupabase();
  if (!supabase || records.length === 0) return;

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    throw new Error("Not signed in. Sign in again to save box scores.");
  }

  const rows = records.map((record) =>
    boxScoreToRow(
      record.eventId,
      record.userId,
      record.stats,
      record.recordedAt,
    ),
  );

  const { error: batchError } = await withTimeout(
    supabase
      .from("event_player_stats")
      .upsert(rows, { onConflict: "event_id,user_id" }),
    12_000,
  );

  if (!batchError) return;

  for (const row of rows) {
    const { error } = await withTimeout(
      supabase
        .from("event_player_stats")
        .upsert(row, { onConflict: "event_id,user_id" }),
      12_000,
    );
    if (error) throw error;
  }
}

export async function finishEventRemote(eventId: string, finishedAt: string) {
  const supabase = getSupabase();
  if (!supabase) return;

  const { error } = await supabase
    .from("events")
    .update({ finished_at: finishedAt })
    .eq("id", eventId);
  if (error) throw error;
}

export async function deleteEventRemote(eventId: string) {
  const supabase = getSupabase();
  if (!supabase) return;

  const { error } = await withTimeout(
    supabase.from("events").delete().eq("id", eventId),
    12_000,
  );
  if (error) throw error;
}

export async function fetchClubChatMessagesPage(
  clubId: string,
  limit: number = CLUB_CHAT_PAGE_SIZE,
  before?: string,
): Promise<ClubChatMessage[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  let query = supabase
    .from("club_chat_messages")
    .select("*")
    .eq("club_id", clubId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (before) {
    query = query.lt("created_at", before);
  }

  const { data, error } = await query;
  if (error) throw error;

  return ((data ?? []) as ClubChatMessageRow[])
    .map(clubChatMessageFromRow)
    .reverse();
}

export async function fetchChatPreviews(
  clubIds: string[],
): Promise<ClubChatPreview[]> {
  const supabase = getSupabase();
  if (!supabase || clubIds.length === 0)
    return clubIds.map((clubId) => ({ clubId }));

  const { data, error } = await supabase
    .from("club_chat_messages")
    .select("*")
    .in("club_id", clubIds)
    .order("created_at", { ascending: false });

  if (error) throw error;

  const latestByClub = new Map<string, ClubChatMessage>();
  for (const row of (data ?? []) as ClubChatMessageRow[]) {
    if (!latestByClub.has(row.club_id)) {
      latestByClub.set(row.club_id, clubChatMessageFromRow(row));
    }
  }

  return clubIds.map((clubId) => ({
    clubId,
    lastMessage: latestByClub.get(clubId),
  }));
}

export async function sendClubChatMessage(
  clubId: string,
  userId: string,
  body: string,
): Promise<ClubChatMessage> {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Chat is unavailable offline.");

  const trimmed = body.trim();
  if (!trimmed) throw new Error("Message cannot be empty.");

  const { data, error } = await supabase
    .from("club_chat_messages")
    .insert({
      club_id: clubId,
      user_id: userId,
      body: trimmed,
    })
    .select("*")
    .single();

  if (error) throw error;

  const message = clubChatMessageFromRow(data as ClubChatMessageRow);

  await supabase.functions
    .invoke("notify-club-chat", {
      body: { messageId: message.id },
    })
    .catch(() => undefined);

  return message;
}

export function subscribeToClubChat(
  clubId: string,
  onMessage: (message: ClubChatMessage) => void,
) {
  const supabase = getSupabase();
  if (!supabase) return () => {};

  const channel = supabase
    .channel(`club-chat-${clubId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "club_chat_messages",
        filter: `club_id=eq.${clubId}`,
      },
      (payload) => {
        onMessage(clubChatMessageFromRow(payload.new as ClubChatMessageRow));
      },
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export function subscribeToChanges(onChange: () => void) {
  const supabase = getSupabase();
  if (!supabase) return () => {};

  const channel = supabase
    .channel("highballers-sync")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "profiles" },
      onChange,
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "clubs" },
      onChange,
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "club_members" },
      onChange,
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "club_chat_messages" },
      onChange,
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "club_join_requests" },
      onChange,
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "club_bans" },
      onChange,
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "events" },
      onChange,
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "event_participants" },
      onChange,
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "event_player_stats" },
      onChange,
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
