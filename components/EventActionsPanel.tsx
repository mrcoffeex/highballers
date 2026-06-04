import { Ionicons } from "@expo/vector-icons";
import { useState, type ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { EventActionRow } from "./EventActionRow";
import { EventInviteSection } from "./EventInviteSection";
import { PlayersPerGamePicker } from "./PlayersPerGamePicker";
import { Button, Card } from "./ui";
import { useTheme, useThemedStyles } from "../lib/ThemeProvider";
import { describeCourtCapacity } from "../lib/gameFormats";
import { getSpotsLeft } from "../lib/eventInvite";
import { radius, spacing, typography, type ThemeColors } from "../lib/theme";
import { Club, ClubBan, GameEvent, UserProfile } from "../lib/types";

export type EventActionsPanelProps = {
  event: GameEvent;
  club: Club | undefined;
  users: UserProfile[];
  clubBans: ClubBan[];
  currentUserId: string | null | undefined;
  optionsLocked: boolean;
  isClubMember: boolean;
  isJoined: boolean;
  isFull: boolean;
  canJoinThisGame: boolean;
  joinAccessReason?: string;
  joinError: string | null;
  playersPerGame: number;
  onPlayersPerGameChange: (value: number) => void;
  gameSizeLabel: string;
  shuffleReady: boolean;
  shuffling: boolean;
  shuffleError: string | null;
  hasEventStats: boolean;
  canEdit: boolean;
  canRunShuffle: boolean;
  canAddPlayers: boolean;
  canRecordStats: boolean;
  canFinish: boolean;
  canCancel: boolean;
  cancelError: string | null;
  inviting: boolean;
  inviteError: string | null;
  onJoin: () => void;
  onLeave: () => void;
  onShuffle: () => void;
  onOrganizeCourts: () => void;
  onEditGame: () => void;
  onScorekeeper: () => void;
  onFinish: () => void;
  onCancel: () => void;
  onInvite: (memberIds: string[]) => Promise<void>;
};

function PanelSection({
  title,
  children,
  styles,
}: {
  title: string;
  children: ReactNode;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

export function EventActionsPanel({
  event,
  club,
  users,
  clubBans,
  currentUserId,
  optionsLocked,
  isClubMember,
  isJoined,
  isFull,
  canJoinThisGame,
  joinAccessReason,
  joinError,
  playersPerGame,
  onPlayersPerGameChange,
  gameSizeLabel,
  shuffleReady,
  shuffling,
  shuffleError,
  hasEventStats,
  canEdit,
  canRunShuffle,
  canAddPlayers,
  canRecordStats,
  canFinish,
  canCancel,
  cancelError,
  inviting,
  inviteError,
  onJoin,
  onLeave,
  onShuffle,
  onOrganizeCourts,
  onEditGame,
  onScorekeeper,
  onFinish,
  onCancel,
  onInvite,
}: EventActionsPanelProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [addPlayersOpen, setAddPlayersOpen] = useState(false);

  const courtCapacity = describeCourtCapacity(
    event.participantIds.length,
    playersPerGame,
  );
  const spotsLeft = getSpotsLeft(event);

  const showParticipation = isClubMember && !optionsLocked;
  const showOrganizer =
    !optionsLocked &&
    (canEdit || canRecordStats || canFinish || canAddPlayers);
  const showSettings = canEdit && !optionsLocked;
  const showDanger = canCancel;

  const hasContent =
    showParticipation || showOrganizer || showSettings || showDanger;

  if (!hasContent && optionsLocked) {
    return (
      <Card style={styles.card}>
        <View style={styles.statusBanner}>
          <Ionicons
            name="lock-closed-outline"
            size={20}
            color={colors.textMuted}
          />
          <Text style={styles.statusText}>
            {event.finishedAt
              ? "This game is finished. Actions are closed."
              : "This game closed 12 hours after tip-off."}
          </Text>
        </View>
      </Card>
    );
  }

  if (!hasContent) {
    return (
      <Card style={styles.card}>
        <Text style={styles.statusText}>
          Join the club to participate in this game.
        </Text>
      </Card>
    );
  }

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Ionicons name="basketball-outline" size={22} color={colors.primary} />
        <View style={styles.headerCopy}>
          <Text style={styles.headerTitle}>Game actions</Text>
          <Text style={styles.headerSubtitle}>
            Everything you can do for this run in one place
          </Text>
        </View>
      </View>

      {optionsLocked ? (
        <View style={[styles.statusBanner, styles.statusBannerWarning]}>
          <Ionicons name="lock-closed-outline" size={18} color={colors.warning} />
          <Text style={styles.statusText}>
            {event.finishedAt
              ? "Finished — roster and stats are read-only."
              : "Closed — options ended 12 hours after tip-off."}
          </Text>
        </View>
      ) : null}

      {showParticipation ? (
        <PanelSection title="Your spot" styles={styles}>
          {isJoined ? (
            <EventActionRow
              icon="exit-outline"
              title="Leave game"
              subtitle="Give up your spot on the roster"
              tone="neutral"
              onPress={onLeave}
            />
          ) : (
            <>
              <Button
                title={
                  isFull
                    ? "Game full"
                    : canJoinThisGame
                      ? "Join game"
                      : "Invite only"
                }
                variant="primary"
                onPress={onJoin}
                disabled={isFull || !canJoinThisGame}
                icon={
                  <Ionicons
                    name="add-circle-outline"
                    size={20}
                    color={colors.onPrimary}
                  />
                }
                style={styles.joinBtn}
              />
              {joinError ? (
                <Text style={styles.feedbackError}>{joinError}</Text>
              ) : !canJoinThisGame && !isFull && joinAccessReason ? (
                <Text style={styles.feedbackMuted}>{joinAccessReason}</Text>
              ) : null}
            </>
          )}
        </PanelSection>
      ) : null}

      {showOrganizer ? (
        <PanelSection title="Run the game" styles={styles}>
          {canEdit ? (
            <View style={styles.setupBlock}>
              <Text style={styles.setupLabel}>Players per court</Text>
              <PlayersPerGamePicker
                value={playersPerGame}
                maxPlayers={event.maxPlayers}
                onChange={onPlayersPerGameChange}
              />
              {courtCapacity.courtCount > 0 ? (
                <Text style={styles.feedbackMuted}>
                  {courtCapacity.courtCount} court
                  {courtCapacity.courtCount === 1 ? "" : "s"} ·{" "}
                  {courtCapacity.assignedCount} on court
                  {courtCapacity.unassignedCount > 0
                    ? ` · ${courtCapacity.unassignedCount} sub${courtCapacity.unassignedCount !== 1 ? "s" : ""}`
                    : ""}
                </Text>
              ) : null}
            </View>
          ) : null}

          {hasEventStats && canEdit ? (
            <Text style={styles.feedbackMuted}>
              Re-shuffle is locked after scores are saved. You can still edit
              court assignments.
            </Text>
          ) : null}

          {canRunShuffle ? (
            <>
              <EventActionRow
                icon="shuffle"
                title={
                  event.shuffled
                    ? `Re-shuffle ${gameSizeLabel} courts`
                    : `Shuffle ${gameSizeLabel} courts`
                }
                subtitle={
                  shuffleReady
                    ? "Balance teams across courts automatically"
                    : `Need ${playersPerGame} players (${event.participantIds.length}/${playersPerGame})`
                }
                tone="accent"
                disabled={!shuffleReady || shuffling}
                onPress={onShuffle}
              />
              {shuffleError ? (
                <Text style={styles.feedbackError}>{shuffleError}</Text>
              ) : null}
            </>
          ) : null}

          {canEdit && event.participantIds.length > 0 ? (
            <EventActionRow
              icon="people-circle-outline"
              title={
                event.shuffled ? "Edit court assignments" : "Organize courts"
              }
              subtitle="Drag players between Team A and Team B"
              tone="primary"
              onPress={onOrganizeCourts}
            />
          ) : null}

          {canAddPlayers ? (
            <>
              <EventActionRow
                icon="person-add-outline"
                title="Add players to game"
                subtitle={
                  spotsLeft > 0
                    ? `${spotsLeft} spot${spotsLeft === 1 ? "" : "s"} left on the roster`
                    : "Roster is full"
                }
                tone="primary"
                expanded={addPlayersOpen}
                disabled={spotsLeft === 0}
                onPress={() => setAddPlayersOpen((open) => !open)}
              />
              <EventInviteSection
                event={event}
                club={club}
                users={users}
                clubBans={clubBans}
                currentUserId={currentUserId}
                inviting={inviting}
                inviteError={inviteError}
                onInvite={onInvite}
                embedded
                expanded={addPlayersOpen}
              />
            </>
          ) : null}

          {canRecordStats ? (
            <EventActionRow
              icon="clipboard-outline"
              title="Open scorekeeper"
              subtitle="Record box scores and run the game clock"
              tone="accent"
              onPress={onScorekeeper}
            />
          ) : null}

          {canFinish ? (
            <EventActionRow
              icon="checkmark-circle-outline"
              title="Mark game finished"
              subtitle="Close join, shuffle, and stat entry for everyone"
              tone="success"
              onPress={onFinish}
            />
          ) : null}
        </PanelSection>
      ) : null}

      {showSettings ? (
        <PanelSection title="Settings" styles={styles}>
          <EventActionRow
            icon="create-outline"
            title="Edit game details"
            subtitle="Title, time, location, and max players"
            tone="neutral"
            onPress={onEditGame}
          />
        </PanelSection>
      ) : null}

      {showDanger ? (
        <PanelSection title="Danger zone" styles={styles}>
          <EventActionRow
            icon="close-circle-outline"
            title="Cancel game"
            subtitle="Removes this game for all club members"
            tone="danger"
            onPress={onCancel}
          />
          {cancelError ? (
            <Text style={styles.feedbackError}>{cancelError}</Text>
          ) : null}
        </PanelSection>
      ) : null}
    </Card>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    card: {
      marginBottom: spacing.lg,
      gap: spacing.sm,
    },
    header: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: spacing.md,
      marginBottom: spacing.sm,
      paddingBottom: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.outlineVariant,
    },
    headerCopy: {
      flex: 1,
    },
    headerTitle: {
      ...typography.heading,
      color: colors.text,
      fontSize: 18,
    },
    headerSubtitle: {
      ...typography.caption,
      color: colors.textMuted,
      marginTop: 2,
    },
    statusBanner: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: spacing.sm,
      padding: spacing.md,
      borderRadius: radius.md,
      backgroundColor: colors.surfaceContainerLow,
      marginBottom: spacing.sm,
    },
    statusBannerWarning: {
      backgroundColor: `${colors.warning}14`,
    },
    statusText: {
      ...typography.caption,
      color: colors.textMuted,
      flex: 1,
      lineHeight: 18,
    },
    section: {
      marginTop: spacing.sm,
    },
    sectionTitle: {
      ...typography.label,
      color: colors.textDim,
      fontSize: 11,
      letterSpacing: 0.6,
      textTransform: "uppercase",
      marginBottom: spacing.sm,
    },
    setupBlock: {
      marginBottom: spacing.md,
      padding: spacing.md,
      borderRadius: radius.md,
      backgroundColor: colors.surfaceContainerLow,
      borderWidth: 1,
      borderColor: colors.outlineVariant,
    },
    setupLabel: {
      ...typography.label,
      color: colors.textMuted,
      marginBottom: spacing.sm,
    },
    joinBtn: {
      marginBottom: spacing.xs,
    },
    feedbackMuted: {
      ...typography.caption,
      color: colors.textDim,
      marginBottom: spacing.sm,
      lineHeight: 17,
    },
    feedbackError: {
      ...typography.caption,
      color: colors.error,
      marginBottom: spacing.sm,
    },
  });
}
