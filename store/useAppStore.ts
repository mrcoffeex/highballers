import AsyncStorage from "@react-native-async-storage/async-storage";
import { Session } from "@supabase/supabase-js";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { v4 as uuidv4 } from "uuid";

import { signInWithGoogle as startGoogleSignIn } from "../lib/googleAuth";
import { isSupabaseEnabled } from "../lib/config";
import {
  cancelGameReminder,
  registerForPushNotifications,
  scheduleGameReminder,
} from "../lib/notifications";
import {
  AVATAR_COLORS,
  SEED_CLUBS,
  SEED_EVENTS,
  SEED_PLAYERS,
} from "../lib/seedData";
import { getGoogleProfileHints } from "../lib/googleAuth";
import { uploadAvatar, uploadClubLogo } from "../lib/storage";
import { getSupabase } from "../lib/supabase";
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
} from "../lib/supabaseSync";
import { formatSyncError } from "../lib/syncErrors";
import {
  assertFeatureAccess,
  canAddClubMember,
  canCreateClub,
  canJoinClub,
  canJoinEvent,
  countMyClubs,
  getUserTier,
  isAllStar,
  SubscriptionError,
} from "../lib/subscription";
import { clearRemoteCache } from "../lib/remoteCache";
import { clearTabFetchSession } from "../lib/useCachedFetch";
import { clampPlayersPerGame, getPlayersPerGame } from "../lib/gameFormats";
import {
  isEventOptionsLocked,
  hasEventStarted,
  canManageEvent,
} from "../lib/gameEvents";
import {
  buildCourtGames,
  canShuffleEvent,
  getCourtGameRosterIds,
  normalizeEventCourts,
  removePlayerFromCourtGames,
  sanitizeCourtGames,
} from "../lib/eventRoster";
import {
  BoxScoreStats,
  Club,
  ClubJoinRequest,
  CourtGame,
  DEFAULT_STATS,
  EMPTY_BOX_SCORE,
  GameEvent,
  GameStatRecord,
  PlayerStats,
  Position,
  SubscriptionTier,
  UserProfile,
} from "../lib/types";

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

  completeOnboarding: (
    profile: Omit<UserProfile, "id" | "joinedAt">,
    avatarUri?: string,
  ) => Promise<void>;
  updateProfile: (
    updates: Partial<UserProfile>,
    avatarUri?: string,
  ) => Promise<void>;
  updateStats: (stats: PlayerStats) => Promise<void>;
  upgradeToAllStar: () => Promise<void>;

  joinClub: (clubId: string) => Promise<void>;
  requestToJoinClub: (clubId: string) => Promise<void>;
  cancelJoinRequest: (clubId: string) => Promise<void>;
  approveJoinRequest: (requestId: string) => Promise<void>;
  denyJoinRequest: (requestId: string) => Promise<void>;
  leaveClub: (clubId: string) => Promise<void>;
  createClub: (
    club: Omit<Club, "id" | "createdAt" | "memberIds" | "adminId">,
    logoUri?: string,
  ) => Promise<string>;

  joinEvent: (eventId: string) => Promise<void>;
  leaveEvent: (eventId: string) => Promise<void>;
  createEvent: (
    event: Omit<
      GameEvent,
      "id" | "participantIds" | "shuffled" | "createdBy" | "courtGames"
    >,
  ) => Promise<string>;
  editEvent: (
    eventId: string,
    updates: Pick<
      GameEvent,
      | "title"
      | "description"
      | "location"
      | "latitude"
      | "longitude"
      | "dateTime"
      | "maxPlayers"
    > & { playersPerGame?: number },
  ) => Promise<boolean>;
  shuffleTeams: (eventId: string, playersPerGame?: number) => Promise<void>;
  saveEventCourts: (
    eventId: string,
    courtGames: CourtGame[],
  ) => Promise<boolean>;
  finishEvent: (eventId: string) => Promise<void>;
  saveEventStats: (
    eventId: string,
    statsByPlayer: Record<string, BoxScoreStats>,
    courtGameIndex?: number,
    playerIds?: string[],
  ) => Promise<string | null>;

  getCurrentUser: () => UserProfile | null;
  getUserById: (id: string) => UserProfile | undefined;
  getClubById: (id: string) => Club | undefined;
  getEventById: (id: string) => GameEvent | undefined;
  getMyClubs: () => Club[];
  getUpcomingEvents: () => GameEvent[];
  getPlayerGameHistory: (userId: string) => GameStatRecord[];
}

async function resolveAvatarUrl(
  userId: string,
  avatarUri?: string,
  existingUrl?: string,
) {
  if (!avatarUri || avatarUri === existingUrl) return existingUrl;
  return uploadAvatar(userId, avatarUri);
}

async function resolveClubLogoUrl(
  clubId: string,
  logoUri?: string,
  existingUrl?: string,
) {
  if (!logoUri || logoUri === existingUrl) return existingUrl;
  return uploadClubLogo(clubId, logoUri);
}

let authListenerRegistered = false;

function getCurrentUser(get: () => AppState): UserProfile | null {
  const { currentUserId, users } = get();
  if (!currentUserId) return null;
  return users.find((user) => user.id === currentUserId) ?? null;
}

function getCurrentUserTier(get: () => AppState) {
  return getUserTier(getCurrentUser(get));
}

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
        set({ session: data.session });

        if (data.session?.user) {
          await get().syncSessionFromSupabase();
        }

        set({ authReady: true });

        if (!authListenerRegistered) {
          authListenerRegistered = true;
          supabase.auth.onAuthStateChange(async (_event, session) => {
            set({ session });
            if (session?.user) {
              await get()
                .refreshFromServer()
                .catch(() => undefined);
              const profile = get().users.find(
                (user) => user.id === session.user.id,
              );
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
          await get()
            .refreshFromServer()
            .catch(() => undefined);
          const profile = get().users.find(
            (user) => user.id === data.session!.user.id,
          );
          set({
            currentUserId: data.session.user.id,
            onboardingComplete: Boolean(profile),
          });
          await registerForPushNotifications(data.session.user.id).catch(
            () => undefined,
          );
        }

        return data.session;
      },

      signIn: async (email, password) => {
        const supabase = getSupabase();
        if (!supabase) return "Cloud sync is not configured.";

        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        return error?.message ?? null;
      },

      signUp: async (email, password) => {
        const supabase = getSupabase();
        if (!supabase) return "Cloud sync is not configured.";

        const { error } = await supabase.auth.signUp({ email, password });
        return error?.message ?? null;
      },

      signInWithGoogle: async () => startGoogleSignIn(),

      signOut: async () => {
        const supabase = getSupabase();
        await supabase?.auth.signOut();
        clearRemoteCache();
        clearTabFetchSession();
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
            get()
              .refreshFromServer()
              .catch(() => undefined);
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
          subscriptionTier: "basic",
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
          await get()
            .refreshFromServer()
            .catch(() => undefined);
        }
      },

      updateProfile: async (updates, avatarUri) => {
        const { currentUserId, users } = get();
        if (!currentUserId) return;

        const current = users.find((user) => user.id === currentUserId);
        if (!current) return;

        let avatarUrl = updates.avatarUrl ?? current.avatarUrl;
        if (avatarUri) {
          avatarUrl = await resolveAvatarUrl(
            currentUserId,
            avatarUri,
            avatarUrl,
          );
        }

        const updated = { ...current, ...updates, avatarUrl };
        set({
          users: users.map((user) =>
            user.id === currentUserId ? updated : user,
          ),
        });

        if (isSupabaseEnabled) {
          await upsertProfile(updated);
        }
      },

      updateStats: async (stats) => {
        const { currentUserId, users } = get();
        if (!currentUserId) return;

        set({
          users: users.map((user) =>
            user.id === currentUserId ? { ...user, stats } : user,
          ),
        });

        if (isSupabaseEnabled) {
          await updateProfileStats(currentUserId, stats);
        }
      },

      upgradeToAllStar: async () => {
        const { currentUserId, users } = get();
        if (!currentUserId) return;

        const current = users.find((user) => user.id === currentUserId);
        if (!current || isAllStar(current)) return;

        const updated: UserProfile = {
          ...current,
          subscriptionTier: "all_star",
        };
        set({
          users: users.map((user) =>
            user.id === currentUserId ? updated : user,
          ),
        });
      },

      joinClub: async (clubId) => {
        const { currentUserId, clubs, users } = get();
        if (!currentUserId) return;

        const club = clubs.find((item) => item.id === clubId);
        if (!club || club.visibility !== "open") return;

        const user = getCurrentUser(get);
        const tier = getUserTier(user);
        const memberClubCount = countMyClubs(clubs, currentUserId);
        const admin = users.find((item) => item.id === club.adminId) ?? null;
        const joinCheck = canJoinClub(tier, memberClubCount, club, admin);
        if (!joinCheck.ok) {
          throw new SubscriptionError(joinCheck.reason!);
        }

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

        assertFeatureAccess(getCurrentUserTier(get), "private_clubs");

        const club = clubs.find((item) => item.id === clubId);
        if (!club || club.visibility !== "private") return;
        if (club.memberIds.includes(currentUserId)) return;
        if (
          joinRequests.some(
            (request) =>
              request.clubId === clubId && request.userId === currentUserId,
          )
        ) {
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

        set({
          joinRequests: joinRequests.filter((item) => item.id !== request.id),
        });

        if (isSupabaseEnabled) {
          await deleteJoinRequest(request.id);
        }
      },

      approveJoinRequest: async (requestId) => {
        const { currentUserId, clubs, joinRequests, users } = get();
        const request = joinRequests.find((item) => item.id === requestId);
        if (!request) return;

        const club = clubs.find((item) => item.id === request.clubId);
        if (!club || club.adminId !== currentUserId) return;

        assertFeatureAccess(getCurrentUserTier(get), "approve_join_requests");

        const admin = users.find((item) => item.id === club.adminId) ?? null;
        const memberCheck = canAddClubMember(admin, club);
        if (!memberCheck.ok) {
          throw new SubscriptionError(memberCheck.reason!);
        }

        set({
          clubs: clubs.map((item) =>
            item.id === request.clubId &&
            !item.memberIds.includes(request.userId)
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

        set({
          joinRequests: joinRequests.filter((item) => item.id !== requestId),
        });

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
              ? {
                  ...club,
                  memberIds: club.memberIds.filter(
                    (id) => id !== currentUserId,
                  ),
                }
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
          throw new Error("Sign in to create a club.");
        }

        const user = get().users.find((item) => item.id === userId) ?? null;
        const tier = getUserTier(user);
        const memberClubCount = countMyClubs(clubs, userId);
        const createCheck = canCreateClub(tier, memberClubCount);
        if (!createCheck.ok) {
          throw new SubscriptionError(createCheck.reason!);
        }

        if (clubData.visibility === "private") {
          assertFeatureAccess(tier, "private_clubs");
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
          visibility: tier === "basic" ? "open" : clubData.visibility,
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
            throw new Error(
              formatSyncError(error, "Could not save club to the cloud."),
            );
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

        const joinCheck = canJoinEvent(getCurrentUserTier(get), target);
        if (!joinCheck.ok) {
          throw new SubscriptionError(joinCheck.reason!);
        }

        let joinedEvent: GameEvent | undefined;

        set({
          events: events.map((event) => {
            if (event.id !== eventId) return event;
            if (event.participantIds.includes(currentUserId)) return event;
            if (event.participantIds.length >= event.maxPlayers) return event;

            joinedEvent = {
              ...event,
              participantIds: [...event.participantIds, currentUserId],
            };
            return joinedEvent;
          }),
        });

        if (joinedEvent) {
          await scheduleGameReminder(
            joinedEvent.id,
            joinedEvent.title,
            joinedEvent.dateTime,
          );
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

            const participantIds = event.participantIds.filter(
              (id) => id !== currentUserId,
            );
            const courtGames = removePlayerFromCourtGames(
              event.courtGames,
              currentUserId,
              participantIds,
            );

            return {
              ...event,
              participantIds,
              courtGames,
              shuffled: Boolean(courtGames?.length),
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
        if (!currentUserId) return "";

        assertFeatureAccess(getCurrentUserTier(get), "create_event");

        const id = uuidv4();
        const newEvent: GameEvent = {
          ...eventData,
          id,
          participantIds: [currentUserId],
          shuffled: false,
          createdBy: currentUserId,
        };

        set({ events: [...events, newEvent] });

        void scheduleGameReminder(
          newEvent.id,
          newEvent.title,
          newEvent.dateTime,
        ).catch(() => undefined);

        if (isSupabaseEnabled) {
          void insertEvent(newEvent)
            .then(() => get().refreshFromServer())
            .catch(() => undefined);
        }

        return id;
      },

      editEvent: async (eventId, updates) => {
        const { events, currentUserId, clubs } = get();
        const event = events.find((item) => item.id === eventId);
        if (!event || isEventOptionsLocked(event)) return false;

        const club = clubs.find((item) => item.id === event.clubId);
        if (!canManageEvent(event, currentUserId, club?.adminId)) return false;

        assertFeatureAccess(getCurrentUserTier(get), "create_event");

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
          updatedEvent.dateTime !== event.dateTime ||
          updatedEvent.title !== event.title;

        set({
          events: events.map((item) =>
            item.id === eventId ? updatedEvent : item,
          ),
        });

        if (scheduleChanged) {
          await cancelGameReminder(eventId);
          await scheduleGameReminder(
            updatedEvent.id,
            updatedEvent.title,
            updatedEvent.dateTime,
          );
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

        assertFeatureAccess(getCurrentUserTier(get), "shuffle_teams");

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
          events: events.map((item) =>
            item.id === eventId ? updatedEvent : item,
          ),
        });

        if (isSupabaseEnabled) {
          void updateEvent(updatedEvent).catch(() => undefined);
        }
      },

      saveEventCourts: async (eventId, courtGames) => {
        const { events, currentUserId, clubs } = get();
        const event = events.find((item) => item.id === eventId);
        if (!event || isEventOptionsLocked(event)) return false;

        const club = clubs.find((item) => item.id === event.clubId);
        if (!canManageEvent(event, currentUserId, club?.adminId)) return false;

        assertFeatureAccess(getCurrentUserTier(get), "edit_courts");

        const sanitized = sanitizeCourtGames(courtGames, event.participantIds);
        const updatedEvent: GameEvent = {
          ...event,
          courtGames: sanitized.length > 0 ? sanitized : undefined,
          shuffled: sanitized.length > 0,
        };

        set({
          events: events.map((item) =>
            item.id === eventId ? updatedEvent : item,
          ),
        });

        if (isSupabaseEnabled) {
          try {
            await updateEvent(updatedEvent);
          } catch {
            return false;
          }
        }

        return true;
      },

      finishEvent: async (eventId) => {
        const { events, currentUserId, clubs } = get();
        const event = events.find((item) => item.id === eventId);
        if (!event || isEventOptionsLocked(event) || !hasEventStarted(event))
          return;

        const club = clubs.find((item) => item.id === event.clubId);
        const canFinish =
          currentUserId === event.createdBy || currentUserId === club?.adminId;
        if (!canFinish) return;

        assertFeatureAccess(getCurrentUserTier(get), "scorekeeper");

        const finishedAt = new Date().toISOString();
        const updatedEvent: GameEvent = { ...event, finishedAt };

        set({
          events: events.map((item) =>
            item.id === eventId ? updatedEvent : item,
          ),
        });

        if (isSupabaseEnabled) {
          await finishEventRemote(eventId, finishedAt);
        }
      },

      saveEventStats: async (
        eventId,
        statsByPlayer,
        courtGameIndex = 0,
        playerIds,
      ) => {
        const { events, currentUserId, clubs, gameStatRecords, users } = get();
        const rawEvent = events.find((item) => item.id === eventId);
        if (!rawEvent) return "Game not found.";
        if (isEventOptionsLocked(rawEvent)) {
          return "This game is closed. Stats can no longer be saved.";
        }

        const event = normalizeEventCourts(rawEvent);
        const club = clubs.find((item) => item.id === event.clubId);
        const canSave =
          currentUserId === event.createdBy || currentUserId === club?.adminId;
        if (!canSave) {
          return "Only the game creator or club admin can save stats.";
        }

        try {
          assertFeatureAccess(getCurrentUserTier(get), "scorekeeper");
        } catch (error) {
          return error instanceof SubscriptionError
            ? error.message
            : "Scorekeeper is not available on your plan.";
        }

        const courtRosterIds = getCourtGameRosterIds(event, courtGameIndex);
        const rosterIds = (
          playerIds?.length ? playerIds : courtRosterIds
        ).filter((userId) => users.some((user) => user.id === userId));

        if (rosterIds.length === 0) {
          if (playerIds?.length || courtRosterIds.length > 0) {
            return "Player profiles are still loading. Pull to refresh and try again.";
          }
          return "No players on this court to save.";
        }

        const now = new Date().toISOString();
        const existingByUser = new Map(
          gameStatRecords
            .filter((record) => record.eventId === eventId)
            .map((record) => [record.userId, record]),
        );

        const updatedRecords: GameStatRecord[] = [];

        for (const userId of rosterIds) {
          const stats = statsByPlayer[userId] ??
            existingByUser.get(userId)?.stats ?? { ...EMPTY_BOX_SCORE };
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

        const updatedUserIds = new Set(
          updatedRecords.map((record) => record.userId),
        );
        const otherRecords = gameStatRecords.filter(
          (record) =>
            record.eventId !== eventId || !updatedUserIds.has(record.userId),
        );
        set({ gameStatRecords: [...otherRecords, ...updatedRecords] });

        if (isSupabaseEnabled) {
          try {
            await upsertEventPlayerStats(updatedRecords);
          } catch (error) {
            return formatSyncError(
              error,
              "Could not save box score. Try again.",
            );
          }
        }

        return null;
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
          .sort(
            (a, b) =>
              new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime(),
          );
      },

      getPlayerGameHistory: (userId) => {
        return get()
          .gameStatRecords.filter((record) => record.userId === userId)
          .sort(
            (a, b) =>
              new Date(b.recordedAt).getTime() -
              new Date(a.recordedAt).getTime(),
          );
      },
    }),
    {
      name: "highballers-storage",
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

export function createDefaultProfile(
  name: string,
  position: Position,
): Omit<UserProfile, "id" | "joinedAt"> {
  return {
    name,
    position,
    avatarColor:
      AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
    stats: { ...DEFAULT_STATS },
    bio: "",
  };
}

export function getDefaultGameDateTime() {
  const date = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
  date.setHours(19, 0, 0, 0);
  return date;
}
