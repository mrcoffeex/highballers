import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { EventMemberPicker } from "../../components/EventMemberPicker";
import { DateTimePickerField } from "../../components/DateTimePickerField";
import { LocationPicker } from "../../components/LocationPicker";
import { Button, Input } from "../../components/ui";
import { useUpgradePrompt } from "../../lib/useUpgradePrompt";
import { searchPlaces } from "../../lib/geocoding";
import { EventLocation } from "../../lib/location";
import { colors, radius, spacing, typography } from "../../lib/theme";
import { EventVisibility } from "../../lib/types";
import { getDefaultGameDateTime, useAppStore } from "../../store/useAppStore";
import { useMyClubs } from "../../store/hooks";

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
  const users = useAppStore((state) => state.users);
  const currentUserId = useAppStore((state) => state.currentUserId);
  const createEvent = useAppStore((state) => state.createEvent);
  const { handleSubscriptionError } = useUpgradePrompt();

  const [clubId, setClubId] = useState(paramClubId ?? myClubs[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventLocation, setEventLocation] = useState<EventLocation | null>(
    null,
  );
  const [maxPlayers, setMaxPlayers] = useState<number>(10);
  const [customMaxPlayers, setCustomMaxPlayers] = useState("20");
  const [useCustomMax, setUseCustomMax] = useState(false);
  const [dateTime, setDateTime] = useState(getDefaultGameDateTime());
  const [visibility, setVisibility] = useState<EventVisibility>("open");
  const [invitedMemberIds, setInvitedMemberIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const selectedClub = useMemo(
    () => myClubs.find((club) => club.id === clubId),
    [myClubs, clubId],
  );

  const resolvedMaxPlayers = useMemo(() => {
    if (!useCustomMax) return maxPlayers;
    return parseCustomMaxPlayers(customMaxPlayers);
  }, [customMaxPlayers, maxPlayers, useCustomMax]);

  const clubMembers = useMemo(() => {
    if (!selectedClub || !currentUserId) return [];
    return selectedClub.memberIds
      .filter((memberId) => memberId !== currentUserId)
      .map((memberId) => users.find((user) => user.id === memberId))
      .filter((member): member is NonNullable<typeof member> => Boolean(member));
  }, [currentUserId, selectedClub, users]);

  const isFutureDate = dateTime.getTime() > Date.now();
  const hasPrivateInvites =
    visibility !== "private" || invitedMemberIds.length > 0;
  const canCreate =
    title.trim().length >= 3 &&
    Boolean(eventLocation?.label.trim()) &&
    eventLocation?.latitude != null &&
    eventLocation?.longitude != null &&
    clubId &&
    isFutureDate &&
    resolvedMaxPlayers != null &&
    hasPrivateInvites;

  const toggleInvite = (memberId: string) => {
    setInvitedMemberIds((current) =>
      current.includes(memberId)
        ? current.filter((id) => id !== memberId)
        : [...current, memberId],
    );
  };

  useEffect(() => {
    setInvitedMemberIds([]);
  }, [clubId, visibility]);

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

  const handleCreate = () => {
    if (!eventLocation || resolvedMaxPlayers == null || loading) return;

    setLoading(true);
    setCreateError(null);

    void (async () => {
      try {
        const id = await createEvent({
          clubId,
          visibility,
          invitedMemberIds:
            visibility === "private" ? invitedMemberIds : undefined,
          title: title.trim(),
          description:
            description.trim() ||
            (visibility === "private"
              ? "Private run for invited members."
              : "Pickup basketball run. All members welcome!"),
          location: eventLocation.label.trim(),
          latitude: eventLocation.latitude,
          longitude: eventLocation.longitude,
          dateTime: dateTime.toISOString(),
          maxPlayers: resolvedMaxPlayers,
        });

        if (!id) {
          setCreateError("Could not create the game. Sign in and try again.");
          return;
        }

        router.replace(`/event/${id}`);
      } catch (error) {
        if (handleSubscriptionError(error)) return;
        setCreateError("Could not create the game. Try again.");
      } finally {
        setLoading(false);
      }
    })();
  };

  if (myClubs.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>Join a club first</Text>
        <Text style={styles.emptyDesc}>
          You need to be in a club to create games.
        </Text>
        <Button
          title="Browse Clubs"
          onPress={() => router.navigate("/clubs")}
        />
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
            style={[
              styles.clubOption,
              clubId === club.id && styles.clubOptionActive,
            ]}
          >
            <Text
              style={[
                styles.clubOptionText,
                clubId === club.id && styles.clubOptionTextActive,
              ]}
            >
              {club.name}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Game Type</Text>
      <View style={styles.typeRow}>
        <Pressable
          onPress={() => setVisibility("open")}
          style={[
            styles.typeCard,
            visibility === "open" && styles.typeCardActive,
          ]}
        >
          <Ionicons
            name="globe-outline"
            size={22}
            color={visibility === "open" ? colors.primary : colors.textMuted}
          />
          <Text
            style={[
              styles.typeTitle,
              visibility === "open" && styles.typeTitleActive,
            ]}
          >
            Open Game
          </Text>
          <Text style={styles.typeDesc}>Any club member can join</Text>
        </Pressable>
        <Pressable
          onPress={() => setVisibility("private")}
          style={[
            styles.typeCard,
            visibility === "private" && styles.typeCardActive,
          ]}
        >
          <Ionicons
            name="lock-closed-outline"
            size={22}
            color={
              visibility === "private" ? colors.primary : colors.textMuted
            }
          />
          <Text
            style={[
              styles.typeTitle,
              visibility === "private" && styles.typeTitleActive,
            ]}
          >
            Private Game
          </Text>
          <Text style={styles.typeDesc}>Pick who can join</Text>
        </Pressable>
      </View>

      {visibility === "private" ? (
        <>
          <Text style={styles.label}>Invite Members</Text>
          <Text style={styles.inviteHint}>
            Select at least one club member. You are added automatically.
          </Text>
          <EventMemberPicker
            members={clubMembers}
            selectedIds={invitedMemberIds}
            onToggle={toggleInvite}
          />
        </>
      ) : null}

      <Text style={styles.label}>Game Title</Text>
      <Input
        placeholder="e.g. Tuesday Night Run"
        value={title}
        onChangeText={setTitle}
        style={styles.field}
      />

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
        placeholder={
          selectedClub
            ? `Search near ${selectedClub.location}`
            : "Search courts, gyms, parks..."
        }
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
            style={[
              styles.playerOption,
              !useCustomMax &&
                maxPlayers === count &&
                styles.playerOptionActive,
            ]}
          >
            <Text
              style={[
                styles.playerOptionValue,
                !useCustomMax &&
                  maxPlayers === count &&
                  styles.playerOptionValueActive,
              ]}
            >
              {count}
            </Text>
          </Pressable>
        ))}
        <Pressable
          onPress={() => setUseCustomMax(true)}
          style={[
            styles.playerOption,
            useCustomMax && styles.playerOptionActive,
          ]}
        >
          <Text
            style={[
              styles.playerOptionValue,
              useCustomMax && styles.playerOptionValueActive,
            ]}
          >
            Custom
          </Text>
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

      {createError ? <Text style={styles.errorHint}>{createError}</Text> : null}

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
    alignItems: "center",
    justifyContent: "center",
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
    textAlign: "center",
  },
  label: {
    ...typography.label,
    color: colors.textMuted,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  clubPicker: {
    flexDirection: "row",
    flexWrap: "wrap",
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
    fontWeight: "600",
  },
  clubOptionTextActive: {
    color: colors.primary,
  },
  typeRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  typeCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.cardBorder,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.xs,
  },
  typeCardActive: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}12`,
  },
  typeTitle: {
    ...typography.heading,
    color: colors.textMuted,
    fontSize: 15,
  },
  typeTitleActive: {
    color: colors.primary,
  },
  typeDesc: {
    ...typography.caption,
    color: colors.textMuted,
  },
  inviteHint: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  field: {
    marginBottom: spacing.sm,
  },
  textArea: {
    minHeight: 88,
    textAlignVertical: "top",
  },
  playerPicker: {
    flexDirection: "row",
    flexWrap: "wrap",
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
    alignItems: "center",
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
  errorHint: {
    ...typography.caption,
    color: colors.error,
    marginBottom: spacing.sm,
  },
  submit: {
    marginTop: spacing.lg,
  },
});
