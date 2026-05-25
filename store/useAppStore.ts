import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';

import { AVATAR_COLORS, SEED_CLUBS, SEED_EVENTS, SEED_PLAYERS } from '../lib/seedData';
import { balanceTeams } from '../lib/teamBalancer';
import { Club, DEFAULT_STATS, GameEvent, PlayerStats, Position, UserProfile } from '../lib/types';

interface AppState {
  hydrated: boolean;
  onboardingComplete: boolean;
  currentUserId: string | null;
  users: UserProfile[];
  clubs: Club[];
  events: GameEvent[];

  setHydrated: (value: boolean) => void;
  completeOnboarding: (profile: Omit<UserProfile, 'id' | 'joinedAt'>) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  updateStats: (stats: PlayerStats) => void;

  joinClub: (clubId: string) => void;
  leaveClub: (clubId: string) => void;
  createClub: (club: Omit<Club, 'id' | 'createdAt' | 'memberIds' | 'adminId'>) => string;

  joinEvent: (eventId: string) => void;
  leaveEvent: (eventId: string) => void;
  createEvent: (event: Omit<GameEvent, 'id' | 'participantIds' | 'shuffled' | 'createdBy' | 'teamA' | 'teamB'>) => string;
  shuffleTeams: (eventId: string) => void;

  getCurrentUser: () => UserProfile | null;
  getUserById: (id: string) => UserProfile | undefined;
  getClubById: (id: string) => Club | undefined;
  getEventById: (id: string) => GameEvent | undefined;
  getMyClubs: () => Club[];
  getUpcomingEvents: () => GameEvent[];
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      hydrated: false,
      onboardingComplete: false,
      currentUserId: null,
      users: SEED_PLAYERS,
      clubs: SEED_CLUBS,
      events: SEED_EVENTS,

      setHydrated: (value) => set({ hydrated: value }),

      completeOnboarding: (profile) => {
        const id = uuidv4();
        const newUser: UserProfile = {
          ...profile,
          id,
          joinedAt: new Date().toISOString(),
        };

        set({
          onboardingComplete: true,
          currentUserId: id,
          users: [...get().users, newUser],
        });
      },

      updateProfile: (updates) => {
        const { currentUserId, users } = get();
        if (!currentUserId) return;

        set({
          users: users.map((user) =>
            user.id === currentUserId ? { ...user, ...updates } : user,
          ),
        });
      },

      updateStats: (stats) => {
        const { currentUserId, users } = get();
        if (!currentUserId) return;

        set({
          users: users.map((user) =>
            user.id === currentUserId ? { ...user, stats } : user,
          ),
        });
      },

      joinClub: (clubId) => {
        const { currentUserId, clubs } = get();
        if (!currentUserId) return;

        set({
          clubs: clubs.map((club) =>
            club.id === clubId && !club.memberIds.includes(currentUserId)
              ? { ...club, memberIds: [...club.memberIds, currentUserId] }
              : club,
          ),
        });
      },

      leaveClub: (clubId) => {
        const { currentUserId, clubs } = get();
        if (!currentUserId) return;

        set({
          clubs: clubs.map((club) =>
            club.id === clubId
              ? { ...club, memberIds: club.memberIds.filter((id) => id !== currentUserId) }
              : club,
          ),
        });
      },

      createClub: (clubData) => {
        const { currentUserId, clubs } = get();
        if (!currentUserId) return '';

        const id = uuidv4();
        const newClub: Club = {
          ...clubData,
          id,
          memberIds: [currentUserId],
          adminId: currentUserId,
          createdAt: new Date().toISOString(),
        };

        set({ clubs: [...clubs, newClub] });
        return id;
      },

      joinEvent: (eventId) => {
        const { currentUserId, events } = get();
        if (!currentUserId) return;

        set({
          events: events.map((event) => {
            if (event.id !== eventId) return event;
            if (event.participantIds.includes(currentUserId)) return event;
            if (event.participantIds.length >= event.maxPlayers) return event;

            return {
              ...event,
              participantIds: [...event.participantIds, currentUserId],
              shuffled: false,
              teamA: undefined,
              teamB: undefined,
            };
          }),
        });
      },

      leaveEvent: (eventId) => {
        const { currentUserId, events } = get();
        if (!currentUserId) return;

        set({
          events: events.map((event) => {
            if (event.id !== eventId) return event;

            return {
              ...event,
              participantIds: event.participantIds.filter((id) => id !== currentUserId),
              shuffled: false,
              teamA: undefined,
              teamB: undefined,
            };
          }),
        });
      },

      createEvent: (eventData) => {
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
        return id;
      },

      shuffleTeams: (eventId) => {
        const { events, users } = get();
        const event = events.find((item) => item.id === eventId);
        if (!event || event.participantIds.length < 2) return;

        const participants = event.participantIds
          .map((id) => users.find((user) => user.id === id))
          .filter((user): user is UserProfile => Boolean(user));

        const { teamA, teamB } = balanceTeams(participants);

        set({
          events: events.map((item) =>
            item.id === eventId
              ? {
                  ...item,
                  shuffled: true,
                  teamA: teamA.map((p) => p.id),
                  teamB: teamB.map((p) => p.id),
                }
              : item,
          ),
        });
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
