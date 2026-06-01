import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useRef, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ActivityStoryGroup } from "../lib/activityStories";
import { shareActivityStory } from "../lib/shareActivityStoryImage";
import { markStorySlideViewed } from "../lib/activityStoryViews";
import { colors, radius, spacing, typography } from "../lib/theme";
import { ActivityStoryCanvas } from "./ActivityStorySlide";
import { Avatar } from "./ui";

const SLIDE_DURATION_MS = 5500;

interface ActivityStoriesViewerProps {
  visible: boolean;
  groups: ActivityStoryGroup[];
  initialGroupIndex?: number;
  initialSlideIndex?: number;
  viewedSlideIds: Set<string>;
  onViewedChange: (ids: Set<string>) => void;
  onClose: () => void;
}

export function ActivityStoriesViewer({
  visible,
  groups,
  initialGroupIndex = 0,
  initialSlideIndex = 0,
  viewedSlideIds,
  onViewedChange,
  onClose,
}: ActivityStoriesViewerProps) {
  const insets = useSafeAreaInsets();
  const captureRef = useRef<View>(null);
  const [groupIndex, setGroupIndex] = useState(initialGroupIndex);
  const [slideIndex, setSlideIndex] = useState(initialSlideIndex);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [sharing, setSharing] = useState(false);

  const group = groups[groupIndex];
  const slide = group?.slides[slideIndex];

  useEffect(() => {
    if (!visible) return;
    setGroupIndex(initialGroupIndex);
    setSlideIndex(initialSlideIndex);
    setProgress(0);
  }, [visible, initialGroupIndex, initialSlideIndex]);

  const goNext = useCallback(() => {
    if (!group) return;

    if (slideIndex < group.slides.length - 1) {
      setSlideIndex((value) => value + 1);
      setProgress(0);
      return;
    }

    if (groupIndex < groups.length - 1) {
      setGroupIndex((value) => value + 1);
      setSlideIndex(0);
      setProgress(0);
      return;
    }

    onClose();
  }, [group, groupIndex, groups.length, onClose, slideIndex]);

  const goPrev = useCallback(() => {
    if (slideIndex > 0) {
      setSlideIndex((value) => value - 1);
      setProgress(0);
      return;
    }

    if (groupIndex > 0) {
      const prevGroup = groups[groupIndex - 1];
      setGroupIndex((value) => value - 1);
      setSlideIndex(Math.max(prevGroup.slides.length - 1, 0));
      setProgress(0);
    }
  }, [groupIndex, groups, slideIndex]);

  useEffect(() => {
    if (!visible || !slide || paused) return undefined;

    const started = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - started;
      const nextProgress = Math.min(elapsed / SLIDE_DURATION_MS, 1);
      setProgress(nextProgress);
      if (nextProgress >= 1) {
        clearInterval(timer);
        goNext();
      }
    }, 50);

    return () => clearInterval(timer);
  }, [visible, slide?.id, paused, goNext]);

  useEffect(() => {
    if (!visible || !slide || viewedSlideIds.has(slide.id)) return;

    void markStorySlideViewed(slide.id, viewedSlideIds).then(onViewedChange);
  }, [visible, slide?.id, viewedSlideIds, onViewedChange]);

  const handleShare = async () => {
    if (!slide || !group || sharing) return;
    setSharing(true);
    setPaused(true);
    try {
      await shareActivityStory(captureRef, slide, group.user);
    } finally {
      setSharing(false);
      setPaused(false);
    }
  };

  if (!group || !slide) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View
        style={[
          styles.root,
          { paddingTop: insets.top, paddingBottom: insets.bottom },
        ]}
      >
        <View style={styles.progressRow}>
          {group.slides.map((item, index) => (
            <View key={item.id} style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width:
                      index < slideIndex
                        ? "100%"
                        : index === slideIndex
                          ? `${progress * 100}%`
                          : "0%",
                  },
                ]}
              />
            </View>
          ))}
        </View>

        <View style={styles.viewerHeader}>
          <View style={styles.viewerUser}>
            <Avatar
              name={group.user.name}
              color={group.user.avatarColor}
              size={36}
              imageUrl={group.user.avatarUrl}
            />
            <View>
              <Text style={styles.viewerName}>
                {group.user.nickname ?? group.user.name}
              </Text>
              <Text style={styles.viewerSub}>
                {slideIndex + 1}/{group.slides.length}
                {slide.clubName ? ` · ${slide.clubName}` : ""}
              </Text>
            </View>
          </View>
          <Pressable
            onPress={onClose}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Close stories"
            style={styles.closeBtn}
          >
            <Ionicons name="close" size={28} color={colors.text} />
          </Pressable>
        </View>

        <View style={styles.slideArea}>
          <ActivityStoryCanvas
            ref={captureRef}
            slide={slide}
            user={group.user}
          />
          <View style={styles.tapZones} pointerEvents="box-none">
            <Pressable
              style={styles.tapLeft}
              onPress={goPrev}
              onLongPress={() => setPaused(true)}
              onPressOut={() => setPaused(false)}
            />
            <Pressable
              style={styles.tapRight}
              onPress={goNext}
              onLongPress={() => setPaused(true)}
              onPressOut={() => setPaused(false)}
            />
          </View>
        </View>

        <View style={styles.footer}>
          <Pressable
            style={[styles.shareBtn, sharing && styles.shareBtnDisabled]}
            onPress={handleShare}
            disabled={sharing}
          >
            <Ionicons
              name="share-social-outline"
              size={20}
              color={colors.text}
            />
            <Text style={styles.shareBtnText}>
              {sharing ? "Preparing…" : "Share story"}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#000",
  },
  progressRow: {
    flexDirection: "row",
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.sm,
  },
  progressTrack: {
    flex: 1,
    height: 3,
    borderRadius: radius.full,
    backgroundColor: `${colors.text}33`,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.text,
    borderRadius: radius.full,
  },
  viewerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    zIndex: 3,
  },
  viewerUser: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flex: 1,
  },
  viewerName: {
    ...typography.body,
    color: colors.text,
    fontWeight: "700",
  },
  viewerSub: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  closeBtn: {
    zIndex: 4,
  },
  slideArea: {
    flex: 1,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    position: "relative",
    zIndex: 1,
  },
  tapZones: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: "row",
  },
  tapLeft: {
    flex: 1,
  },
  tapRight: {
    flex: 2,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    zIndex: 3,
  },
  shareBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingVertical: spacing.md,
  },
  shareBtnDisabled: {
    opacity: 0.7,
  },
  shareBtnText: {
    ...typography.body,
    color: colors.text,
    fontWeight: "700",
  },
});
