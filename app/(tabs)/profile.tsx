import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { format } from 'date-fns';
import { StyleSheet, Text, View } from 'react-native';

import { Screen } from '../../components/Screen';
import { StatSlider } from '../../components/StatSlider';
import { Avatar, Badge, Button, Card } from '../../components/ui';
import { isSupabaseEnabled } from '../../lib/config';
import { calculatePlayerRating } from '../../lib/teamBalancer';
import { colors, radius, spacing, typography } from '../../lib/theme';
import { BOX_SCORE_LABELS, BOX_SCORE_FIELDS, POSITION_LABELS } from '../../lib/types';
import { useCurrentUser, useMyClubs, usePlayerGameHistory } from '../../store/hooks';
import { useAppStore } from '../../store/useAppStore';

export default function ProfileScreen() {
  const router = useRouter();
  const user = useCurrentUser();
  const myClubs = useMyClubs();
  const gameHistory = usePlayerGameHistory(user?.id ?? '');
  const updateStats = useAppStore((state) => state.updateStats);
  const signOut = useAppStore((state) => state.signOut);

  if (!user) {
    return null;
  }

  const rating = calculatePlayerRating(user.stats);
  const careerTotals = BOX_SCORE_FIELDS.reduce(
    (acc, field) => {
      acc[field] = gameHistory.reduce((sum, game) => sum + game.stats[field], 0);
      return acc;
    },
    { points: 0, rebounds: 0, assists: 0, blocks: 0, steals: 0 },
  );
  const statItems = [
    { label: 'Speed', value: user.stats.speed },
    { label: 'Strength', value: user.stats.strength },
    { label: 'Shooting', value: user.stats.shooting },
    { label: 'Defense', value: user.stats.defense },
    { label: 'Stamina', value: user.stats.stamina },
  ];

  return (
    <Screen>
      <Card style={styles.profileCard}>
        <View style={styles.profileHeader}>
          <Avatar name={user.name} color={user.avatarColor} size={72} imageUrl={user.avatarUrl} />
          <View style={styles.profileInfo}>
            <Text style={styles.name}>{user.name}</Text>
            {user.nickname ? <Text style={styles.nickname}>&quot;{user.nickname}&quot;</Text> : null}
            <View style={styles.badges}>
              <Badge label={user.position} color={colors.primary} />
              <Badge label={`OVR ${rating}`} color={colors.secondary} />
            </View>
          </View>
        </View>
        <Text style={styles.position}>{POSITION_LABELS[user.position]}</Text>
        <View style={styles.physicalRow}>
          <PhysicalStat label="Height" value={`${user.stats.height} cm`} />
          <PhysicalStat label="Weight" value={`${user.stats.weight} kg`} />
        </View>
        <Button
          title="Edit Profile"
          variant="outline"
          onPress={() => router.push('/profile/edit')}
          style={styles.editBtn}
        />
      </Card>

      <Text style={styles.sectionTitle}>Skill Radar</Text>
      <Card style={styles.statsCard}>
        {statItems.map((stat) => (
          <View key={stat.label} style={styles.statRow}>
            <Text style={styles.statLabel}>{stat.label}</Text>
            <View style={styles.statBarTrack}>
              <View style={[styles.statBarFill, { width: `${stat.value * 10}%` }]} />
            </View>
            <Text style={styles.statValue}>{stat.value}</Text>
          </View>
        ))}
      </Card>

      <Text style={styles.sectionTitle}>Quick Adjust</Text>
      <Card>
        <StatSlider
          label="Shooting"
          value={user.stats.shooting}
          onChange={(shooting) => updateStats({ ...user.stats, shooting })}
        />
        <StatSlider
          label="Defense"
          value={user.stats.defense}
          onChange={(defense) => updateStats({ ...user.stats, defense })}
        />
      </Card>

      <Text style={styles.sectionTitle}>Activity</Text>
      <View style={styles.activityRow}>
        <ActivityItem icon="people" label="Clubs" value={String(myClubs.length)} />
        <ActivityItem icon="basketball" label="Position" value={user.position} />
        <ActivityItem icon="stats-chart" label="Games" value={String(gameHistory.length)} />
      </View>

      <Text style={styles.sectionTitle}>Game History</Text>
      {gameHistory.length > 0 ? (
        <>
          <Card style={styles.careerCard}>
            <Text style={styles.careerTitle}>Career totals</Text>
            <View style={styles.careerRow}>
              {BOX_SCORE_FIELDS.map((field) => (
                <View key={field} style={styles.careerItem}>
                  <Text style={styles.careerLabel}>{BOX_SCORE_LABELS[field]}</Text>
                  <Text style={styles.careerValue}>{careerTotals[field]}</Text>
                </View>
              ))}
            </View>
          </Card>
          {gameHistory.map((game) => (
            <Card key={game.id} style={styles.historyCard}>
              <View style={styles.historyHeader}>
                <Text style={styles.historyTitle}>{game.event?.title ?? 'Pickup game'}</Text>
                <Text style={styles.historyDate}>
                  {format(new Date(game.event?.dateTime ?? game.recordedAt), 'MMM d, yyyy')}
                </Text>
              </View>
              <View style={styles.historyStats}>
                {BOX_SCORE_FIELDS.map((field) => (
                  <Text key={field} style={styles.historyStat}>
                    {BOX_SCORE_LABELS[field]} {game.stats[field]}
                  </Text>
                ))}
              </View>
            </Card>
          ))}
        </>
      ) : (
        <Card>
          <Text style={styles.emptyHistory}>No recorded games yet. Stats appear here after a game is tabulated.</Text>
        </Card>
      )}

      {isSupabaseEnabled ? (
        <Button
          title="Sign Out"
          variant="ghost"
          onPress={async () => {
            await signOut();
            router.replace('/auth');
          }}
          style={styles.signOut}
        />
      ) : null}
    </Screen>
  );
}

function PhysicalStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.physicalStat}>
      <Text style={styles.physicalLabel}>{label}</Text>
      <Text style={styles.physicalValue}>{value}</Text>
    </View>
  );
}

function ActivityItem({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <Card style={styles.activityCard}>
      <Ionicons name={icon} size={22} color={colors.primary} />
      <Text style={styles.activityValue}>{value}</Text>
      <Text style={styles.activityLabel}>{label}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  profileCard: {
    marginBottom: spacing.lg,
  },
  profileHeader: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  profileInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    ...typography.title,
    color: colors.text,
    fontSize: 22,
  },
  nickname: {
    ...typography.caption,
    color: colors.textMuted,
    fontStyle: 'italic',
    marginTop: 2,
  },
  badges: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  position: {
    ...typography.body,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  physicalRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  physicalStat: {
    flex: 1,
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  physicalLabel: {
    ...typography.label,
    color: colors.textDim,
    fontSize: 10,
  },
  physicalValue: {
    ...typography.heading,
    color: colors.text,
    marginTop: 4,
  },
  editBtn: {
    marginTop: spacing.xs,
  },
  sectionTitle: {
    ...typography.heading,
    color: colors.text,
    marginBottom: spacing.md,
    marginTop: spacing.sm,
  },
  statsCard: {
    marginBottom: spacing.lg,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  statLabel: {
    width: 72,
    ...typography.caption,
    color: colors.textMuted,
  },
  statBarTrack: {
    flex: 1,
    height: 8,
    backgroundColor: colors.cardBorder,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  statBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: radius.full,
  },
  statValue: {
    width: 24,
    ...typography.caption,
    color: colors.secondary,
    fontWeight: '700',
    textAlign: 'right',
  },
  activityRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  activityCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  activityValue: {
    ...typography.title,
    color: colors.text,
    fontSize: 20,
    marginTop: spacing.sm,
  },
  activityLabel: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  signOut: {
    marginBottom: spacing.lg,
  },
  careerCard: {
    marginBottom: spacing.sm,
    backgroundColor: colors.surface,
  },
  careerTitle: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  careerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  careerItem: {
    alignItems: 'center',
    gap: 2,
  },
  careerLabel: {
    ...typography.label,
    color: colors.textDim,
    fontSize: 10,
  },
  careerValue: {
    ...typography.body,
    color: colors.secondary,
    fontWeight: '700',
  },
  historyCard: {
    marginBottom: spacing.sm,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  historyTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    flex: 1,
  },
  historyDate: {
    ...typography.caption,
    color: colors.textMuted,
  },
  historyStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  historyStat: {
    ...typography.caption,
    color: colors.textMuted,
  },
  emptyHistory: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
