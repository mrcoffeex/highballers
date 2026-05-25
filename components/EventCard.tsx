import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '../lib/theme';
import { GameEvent } from '../lib/types';
import { Badge, Card } from './ui';

interface EventCardProps {
  event: GameEvent;
  clubName?: string;
  isJoined?: boolean;
  onPress?: () => void;
}

export function EventCard({ event, clubName, isJoined, onPress }: EventCardProps) {
  const date = new Date(event.dateTime);
  const spotsLeft = event.maxPlayers - event.participantIds.length;
  const isFull = spotsLeft <= 0;

  return (
    <Card onPress={onPress} style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.dateBox}>
          <Text style={styles.dateMonth}>{format(date, 'MMM')}</Text>
          <Text style={styles.dateDay}>{format(date, 'd')}</Text>
        </View>
        <View style={styles.content}>
          <Text style={styles.title}>{event.title}</Text>
          {clubName ? <Text style={styles.club}>{clubName}</Text> : null}
          <View style={styles.metaRow}>
            <Ionicons name="time-outline" size={14} color={colors.textMuted} />
            <Text style={styles.meta}>{format(date, 'h:mm a')}</Text>
            <Ionicons name="location-outline" size={14} color={colors.textMuted} />
            <Text style={styles.meta} numberOfLines={1}>
              {event.location}
            </Text>
          </View>
        </View>
      </View>
      <View style={styles.footer}>
        <View style={styles.spots}>
          <Ionicons name="people" size={16} color={isFull ? colors.warning : colors.success} />
          <Text style={[styles.spotsText, isFull && styles.spotsFull]}>
            {event.participantIds.length}/{event.maxPlayers} players
          </Text>
        </View>
        {event.shuffled ? (
          <Badge label="Teams set" color={colors.accent} />
        ) : isJoined ? (
          <Badge label="Joined" color={colors.success} />
        ) : isFull ? (
          <Badge label="Full" color={colors.warning} />
        ) : (
          <Badge label={`${spotsLeft} spots`} color={colors.primary} />
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  dateBox: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateMonth: {
    ...typography.label,
    color: colors.text,
    fontSize: 10,
  },
  dateDay: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    lineHeight: 24,
  },
  content: {
    flex: 1,
  },
  title: {
    ...typography.heading,
    color: colors.text,
    marginBottom: 2,
  },
  club: {
    ...typography.caption,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexWrap: 'wrap',
  },
  meta: {
    ...typography.caption,
    color: colors.textMuted,
    marginRight: spacing.sm,
    flexShrink: 1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
  },
  spots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  spotsText: {
    ...typography.caption,
    color: colors.success,
  },
  spotsFull: {
    color: colors.warning,
  },
});
