import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '../lib/theme';
import { Club } from '../lib/types';
import { Badge, Card } from './ui';

interface ClubCardProps {
  club: Club;
  memberCount?: number;
  isMember?: boolean;
  onPress?: () => void;
}

export function ClubCard({ club, memberCount, isMember, onPress }: ClubCardProps) {
  return (
    <Card onPress={onPress} style={styles.card}>
      <View style={styles.header}>
        <View style={[styles.icon, { backgroundColor: `${club.iconColor}22` }]}>
          <Ionicons name="basketball" size={24} color={club.iconColor} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.name}>{club.name}</Text>
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={14} color={colors.textMuted} />
            <Text style={styles.location}>{club.location}</Text>
          </View>
        </View>
        {isMember ? <Badge label="Member" color={colors.success} /> : null}
      </View>
      <Text style={styles.description} numberOfLines={2}>
        {club.description}
      </Text>
      <View style={styles.footer}>
        <Ionicons name="people-outline" size={16} color={colors.textMuted} />
        <Text style={styles.members}>{memberCount ?? club.memberIds.length} members</Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  icon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  name: {
    ...typography.heading,
    color: colors.text,
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  location: {
    ...typography.caption,
    color: colors.textMuted,
  },
  description: {
    ...typography.body,
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  members: {
    ...typography.caption,
    color: colors.textMuted,
  },
});
