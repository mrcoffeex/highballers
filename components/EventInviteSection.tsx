import { useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import {
  canInvitePlayersToEvent,
  getInviteableClubMembers,
  getSpotsLeft,
} from "../lib/eventInvite";
import { useThemedStyles } from "../lib/ThemeProvider";
import { spacing, typography, type ThemeColors } from "../lib/theme";
import { Club, ClubBan, GameEvent, UserProfile } from "../lib/types";
import { EventMemberPicker } from "./EventMemberPicker";
import { Button } from "./ui";

type EventInviteSectionProps = {
  event: GameEvent;
  club: Club | undefined;
  users: UserProfile[];
  clubBans: ClubBan[];
  currentUserId: string | null | undefined;
  inviting: boolean;
  inviteError: string | null;
  onInvite: (memberIds: string[]) => Promise<void>;
  /** When true, only renders the picker block (parent supplies the row toggle). */
  embedded?: boolean;
  expanded?: boolean;
};

export function EventInviteSection({
  event,
  club,
  users,
  clubBans,
  currentUserId,
  inviting,
  inviteError,
  onInvite,
  embedded = false,
  expanded: expandedProp,
}: EventInviteSectionProps) {
  const styles = useThemedStyles(createStyles);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [expandedInternal, setExpandedInternal] = useState(false);
  const expanded = embedded ? (expandedProp ?? false) : expandedInternal;

  const canInvite = canInvitePlayersToEvent(event, currentUserId, club);
  const spotsLeft = getSpotsLeft(event);

  const inviteableMembers = useMemo(
    () =>
      getInviteableClubMembers(event, club, users, clubBans, currentUserId),
    [club, clubBans, currentUserId, event, users],
  );

  if (!canInvite) return null;

  const toggleMember = (memberId: string) => {
    setSelectedIds((current) => {
      if (current.includes(memberId)) {
        return current.filter((id) => id !== memberId);
      }
      if (current.length >= spotsLeft) return current;
      return [...current, memberId];
    });
  };

  const handleInvite = async () => {
    if (selectedIds.length === 0) return;
    await onInvite(selectedIds);
    setSelectedIds([]);
    if (!embedded) setExpandedInternal(false);
  };

  if (inviteableMembers.length === 0) {
    const emptyHint = (
      <Text style={styles.hint}>
        Every club member is already in this game
        {spotsLeft === 0 ? " or the run is full" : ""}.
      </Text>
    );
    return embedded ? emptyHint : <View style={styles.wrap}>{emptyHint}</View>;
  }

  const pickerBlock = expanded ? (
        <>
          <Text style={styles.hint}>
            Add club members directly to the roster. {spotsLeft} spot
            {spotsLeft === 1 ? "" : "s"} left.
          </Text>
          <EventMemberPicker
            members={inviteableMembers}
            selectedIds={selectedIds}
            onToggle={toggleMember}
          />
          {inviteError ? <Text style={styles.error}>{inviteError}</Text> : null}
          <Button
            title={
              selectedIds.length > 0
                ? `Add ${selectedIds.length} to game`
                : "Select players"
            }
            variant="primary"
            onPress={() => {
              void handleInvite();
            }}
            disabled={selectedIds.length === 0}
            loading={inviting}
            style={styles.submit}
          />
        </>
  ) : null;

  if (embedded) {
    return pickerBlock ? <View style={styles.embedded}>{pickerBlock}</View> : null;
  }

  return (
    <View style={styles.wrap}>
      <Button
        title={expanded ? "Hide player list" : "Add players to game"}
        variant="outline"
        onPress={() => setExpandedInternal((value) => !value)}
        style={styles.toggle}
      />
      {pickerBlock}
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
  wrap: {
    marginBottom: spacing.sm,
  },
  embedded: {
    marginBottom: spacing.sm,
    paddingTop: spacing.xs,
  },
  toggle: {
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  hint: {
    ...typography.caption,
    color: colors.textDim,
    marginBottom: spacing.sm,
  },
  error: {
    ...typography.caption,
    color: colors.error,
    marginBottom: spacing.sm,
  },
  submit: {
    marginTop: spacing.xs,
  },
  });
}
