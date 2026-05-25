import { StyleSheet, Text, View } from 'react-native';

import { calculatePlayerRating } from '../lib/teamBalancer';
import { colors, radius, spacing, typography } from '../lib/theme';
import { POSITION_LABELS, UserProfile } from '../lib/types';
import { Avatar, Badge, Card } from './ui';

interface PlayerCardProps {
  player: UserProfile;
  compact?: boolean;
  showRating?: boolean;
}

export function PlayerCard({ player, compact, showRating = true }: PlayerCardProps) {
  const rating = calculatePlayerRating(player.stats);

  return (
    <Card style={compact ? styles.compactCard : undefined}>
      <View style={styles.row}>
        <Avatar name={player.name} color={player.avatarColor} size={compact ? 40 : 52} />
        <View style={styles.info}>
          <Text style={styles.name}>{player.nickname ?? player.name}</Text>
          {!compact && player.nickname ? (
            <Text style={styles.fullName}>{player.name}</Text>
          ) : null}
          <View style={styles.meta}>
            <Badge label={player.position} color={colors.primary} />
            {showRating ? (
              <Text style={styles.rating}>OVR {rating}</Text>
            ) : null}
          </View>
        </View>
      </View>
      {!compact ? (
        <Text style={styles.position}>{POSITION_LABELS[player.position]}</Text>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  compactCard: {
    padding: spacing.sm + 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  info: {
    flex: 1,
  },
  name: {
    ...typography.heading,
    color: colors.text,
  },
  fullName: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  rating: {
    ...typography.caption,
    color: colors.secondary,
    fontWeight: '700',
  },
  position: {
    ...typography.caption,
    color: colors.textDim,
    marginTop: spacing.sm,
  },
});
