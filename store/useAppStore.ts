import AsyncStorage from "@react-native-async-storage/async-storage";
import { Session } from "@supabase/supabase-js";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { v4 as uuidv4 } from "uuid";

import {
  clearOAuthCallbackUrl,
  getGoogleProfileHints,
  getOAuthRedirectUri,
  resetOAuthExchangeState,
  signInWithGoogle as startGoogleSignIn,
} from "../lib/googleAuth";
import { isSupabaseEnabled } from "../lib/config";
import { devStartAtLogin } from "../lib/devConfig";
import {
  sendEmailOtpCode,
  verifyEmailOtpCode,
} from "../lib/emailOtpAuth";
import {
  cancelGameReminder,
  registerForPushNotifications,
  scheduleGameReminder,
} from "../lib/notificationsLazy";
import {
  AVATAR_COLORS,
  SEED_CLUBS,
  SEED_EVENTS,
  SEED_PLAYERS,
} from "../lib/seedData";
import { uploadAvatar, uploadClubLogo } from "../lib/storage";
import { getSupabase } from "../lib/supabase";
import {
  deleteClubBan,
  replaceClubSubCaptains,
  deleteJoinRequest,
  fetchAllData,
  fetchProfileById,
  insertClubBan,
  deleteEventRemote,
  finishEventRemote,
  insertClub,
  insertEvent,
  insertJoinRequest,
  joinClubRemote,
  addEventInvitesRemote,
  addEventParticipantsRemote,
  joinEventRemote,
  leaveClubRemote,
  leaveEventRemote,
  subscribeToChanges,
  transferClubCaptainRemote,
  updateClub,
  updateEvent,
  updateEventCourts,
  updateProfileStats,
  upsertEventPlayerStats,
  upsertProfile,
} from "../lib/supabaseSync";
import { formatSyncError } from "../lib/syncErrors";
import { isUserBannedFromClub } from "../lib/clubBans";
import {
  canCreatePrivateGame,
  isClubCaptain,
  canLeaveClub,
  MAX_SUB_CAPTAINS,
} from "../lib/clubRoles";
import { canUserJoinEvent, isPrivateEvent } from "../lib/eventAccess";
import {
  canInvitePlayersToEvent,
  InvitePlayerResult,
  resolvePlayersToInvite,
} from "../lib/eventInvite";
import { assertEventMaxPlayersAllowed } from "../lib/eventCapacity";
import {
  assertFeatureAccess,
  canAddClubMember,
  canCreateClub,
  canJoinClub,
  canJoinEvent,
  getUserTier,
  isAllStar,
  SubscriptionError,
} from "../lib/subscription";
import { buildMemberRemovalUpdate } from "../lib/memberRemoval";
import { clearRemoteCache } from "../lib/remoteCache";
import { clearTabFetchSession } from "../lib/useCachedFetch";
import { clampPlayersPerGame, getPlayersPerGame } from "../lib/gameFormats";
import {
  isEventOptionsLocked,
  hasEventStarted,
  canEditEvent,
  canManageEvent,
  canManageEventStats,
  canMarkEventFinished,
  eventHasRecordedStats,
} from "../lib/gameEvents";
import {
  buildCourtGames,
  canShuffleEvent,
  getCourtGameRosterIds,
  normalizeEventCourts,
  removePlayerFromCourtGames,
  isActiveCourtGame,
  sanitizeCourtGames,
} from "../lib/eventRoster";
import {
  BoxScoreStats,
  Club,
  ClubBan,
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
  /** True after the first Supabase getSession() on launch (avoids flashing /auth). */
  authChecked: boolean;
  authReady: boolean;
  syncEnabled: boolean;
  session: Session | null;
  onboardingComplete: boolean;
  currentUserId: string | null;
  users: UserProfile[];
  clubs: Club[];
  events: GameEvent[];
  joinRequests: ClubJoinRequest[];
  clubBans: ClubBan[];
  gameStatRecords: GameStatRecord[];

  setHydrated: (value: boolean) => void;
  initAuth: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (
    email: string,
    password: string,
  ) => Promise<{ error: string | null; needsEmailConfirmation: boolean }>;
  signInWithGoogle: () => Promise<string | null>;
  sendEmailOtp: (email: string) => Promise<string | null>;
  verifyEmailOtp: (email: string, token: string) => Promise<string | null>;
  syncSessionFromSupabase: () => Promise<Session | null>;
  hydrateSessionUser: (userId: string) => Promise<void>;
  finishOAuthSignIn: () => Promise<Session | null>;
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
  kickMember: (clubId: string, userId: string) => Promise<void>;
  banMember: (clubId: string, userId: string) => Promise<void>;
  unbanMember: (clubId: string, userId: string) => Promise<void>;
  createClub: (
    club: Omit<
      Club,
      "id" | "createdAt" | "memberIds" | "adminId" | "subCaptainIds"
    >,
    logoUri?: string,
  ) => Promise<string>;
  updateClubVisibility: (
    clubId: string,
    visibility: Club["visibility"],
  ) => Promise<void>;
  setClubSubCaptains: (clubId: string, userIds: string[]) => Promise<void>;
  transferClubCaptain: (clubId: string, newCaptainId: string) => Promise<void>;

  joinEvent: (eventId: string) => Promise<void>;
  leaveEvent: (eventId: string) => Promise<void>;
  invitePlayersToEvent: (
    eventId: string,
    memberIds: string[],
  ) => Promise<InvitePlayerResult>;
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
  cancelEvent: (eventId: string) => Promise<void>;
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
let devLoginResetApplied = false;

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
      authChecked: false,
      authReady: false,
      syncEnabled: isSupabaseEnabled,
      session: null,
      onboardingComplete: false,
      currentUserId: null,
      users: isSupabaseEnabled ? [] : SEED_PLAYERS,
      clubs: isSupabaseEnabled ? [] : SEED_CLUBS,
      events: isSupabaseEnabled ? [] : SEED_EVENTS,
      joinRequests: [],
      clubBans: [],
      gameStatRecords: [],

      setHydrated: (value) => set({ hydrated: value }),

      initAuth: async () => {
        if (devStartAtLogin() && !devLoginResetApplied) {
          devLoginResetApplied = true;
          await get().signOut();
        }

        if (!isSupabaseEnabled) {
          set({ authChecked: true, authReady: true });
          return;
        }

        const supabase = getSupabase();
        if (!supabase) {
          set({ authChecked: true, authReady: true });
          return;
        }

        try {
          const { data } = await supabase.auth.getSession();
          set({ session: data.session });

          if (data.session?.user) {
            set({ authReady: false });
            await get().hydrateSessionUser(data.session.user.id);
          } else {
            set({ authReady: true });
          }
        } finally {
          set({ authChecked: true });
        }

        if (!authListenerRegistered) {
          authListenerRegistered = true;
          supabase.auth.onAuthStateChange(async (_event, session) => {
            set({ session });
            if (session?.user) {
              set({ authReady: false });
              await get().hydrateSessionUser(session.user.id);
            } else {
              set({
                authReady: true,
                currentUserId: null,
                onboardingComplete: false,
                users: isSupabaseEnabled ? [] : SEED_PLAYERS,
                clubs: isSupabaseEnabled ? [] : SEED_CLUBS,
                events: isSupabaseEnabled ? [] : SEED_EVENTS,
                joinRequests: [],
                clubBans: [],
                gameStatRecords: [],
              });
            }
          });
        }
      },

      hydrateSessionUser: async (userId: string) => {
        if (!isSupabaseEnabled) {
          const profile = get().users.find((user) => user.id === userId);
          set({
            currentUserId: userId,
            onboardingComplete: Boolean(profile),
            authReady: true,
          });
          return;
        }

        try {
          await get().refreshFromServer();
        } catch {
          // Fall back to a direct profile lookup below.
        }

        let profile = get().users.find((user) => user.id === userId) ?? null;

        if (!profile) {
          try {
            profile = await fetchProfileById(userId);
            if (profile) {
              set({
                users: [
                  ...get().users.filter((user) => user.id !== userId),
                  profile,
                ],
              });
            }
          } catch {
            profile = null;
          }
        }

        set({
          currentUserId: userId,
          onboardingComplete: Boolean(profile),
          authReady: true,
        });

        if (profile) {
          await registerForPushNotifications(userId).catch(() => undefined);
        }
      },

      syncSessionFromSupabase: async () => {
        const supabase = getSupabase();
        if (!supabase) return null;

        const { data } = await supabase.auth.getSession();
        set({ session: data.session });

        if (data.session?.user) {
          set({ authReady: false });
          await get().hydrateSessionUser(data.session.user.id);
        } else {
          set({ authReady: true });
        }

        return data.session;
      },

      finishOAuthSignIn: async () => {
        const supabase = getSupabase();
        if (!supabase) return null;

        for (let attempt = 0; attempt < 30; attempt += 1) {
          const { data } = await supabase.auth.getSession();
          if (data.session?.user) {
            set({ session: data.session, authReady: false });
            await get().hydrateSessionUser(data.session.user.id);
            return data.session;
          }
          if (attempt < 29) {
            await new Promise((resolve) => setTimeout(resolve, 200));
          }
        }

        return null;
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
        if (!supabase) {
          return {
            error: "Cloud sync is not configured.",
            needsEmailConfirmation: false,
          };
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: getOAuthRedirectUri(),
          },
        });

        return {
          error: error?.message ?? null,
          needsEmailConfirmation: !error && !data.session,
        };
      },

      signInWithGoogle: async () => startGoogleSignIn(),

      sendEmailOtp: async (email) => sendEmailOtpCode(email),

      verifyEmailOtp: async (email, token) => verifyEmailOtpCode(email, token),

      signOut: async () => {
        const supabase = getSupabase();
        if (supabase) {
          const { error } = await supabase.auth.signOut();
          if (error) {
            await supabase.auth.signOut({ scope: "local" });
          }
        }

        resetOAuthExchangeState();
        clearOAuthCallbackUrl();
        clearRemoteCache();
        clearTabFetchSession();
        set({
          session: null,
          authChecked: true,
          authReady: true,
          currentUserId: null,
          onboardingComplete: false,
          users: isSupabaseEnabled ? [] : SEED_PLAYERS,
          clubs: isSupabaseEnabled ? [] : SEED_CLUBS,
          events: isSupabaseEnabled ? [] : SEED_EVENTS,
          joinRequests: [],
          clubBans: [],
          gameStatRecords: [],
        });
        await useAppStore.persist.clearStorage();
      },

      refreshFromServer: async () => {
        if (!isSupabaseEnabled) return;

        try {
          const data = await fetchAllData();
          if (!data) return;

          set({
            users: data.users,
            clubs: data.clubs.map((club) => ({
              ...club,
              subCaptainIds: club.subCaptainIds ?? [],
            })),
            events: data.events,
            joinRequests: data.joinRequests,
            clubBans: data.clubBans,
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
        const { currentUserId, clubs, users, clubBans, session } = get();
        const userId = session?.user?.id ?? currentUserId;
        if (!userId) return;

        const club = clubs.find((item) => item.id === clubId);
        if (!club || club.visibility !== "open") return;

        if (isUserBannedFromClub(clubId, userId, clubBans)) {
          throw new Error("You are banned from this club.");
        }

        const user = getCurrentUser(get);
        const tier = getUserTier(user);
        const admin = users.find((item) => item.id === club.adminId) ?? null;
        const joinCheck = canJoinClub(tier, clubs, userId, club, admin);
        if (!joinCheck.ok) {
          throw new SubscriptionError(joinCheck.reason!);
        }

        set({
          clubs: clubs.map((item) =>
            item.id === clubId && !item.memberIds.includes(userId)
              ? { ...item, memberIds: [...item.memberIds, userId] }
              : item,
          ),
        });

        if (isSupabaseEnabled) {
          try {
            await joinClubRemote(clubId, userId);
          } catch (error) {
            set({
              clubs: get().clubs.map((item) =>
                item.id === clubId
                  ? {
                      ...item,
                      memberIds: item.memberIds.filter((id) => id !== userId),
                    }
                  : item,
              ),
            });
            throw new Error(
              formatSyncError(error, "Could not join club. Try again."),
            );
          }
        }
      },

      requestToJoinClub: async (clubId) => {
        const { currentUserId, clubs, joinRequests, clubBans } = get();
        if (!currentUserId) return;

        assertFeatureAccess(getCurrentUserTier(get), "private_clubs");

        const club = clubs.find((item) => item.id === clubId);
        if (!club || club.visibility !== "private") return;
        if (isUserBannedFromClub(clubId, currentUserId, clubBans)) {
          throw new Error("You are banned from this club.");
        }
        if (club.memberIds.includes(currentUserId)) return;
        if (
          joinRequests.some(
            (request) =>
              request.clubId === clubId && request.userId === currentUserId,
          )
        ) {
          return;
        }

        const user = getCurrentUser(get);
        const tier = getUserTier(user);
        const admin =
          get().users.find((item) => item.id === club.adminId) ?? null;
        const joinCheck = canJoinClub(tier, clubs, currentUserId, club, admin);
        if (!joinCheck.ok) {
          throw new SubscriptionError(joinCheck.reason!);
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
        const { currentUserId, clubs, joinRequests, users, clubBans } = get();
        const request = joinRequests.find((item) => item.id === requestId);
        if (!request) return;

        const club = clubs.find((item) => item.id === request.clubId);
        if (!club || club.adminId !== currentUserId) return;

        if (isUserBannedFromClub(request.clubId, request.userId, clubBans)) {
          set({
            joinRequests: joinRequests.filter((item) => item.id !== requestId),
          });
          if (isSupabaseEnabled) {
            await deleteJoinRequest(requestId);
          }
          return;
        }

        assertFeatureAccess(getCurrentUserTier(get), "approve_join_requests");

        const admin = users.find((item) => item.id === club.adminId) ?? null;
        const memberCheck = canAddClubMember(admin, club);
        if (!memberCheck.ok) {
          throw new SubscriptionError(memberCheck.reason!);
        }

        const requester = users.find((item) => item.id === request.userId);
        const requesterTier = getUserTier(requester);
        const joinCheck = canJoinClub(
          requesterTier,
          clubs,
          request.userId,
          club,
          admin,
        );
        if (!joinCheck.ok) {
          throw new SubscriptionError(
            joinCheck.reason ??
              "This player cannot join more clubs on their plan.",
          );
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
        const { currentUserId, clubs, events, joinRequests, clubBans } = get();
        if (!currentUserId) return;

        const club = clubs.find((item) => item.id === clubId);
        if (club && !canLeaveClub(club, currentUserId)) {
          throw new Error(
            "Transfer club captain role to another member before leaving.",
          );
        }

        set(
          buildMemberRemovalUpdate(
            clubs,
            events,
            joinRequests,
            clubBans,
            clubId,
            currentUserId,
          ),
        );

        if (isSupabaseEnabled) {
          await leaveClubRemote(clubId, currentUserId);
        }
      },

      kickMember: async (clubId, userId) => {
        const { currentUserId, clubs, events, joinRequests, clubBans } = get();
        const club = clubs.find((item) => item.id === clubId);
        if (!club || club.adminId !== currentUserId) {
          throw new Error("Only the club captain can remove members.");
        }
        if (userId === club.adminId) {
          throw new Error("The club captain cannot be removed.");
        }
        if (!club.memberIds.includes(userId)) return;

        const { pendingRequests, ...removalUpdate } = buildMemberRemovalUpdate(
          clubs,
          events,
          joinRequests,
          clubBans,
          clubId,
          userId,
        );
        set(removalUpdate);

        if (isSupabaseEnabled) {
          await leaveClubRemote(clubId, userId);
          for (const request of pendingRequests) {
            await deleteJoinRequest(request.id);
          }
        }
      },

      banMember: async (clubId, userId) => {
        const { currentUserId, clubs, events, joinRequests, clubBans } = get();
        const club = clubs.find((item) => item.id === clubId);
        if (!club || club.adminId !== currentUserId) {
          throw new Error("Only the club captain can ban members.");
        }
        if (userId === club.adminId) {
          throw new Error("The club captain cannot be banned.");
        }

        const ban: ClubBan = {
          clubId,
          userId,
          bannedBy: currentUserId ?? "",
          createdAt: new Date().toISOString(),
        };

        const { pendingRequests, ...removalUpdate } = buildMemberRemovalUpdate(
          clubs,
          events,
          joinRequests,
          clubBans,
          clubId,
          userId,
          ban,
        );
        set(removalUpdate);

        if (isSupabaseEnabled) {
          await leaveClubRemote(clubId, userId);
          await insertClubBan(ban);
          for (const request of pendingRequests) {
            await deleteJoinRequest(request.id);
          }
        }
      },

      unbanMember: async (clubId, userId) => {
        const { currentUserId, clubs, clubBans } = get();
        const club = clubs.find((item) => item.id === clubId);
        if (!club || club.adminId !== currentUserId) {
          throw new Error("Only the club captain can unban members.");
        }

        set({
          clubBans: clubBans.filter(
            (ban) => !(ban.clubId === clubId && ban.userId === userId),
          ),
        });

        if (isSupabaseEnabled) {
          await deleteClubBan(clubId, userId);
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
        const createCheck = canCreateClub(tier, clubs, userId);
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
          subCaptainIds: [],
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

      updateClubVisibility: async (clubId, visibility) => {
        const { currentUserId, clubs } = get();
        if (!currentUserId) {
          throw new Error("Sign in to update club settings.");
        }

        const club = clubs.find((item) => item.id === clubId);
        if (!club || club.adminId !== currentUserId) {
          throw new Error("Only the club captain can change visibility.");
        }

        if (club.visibility === visibility) return;

        const tier = getCurrentUserTier(get);
        if (visibility === "private") {
          assertFeatureAccess(tier, "private_clubs");
        }

        const previousVisibility = club.visibility;
        const updatedClub: Club = { ...club, visibility };

        set({
          clubs: clubs.map((item) => (item.id === clubId ? updatedClub : item)),
        });

        if (isSupabaseEnabled) {
          try {
            await updateClub(updatedClub);
          } catch (error) {
            set({
              clubs: get().clubs.map((item) =>
                item.id === clubId
                  ? { ...item, visibility: previousVisibility }
                  : item,
              ),
            });
            throw new Error(
              formatSyncError(
                error,
                "Could not update club visibility. Try again.",
              ),
            );
          }
        }
      },

      transferClubCaptain: async (clubId, newCaptainId) => {
        const { currentUserId, clubs, session } = get();
        const userId = session?.user?.id ?? currentUserId;
        if (!userId) {
          throw new Error("Sign in to transfer club captain role.");
        }

        const club = clubs.find((item) => item.id === clubId);
        if (!club || !isClubCaptain(club, userId)) {
          throw new Error("Only the club captain can transfer leadership.");
        }
        if (newCaptainId === club.adminId) {
          throw new Error("That member is already the captain.");
        }
        if (!club.memberIds.includes(newCaptainId)) {
          throw new Error("The new captain must be a club member.");
        }

        const previousAdminId = club.adminId;
        const updatedClub: Club = {
          ...club,
          adminId: newCaptainId,
          subCaptainIds: (club.subCaptainIds ?? []).filter(
            (id) => id !== newCaptainId,
          ),
        };

        set({
          clubs: clubs.map((item) => (item.id === clubId ? updatedClub : item)),
        });

        if (isSupabaseEnabled) {
          try {
            await transferClubCaptainRemote(clubId, newCaptainId);
          } catch (error) {
            set({
              clubs: clubs.map((item) =>
                item.id === clubId
                  ? { ...item, adminId: previousAdminId }
                  : item,
              ),
            });
            throw new Error(
              formatSyncError(
                error,
                "Could not transfer captain role. Try again.",
              ),
            );
          }
        }
      },

      setClubSubCaptains: async (clubId, userIds) => {
        const { currentUserId, clubs, session } = get();
        const userId = session?.user?.id ?? currentUserId;
        if (!userId) {
          throw new Error("Sign in to update sub-captains.");
        }

        const club = clubs.find((item) => item.id === clubId);
        if (!club || !isClubCaptain(club, userId)) {
          throw new Error("Only the club captain can assign sub-captains.");
        }

        const uniqueIds = [...new Set(userIds)];
        if (uniqueIds.length > MAX_SUB_CAPTAINS) {
          throw new Error(
            `You can assign up to ${MAX_SUB_CAPTAINS} sub-captains.`,
          );
        }

        const invalid = uniqueIds.find(
          (memberId) =>
            memberId === club.adminId || !club.memberIds.includes(memberId),
        );
        if (invalid) {
          throw new Error(
            "Sub-captains must be club members other than the captain.",
          );
        }

        const previous = club.subCaptainIds ?? [];
        const updatedClub: Club = { ...club, subCaptainIds: uniqueIds };

        set({
          clubs: clubs.map((item) => (item.id === clubId ? updatedClub : item)),
        });

        if (isSupabaseEnabled) {
          try {
            await replaceClubSubCaptains(clubId, uniqueIds, userId);
          } catch (error) {
            set({
              clubs: get().clubs.map((item) =>
                item.id === clubId
                  ? { ...item, subCaptainIds: previous }
                  : item,
              ),
            });
            throw new Error(
              formatSyncError(error, "Could not save sub-captains. Try again."),
            );
          }
        }
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

        const accessCheck = canUserJoinEvent(currentUserId, target);
        if (!accessCheck.ok) {
          throw new Error(accessCheck.reason);
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

      invitePlayersToEvent: async (eventId, memberIds) => {
        const { currentUserId, events, clubs, users, clubBans } = get();
        const event = events.find((item) => item.id === eventId);
        if (!event) {
          throw new Error("Game not found.");
        }

        const club = clubs.find((item) => item.id === event.clubId);
        if (!canInvitePlayersToEvent(event, currentUserId, club)) {
          throw new Error(
            "Only the game creator or club captain can add players to this game.",
          );
        }
        if (isEventOptionsLocked(event)) {
          throw new Error("This game is closed.");
        }

        assertFeatureAccess(getCurrentUserTier(get), "invite_players");

        const { addedIds, skipped } = resolvePlayersToInvite(
          event,
          club,
          users,
          clubBans,
          memberIds,
        );

        if (addedIds.length === 0) {
          const firstReason = skipped[0]?.reason;
          throw new Error(
            firstReason ?? "No players could be added to this game.",
          );
        }

        const invitedMemberIds = isPrivateEvent(event)
          ? [
              ...new Set([...(event.invitedMemberIds ?? []), ...addedIds]),
            ]
          : event.invitedMemberIds;

        const updatedEvent: GameEvent = {
          ...event,
          participantIds: [...event.participantIds, ...addedIds],
          invitedMemberIds,
        };

        set({
          events: events.map((item) =>
            item.id === eventId ? updatedEvent : item,
          ),
        });

        if (isSupabaseEnabled) {
          try {
            await addEventParticipantsRemote(eventId, addedIds);
            if (isPrivateEvent(event)) {
              await addEventInvitesRemote(eventId, addedIds);
            }
          } catch (error) {
            set({
              events: events.map((item) =>
                item.id === eventId ? event : item,
              ),
            });
            throw new Error(
              formatSyncError(error, "Could not add players to this game."),
            );
          }
        }

        return { addedIds, skipped };
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
        const { currentUserId, events, session, clubs } = get();
        const userId = session?.user?.id ?? currentUserId;
        if (!userId) {
          throw new Error("Sign in to create a game.");
        }

        const club = clubs.find((item) => item.id === eventData.clubId);
        if (!club) {
          throw new Error("Club not found.");
        }
        if (!club.memberIds.includes(userId)) {
          throw new Error("Join this club before creating a game.");
        }

        const tier = getCurrentUserTier(get);
        assertFeatureAccess(tier, "create_event");
        assertEventMaxPlayersAllowed(tier, eventData.maxPlayers);

        const id = uuidv4();
        const visibility = eventData.visibility ?? "open";
        if (visibility === "private" && !canCreatePrivateGame(club, userId)) {
          throw new Error(
            "Only the captain and sub-captains can schedule private games.",
          );
        }
        const invitedMemberIds =
          visibility === "private"
            ? (eventData.invitedMemberIds ?? []).filter(
                (memberId) => memberId !== userId,
              )
            : undefined;

        let participantIds = [userId];
        if (visibility === "private" && invitedMemberIds?.length) {
          const draftEvent: GameEvent = {
            ...eventData,
            id,
            visibility,
            invitedMemberIds,
            participantIds,
            shuffled: false,
            createdBy: userId,
          };
          const { addedIds, skipped } = resolvePlayersToInvite(
            draftEvent,
            club,
            get().users,
            get().clubBans,
            invitedMemberIds,
          );
          if (addedIds.length === 0) {
            throw new Error(
              skipped[0]?.reason ??
                "No invited players could be added to this game.",
            );
          }
          participantIds = [userId, ...addedIds];
        }

        const newEvent: GameEvent = {
          ...eventData,
          id,
          visibility,
          invitedMemberIds,
          participantIds,
          shuffled: false,
          createdBy: userId,
        };

        set({ events: [...events, newEvent] });

        if (isSupabaseEnabled) {
          try {
            await insertEvent(newEvent, { membershipVerified: true });
          } catch (error) {
            set({
              events: get().events.filter((item) => item.id !== id),
            });
            throw new Error(
              formatSyncError(error, "Could not save game to the cloud."),
            );
          }
        }

        void scheduleGameReminder(
          newEvent.id,
          newEvent.title,
          newEvent.dateTime,
        ).catch(() => undefined);

        return id;
      },

      editEvent: async (eventId, updates) => {
        const { events, currentUserId, clubs } = get();
        const event = events.find((item) => item.id === eventId);
        if (!event || isEventOptionsLocked(event)) return false;

        const club = clubs.find((item) => item.id === event.clubId);
        if (!canEditEvent(event, currentUserId, club)) return false;

        const tier = getCurrentUserTier(get);
        assertFeatureAccess(tier, "create_event");
        assertEventMaxPlayersAllowed(tier, updates.maxPlayers);

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
        const { events, users, gameStatRecords, currentUserId, clubs } = get();
        const event = events.find((item) => item.id === eventId);
        if (!event || isEventOptionsLocked(event)) return;

        const club = clubs.find((item) => item.id === event.clubId);
        if (!canEditEvent(event, currentUserId, club)) {
          throw new Error(
            "Only the game creator or club captain can shuffle this game.",
          );
        }

        if (eventHasRecordedStats(eventId, gameStatRecords)) {
          throw new Error(
            "Re-shuffle is locked after scores are saved. Edit court assignments instead.",
          );
        }

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
        if (!event || isEventOptionsLocked(event)) {
          throw new Error("This game is closed for court edits.");
        }

        const club = clubs.find((item) => item.id === event.clubId);
        if (!canEditEvent(event, currentUserId, club)) {
          throw new Error(
            "Only the game creator or club captain can save court assignments.",
          );
        }

        assertFeatureAccess(getCurrentUserTier(get), "edit_courts");

        const sanitized = sanitizeCourtGames(courtGames, event.participantIds);
        const playersPerGame = getPlayersPerGame(event);
        const hasFullCourts = sanitized.some((game) =>
          isActiveCourtGame(game, playersPerGame),
        );
        const updatedEvent: GameEvent = {
          ...event,
          courtGames: sanitized.length > 0 ? sanitized : undefined,
          shuffled: hasFullCourts,
        };

        set({
          events: events.map((item) =>
            item.id === eventId ? updatedEvent : item,
          ),
        });

        if (isSupabaseEnabled) {
          try {
            await updateEventCourts(updatedEvent);
          } catch (error) {
            set({
              events: events.map((item) =>
                item.id === eventId ? event : item,
              ),
            });
            throw error;
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
        if (!canMarkEventFinished(event, currentUserId, club)) return;

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

      cancelEvent: async (eventId) => {
        const { events, currentUserId, clubs, gameStatRecords } = get();
        const event = events.find((item) => item.id === eventId);
        if (!event) {
          throw new Error("Game not found.");
        }
        if (event.finishedAt) {
          throw new Error("Finished games cannot be cancelled.");
        }

        const club = clubs.find((item) => item.id === event.clubId);
        if (!canManageEvent(event, currentUserId, club)) {
          throw new Error(
            "Only the game creator, captain, or sub-captain can cancel this game.",
          );
        }

        const previousEvents = events;
        const previousStats = gameStatRecords;

        set({
          events: events.filter((item) => item.id !== eventId),
          gameStatRecords: gameStatRecords.filter(
            (record) => record.eventId !== eventId,
          ),
        });

        await cancelGameReminder(eventId);

        if (isSupabaseEnabled) {
          try {
            await deleteEventRemote(eventId);
          } catch (error) {
            set({
              events: previousEvents,
              gameStatRecords: previousStats,
            });
            throw new Error(
              formatSyncError(error, "Could not cancel this game. Try again."),
            );
          }
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
        if (!canManageEventStats(event, currentUserId, club)) {
          return "Only the game creator or club captain can save stats.";
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
        clubBans: state.clubBans,
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
