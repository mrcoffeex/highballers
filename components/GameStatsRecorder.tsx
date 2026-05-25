import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Avatar, Button } from './ui';
import { UNASSIGNED_ROSTER_LABEL } from '../lib/eventRoster';
import { colors, radius, spacing, typography } from '../lib/theme';
import {
  BOX_SCORE_FIELDS,
  BOX_SCORE_LABELS,
  BoxScoreStats,
  EMPTY_BOX_SCORE,
  UserProfile,
} from '../lib/types';

interface GameStatsRecorderProps {
  participants: UserProfile[];
  teamA?: UserProfile[];
  teamB?: UserProfile[];
  courtLabel?: string;
  initialStats: Record<string, BoxScoreStats>;
  saving?: boolean;
  saved?: boolean;
  onSave: (statsByPlayer: Record<string, BoxScoreStats>) => void;
}

const STAT_META: Record<
  keyof BoxScoreStats,
  { icon: keyof typeof Ionicons.glyphMap; color: string }
> = {
  points: { icon: 'basketball', color: colors.primary },
  rebounds: { icon: 'arrow-up-circle', color: colors.accent },
  assists: { icon: 'git-network-outline', color: colors.success },
  blocks: { icon: 'shield-checkmark', color: colors.secondary },
  steals: { icon: 'flash', color: colors.warning },
};

function clampStat(value: number): number {
  if (!Number.isFinite(value) || value < 0) return 0;
  return Math.min(99, Math.round(value));
}

function StatPad({
  field,
  value,
  onIncrement,
  onDecrement,
}: {
  field: keyof BoxScoreStats;
  value: number;
  onIncrement: () => void;
  onDecrement: () => void;
}) {
  const meta = STAT_META[field];

  return (
    <View style={[styles.statPad, { borderColor: `${meta.color}44` }]}>
      <View style={styles.statPadHeader}>
        <View style={[styles.statIconWrap, { backgroundColor: `${meta.color}22` }]}>
          <Ionicons name={meta.icon} size={18} color={meta.color} />
        </View>
        <Text style={[styles.statLabel, { color: meta.color }]}>{BOX_SCORE_LABELS[field]}</Text>
      </View>

      <Text style={styles.statValue}>{value}</Text>

      <View style={styles.statControls}>
        <Pressable
          style={styles.statBtn}
          onPress={onDecrement}
          hitSlop={6}
          accessibilityLabel={`Decrease ${BOX_SCORE_LABELS[field]}`}
        >
          <Ionicons name="remove" size={20} color={colors.textMuted} />
        </Pressable>
        <Pressable
          style={[styles.statBtn, styles.statBtnPrimary, { backgroundColor: `${meta.color}33` }]}
          onPress={onIncrement}
          hitSlop={6}
          accessibilityLabel={`Increase ${BOX_SCORE_LABELS[field]}`}
        >
          <Ionicons name="add" size={22} color={meta.color} />
        </Pressable>
      </View>
    </View>
  );
}

export function GameStatsRecorder({
  participants,
  teamA,
  teamB,
  courtLabel,
  initialStats,
  saving,
  saved,
  onSave,
}: GameStatsRecorderProps) {
  const roster = useMemo(() => {
    if (teamA?.length && teamB?.length) {
      return [...teamA, ...teamB];
    }
    return participants;
  }, [participants, teamA, teamB]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [draft, setDraft] = useState<Record<string, BoxScoreStats>>({});

  useEffect(() => {
    const next: Record<string, BoxScoreStats> = {};
    for (const player of roster) {
      next[player.id] = initialStats[player.id] ?? { ...EMPTY_BOX_SCORE };
    }
    setDraft(next);
    setActiveIndex(0);
  }, [roster, initialStats]);

  const activePlayer = roster[activeIndex];
  const activeStats = activePlayer ? draft[activePlayer.id] ?? EMPTY_BOX_SCORE : EMPTY_BOX_SCORE;
  const activeTeamLabel = teamA?.some((player) => player.id === activePlayer?.id)
    ? 'Team A'
    : teamB?.some((player) => player.id === activePlayer?.id)
      ? 'Team B'
      : null;

  const isUnassignedRoster = courtLabel === UNASSIGNED_ROSTER_LABEL;
  const rosterAccent = isUnassignedRoster ? colors.warning : colors.primary;

  const totals = useMemo(() => {
    return BOX_SCORE_FIELDS.reduce(
      (acc, field) => {
        acc[field] = roster.reduce((sum, player) => sum + (draft[player.id]?.[field] ?? 0), 0);
        return acc;
      },
      { ...EMPTY_BOX_SCORE },
    );
  }, [draft, roster]);

  const updateStat = (playerId: string, field: keyof BoxScoreStats, delta: number) => {
    setDraft((current) => {
      const currentStats = current[playerId] ?? { ...EMPTY_BOX_SCORE };
      return {
        ...current,
        [playerId]: {
          ...currentStats,
          [field]: clampStat(currentStats[field] + delta),
        },
      };
    });
  };

  const goToPlayer = (index: number) => {
    if (roster.length === 0) return;
    setActiveIndex((index + roster.length) % roster.length);
  };

  const renderPlayerChip = (
    item: UserProfile,
    index: number,
    teamColor: string,
  ) => {
    const selected = index === activeIndex;
    const stats = draft[item.id] ?? EMPTY_BOX_SCORE;

    return (
      <Pressable
        key={item.id}
        style={[
          styles.avatarChip,
          { borderColor: selected ? teamColor : `${teamColor}44` },
          selected && { backgroundColor: `${teamColor}22` },
        ]}
        onPress={() => setActiveIndex(index)}
        accessibilityLabel={`${item.name}, ${stats.points} points`}
      >
        <Avatar
          name={item.name}
          color={item.avatarColor}
          size={34}
          imageUrl={item.avatarUrl}
        />
        {stats.points > 0 ? (
          <View style={[styles.ptsBadge, { backgroundColor: teamColor }]}>
            <Text style={styles.ptsBadgeText}>{stats.points}</Text>
          </View>
        ) : null}
      </Pressable>
    );
  };

  const renderTeamRow = (
    label: string,
    shortLabel: string,
    players: UserProfile[],
    teamColor: string,
    startIndex: number,
  ) => (
    <View style={styles.teamRow}>
      <View style={[styles.teamBadge, { backgroundColor: `${teamColor}18`, borderColor: `${teamColor}55` }]}>
        <Text style={[styles.teamBadgeShort, { color: teamColor }]}>{shortLabel}</Text>
        <Text style={[styles.teamBadgeLabel, { color: teamColor }]} numberOfLines={1}>
          {label}
        </Text>
      </View>
      <ScrollView
        horizontal
        style={styles.teamScroll}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.avatarStrip}
      >
        {players.map((player, index) => renderPlayerChip(player, startIndex + index, teamColor))}
      </ScrollView>
    </View>
  );

  if (roster.length === 0) {
    return (
      <View style={styles.emptyWrap}>
        <Text style={styles.emptyText}>No players on this court. Re-shuffle teams and try again.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.playerPicker}>
        {teamA?.length && teamB?.length ? (
          <>
            {renderTeamRow('Team A', 'A', teamA, colors.teamA, 0)}
            <View style={styles.teamDivider} />
            {renderTeamRow('Team B', 'B', teamB, colors.teamB, teamA.length)}
          </>
        ) : (
          <View style={styles.singleTeamRow}>
            {isUnassignedRoster ? (
              <View style={[styles.unassignedBadge, { borderColor: `${colors.warning}55` }]}>
                <Ionicons name="person-outline" size={14} color={colors.warning} />
                <Text style={styles.unassignedBadgeText}>Not on court</Text>
              </View>
            ) : null}
            <ScrollView
              horizontal
              style={[styles.teamScroll, styles.teamScrollFlex]}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.avatarStrip}
            >
              {roster.map((player, index) => renderPlayerChip(player, index, rosterAccent))}
            </ScrollView>
          </View>
        )}
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator
        nestedScrollEnabled
      >
        <View style={styles.activePlayerBar}>
          <Pressable style={styles.navBtn} onPress={() => goToPlayer(activeIndex - 1)}>
            <Ionicons name="chevron-back" size={20} color={colors.text} />
          </Pressable>

          <View style={styles.activePlayerCenter}>
            {isUnassignedRoster ? (
              <View
                style={[
                  styles.activeTeamPill,
                  {
                    backgroundColor: `${colors.warning}22`,
                    borderColor: `${colors.warning}66`,
                  },
                ]}
              >
                <Text style={[styles.activeTeamPillText, { color: colors.warning }]}>
                  Unassigned
                </Text>
              </View>
            ) : activeTeamLabel ? (
              <View
                style={[
                  styles.activeTeamPill,
                  {
                    backgroundColor: `${activeTeamLabel === 'Team A' ? colors.teamA : colors.teamB}22`,
                    borderColor: `${activeTeamLabel === 'Team A' ? colors.teamA : colors.teamB}66`,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.activeTeamPillText,
                    { color: activeTeamLabel === 'Team A' ? colors.teamA : colors.teamB },
                  ]}
                >
                  {activeTeamLabel}
                </Text>
              </View>
            ) : null}
            {courtLabel ? <Text style={styles.activeMeta}>{courtLabel}</Text> : null}
            <Text style={styles.activeName} numberOfLines={1}>
              {activePlayer?.name}
            </Text>
            <Text style={styles.activeSub}>
              {activeIndex + 1} of {roster.length}
              {activePlayer?.position ? ` · ${activePlayer.position}` : ''}
            </Text>
          </View>

          <Pressable style={styles.navBtn} onPress={() => goToPlayer(activeIndex + 1)}>
            <Ionicons name="chevron-forward" size={20} color={colors.text} />
          </Pressable>
        </View>

        <View style={styles.quickLine}>
          {BOX_SCORE_FIELDS.map((field) => (
            <View key={field} style={styles.quickItem}>
              <Text style={[styles.quickKey, { color: STAT_META[field].color }]}>
                {BOX_SCORE_LABELS[field]}
              </Text>
              <Text style={styles.quickVal}>{activeStats[field]}</Text>
            </View>
          ))}
        </View>

        <View style={styles.padGrid}>
          {BOX_SCORE_FIELDS.map((field) => (
            <StatPad
              key={field}
              field={field}
              value={activeStats[field]}
              onIncrement={() => activePlayer && updateStat(activePlayer.id, field, 1)}
              onDecrement={() => activePlayer && updateStat(activePlayer.id, field, -1)}
            />
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.totalsRow}>
          {BOX_SCORE_FIELDS.map((field) => (
            <View key={field} style={styles.totalItem}>
              <Text style={styles.totalKey}>{BOX_SCORE_LABELS[field]}</Text>
              <Text style={styles.totalVal}>{totals[field]}</Text>
            </View>
          ))}
        </View>

        <Button
          title={saved ? 'Saved!' : courtLabel ? `Save ${courtLabel}` : 'Save Box Score'}
          loading={saving}
          onPress={() => onSave(draft)}
          icon={<Ionicons name="checkmark-done" size={18} color={colors.text} />}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 0,
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  emptyText: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
  },
  playerPicker: {
    flexGrow: 0,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
    backgroundColor: colors.surface,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    gap: spacing.sm,
  },
  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    gap: spacing.sm,
  },
  teamDivider: {
    height: 1,
    backgroundColor: colors.cardBorder,
    marginHorizontal: spacing.xs,
  },
  singleTeamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    gap: spacing.sm,
  },
  unassignedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.sm,
    borderWidth: 1,
    backgroundColor: `${colors.warning}12`,
  },
  unassignedBadgeText: {
    ...typography.label,
    color: colors.warning,
    fontSize: 9,
  },
  teamBadge: {
    width: 52,
    height: 44,
    borderRadius: radius.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  teamBadgeShort: {
    ...typography.label,
    fontWeight: '800',
    fontSize: 13,
    lineHeight: 14,
  },
  teamBadgeLabel: {
    ...typography.label,
    fontSize: 8,
    lineHeight: 10,
    marginTop: 1,
  },
  teamScroll: {
    flex: 1,
    height: 44,
  },
  teamScrollFlex: {
    flex: 1,
  },
  avatarStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingRight: spacing.sm,
  },
  avatarChip: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  ptsBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: colors.background,
  },
  ptsBadgeText: {
    color: colors.text,
    fontSize: 9,
    fontWeight: '800',
    lineHeight: 11,
  },
  scrollArea: {
    flex: 1,
    minHeight: 0,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  activePlayerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.sm,
  },
  navBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activePlayerCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
  },
  activeMeta: {
    ...typography.label,
    color: colors.textMuted,
    fontSize: 10,
    marginTop: 2,
  },
  activeTeamPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
    borderWidth: 1,
    marginBottom: 2,
  },
  activeTeamPillText: {
    ...typography.label,
    fontSize: 10,
    fontWeight: '700',
  },
  activeName: {
    ...typography.body,
    color: colors.text,
    fontWeight: '700',
    fontSize: 16,
  },
  activeSub: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 1,
  },
  quickLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  quickItem: {
    alignItems: 'center',
    minWidth: 44,
  },
  quickKey: {
    ...typography.label,
    fontSize: 9,
  },
  quickVal: {
    ...typography.body,
    color: colors.text,
    fontWeight: '800',
    fontSize: 16,
    lineHeight: 20,
  },
  padGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  statPad: {
    width: '47%',
    borderRadius: radius.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    padding: spacing.sm,
    gap: spacing.xs,
  },
  statPadHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statIconWrap: {
    width: 28,
    height: 28,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statLabel: {
    ...typography.label,
    fontSize: 11,
  },
  statValue: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.text,
    lineHeight: 40,
    textAlign: 'center',
  },
  statControls: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  statBtn: {
    flex: 1,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  statBtnPrimary: {
    borderColor: 'transparent',
  },
  footer: {
    flexGrow: 0,
    padding: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
    backgroundColor: colors.background,
    gap: spacing.sm,
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
  },
  totalItem: {
    alignItems: 'center',
    gap: 2,
  },
  totalKey: {
    ...typography.label,
    color: colors.textDim,
    fontSize: 9,
  },
  totalVal: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '700',
  },
});
