import * as Sharing from "expo-sharing";
import type { RefObject } from "react";
import { Platform, Share, type View } from "react-native";
import { captureRef } from "react-native-view-shot";

import { ActivityStorySlide } from "./activityStories";
import { formatActivityStoryShareMessage } from "./activityStoryShare";
import { UserProfile } from "./types";

export async function shareActivityStory(
  captureTarget: RefObject<View | null>,
  slide: ActivityStorySlide,
  user: UserProfile,
) {
  const message = formatActivityStoryShareMessage(slide, user);

  if (Platform.OS === "web") {
    if (typeof navigator !== "undefined" && navigator.share) {
      await navigator.share({
        title: `${user.nickname ?? user.name} on HighBallers`,
        text: message,
      });
      return;
    }

    await Share.share({ message });
    return;
  }

  try {
    if (captureTarget.current) {
      const uri = await captureRef(captureTarget, {
        format: "png",
        quality: 1,
        result: "tmpfile",
      });

      const canShareFile = await Sharing.isAvailableAsync();
      if (canShareFile) {
        await Sharing.shareAsync(uri, {
          mimeType: "image/png",
          dialogTitle: "Share game story",
        });
        return;
      }
    }
  } catch {
    // Fall through to text share.
  }

  await Share.share({ message, title: "HighBallers game story" });
}
