import { Stack, useLocalSearchParams } from "@/lib/expoRouter";
import { useMemo, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CourtAssignmentsEditor } from "../../../components/CourtAssignmentsEditor";
import { FloatingAlert } from "../../../components/FloatingAlert";
import { FormScreenSkeleton } from "../../../components/ui";
import { shouldShowEntitySkeleton } from "../../../lib/entityLoading";
import { canEditEvent } from "../../../lib/gameEvents";
import { getPlayersPerGame } from "../../../lib/gameFormats";
import { useThemedStyles } from "../../../lib/ThemeProvider";
import { spacing, typography, type ThemeColors } from "../../../lib/theme";
import { formatSyncError } from "../../../lib/syncErrors";
import { SubscriptionError } from "../../../lib/subscription";
import { useFloatingAlert } from "../../../lib/useFloatingAlert";
import { useUpgradePrompt } from "../../../lib/useUpgradePrompt";
import { CourtGame, UserProfile } from "../../../lib/types";
import { useClub, useEvent } from "../../../store/hooks";
import { useAppStore } from "../../../store/useAppStore";

export default function EditEventCourtsScreen() {
  const styles = useThemedStyles(createStyles);
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const event = useEvent(id);
  const club = useClub(event?.clubId ?? "");
  const users = useAppStore((state) => state.users);
  const currentUserId = useAppStore((state) => state.currentUserId);
  const saveEventCourts = useAppStore((state) => state.saveEventCourts);
  const events = useAppStore((state) => state.events);
  const hydrated = useAppStore((state) => state.hydrated);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const floatingAlert = useFloatingAlert();
  const { handleSubscriptionError } = useUpgradePrompt();

  const participants = useMemo(
    () =>
      (event?.participantIds ?? [])
        .map((playerId) => users.find((user) => user.id === playerId))
        .filter((player): player is UserProfile => Boolean(player)),
    [event?.participantIds, users],
  );

  const canEdit = event ? canEditEvent(event, currentUserId, club) : false;
  const playersPerGame = event ? getPlayersPerGame(event) : 10;
  const initialCourtGames = useMemo<CourtGame[]>(
    () =>
      event?.courtGames?.length ? event.courtGames : [{ teamA: [], teamB: [] }],
    [event?.courtGames, event?.id],
  );

  const handleSave = async (courtGames: CourtGame[]) => {
    if (!event || savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    floatingAlert.dismiss();
    try {
      await saveEventCourts(event.id, courtGames);
      floatingAlert.show("Court assignments saved.", "success");
    } catch (err) {
      if (err instanceof SubscriptionError) {
        handleSubscriptionError(err);
      } else {
        floatingAlert.show(
          formatSyncError(err, "Could not save court assignments. Try again."),
          "error",
        );
      }
    } finally {
      setSaving(false);
      savingRef.current = false;
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
            Only the game creator or club captain can edit court assignments
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
        <FloatingAlert
          message={floatingAlert.message}
          variant={floatingAlert.variant}
          bottomInset={insets.bottom}
          onDismiss={floatingAlert.dismiss}
        />
        <CourtAssignmentsEditor
          key={event.id}
          participants={participants}
          initialCourtGames={initialCourtGames}
          playersPerGame={playersPerGame}
          saving={saving}
          bottomInset={insets.bottom}
          onSave={handleSave}
        />
      </View>
    </>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      position: "relative",
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
  });
}
