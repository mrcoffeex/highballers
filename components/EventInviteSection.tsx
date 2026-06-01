import { useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import {
  canInvitePlayersToEvent,
  getInviteableClubMembers,
  getSpotsLeft,
} from "../lib/eventInvite";
import { colors, spacing, typography } from "../lib/theme";
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
}: EventInviteSectionProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [expanded, setExpanded] = useState(false);

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
    setExpanded(false);
  };

  if (inviteableMembers.length === 0) {
    return (
      <Text style={styles.hint}>
        Every club member is already in this game
        {spotsLeft === 0 ? " or the run is full" : ""}.
      </Text>
    );
  }

  return (
    <View style={styles.wrap}>
      <Button
        title={expanded ? "Hide invite list" : "Invite players to game"}
        variant="outline"
        onPress={() => setExpanded((value) => !value)}
        style={styles.toggle}
      />

      {expanded ? (
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
            onPress={() => {
              void handleInvite();
            }}
            disabled={selectedIds.length === 0}
            loading={inviting}
            style={styles.submit}
          />
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.sm,
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
