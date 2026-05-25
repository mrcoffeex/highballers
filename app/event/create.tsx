import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { DateTimePickerField } from '../../components/DateTimePickerField';
import { LocationPicker } from '../../components/LocationPicker';
import { PlayersPerGamePicker } from '../../components/PlayersPerGamePicker';
import { Button, Input } from '../../components/ui';
import { clampPlayersPerGame, DEFAULT_PLAYERS_PER_GAME } from '../../lib/gameFormats';
import { searchPlaces } from '../../lib/geocoding';
import { EventLocation } from '../../lib/location';
import { colors, radius, spacing, typography } from '../../lib/theme';
import { getDefaultGameDateTime, useAppStore } from '../../store/useAppStore';
import { useMyClubs } from '../../store/hooks';

const PLAYER_PRESETS = [10, 20, 30, 40] as const;
const MIN_PLAYERS = 10;
const MAX_PLAYERS = 40;

function clampMaxPlayers(value: number) {
  return Math.min(Math.max(value, MIN_PLAYERS), MAX_PLAYERS);
}

function parseCustomMaxPlayers(value: string) {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) return null;
  return clampMaxPlayers(parsed);
}

export default function CreateEventScreen() {
  const router = useRouter();
  const { clubId: paramClubId } = useLocalSearchParams<{ clubId?: string }>();
  const myClubs = useMyClubs();
  const createEvent = useAppStore((state) => state.createEvent);

  const [clubId, setClubId] = useState(paramClubId ?? myClubs[0]?.id ?? '');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventLocation, setEventLocation] = useState<EventLocation | null>(null);
  const [maxPlayers, setMaxPlayers] = useState<number>(10);
  const [playersPerGame, setPlayersPerGame] = useState(DEFAULT_PLAYERS_PER_GAME);
  const [customMaxPlayers, setCustomMaxPlayers] = useState('20');
  const [useCustomMax, setUseCustomMax] = useState(false);
  const [dateTime, setDateTime] = useState(getDefaultGameDateTime());
  const [loading, setLoading] = useState(false);

  const selectedClub = useMemo(
    () => myClubs.find((club) => club.id === clubId),
    [myClubs, clubId],
  );

  const resolvedMaxPlayers = useMemo(() => {
    if (!useCustomMax) return maxPlayers;
    return parseCustomMaxPlayers(customMaxPlayers);
  }, [customMaxPlayers, maxPlayers, useCustomMax]);

  const resolvedPlayersPerGame = useMemo(() => {
    if (resolvedMaxPlayers == null) return DEFAULT_PLAYERS_PER_GAME;
    return clampPlayersPerGame(playersPerGame, resolvedMaxPlayers);
  }, [playersPerGame, resolvedMaxPlayers]);

  const isFutureDate = dateTime.getTime() > Date.now();
  const canCreate =
    title.trim().length >= 3
    && Boolean(eventLocation?.label.trim())
    && eventLocation?.latitude != null
    && eventLocation?.longitude != null
    && clubId
    && isFutureDate
    && resolvedMaxPlayers != null;

  useEffect(() => {
    if (!selectedClub) return;

    searchPlaces(selectedClub.location, 1)
      .then((results) => {
        if (results[0]) {
          setEventLocation(results[0]);
        }
      })
      .catch(() => undefined);
  }, [selectedClub?.id, selectedClub?.location]);

  const handleCreate = async () => {
    if (!eventLocation || resolvedMaxPlayers == null) return;

    setLoading(true);
    const id = await createEvent({
      clubId,
      title: title.trim(),
      description: description.trim() || 'Pickup basketball run. All members welcome!',
      location: eventLocation.label.trim(),
      latitude: eventLocation.latitude,
      longitude: eventLocation.longitude,
      dateTime: dateTime.toISOString(),
      maxPlayers: resolvedMaxPlayers,
      playersPerGame: resolvedPlayersPerGame,
    });
    setLoading(false);

    if (id) {
      router.replace(`/event/${id}`);
    }
  };

  if (myClubs.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>Join a club first</Text>
        <Text style={styles.emptyDesc}>You need to be in a club to create games.</Text>
        <Button title="Browse Clubs" onPress={() => router.navigate('/clubs')} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.label}>Club</Text>
      <View style={styles.clubPicker}>
        {myClubs.map((club) => (
          <Pressable
            key={club.id}
            onPress={() => {
              setClubId(club.id);
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

      <Text style={styles.label}>When</Text>
      <DateTimePickerField
        value={dateTime}
        onChange={setDateTime}
        minimumDate={new Date()}
      />

      <Text style={styles.label}>Location</Text>
      <LocationPicker
        value={eventLocation}
        onChange={setEventLocation}
        placeholder={selectedClub ? `Search near ${selectedClub.location}` : 'Search courts, gyms, parks...'}
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
      <View style={styles.playerPicker}>
        {PLAYER_PRESETS.map((count) => (
          <Pressable
            key={count}
            onPress={() => {
              setUseCustomMax(false);
              setMaxPlayers(count);
            }}
            style={[styles.playerOption, !useCustomMax && maxPlayers === count && styles.playerOptionActive]}
          >
            <Text style={[styles.playerOptionValue, !useCustomMax && maxPlayers === count && styles.playerOptionValueActive]}>
              {count}
            </Text>
          </Pressable>
        ))}
        <Pressable
          onPress={() => setUseCustomMax(true)}
          style={[styles.playerOption, useCustomMax && styles.playerOptionActive]}
        >
          <Text style={[styles.playerOptionValue, useCustomMax && styles.playerOptionValueActive]}>Custom</Text>
        </Pressable>
      </View>

      {useCustomMax ? (
        <View style={styles.customWrap}>
          <Input
            placeholder={`${MIN_PLAYERS}-${MAX_PLAYERS}`}
            value={customMaxPlayers}
            onChangeText={setCustomMaxPlayers}
            keyboardType="number-pad"
            style={styles.field}
          />
          <Text style={styles.customHint}>
            {resolvedMaxPlayers == null
              ? `Enter a number between ${MIN_PLAYERS} and ${MAX_PLAYERS}.`
              : `${resolvedMaxPlayers} players`}
          </Text>
        </View>
        ) : null}

      <Text style={styles.label}>Players Per Court</Text>
      <PlayersPerGamePicker
        value={resolvedPlayersPerGame}
        maxPlayers={resolvedMaxPlayers ?? MAX_PLAYERS}
        onChange={setPlayersPerGame}
        disabled={resolvedMaxPlayers == null}
      />

      <Button
        title="Create Game"
        onPress={handleCreate}
        disabled={!canCreate}
        loading={loading}
        size="lg"
        style={styles.submit}
      />
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
  playerPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  playerOption: {
    minWidth: 72,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    alignItems: 'center',
    gap: 2,
  },
  playerOptionActive: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}15`,
  },
  playerOptionValue: {
    ...typography.heading,
    color: colors.textMuted,
    fontSize: 18,
  },
  playerOptionValueActive: {
    color: colors.primary,
  },
  customWrap: {
    marginBottom: spacing.sm,
  },
  customHint: {
    ...typography.caption,
    color: colors.textDim,
    marginBottom: spacing.sm,
  },
  submit: {
    marginTop: spacing.lg,
  },
});
