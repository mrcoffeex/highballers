import { StyleSheet, Text, View } from "react-native";

import { Card } from "./ui";
import { colors, radius, spacing, typography } from "../lib/theme";
import {
  BOX_SCORE_FIELDS,
  BOX_SCORE_LABELS,
  BoxScoreStats,
  EMPTY_BOX_SCORE,
  UserProfile,
} from "../lib/types";

interface BoxScoreTableProps {
  participants: UserProfile[];
  statsByPlayer: Record<string, BoxScoreStats>;
}

function sumStats(
  participants: UserProfile[],
  statsByPlayer: Record<string, BoxScoreStats>,
): BoxScoreStats {
  return BOX_SCORE_FIELDS.reduce(
    (acc, field) => {
      acc[field] = participants.reduce(
        (sum, player) => sum + (statsByPlayer[player.id]?.[field] ?? 0),
        0,
      );
      return acc;
    },
    { ...EMPTY_BOX_SCORE },
  );
}

export function BoxScoreTable({
  participants,
  statsByPlayer,
}: BoxScoreTableProps) {
  if (participants.length === 0) {
    return (
      <Card>
        <Text style={styles.empty}>No box score recorded yet.</Text>
      </Card>
    );
  }

  const totals = sumStats(participants, statsByPlayer);

  return (
    <Card style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={[styles.headerCell, styles.playerCol]}>Player</Text>
        {BOX_SCORE_FIELDS.map((field) => (
          <Text key={field} style={styles.headerCell}>
            {BOX_SCORE_LABELS[field]}
          </Text>
        ))}
      </View>

      {participants.map((player, index) => {
        const stats = statsByPlayer[player.id] ?? EMPTY_BOX_SCORE;
        const firstName = player.name.split(" ")[0];

        return (
          <View
            key={player.id}
            style={[
              styles.dataRow,
              index % 2 === 1 ? styles.stripedRow : undefined,
            ]}
          >
            <Text
              style={[styles.dataCell, styles.playerCol, styles.playerName]}
              numberOfLines={1}
            >
              {firstName}
            </Text>
            {BOX_SCORE_FIELDS.map((field) => (
              <Text key={field} style={styles.dataCell}>
                {stats[field]}
              </Text>
            ))}
          </View>
        );
      })}

      <View style={styles.footerRow}>
        <Text style={[styles.footerCell, styles.playerCol]}>TOTAL</Text>
        {BOX_SCORE_FIELDS.map((field) => (
          <Text key={field} style={[styles.footerCell, styles.totalValue]}>
            {totals[field]}
          </Text>
        ))}
      </View>
    </Card>
  );
}

const COL_WIDTH = 36;

const styles = StyleSheet.create({
  card: {
    padding: 0,
    overflow: "hidden",
  },
  empty: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: "center",
    padding: spacing.md,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  headerCell: {
    width: COL_WIDTH,
    ...typography.label,
    color: colors.textMuted,
    fontSize: 9,
    textAlign: "center",
  },
  playerCol: {
    flex: 1,
    width: undefined,
    textAlign: "left",
    paddingRight: spacing.xs,
  },
  dataRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  stripedRow: {
    backgroundColor: `${colors.surface}88`,
  },
  dataCell: {
    width: COL_WIDTH,
    ...typography.caption,
    color: colors.text,
    textAlign: "center",
    fontWeight: "600",
  },
  playerName: {
    textAlign: "left",
    fontWeight: "500",
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
    backgroundColor: `${colors.primary}18`,
  },
  footerCell: {
    width: COL_WIDTH,
    ...typography.label,
    color: colors.primary,
    fontSize: 9,
    textAlign: "center",
  },
  totalValue: {
    fontSize: 12,
    fontWeight: "800",
  },
});
