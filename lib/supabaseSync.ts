import { getSupabase } from './supabase';
import {
  clubFromRow,
  ClubJoinRequestRow,
  ClubMemberRow,
  ClubRow,
  eventFromRow,
  EventParticipantRow,
  EventPlayerStatsRow,
  EventRow,
  gameStatFromRow,
  joinRequestFromRow,
  profileFromRow,
  ProfileRow,
  boxScoreToRow,
} from './supabaseMappers';
import { BoxScoreStats, Club, ClubJoinRequest, GameEvent, GameStatRecord, PlayerStats, UserProfile } from './types';

export async function fetchAllData() {
  const supabase = getSupabase();
  if (!supabase) return null;

  const [profilesRes, clubsRes, membersRes, eventsRes, participantsRes, joinRequestsRes, statsRes] = await Promise.all([
    supabase.from('profiles').select('*'),
    supabase.from('clubs').select('*'),
    supabase.from('club_members').select('club_id, user_id'),
    supabase.from('events').select('*'),
    supabase.from('event_participants').select('event_id, user_id'),
    supabase.from('club_join_requests').select('*'),
    supabase.from('event_player_stats').select('*'),
  ]);

  if (profilesRes.error) throw profilesRes.error;
  if (clubsRes.error) throw clubsRes.error;
  if (membersRes.error) throw membersRes.error;
  if (eventsRes.error) throw eventsRes.error;
  if (participantsRes.error) throw participantsRes.error;

  const membersByClub = groupMembers(membersRes.data as ClubMemberRow[]);
  const participantsByEvent = groupParticipants(participantsRes.data as EventParticipantRow[]);
  const gameStatRecords = statsRes.error
    ? []
    : ((statsRes.data ?? []) as EventPlayerStatsRow[]).map(gameStatFromRow);

  return {
    users: (profilesRes.data as ProfileRow[]).map(profileFromRow),
    clubs: (clubsRes.data as ClubRow[]).map((row) => clubFromRow(row, membersByClub.get(row.id) ?? [])),
    events: (eventsRes.data as EventRow[]).map((row) =>
      eventFromRow(row, participantsByEvent.get(row.id) ?? []),
    ),
    joinRequests: joinRequestsRes.error
      ? []
      : ((joinRequestsRes.data ?? []) as ClubJoinRequestRow[]).map(joinRequestFromRow),
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

export async function upsertProfile(profile: UserProfile) {
  const supabase = getSupabase();
  if (!supabase) return;

  const { error } = await supabase.from('profiles').upsert({
    id: profile.id,
    name: profile.name,
    nickname: profile.nickname ?? null,
    position: profile.position,
    avatar_color: profile.avatarColor,
    avatar_url: profile.avatarUrl ?? null,
    bio: profile.bio ?? null,
    stats: profile.stats,
    joined_at: profile.joinedAt,
  });

  if (error) throw error;
}

export async function updateProfileStats(userId: string, stats: PlayerStats) {
  const supabase = getSupabase();
  if (!supabase) return;

  const { error } = await supabase.from('profiles').update({ stats }).eq('id', userId);
  if (error) throw error;
}

export async function savePushToken(userId: string, pushToken: string) {
  const supabase = getSupabase();
  if (!supabase) return;

  const { error } = await supabase.from('profiles').update({ push_token: pushToken }).eq('id', userId);
  if (error) throw error;
}

export async function insertClub(club: Club) {
  const supabase = getSupabase();
  if (!supabase) return;

  const { error: clubError } = await supabase.from('clubs').insert({
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

  const { error: memberError } = await supabase.from('club_members').insert(
    club.memberIds.map((userId) => ({ club_id: club.id, user_id: userId })),
  );
  if (memberError) throw memberError;
}

export async function updateClub(club: Club) {
  const supabase = getSupabase();
  if (!supabase) return;

  const { error } = await supabase
    .from('clubs')
    .update({
      name: club.name,
      description: club.description,
      location: club.location,
      icon_color: club.iconColor,
      icon_url: club.iconUrl ?? null,
      visibility: club.visibility,
    })
    .eq('id', club.id);

  if (error) throw error;
}

export async function joinClubRemote(clubId: string, userId: string) {
  const supabase = getSupabase();
  if (!supabase) return;

  const { error } = await supabase.from('club_members').insert({ club_id: clubId, user_id: userId });
  if (error && error.code !== '23505') throw error;
}

export async function leaveClubRemote(clubId: string, userId: string) {
  const supabase = getSupabase();
  if (!supabase) return;

  const { error } = await supabase
    .from('club_members')
    .delete()
    .eq('club_id', clubId)
    .eq('user_id', userId);

  if (error) throw error;
}

export async function insertEvent(event: GameEvent) {
  const supabase = getSupabase();
  if (!supabase) return;

  const { error: eventError } = await supabase.from('events').insert({
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
    court_games: event.courtGames ?? null,
    finished_at: event.finishedAt ?? null,
  });
  if (eventError) throw eventError;

  if (event.participantIds.length > 0) {
    const { error: participantError } = await supabase.from('event_participants').insert(
      event.participantIds.map((userId) => ({ event_id: event.id, user_id: userId })),
    );
    if (participantError) throw participantError;
  }
}

export async function updateEvent(event: GameEvent) {
  const supabase = getSupabase();
  if (!supabase) return;

  const { error } = await supabase
    .from('events')
    .update({
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
      court_games: event.courtGames ?? null,
      finished_at: event.finishedAt ?? null,
    })
    .eq('id', event.id);

  if (error) throw error;
}

export async function insertJoinRequest(request: ClubJoinRequest) {
  const supabase = getSupabase();
  if (!supabase) return;

  const { error } = await supabase.from('club_join_requests').insert({
    id: request.id,
    club_id: request.clubId,
    user_id: request.userId,
    created_at: request.createdAt,
  });

  if (error && error.code !== '23505') throw error;
}

export async function deleteJoinRequest(requestId: string) {
  const supabase = getSupabase();
  if (!supabase) return;

  const { error } = await supabase.from('club_join_requests').delete().eq('id', requestId);
  if (error) throw error;
}

export async function joinEventRemote(eventId: string, userId: string) {
  const supabase = getSupabase();
  if (!supabase) return;

  const { error } = await supabase
    .from('event_participants')
    .insert({ event_id: eventId, user_id: userId });

  if (error && error.code !== '23505') throw error;
}

export async function leaveEventRemote(eventId: string, userId: string) {
  const supabase = getSupabase();
  if (!supabase) return;

  const { error } = await supabase
    .from('event_participants')
    .delete()
    .eq('event_id', eventId)
    .eq('user_id', userId);

  if (error) throw error;
}

export async function upsertEventPlayerStats(records: GameStatRecord[]) {
  const supabase = getSupabase();
  if (!supabase || records.length === 0) return;

  const rows = records.map((record) =>
    boxScoreToRow(record.eventId, record.userId, record.stats, record.id),
  );

  const { error } = await supabase.from('event_player_stats').upsert(rows, { onConflict: 'event_id,user_id' });
  if (error) throw error;
}

export async function finishEventRemote(eventId: string, finishedAt: string) {
  const supabase = getSupabase();
  if (!supabase) return;

  const { error } = await supabase.from('events').update({ finished_at: finishedAt }).eq('id', eventId);
  if (error) throw error;
}

export function subscribeToChanges(onChange: () => void) {
  const supabase = getSupabase();
  if (!supabase) return () => {};

  const channel = supabase
    .channel('highballers-sync')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'clubs' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'club_members' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'club_join_requests' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'event_participants' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'event_player_stats' }, onChange)
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
