import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button, Input } from '../../components/ui';
import { colors, radius, spacing, typography } from '../../lib/theme';
import { useAppStore } from '../../store/useAppStore';

export default function CreateEventScreen() {
  const router = useRouter();
  const { clubId: paramClubId } = useLocalSearchParams<{ clubId?: string }>();
  const myClubs = useAppStore((state) => state.getMyClubs());
  const createEvent = useAppStore((state) => state.createEvent);

  const [clubId, setClubId] = useState(paramClubId ?? myClubs[0]?.id ?? '');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [maxPlayers, setMaxPlayers] = useState('10');

  const selectedClub = useMemo(
    () => myClubs.find((club) => club.id === clubId),
    [myClubs, clubId],
  );

  const canCreate = title.trim().length >= 3 && location.trim().length >= 3 && clubId;

  const handleCreate = () => {
    const daysAhead = 3;
    const dateTime = new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000);
    dateTime.setHours(19, 0, 0, 0);

    const id = createEvent({
      clubId,
      title: title.trim(),
      description: description.trim() || 'Pickup basketball run. All members welcome!',
      location: location.trim(),
      dateTime: dateTime.toISOString(),
      maxPlayers: Math.min(Math.max(parseInt(maxPlayers, 10) || 10, 4), 20),
    });

    if (id) {
      router.replace(`/event/${id}`);
    }
  };

  if (myClubs.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>Join a club first</Text>
        <Text style={styles.emptyDesc}>You need to be in a club to create games.</Text>
        <Button title="Browse Clubs" onPress={() => router.push('/(tabs)/clubs')} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.label}>Club</Text>
      <View style={styles.clubPicker}>
        {myClubs.map((club) => (
          <Pressable
            key={club.id}
            onPress={() => {
              setClubId(club.id);
              if (!location) setLocation(club.location);
            }}
            style={[styles.clubOption, clubId === club.id && styles.clubOptionActive]}
          >
            <Text style={[styles.clubOptionText, clubId === club.id && styles.clubOptionTextActive]}>
              {club.name}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Game Title</Text>
      <Input placeholder="e.g. Tuesday Night Run" value={title} onChangeText={setTitle} style={styles.field} />

      <Text style={styles.label}>Location</Text>
      <Input
        placeholder={selectedClub?.location ?? 'Court location'}
        value={location}
        onChangeText={setLocation}
        style={styles.field}
      />

      <Text style={styles.label}>Description</Text>
      <Input
        placeholder="Full court 5v5, bring water..."
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={3}
        style={[styles.field, styles.textArea]}
      />

      <Text style={styles.label}>Max Players</Text>
      <Input
        placeholder="10"
        value={maxPlayers}
        onChangeText={setMaxPlayers}
        keyboardType="number-pad"
        style={styles.field}
      />

      <Text style={styles.note}>Game scheduled for 3 days from now at 7:00 PM</Text>

      <Button title="Create Game" onPress={handleCreate} disabled={!canCreate} size="lg" style={styles.submit} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
  },
  empty: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  emptyTitle: {
    ...typography.heading,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  emptyDesc: {
    ...typography.body,
    color: colors.textMuted,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  label: {
    ...typography.label,
    color: colors.textMuted,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  clubPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  clubOption: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  clubOptionActive: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}15`,
  },
  clubOptionText: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '600',
  },
  clubOptionTextActive: {
    color: colors.primary,
  },
  field: {
    marginBottom: spacing.sm,
  },
  textArea: {
    minHeight: 88,
    textAlignVertical: 'top',
  },
  note: {
    ...typography.caption,
    color: colors.textDim,
    marginTop: spacing.md,
  },
  submit: {
    marginTop: spacing.lg,
  },
});
