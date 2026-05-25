import AsyncStorage from '@react-native-async-storage/async-storage';
import { Session } from '@supabase/supabase-js';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';

import { signInWithGoogle as startGoogleSignIn } from '../lib/googleAuth';
import { isSupabaseEnabled } from '../lib/config';
import { cancelGameReminder, registerForPushNotifications, scheduleGameReminder } from '../lib/notifications';
import { AVATAR_COLORS, SEED_CLUBS, SEED_EVENTS, SEED_PLAYERS } from '../lib/seedData';
import { getGoogleProfileHints } from '../lib/googleAuth';
import { uploadAvatar, uploadClubLogo } from '../lib/storage';
import { getSupabase } from '../lib/supabase';
import {
  deleteJoinRequest,
  fetchAllData,
  finishEventRemote,
  insertClub,
  insertEvent,
  insertJoinRequest,
  joinClubRemote,
  joinEventRemote,
  leaveClubRemote,
  leaveEventRemote,
  subscribeToChanges,
  updateClub,
  updateEvent,
  updateProfileStats,
  upsertEventPlayerStats,
  upsertProfile,
} from '../lib/supabaseSync';
import { formatSyncError } from '../lib/syncErrors';
import { clampPlayersPerGame, getPlayersPerGame } from '../lib/gameFormats';
import { isEventOptionsLocked, hasEventStarted, canManageEvent } from '../lib/gameEvents';
import {
  buildCourtGames,
  canShuffleEvent,
  getCourtGameRosterIds,
} from '../lib/eventRoster';
import {
  BoxScoreStats,
  Club,
  ClubJoinRequest,
  DEFAULT_STATS,
  EMPTY_BOX_SCORE,
  GameEvent,
  GameStatRecord,
  PlayerStats,
  Position,
  UserProfile,
} from '../lib/types';

interface AppState {
  hydrated: boolean;
  authReady: boolean;
  syncEnabled: boolean;
  session: Session | null;
  onboardingComplete: boolean;
  currentUserId: string | null;
  users: UserProfile[];
  clubs: Club[];
  events: GameEvent[];
  joinRequests: ClubJoinRequest[];
  gameStatRecords: GameStatRecord[];

  setHydrated: (value: boolean) => void;
  initAuth: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (email: string, password: string) => Promise<string | null>;
  signInWithGoogle: () => Promise<string | null>;
  syncSessionFromSupabase: () => Promise<Session | null>;
  signOut: () => Promise<void>;
  refreshFromServer: () => Promise<void>;
  startSync: () => () => void;

  completeOnboarding: (profile: Omit<UserProfile, 'id' | 'joinedAt'>, avatarUri?: string) => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>, avatarUri?: string) => Promise<void>;
  updateStats: (stats: PlayerStats) => Promise<void>;

  joinClub: (clubId: string) => Promise<void>;
  requestToJoinClub: (clubId: string) => Promise<void>;
  cancelJoinRequest: (clubId: string) => Promise<void>;
  approveJoinRequest: (requestId: string) => Promise<void>;
  denyJoinRequest: (requestId: string) => Promise<void>;
  leaveClub: (clubId: string) => Promise<void>;
  createClub: (
    club: Omit<Club, 'id' | 'createdAt' | 'memberIds' | 'adminId'>,
    logoUri?: string,
  ) => Promise<string>;

  joinEvent: (eventId: string) => Promise<void>;
  leaveEvent: (eventId: string) => Promise<void>;
  createEvent: (
    event: Omit<GameEvent, 'id' | 'participantIds' | 'shuffled' | 'createdBy' | 'courtGames'>,
  ) => Promise<string>;
  editEvent: (
    eventId: string,
    updates: Pick<
      GameEvent,
      | 'title'
      | 'description'
      | 'location'
      | 'latitude'
      | 'longitude'
      | 'dateTime'
      | 'maxPlayers'
      | 'playersPerGame'
    >,
  ) => Promise<boolean>;
  shuffleTeams: (eventId: string, playersPerGame?: number) => Promise<void>;
  finishEvent: (eventId: string) => Promise<void>;
  saveEventStats: (
    eventId: string,
    statsByPlayer: Record<string, BoxScoreStats>,
    courtGameIndex?: number,
  ) => Promise<void>;

  getCurrentUser: () => UserProfile | null;
  getUserById: (id: string) => UserProfile | undefined;
  getClubById: (id: string) => Club | undefined;
  getEventById: (id: string) => GameEvent | undefined;
  getMyClubs: () => Club[];
  getUpcomingEvents: () => GameEvent[];
  getPlayerGameHistory: (userId: string) => GameStatRecord[];
}

async function resolveAvatarUrl(userId: string, avatarUri?: string, existingUrl?: string) {
  if (!avatarUri || avatarUri === existingUrl) return existingUrl;
  return uploadAvatar(userId, avatarUri);
}

async function resolveClubLogoUrl(clubId: string, logoUri?: string, existingUrl?: string) {
  if (!logoUri || logoUri === existingUrl) return existingUrl;
  return uploadClubLogo(clubId, logoUri);
}

let authListenerRegistered = false;

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      hydrated: false,
      authReady: false,
      syncEnabled: isSupabaseEnabled,
      session: null,
      onboardingComplete: false,
      currentUserId: null,
      users: isSupabaseEnabled ? [] : SEED_PLAYERS,
      clubs: isSupabaseEnabled ? [] : SEED_CLUBS,
      events: isSupabaseEnabled ? [] : SEED_EVENTS,
      joinRequests: [],
      gameStatRecords: [],

      setHydrated: (value) => set({ hydrated: value }),

      initAuth: async () => {
        if (!isSupabaseEnabled) {
          set({ authReady: true });
          return;
        }

        const supabase = getSupabase();
        if (!supabase) {
          set({ authReady: true });
          return;
        }

        const { data } = await supabase.auth.getSession();
        set({ session: data.session, authReady: true });

        if (data.session?.user) {
          await get().syncSessionFromSupabase();
        }

        if (!authListenerRegistered) {
          authListenerRegistered = true;
          supabase.auth.onAuthStateChange(async (_event, session) => {
            set({ session });
            if (session?.user) {
              await get().refreshFromServer().catch(() => undefined);
              const profile = get().users.find((user) => user.id === session.user.id);
              set({
                currentUserId: session.user.id,
                onboardingComplete: Boolean(profile),
              });
              await registerForPushNotifications(session.user.id);
            } else {
              set({
                currentUserId: null,
                onboardingComplete: false,
              users: isSupabaseEnabled ? [] : SEED_PLAYERS,
              clubs: isSupabaseEnabled ? [] : SEED_CLUBS,
              events: isSupabaseEnabled ? [] : SEED_EVENTS,
              joinRequests: [],
              gameStatRecords: [],
            });
            }
          });
        }
      },

      syncSessionFromSupabase: async () => {
        const supabase = getSupabase();
        if (!supabase) return null;

        const { data } = await supabase.auth.getSession();
        set({ session: data.session, authReady: true });

        if (data.session?.user) {
          await get().refreshFromServer().catch(() => undefined);
          const profile = get().users.find((user) => user.id === data.session!.user.id);
          set({
            currentUserId: data.session.user.id,
            onboardingComplete: Boolean(profile),
          });
          await registerForPushNotifications(data.session.user.id).catch(() => undefined);
        }

        return data.session;
      },

      signIn: async (email, password) => {
        const supabase = getSupabase();
        if (!supabase) return 'Cloud sync is not configured.';

        const { error } = await supabase.auth.signInWithPassword({ email, password });
        return error?.message ?? null;
      },

      signUp: async (email, password) => {
        const supabase = getSupabase();
        if (!supabase) return 'Cloud sync is not configured.';

        const { error } = await supabase.auth.signUp({ email, password });
        return error?.message ?? null;
      },

      signInWithGoogle: async () => startGoogleSignIn(),

      signOut: async () => {
        const supabase = getSupabase();
        await supabase?.auth.signOut();
        set({
          session: null,
          currentUserId: null,
          onboardingComplete: false,
          users: isSupabaseEnabled ? [] : SEED_PLAYERS,
          clubs: isSupabaseEnabled ? [] : SEED_CLUBS,
          events: isSupabaseEnabled ? [] : SEED_EVENTS,
          joinRequests: [],
          gameStatRecords: [],
        });
      },

      refreshFromServer: async () => {
        if (!isSupabaseEnabled) return;

        try {
          const data = await fetchAllData();
          if (!data) return;

          set({
            users: data.users,
            clubs: data.clubs,
            events: data.events,
            joinRequests: data.joinRequests,
            gameStatRecords: data.gameStatRecords,
          });
        } catch {
          // Keep local state if sync fails (e.g. schema not migrated yet).
        }
      },

      startSync: () => {
        if (!isSupabaseEnabled) return () => {};

        let timeout: ReturnType<typeof setTimeout> | null = null;
        const debouncedRefresh = () => {
          if (timeout) clearTimeout(timeout);
          timeout = setTimeout(() => {
            get().refreshFromServer().catch(() => undefined);
          }, 400);
        };

        return subscribeToChanges(debouncedRefresh);
      },

      completeOnboarding: async (profile, avatarUri) => {
        const { session, currentUserId } = get();
        const id = session?.user?.id ?? currentUserId ?? uuidv4();
        let avatarUrl = profile.avatarUrl;

        if (avatarUri) {
          avatarUrl = await resolveAvatarUrl(id, avatarUri, avatarUrl);
        } else if (!avatarUrl && session?.user) {
          const hints = getGoogleProfileHints(session);
          avatarUrl = hints.avatarUrl;
        }

        const newUser: UserProfile = {
          ...profile,
          id,
          avatarUrl,
          joinedAt: new Date().toISOString(),
        };

        if (isSupabaseEnabled) {
          await upsertProfile(newUser);
          await registerForPushNotifications(id).catch(() => undefined);
        }

        set({
          onboardingComplete: true,
          currentUserId: id,
          users: [...get().users.filter((user) => user.id !== id), newUser],
        });

        if (isSupabaseEnabled) {
          await get().refreshFromServer().catch(() => undefined);
        }
      },

      updateProfile: async (updates, avatarUri) => {
        const { currentUserId, users } = get();
        if (!currentUserId) return;

        const current = users.find((user) => user.id === currentUserId);
        if (!current) return;

        let avatarUrl = updates.avatarUrl ?? current.avatarUrl;
        if (avatarUri) {
          avatarUrl = await resolveAvatarUrl(currentUserId, avatarUri, avatarUrl);
        }

        const updated = { ...current, ...updates, avatarUrl };
        set({
          users: users.map((user) => (user.id === currentUserId ? updated : user)),
        });

        if (isSupabaseEnabled) {
          await upsertProfile(updated);
        }
      },

      updateStats: async (stats) => {
        const { currentUserId, users } = get();
        if (!currentUserId) return;

        set({
          users: users.map((user) => (user.id === currentUserId ? { ...user, stats } : user)),
        });

        if (isSupabaseEnabled) {
          await updateProfileStats(currentUserId, stats);
        }
      },

      joinClub: async (clubId) => {
        const { currentUserId, clubs } = get();
        if (!currentUserId) return;

        const club = clubs.find((item) => item.id === clubId);
        if (!club || club.visibility !== 'open') return;

        set({
          clubs: clubs.map((item) =>
            item.id === clubId && !item.memberIds.includes(currentUserId)
              ? { ...item, memberIds: [...item.memberIds, currentUserId] }
              : item,
          ),
        });

        if (isSupabaseEnabled) {
          await joinClubRemote(clubId, currentUserId);
        }
      },

      requestToJoinClub: async (clubId) => {
        const { currentUserId, clubs, joinRequests } = get();
        if (!currentUserId) return;

        const club = clubs.find((item) => item.id === clubId);
        if (!club || club.visibility !== 'private') return;
        if (club.memberIds.includes(currentUserId)) return;
        if (joinRequests.some((request) => request.clubId === clubId && request.userId === currentUserId)) {
          return;
        }

        const request: ClubJoinRequest = {
          id: uuidv4(),
          clubId,
          userId: currentUserId,
          createdAt: new Date().toISOString(),
        };

        set({ joinRequests: [...joinRequests, request] });

        if (isSupabaseEnabled) {
          await insertJoinRequest(request);
        }
      },

      cancelJoinRequest: async (clubId) => {
        const { currentUserId, joinRequests } = get();
        if (!currentUserId) return;

        const request = joinRequests.find(
          (item) => item.clubId === clubId && item.userId === currentUserId,
        );
        if (!request) return;

        set({ joinRequests: joinRequests.filter((item) => item.id !== request.id) });

        if (isSupabaseEnabled) {
          await deleteJoinRequest(request.id);
        }
      },

      approveJoinRequest: async (requestId) => {
        const { currentUserId, clubs, joinRequests } = get();
        const request = joinRequests.find((item) => item.id === requestId);
        if (!request) return;

        const club = clubs.find((item) => item.id === request.clubId);
        if (!club || club.adminId !== currentUserId) return;

        set({
          clubs: clubs.map((item) =>
            item.id === request.clubId && !item.memberIds.includes(request.userId)
              ? { ...item, memberIds: [...item.memberIds, request.userId] }
              : item,
          ),
          joinRequests: joinRequests.filter((item) => item.id !== requestId),
        });

        if (isSupabaseEnabled) {
          await joinClubRemote(request.clubId, request.userId);
          await deleteJoinRequest(requestId);
        }
      },

      denyJoinRequest: async (requestId) => {
        const { currentUserId, clubs, joinRequests } = get();
        const request = joinRequests.find((item) => item.id === requestId);
        if (!request) return;

        const club = clubs.find((item) => item.id === request.clubId);
        if (!club || club.adminId !== currentUserId) return;

        set({ joinRequests: joinRequests.filter((item) => item.id !== requestId) });

        if (isSupabaseEnabled) {
          await deleteJoinRequest(requestId);
        }
      },

      leaveClub: async (clubId) => {
        const { currentUserId, clubs } = get();
        if (!currentUserId) return;

        set({
          clubs: clubs.map((club) =>
            club.id === clubId
              ? { ...club, memberIds: club.memberIds.filter((id) => id !== currentUserId) }
              : club,
          ),
        });

        if (isSupabaseEnabled) {
          await leaveClubRemote(clubId, currentUserId);
        }
      },

      createClub: async (clubData, logoUri) => {
        const { currentUserId, clubs, session } = get();
        const userId = session?.user?.id ?? currentUserId;
        if (!userId) {
          throw new Error('Sign in to create a club.');
        }

        const id = uuidv4();
        let iconUrl = clubData.iconUrl;

        if (logoUri) {
          try {
            iconUrl = await resolveClubLogoUrl(id, logoUri, iconUrl);
          } catch {
            // Logo upload is optional — don't block club creation.
          }
        }

        const newClub: Club = {
          ...clubData,
          iconUrl,
          id,
          memberIds: [userId],
          adminId: userId,
          createdAt: new Date().toISOString(),
        };

        set({ clubs: [...clubs, newClub], currentUserId: userId });

        if (isSupabaseEnabled) {
          try {
            await insertClub(newClub);
          } catch (error) {
            set({ clubs: get().clubs.filter((club) => club.id !== id) });
            throw new Error(formatSyncError(error, 'Could not save club to the cloud.'));
          }

          await get().refreshFromServer();
        }

        return id;
      },

      joinEvent: async (eventId) => {
        const { currentUserId, events } = get();
        if (!currentUserId) return;

        const target = events.find((event) => event.id === eventId);
        if (!target || isEventOptionsLocked(target)) return;

        let joinedEvent: GameEvent | undefined;

        set({
          events: events.map((event) => {
            if (event.id !== eventId) return event;
            if (event.participantIds.includes(currentUserId)) return event;
            if (event.participantIds.length >= event.maxPlayers) return event;

            joinedEvent = {
              ...event,
              participantIds: [...event.participantIds, currentUserId],
              shuffled: false,
              courtGames: undefined,
            };
            return joinedEvent;
          }),
        });

        if (joinedEvent) {
          await scheduleGameReminder(joinedEvent.id, joinedEvent.title, joinedEvent.dateTime);
        }

        if (isSupabaseEnabled) {
          await joinEventRemote(eventId, currentUserId);
          const event = get().events.find((item) => item.id === eventId);
          if (event) await updateEvent(event);
        }
      },

      leaveEvent: async (eventId) => {
        const { currentUserId, events } = get();
        if (!currentUserId) return;

        const target = events.find((event) => event.id === eventId);
        if (!target || isEventOptionsLocked(target)) return;

        set({
          events: events.map((event) => {
            if (event.id !== eventId) return event;

            return {
              ...event,
              participantIds: event.participantIds.filter((id) => id !== currentUserId),
              shuffled: false,
              courtGames: undefined,
            };
          }),
        });

        await cancelGameReminder(eventId);

        if (isSupabaseEnabled) {
          await leaveEventRemote(eventId, currentUserId);
          const event = get().events.find((item) => item.id === eventId);
          if (event) await updateEvent(event);
        }
      },

      createEvent: async (eventData) => {
        const { currentUserId, events } = get();
        if (!currentUserId) return '';

        const id = uuidv4();
        const newEvent: GameEvent = {
          ...eventData,
          id,
          participantIds: [currentUserId],
          shuffled: false,
          createdBy: currentUserId,
        };

        set({ events: [...events, newEvent] });
        await scheduleGameReminder(newEvent.id, newEvent.title, newEvent.dateTime);

        if (isSupabaseEnabled) {
          await insertEvent(newEvent);
          await get().refreshFromServer();
        }

        return id;
      },

      editEvent: async (eventId, updates) => {
        const { events, currentUserId, clubs } = get();
        const event = events.find((item) => item.id === eventId);
        if (!event || isEventOptionsLocked(event)) return false;

        const club = clubs.find((item) => item.id === event.clubId);
        if (!canManageEvent(event, currentUserId, club?.adminId)) return false;

        if (updates.maxPlayers < event.participantIds.length) return false;

        const updatedEvent: GameEvent = {
          ...event,
          title: updates.title.trim(),
          description: updates.description.trim(),
          location: updates.location.trim(),
          latitude: updates.latitude,
          longitude: updates.longitude,
          dateTime: updates.dateTime,
          maxPlayers: updates.maxPlayers,
          playersPerGame: updates.playersPerGame
            ? clampPlayersPerGame(updates.playersPerGame, updates.maxPlayers)
            : event.playersPerGame,
        };

        if (updatedEvent.playersPerGame !== event.playersPerGame) {
          updatedEvent.shuffled = false;
          updatedEvent.courtGames = undefined;
        }

        const scheduleChanged =
          updatedEvent.dateTime !== event.dateTime || updatedEvent.title !== event.title;

        set({
          events: events.map((item) => (item.id === eventId ? updatedEvent : item)),
        });

        if (scheduleChanged) {
          await cancelGameReminder(eventId);
          await scheduleGameReminder(updatedEvent.id, updatedEvent.title, updatedEvent.dateTime);
        }

        if (isSupabaseEnabled) {
          await updateEvent(updatedEvent);
        }

        return true;
      },

      shuffleTeams: async (eventId, playersPerGame) => {
        const { events, users } = get();
        const event = events.find((item) => item.id === eventId);
        if (!event || isEventOptionsLocked(event)) return;

        const rosterSize = clampPlayersPerGame(
          playersPerGame ?? getPlayersPerGame(event),
          event.maxPlayers,
        );
        if (!canShuffleEvent(event, rosterSize)) return;

        const participants = event.participantIds
          .map((id) => users.find((user) => user.id === id))
          .filter((user): user is UserProfile => Boolean(user));

        const courtGames = buildCourtGames(participants, rosterSize);
        const updatedEvent: GameEvent = {
          ...event,
          playersPerGame: rosterSize,
          shuffled: courtGames.length > 0,
          courtGames,
        };

        set({
          events: events.map((item) => (item.id === eventId ? updatedEvent : item)),
        });

        if (isSupabaseEnabled) {
          await updateEvent(updatedEvent);
        }
      },

      finishEvent: async (eventId) => {
        const { events, currentUserId, clubs } = get();
        const event = events.find((item) => item.id === eventId);
        if (!event || isEventOptionsLocked(event) || !hasEventStarted(event)) return;

        const club = clubs.find((item) => item.id === event.clubId);
        const canFinish =
          currentUserId === event.createdBy || currentUserId === club?.adminId;
        if (!canFinish) return;

        const finishedAt = new Date().toISOString();
        const updatedEvent: GameEvent = { ...event, finishedAt };

        set({
          events: events.map((item) => (item.id === eventId ? updatedEvent : item)),
        });

        if (isSupabaseEnabled) {
          await finishEventRemote(eventId, finishedAt);
        }
      },

      saveEventStats: async (eventId, statsByPlayer, courtGameIndex = 0) => {
        const { events, currentUserId, clubs, gameStatRecords } = get();
        const event = events.find((item) => item.id === eventId);
        if (!event || isEventOptionsLocked(event)) return;

        const club = clubs.find((item) => item.id === event.clubId);
        const canSave =
          currentUserId === event.createdBy || currentUserId === club?.adminId;
        if (!canSave) return;

        const rosterIds = getCourtGameRosterIds(event, courtGameIndex);
        if (rosterIds.length === 0) return;

        const now = new Date().toISOString();
        const existingByUser = new Map(
          gameStatRecords
            .filter((record) => record.eventId === eventId)
            .map((record) => [record.userId, record]),
        );

        const updatedRecords: GameStatRecord[] = [];

        for (const userId of rosterIds) {
          const stats = statsByPlayer[userId] ?? existingByUser.get(userId)?.stats ?? { ...EMPTY_BOX_SCORE };
          const existing = existingByUser.get(userId);

          updatedRecords.push({
            id: existing?.id ?? uuidv4(),
            eventId,
            userId,
            stats: {
              points: Math.max(0, Math.round(stats.points)),
              rebounds: Math.max(0, Math.round(stats.rebounds)),
              assists: Math.max(0, Math.round(stats.assists)),
              blocks: Math.max(0, Math.round(stats.blocks)),
              steals: Math.max(0, Math.round(stats.steals)),
            },
            recordedAt: now,
          });
        }

        const updatedUserIds = new Set(updatedRecords.map((record) => record.userId));
        const otherRecords = gameStatRecords.filter(
          (record) => record.eventId !== eventId || !updatedUserIds.has(record.userId),
        );
        set({ gameStatRecords: [...otherRecords, ...updatedRecords] });

        if (isSupabaseEnabled) {
          await upsertEventPlayerStats(updatedRecords);
        }
      },

      getCurrentUser: () => {
        const { currentUserId, users } = get();
        return users.find((user) => user.id === currentUserId) ?? null;
      },

      getUserById: (id) => get().users.find((user) => user.id === id),

      getClubById: (id) => get().clubs.find((club) => club.id === id),

      getEventById: (id) => get().events.find((event) => event.id === id),

      getMyClubs: () => {
        const { currentUserId, clubs } = get();
        if (!currentUserId) return [];
        return clubs.filter((club) => club.memberIds.includes(currentUserId));
      },

      getUpcomingEvents: () => {
        const now = Date.now();
        return get()
          .events.filter((event) => new Date(event.dateTime).getTime() >= now)
          .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
      },

      getPlayerGameHistory: (userId) => {
        return get()
          .gameStatRecords.filter((record) => record.userId === userId)
          .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime());
      },
    }),
    {
      name: 'highballers-storage',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
      partialize: (state) => ({
        onboardingComplete: state.onboardingComplete,
        currentUserId: state.currentUserId,
        users: state.users,
        clubs: state.clubs,
        events: state.events,
        joinRequests: state.joinRequests,
        gameStatRecords: state.gameStatRecords,
      }),
    },
  ),
);

export function createDefaultProfile(name: string, position: Position): Omit<UserProfile, 'id' | 'joinedAt'> {
  return {
    name,
    position,
    avatarColor: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
    stats: { ...DEFAULT_STATS },
    bio: '',
  };
}

export function getDefaultGameDateTime() {
  const date = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
  date.setHours(19, 0, 0, 0);
  return date;
}
