import { Image } from "expo-image";
import { useEffect, useRef } from "react";
import {
  Animated,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";

import { useThemedStyles } from "../../lib/ThemeProvider";
import { radius, spacing, type ThemeColors } from "../../lib/theme";

function useStyles() {
  return useThemedStyles(createStyles);
}

interface SkeletonProps {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

const useNativeDriver = Platform.OS !== "web";

export function Skeleton({
  width = "100%",
  height = 14,
  borderRadius = radius.sm,
  style,
}: SkeletonProps) {
  const styles = useStyles();
  const opacity = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.75,
          duration: 800,
          useNativeDriver,
        }),
        Animated.timing(opacity, {
          toValue: 0.35,
          duration: 800,
          useNativeDriver,
        }),
      ]),
    );

    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[styles.block, { width, height, borderRadius, opacity }, style]}
    />
  );
}

export function SkeletonCircle({
  size = 40,
  style,
}: {
  size?: number;
  style?: ViewStyle;
}) {
  return (
    <Skeleton
      width={size}
      height={size}
      borderRadius={radius.full}
      style={style}
    />
  );
}

export function SkeletonInline({
  size = 18,
  style,
}: {
  size?: number;
  style?: ViewStyle;
}) {
  return (
    <Skeleton
      width={size}
      height={size}
      borderRadius={radius.sm}
      style={style}
    />
  );
}

export function SkeletonButtonLabel({
  size = "md",
}: {
  size?: "sm" | "md" | "lg";
}) {
  const width = size === "sm" ? 56 : size === "lg" ? 108 : 80;
  return <Skeleton width={width} height={14} borderRadius={radius.sm} />;
}

function cardShell(
  styles: ReturnType<typeof createStyles>,
  style?: ViewStyle,
) {
  return [styles.cardShell, style];
}

export function ChatListItemSkeleton() {
  const styles = useStyles();
  return (
    <View style={cardShell(styles, styles.chatItem)}>
      <SkeletonCircle size={48} />
      <View style={styles.chatContent}>
        <View style={styles.chatTopRow}>
          <Skeleton width="55%" height={16} borderRadius={radius.sm} />
          <Skeleton width={42} height={11} borderRadius={radius.sm} />
        </View>
        <Skeleton width="85%" height={12} />
        <Skeleton width="62%" height={12} style={styles.lineGap} />
      </View>
      <Skeleton width={18} height={18} borderRadius={radius.sm} />
    </View>
  );
}

export function ChatListSkeleton({ count = 5 }: { count?: number }) {
  const styles = useStyles();
  return (
    <View style={styles.listGap}>
      {Array.from({ length: count }, (_, index) => (
        <ChatListItemSkeleton key={index} />
      ))}
    </View>
  );
}

function ChatBubbleSkeleton({
  align,
  styles,
}: {
  align: "left" | "right";
  styles: ReturnType<typeof createStyles>;
}) {
  const isLeft = align === "left";

  return (
    <View
      style={[
        styles.messageRow,
        isLeft ? styles.messageRowLeft : styles.messageRowRight,
      ]}
    >
      {isLeft ? <SkeletonCircle size={32} /> : null}
      <View
        style={[
          styles.messageBubble,
          isLeft ? styles.messageBubbleLeft : styles.messageBubbleRight,
        ]}
      >
        {isLeft ? (
          <Skeleton width="40%" height={10} style={styles.messageName} />
        ) : null}
        <Skeleton width={isLeft ? "100%" : "88%"} height={12} />
        <Skeleton
          width={isLeft ? "72%" : "64%"}
          height={12}
          style={styles.lineGap}
        />
        <Skeleton width={36} height={9} style={styles.messageTime} />
      </View>
    </View>
  );
}

export function ChatThreadSkeleton({ count = 6 }: { count?: number }) {
  const styles = useStyles();
  const pattern: Array<"left" | "right"> = [
    "left",
    "right",
    "left",
    "left",
    "right",
    "right",
  ];

  return (
    <View style={styles.thread}>
      {Array.from({ length: count }, (_, index) => (
        <ChatBubbleSkeleton
          key={index}
          align={pattern[index % pattern.length]}
          styles={styles}
        />
      ))}
    </View>
  );
}

export function MemberRowSkeleton() {
  const styles = useStyles();
  return (
    <View style={cardShell(styles, styles.memberRow)}>
      <SkeletonCircle size={40} />
      <View style={styles.memberLines}>
        <Skeleton width="45%" height={14} />
        <Skeleton width="30%" height={11} style={styles.lineGap} />
      </View>
      <Skeleton width={44} height={36} borderRadius={radius.md} />
    </View>
  );
}

export function MemberListSkeleton({ count = 6 }: { count?: number }) {
  const styles = useStyles();
  return (
    <View style={styles.listGap}>
      {Array.from({ length: count }, (_, index) => (
        <MemberRowSkeleton key={index} />
      ))}
    </View>
  );
}

export function LoadMoreSkeleton({ rows = 2 }: { rows?: number }) {
  const styles = useStyles();
  return (
    <View style={styles.loadMoreWrap}>
      {Array.from({ length: rows }, (_, index) => (
        <MemberRowSkeleton key={index} />
      ))}
    </View>
  );
}

export function ClubCardSkeleton() {
  const styles = useStyles();
  return (
    <View style={cardShell(styles, styles.clubCard)}>
      <View style={styles.clubHeader}>
        <SkeletonCircle size={48} />
        <View style={styles.flex}>
          <Skeleton width="50%" height={16} />
          <Skeleton width="35%" height={11} style={styles.lineGap} />
        </View>
        <Skeleton width={52} height={22} borderRadius={radius.full} />
      </View>
      <Skeleton width="92%" height={12} />
      <Skeleton width="68%" height={12} style={styles.lineGap} />
      <Skeleton width="30%" height={11} style={styles.sectionGap} />
    </View>
  );
}

export function ClubsListSkeleton({ count = 4 }: { count?: number }) {
  const styles = useStyles();
  return (
    <View style={styles.listGap}>
      {Array.from({ length: count }, (_, index) => (
        <ClubCardSkeleton key={index} />
      ))}
    </View>
  );
}

export function EventCardSkeleton() {
  const styles = useStyles();
  return (
    <View style={cardShell(styles, styles.eventCard)}>
      <View style={styles.eventTopRow}>
        <Skeleton width={56} height={56} borderRadius={radius.md} />
        <View style={styles.flex}>
          <Skeleton width="62%" height={16} />
          <Skeleton width="38%" height={11} style={styles.lineGap} />
          <Skeleton width="78%" height={11} style={styles.lineGap} />
        </View>
      </View>
      <View style={styles.eventFooter}>
        <Skeleton width="40%" height={11} />
        <Skeleton width={64} height={22} borderRadius={radius.full} />
      </View>
    </View>
  );
}

export function EventListSkeleton({ count = 3 }: { count?: number }) {
  const styles = useStyles();
  return (
    <View style={styles.listGap}>
      {Array.from({ length: count }, (_, index) => (
        <EventCardSkeleton key={index} />
      ))}
    </View>
  );
}

export function LeaderboardRowSkeleton() {
  const styles = useStyles();
  return (
    <View style={cardShell(styles, styles.leaderboardRow)}>
      <SkeletonCircle size={32} />
      <SkeletonCircle size={42} />
      <View style={styles.flex}>
        <Skeleton width="48%" height={14} />
        <Skeleton width="34%" height={11} style={styles.lineGap} />
      </View>
      <View style={styles.leaderboardValue}>
        <Skeleton width={36} height={18} />
        <Skeleton width={24} height={9} style={styles.lineGap} />
      </View>
    </View>
  );
}

export function LeaderboardListSkeleton({ count = 8 }: { count?: number }) {
  const styles = useStyles();
  return (
    <View style={styles.listGap}>
      {Array.from({ length: count }, (_, index) => (
        <LeaderboardRowSkeleton key={index} />
      ))}
    </View>
  );
}

export function ProfileScreenSkeleton() {
  const styles = useStyles();
  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.profileContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={cardShell(styles, styles.profileHero)}>
        <SkeletonCircle size={84} />
        <Skeleton width={64} height={28} borderRadius={radius.full} />
        <Skeleton width="70%" height={22} />
        <Skeleton width="45%" height={12} style={styles.lineGap} />
        <View style={styles.profileTagRow}>
          <Skeleton width={88} height={28} borderRadius={radius.full} />
          <Skeleton width={96} height={28} borderRadius={radius.full} />
        </View>
        <View style={styles.profileMetaGrid}>
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton
              key={index}
              width="48%"
              height={36}
              borderRadius={radius.md}
            />
          ))}
        </View>
        <View style={styles.gridRow}>
          <Skeleton width="48%" height={40} borderRadius={radius.md} />
          <Skeleton width="48%" height={40} borderRadius={radius.md} />
        </View>
      </View>
      <Skeleton width="35%" height={14} style={styles.sectionGap} />
      <View style={styles.statGrid}>
        {Array.from({ length: 5 }, (_, index) => (
          <View key={index} style={styles.statChip}>
            <Skeleton width="100%" height={10} />
            <Skeleton width="60%" height={16} style={styles.lineGap} />
          </View>
        ))}
      </View>
      <Skeleton width="40%" height={14} style={styles.sectionGap} />
      <EventListSkeleton count={2} />
    </ScrollView>
  );
}

export function ClubDetailSkeleton() {
  const styles = useStyles();
  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.screenContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={cardShell(styles, styles.clubHero)}>
        <SkeletonCircle size={72} />
        <View style={styles.flex}>
          <Skeleton width="58%" height={22} />
          <Skeleton width="42%" height={12} style={styles.lineGap} />
          <Skeleton width="88%" height={12} style={styles.lineGap} />
        </View>
      </View>
      <Skeleton width="44%" height={14} style={styles.sectionGap} />
      <MemberListSkeleton count={3} />
      <Skeleton width="38%" height={14} style={styles.sectionGap} />
      <EventListSkeleton count={2} />
    </ScrollView>
  );
}

export function EventDetailSkeleton() {
  const styles = useStyles();
  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.screenContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={cardShell(styles, styles.eventHero)}>
        <Skeleton width="70%" height={24} />
        <Skeleton width="45%" height={12} style={styles.lineGap} />
        <Skeleton
          width="100%"
          height={120}
          borderRadius={radius.lg}
          style={styles.sectionGap}
        />
        <View style={styles.actionRow}>
          <Skeleton width="48%" height={44} borderRadius={radius.md} />
          <Skeleton width="48%" height={44} borderRadius={radius.md} />
        </View>
      </View>
      <Skeleton width="34%" height={14} style={styles.sectionGap} />
      <MemberListSkeleton count={4} />
    </ScrollView>
  );
}

export function FormScreenSkeleton({ fields = 5 }: { fields?: number }) {
  const styles = useStyles();
  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.screenContent}
      showsVerticalScrollIndicator={false}
    >
      {Array.from({ length: fields }, (_, index) => (
        <View key={index} style={styles.formField}>
          <Skeleton width="28%" height={12} />
          <Skeleton
            width="100%"
            height={48}
            borderRadius={radius.md}
            style={styles.lineGap}
          />
        </View>
      ))}
      <Skeleton
        width="100%"
        height={240}
        borderRadius={radius.lg}
        style={styles.sectionGap}
      />
      <Skeleton
        width="100%"
        height={52}
        borderRadius={radius.md}
        style={styles.sectionGap}
      />
    </ScrollView>
  );
}

export function ScorekeeperSkeleton() {
  const styles = useStyles();
  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.screenContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.tabRow}>
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton
            key={index}
            width={88}
            height={34}
            borderRadius={radius.full}
          />
        ))}
      </View>
      <View style={cardShell(styles, styles.scoreGrid)}>
        <Skeleton width="100%" height={72} borderRadius={radius.lg} />
        <View style={styles.gridRow}>
          <Skeleton width="48%" height={64} borderRadius={radius.md} />
          <Skeleton width="48%" height={64} borderRadius={radius.md} />
        </View>
        <View style={styles.gridRow}>
          <Skeleton width="48%" height={64} borderRadius={radius.md} />
          <Skeleton width="48%" height={64} borderRadius={radius.md} />
        </View>
      </View>
      <Skeleton
        width="100%"
        height={52}
        borderRadius={radius.md}
        style={styles.sectionGap}
      />
    </ScrollView>
  );
}

export function LocationResultsSkeleton({ count = 3 }: { count?: number }) {
  const styles = useStyles();
  return (
    <View style={styles.locationResults}>
      {Array.from({ length: count }, (_, index) => (
        <View key={index} style={styles.locationResultRow}>
          <SkeletonCircle size={16} />
          <View style={styles.flex}>
            <Skeleton width="88%" height={12} />
            <Skeleton width="62%" height={11} style={styles.lineGap} />
          </View>
        </View>
      ))}
    </View>
  );
}

export function LocationPickerSkeleton() {
  const styles = useStyles();
  return (
    <View style={styles.listGap}>
      <Skeleton width="100%" height={48} borderRadius={radius.md} />
      <Skeleton width="42%" height={34} borderRadius={radius.md} />
      <Skeleton width="100%" height={240} borderRadius={radius.lg} />
    </View>
  );
}

export function HomeScreenSkeleton() {
  const styles = useStyles();
  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.screenContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={cardShell(styles, styles.homeHero)}>
        <View style={styles.flex}>
          <Skeleton width="42%" height={12} />
          <Skeleton width="58%" height={24} style={styles.lineGap} />
          <Skeleton width="72%" height={12} style={styles.lineGap} />
        </View>
        <Skeleton width={52} height={52} borderRadius={radius.full} />
      </View>
      <Skeleton width="38%" height={14} style={styles.sectionGap} />
      <EventListSkeleton count={2} />
      <Skeleton width="34%" height={14} style={styles.sectionGap} />
      <ClubsListSkeleton count={2} />
    </ScrollView>
  );
}

export function AppBootstrapSkeleton() {
  const styles = useStyles();
  return (
    <View style={styles.bootstrap}>
      <Image
        source={require("../../assets/splash-icon.png")}
        style={styles.bootstrapLogo}
        contentFit="contain"
        accessibilityLabel="HighBallers logo"
      />
      <Skeleton width={180} height={22} style={styles.bootstrapTitle} />
      <Skeleton width={240} height={14} />
      <View style={styles.bootstrapCards}>
        <Skeleton width="100%" height={88} borderRadius={radius.lg} />
        <Skeleton width="100%" height={88} borderRadius={radius.lg} />
      </View>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
  block: {
    backgroundColor: colors.surfaceContainerHighest,
  },
  flex: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listGap: {
    gap: spacing.sm,
  },
  lineGap: {
    marginTop: spacing.sm,
  },
  sectionGap: {
    marginTop: spacing.lg,
  },
  cardShell: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  chatItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  chatContent: {
    flex: 1,
    minWidth: 0,
  },
  chatTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  thread: {
    flex: 1,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  messageRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  messageRowLeft: {
    justifyContent: "flex-start",
  },
  messageRowRight: {
    justifyContent: "flex-end",
  },
  messageBubble: {
    maxWidth: "78%",
    borderRadius: radius.lg,
    padding: spacing.sm + 2,
    backgroundColor: colors.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    gap: spacing.xs,
  },
  messageBubbleLeft: {
    flex: 1,
  },
  messageBubbleRight: {
    alignItems: "flex-end",
  },
  messageName: {
    marginBottom: spacing.xs,
  },
  messageTime: {
    marginTop: spacing.xs,
    alignSelf: "flex-end",
  },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  memberLines: {
    flex: 1,
  },
  loadMoreWrap: {
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  clubCard: {
    marginBottom: spacing.sm,
  },
  clubHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  eventCard: {
    marginBottom: spacing.sm,
  },
  eventTopRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  eventFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.outlineVariant,
  },
  leaderboardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  leaderboardValue: {
    alignItems: "flex-end",
    minWidth: 52,
  },
  profileContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  profileHero: {
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  profileTagRow: {
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "center",
  },
  profileMetaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    width: "100%",
    justifyContent: "space-between",
  },
  statGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  statChip: {
    width: "31%",
    flexGrow: 1,
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: radius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  screenContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  clubHero: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  eventHero: {
    marginBottom: spacing.lg,
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  formField: {
    marginBottom: spacing.md,
  },
  tabRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  scoreGrid: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  gridRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  locationResults: {
    backgroundColor: colors.surfaceContainer,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: radius.xl,
    overflow: "hidden",
  },
  locationResultRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
  },
  homeHero: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  bootstrap: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },
  bootstrapLogo: {
    width: 140,
    height: 140,
  },
  bootstrapTitle: {
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  bootstrapCards: {
    width: "100%",
    maxWidth: 360,
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  });
}
