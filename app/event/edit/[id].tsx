import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import {
  EventMaxPlayersPicker,
  isEventMaxPlayerPreset,
  useResolvedEventMaxPlayers,
} from "../../../components/EventMaxPlayersPicker";
import { DateTimePickerField } from "../../../components/DateTimePickerField";
import { UpgradeModal } from "../../../components/UpgradeModal";
import { LocationPicker } from "../../../components/LocationPicker";
import { Button, FormScreenSkeleton, Input } from "../../../components/ui";
import { shouldShowEntitySkeleton } from "../../../lib/entityLoading";
import { clampEventMaxPlayers } from "../../../lib/eventCapacity";
import { canEditEvent, hasEventStarted } from "../../../lib/gameEvents";
import { EventLocation } from "../../../lib/location";
import { colors, radius, spacing, typography } from "../../../lib/theme";
import { useRefreshControl } from "../../../lib/useRefreshControl";
import { useUpgradePrompt } from "../../../lib/useUpgradePrompt";
import { useClub, useEvent, useSubscriptionTier } from "../../../store/hooks";
import { useAppStore } from "../../../store/useAppStore";

export default function EditEventScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const event = useEvent(id);
  const club = useClub(event?.clubId ?? "");
  const currentUserId = useAppStore((state) => state.currentUserId);
  const editEvent = useAppStore((state) => state.editEvent);
  const upgradeToAllStar = useAppStore((state) => state.upgradeToAllStar);
  const events = useAppStore((state) => state.events);
  const hydrated = useAppStore((state) => state.hydrated);
  const tier = useSubscriptionTier();
  const {
    upgradeVisible,
    upgradeReason,
    promptUpgrade,
    closeUpgrade,
  } = useUpgradePrompt();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventLocation, setEventLocation] = useState<EventLocation | null>(
    null,
  );
  const [maxPlayers, setMaxPlayers] = useState<number>(10);
  const [customMaxPlayers, setCustomMaxPlayers] = useState("20");
  const [useCustomMax, setUseCustomMax] = useState(false);
  const [dateTime, setDateTime] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const { refreshControl } = useRefreshControl();

  const canEdit = event
    ? canEditEvent(event, currentUserId, club)
    : false;
  const eventStarted = event ? hasEventStarted(event) : false;
  const joinedCount = event?.participantIds.length ?? 0;

  useEffect(() => {
    if (!event || initialized) return;

    setTitle(event.title);
    setDescription(event.description);
    setDateTime(new Date(event.dateTime));
    setEventLocation({
      label: event.location,
      latitude: event.latitude ?? 0,
      longitude: event.longitude ?? 0,
    });

    const cappedMax = clampEventMaxPlayers(event.maxPlayers, tier);

    if (isEventMaxPlayerPreset(cappedMax)) {
      setMaxPlayers(cappedMax);
      setUseCustomMax(false);
    } else {
      setUseCustomMax(true);
      setCustomMaxPlayers(String(cappedMax));
    }

    setInitialized(true);
  }, [event, initialized, tier]);

  const resolvedMaxPlayers = useResolvedEventMaxPlayers(
    tier,
    maxPlayers,
    customMaxPlayers,
    useCustomMax,
    joinedCount,
  );

  const isValidDate = eventStarted || dateTime.getTime() > Date.now();
  const maxPlayersOk =
    resolvedMaxPlayers != null && resolvedMaxPlayers >= joinedCount;

  const canSave =
    title.trim().length >= 3 &&
    Boolean(eventLocation?.label.trim()) &&
    eventLocation?.latitude != null &&
    eventLocation?.longitude != null &&
    isValidDate &&
    maxPlayersOk &&
    canEdit;

  const handleSave = async () => {
    if (!event || !eventLocation || resolvedMaxPlayers == null) return;

    setLoading(true);
    const saved = await editEvent(event.id, {
      title: title.trim(),
      description:
        description.trim() || "Pickup basketball run. All members welcome!",
      location: eventLocation.label.trim(),
      latitude: eventLocation.latitude,
      longitude: eventLocation.longitude,
      dateTime: dateTime.toISOString(),
      maxPlayers: resolvedMaxPlayers,
    });
    setLoading(false);

    if (saved) {
      router.back();
    }
  };

  if (!event) {
    if (shouldShowEntitySkeleton(event, hydrated, events.length === 0)) {
      return <FormScreenSkeleton fields={6} />;
    }

    return (
      <View style={styles.blocked}>
        <Text style={styles.blockedText}>Game not found.</Text>
      </View>
    );
  }

  if (!initialized) {
    return <FormScreenSkeleton fields={6} />;
  }

  if (!canEdit) {
    return (
      <>
        <Stack.Screen options={{ headerTitle: "Edit Game" }} />
        <View style={styles.blocked}>
          <Text style={styles.blockedTitle}>Editing locked</Text>
          <Text style={styles.blockedText}>
            Only the game creator or club captain can edit, and only before the
            game closes.
          </Text>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerTitle: "Edit Game" }} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={refreshControl}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.label}>Club</Text>
        <View style={styles.clubReadonly}>
          <Text style={styles.clubReadonlyText}>{club?.name ?? "Club"}</Text>
        </View>

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
          minimumDate={eventStarted ? undefined : new Date()}
        />
        {!isValidDate ? (
          <Text style={styles.errorHint}>
            Schedule must be in the future before tip-off.
          </Text>
        ) : null}

        <Text style={styles.label}>Location</Text>
        <LocationPicker
          value={eventLocation}
          onChange={setEventLocation}
          placeholder={
            club
              ? `Search near ${club.location}`
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
        <EventMaxPlayersPicker
          tier={tier}
          maxPlayers={maxPlayers}
          customMaxPlayers={customMaxPlayers}
          useCustomMax={useCustomMax}
          onMaxPlayersChange={setMaxPlayers}
          onCustomMaxPlayersChange={setCustomMaxPlayers}
          onUseCustomMaxChange={setUseCustomMax}
          onRequireUpgrade={promptUpgrade}
          minPlayers={joinedCount}
        />

        {!maxPlayersOk ? (
          <Text style={styles.errorHint}>
            Max players cannot be below the {joinedCount} players already
            joined.
          </Text>
        ) : null}

        <Button
          title="Save Changes"
          onPress={handleSave}
          disabled={!canSave}
          loading={loading}
          size="lg"
          style={styles.submit}
        />
      </ScrollView>

      <UpgradeModal
        visible={upgradeVisible}
        reason={upgradeReason}
        onClose={closeUpgrade}
        onPurchased={() => {
          void upgradeToAllStar();
        }}
      />
    </>
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
  blocked: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
    gap: spacing.sm,
  },
  blockedTitle: {
    ...typography.heading,
    color: colors.text,
  },
  blockedText: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: "center",
    fontSize: 14,
  },
  label: {
    ...typography.label,
    color: colors.textMuted,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  clubReadonly: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    alignSelf: "flex-start",
    marginBottom: spacing.sm,
  },
  clubReadonlyText: {
    ...typography.caption,
    color: colors.text,
    fontWeight: "600",
  },
  field: {
    marginBottom: spacing.sm,
  },
  textArea: {
    minHeight: 88,
    textAlignVertical: "top",
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
