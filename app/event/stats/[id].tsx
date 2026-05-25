import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GameStatsRecorder } from '../../../components/GameStatsRecorder';
import { canManageEventStats } from '../../../lib/gameEvents';
import {
  hasActiveRoster,
  UNASSIGNED_ROSTER_INDEX,
  UNASSIGNED_ROSTER_LABEL,
} from '../../../lib/eventRoster';
import { colors, radius, spacing, typography } from '../../../lib/theme';
import { BoxScoreStats } from '../../../lib/types';
import {
  useActiveRoster,
  useClub,
  useCourtGames,
  useEvent,
  useEventWaitlist,
} from '../../../store/hooks';
import { useAppStore } from '../../../store/useAppStore';

interface ScorekeeperTab {
  index: number;
  label: string;
}

export default function EventStatsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const event = useEvent(id);
  const club = useClub(event?.clubId ?? '');
  const users = useAppStore((state) => state.users);
  const currentUserId = useAppStore((state) => state.currentUserId);
  const gameStatRecords = useAppStore((state) => state.gameStatRecords);
  const saveEventStats = useAppStore((state) => state.saveEventStats);
  const [selectedTabIndex, setSelectedTabIndex] = useState(0);
  const [savingStats, setSavingStats] = useState(false);
  const [savedTabIndex, setSavedTabIndex] = useState<number | null>(null);

  const courtGames = useCourtGames(event, users);
  const waitlist = useEventWaitlist(event, users);

  const tabs = useMemo((): ScorekeeperTab[] => {
    const items: ScorekeeperTab[] = courtGames.map((game) => ({
      index: game.index,
      label: game.label,
    }));

    if (waitlist.length > 0) {
      items.push({ index: UNASSIGNED_ROSTER_INDEX, label: UNASSIGNED_ROSTER_LABEL });
    }

    return items;
  }, [courtGames, waitlist.length]);

  const selectedTab = tabs.find((tab) => tab.index === selectedTabIndex) ?? tabs[0];
  const activeTabIndex = selectedTab?.index ?? 0;
  const isUnassignedTab = activeTabIndex === UNASSIGNED_ROSTER_INDEX;
  const activeRoster = useActiveRoster(event, users, activeTabIndex);
  const selectedGame = courtGames.find((game) => game.index === activeTabIndex);

  const eventStats = useMemo(() => {
    const map: Record<string, BoxScoreStats> = {};
    for (const record of gameStatRecords) {
      if (record.eventId === id) {
        map[record.userId] = record.stats;
      }
    }
    return map;
  }, [gameStatRecords, id]);

  const canManage = event ? canManageEventStats(event, currentUserId, club?.adminId) : false;

  const handleSave = async (statsByPlayer: Record<string, BoxScoreStats>) => {
    if (!event) return;
    setSavingStats(true);
    setSavedTabIndex(null);
    try {
      await saveEventStats(event.id, statsByPlayer, activeTabIndex);
      setSavedTabIndex(activeTabIndex);
    } finally {
      setSavingStats(false);
    }
  };

  const handleSelectTab = (index: number) => {
    setSelectedTabIndex(index);
    setSavedTabIndex(null);
  };

  if (!event) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>Game not found</Text>
      </View>
    );
  }

  if (!canManage) {
    return (
      <>
        <Stack.Screen options={{ headerTitle: 'Scorekeeper' }} />
        <View style={[styles.blocked, { paddingBottom: insets.bottom }]}>
          <Ionicons name="lock-closed-outline" size={40} color={colors.textMuted} />
          <Text style={styles.blockedTitle}>Scorekeeper locked</Text>
          <Text style={styles.blockedText}>
            Stats can only be recorded before the game closes or within 12 hours after tip-off.
          </Text>
        </View>
      </>
    );
  }

  if (!hasActiveRoster(event)) {
    return (
      <>
        <Stack.Screen options={{ headerTitle: 'Scorekeeper' }} />
        <View style={[styles.blocked, { paddingBottom: insets.bottom }]}>
          <Ionicons name="people-outline" size={40} color={colors.textMuted} />
          <Text style={styles.blockedTitle}>Shuffle courts first</Text>
          <Text style={styles.blockedText}>
            Shuffle players into courts first. The scorekeeper tracks one court at a time.
          </Text>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerTitle: 'Scorekeeper' }} />
      <View style={[styles.container, { paddingBottom: insets.bottom }]}>
        {tabs.length > 1 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.gameTabsScroll}
            contentContainerStyle={styles.gameTabsBar}
          >
            {tabs.map((tab) => {
              const selected = tab.index === activeTabIndex;
              const saved = savedTabIndex === tab.index;
              const isUnassigned = tab.index === UNASSIGNED_ROSTER_INDEX;

              return (
                <Pressable
                  key={tab.label}
                  style={[
                    styles.gameTab,
                    selected && styles.gameTabActive,
                    isUnassigned && selected && styles.gameTabUnassignedActive,
                  ]}
                  onPress={() => handleSelectTab(tab.index)}
                >
                  {isUnassigned ? (
                    <Ionicons
                      name="person-outline"
                      size={13}
                      color={selected ? colors.warning : colors.textMuted}
                    />
                  ) : null}
                  <Text
                    style={[
                      styles.gameTabText,
                      selected && styles.gameTabTextActive,
                      isUnassigned && selected && styles.gameTabTextUnassigned,
                    ]}
                    numberOfLines={1}
                  >
                    {tab.label}
                  </Text>
                  {isUnassigned && waitlist.length > 0 ? (
                    <View style={styles.gameTabCount}>
                      <Text style={styles.gameTabCountText}>{waitlist.length}</Text>
                    </View>
                  ) : null}
                  {saved ? (
                    <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                  ) : null}
                </Pressable>
              );
            })}
          </ScrollView>
        ) : null}

        <View style={styles.recorderWrap}>
          <GameStatsRecorder
            key={`${id}-${activeTabIndex}`}
            participants={activeRoster}
            teamA={isUnassignedTab ? undefined : selectedGame?.teamA}
            teamB={isUnassignedTab ? undefined : selectedGame?.teamB}
            courtLabel={selectedTab?.label}
            initialStats={eventStats}
            saving={savingStats}
            saved={savedTabIndex === activeTabIndex}
            onSave={handleSave}
          />
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  recorderWrap: {
    flex: 1,
    minHeight: 0,
  },
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  notFoundText: {
    color: colors.textMuted,
  },
  blocked: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    padding: spacing.xl,
    gap: spacing.sm,
  },
  blockedTitle: {
    ...typography.heading,
    color: colors.text,
  },
  blockedText: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    fontSize: 14,
  },
  gameTabsScroll: {
    flexGrow: 0,
    maxHeight: 44,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  gameTabsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  gameTab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    height: 36,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  gameTabActive: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}18`,
  },
  gameTabUnassignedActive: {
    borderColor: colors.warning,
    backgroundColor: `${colors.warning}18`,
  },
  gameTabText: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '600',
    fontSize: 13,
  },
  gameTabTextActive: {
    color: colors.primary,
  },
  gameTabTextUnassigned: {
    color: colors.warning,
  },
  gameTabCount: {
    minWidth: 18,
    height: 18,
    borderRadius: radius.full,
    backgroundColor: `${colors.warning}33`,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  gameTabCountText: {
    ...typography.label,
    color: colors.warning,
    fontSize: 10,
    fontWeight: '700',
  },
});
