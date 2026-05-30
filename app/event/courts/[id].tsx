import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CourtAssignmentsEditor } from "../../../components/CourtAssignmentsEditor";
import { FormScreenSkeleton } from "../../../components/ui";
import { shouldShowEntitySkeleton } from "../../../lib/entityLoading";
import { canEditEvent } from "../../../lib/gameEvents";
import { getPlayersPerGame } from "../../../lib/gameFormats";
import { colors, spacing, typography } from "../../../lib/theme";
import { useRefreshControl } from "../../../lib/useRefreshControl";
import { CourtGame, UserProfile } from "../../../lib/types";
import { useClub, useEvent } from "../../../store/hooks";
import { useAppStore } from "../../../store/useAppStore";

export default function EditEventCourtsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const event = useEvent(id);
  const club = useClub(event?.clubId ?? "");
  const users = useAppStore((state) => state.users);
  const currentUserId = useAppStore((state) => state.currentUserId);
  const saveEventCourts = useAppStore((state) => state.saveEventCourts);
  const events = useAppStore((state) => state.events);
  const hydrated = useAppStore((state) => state.hydrated);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { refreshControl } = useRefreshControl();

  const participants = useMemo(
    () =>
      (event?.participantIds ?? [])
        .map((playerId) => users.find((user) => user.id === playerId))
        .filter((player): player is UserProfile => Boolean(player)),
    [event?.participantIds, users],
  );

  const canEdit = event
    ? canEditEvent(event, currentUserId, club?.adminId)
    : false;
  const playersPerGame = event ? getPlayersPerGame(event) : 10;
  const initialCourtGames: CourtGame[] = event?.courtGames?.length
    ? event.courtGames
    : [{ teamA: [], teamB: [] }];

  const handleSave = async (courtGames: CourtGame[]) => {
    if (!event) return;
    setSaving(true);
    setError(null);
    try {
      const saved = await saveEventCourts(event.id, courtGames);
      if (saved) {
        router.back();
        return;
      }
      setError("Could not save court assignments. Try again.");
    } finally {
      setSaving(false);
    }
  };

  if (!event) {
    if (shouldShowEntitySkeleton(event, hydrated, events.length === 0)) {
      return <FormScreenSkeleton fields={4} />;
    }

    return (
      <View style={styles.blocked}>
        <Text style={styles.blockedText}>Game not found.</Text>
      </View>
    );
  }

  if (!canEdit) {
    return (
      <>
        <Stack.Screen options={{ headerTitle: "Edit Courts" }} />
        <View style={[styles.blocked, { paddingBottom: insets.bottom }]}>
          <Text style={styles.blockedTitle}>Editing locked</Text>
          <Text style={styles.blockedText}>
            Only the game creator or club admin can edit court assignments
            before the game closes.
          </Text>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerTitle: "Edit Courts" }} />
      <View style={[styles.container, { paddingBottom: insets.bottom }]}>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <CourtAssignmentsEditor
          key={`${event.id}-${event.courtGames?.length ?? 0}-${event.participantIds.length}`}
          participants={participants}
          initialCourtGames={initialCourtGames}
          playersPerGame={playersPerGame}
          saving={saving}
          refreshControl={refreshControl}
          onSave={handleSave}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  blocked: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
    padding: spacing.xl,
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
  error: {
    ...typography.caption,
    color: colors.error,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
});
