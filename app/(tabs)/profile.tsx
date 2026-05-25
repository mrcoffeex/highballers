import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Screen } from '../../components/Screen';
import { StatSlider } from '../../components/StatSlider';
import { Avatar, Badge, Button, Card } from '../../components/ui';
import { calculatePlayerRating } from '../../lib/teamBalancer';
import { colors, radius, spacing, typography } from '../../lib/theme';
import { POSITION_LABELS } from '../../lib/types';
import { useAppStore } from '../../store/useAppStore';

export default function ProfileScreen() {
  const router = useRouter();
  const user = useAppStore((state) => state.getCurrentUser());
  const myClubs = useAppStore((state) => state.getMyClubs());
  const updateStats = useAppStore((state) => state.updateStats);

  if (!user) {
    return null;
  }

  const rating = calculatePlayerRating(user.stats);
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
          <Avatar name={user.name} color={user.avatarColor} size={72} />
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
      </View>
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
});
