import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "@/lib/expoRouter";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { ClubVisibilityPicker } from "../../../components/ClubVisibilityPicker";
import { ImagePickerField } from "../../../components/ImagePickerField";
import { UpgradeModal } from "../../../components/UpgradeModal";
import { Button, Input } from "../../../components/ui";
import { BASIC_MAX_CLUB_MEMBERS } from "../../../lib/subscription";
import { useUpgradePrompt } from "../../../lib/useUpgradePrompt";
import { AVATAR_COLORS } from "../../../lib/seedData";
import { formatSyncError } from "../../../lib/syncErrors";
import { colors, radius, spacing, typography } from "../../../lib/theme";
import { ClubVisibility } from "../../../lib/types";
import { useClubMembershipLimits, useIsAllStar } from "../../../store/hooks";
import { useAppStore } from "../../../store/useAppStore";

export default function CreateClubScreen() {
  const router = useRouter();
  const createClub = useAppStore((state) => state.createClub);
  const upgradeToAllStar = useAppStore((state) => state.upgradeToAllStar);
  const limits = useClubMembershipLimits();
  const isPro = useIsAllStar();
  const {
    upgradeVisible,
    upgradeReason,
    promptUpgrade,
    closeUpgrade,
    handleSubscriptionError,
  } = useUpgradePrompt();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [iconColor, setIconColor] = useState(AVATAR_COLORS[0]);
  const [visibility, setVisibility] = useState<ClubVisibility>("open");
  const [logoUri, setLogoUri] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit =
    limits.canCreateClub &&
    name.trim().length >= 3 &&
    location.trim().length >= 3;

  const handleCreate = async () => {
    if (!limits.canCreateClub) {
      promptUpgrade(
        limits.createBlockedReason ?? "Basic Ballers can create only one club.",
      );
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await createClub(
        {
          name: name.trim(),
          description:
            description.trim() || "A new basketball club on HighBallers.",
          location: location.trim(),
          iconColor,
          visibility: isPro ? visibility : "open",
        },
        logoUri,
      );
      router.replace("/(tabs)/clubs");
    } catch (err) {
      if (handleSubscriptionError(err)) return;
      setError(formatSyncError(err, "Could not create club. Try again."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {!isPro ? (
        <View style={styles.planBanner}>
          <Text style={styles.planBannerTitle}>Basic Baller club</Text>
          <Text style={styles.planBannerText}>
            Create {limits.ownedCount}/{limits.maxOwned} club · join{" "}
            {limits.joinedCount}/{limits.maxJoined} other · up to{" "}
            {BASIC_MAX_CLUB_MEMBERS} members · open clubs only
          </Text>
        </View>
      ) : null}

      <ImagePickerField
        label="Club Logo"
        imageUri={logoUri}
        fallbackName={name || "Club"}
        fallbackColor={iconColor}
        shape="rounded"
        size={72}
        onPick={setLogoUri}
      />

      <Text style={styles.label}>Club Name</Text>
      <Input
        placeholder="e.g. Downtown Hoopers"
        value={name}
        onChangeText={setName}
        style={styles.field}
      />

      <Text style={styles.label}>Location</Text>
      <Input
        placeholder="Where do you play?"
        value={location}
        onChangeText={setLocation}
        style={styles.field}
      />

      <Text style={styles.label}>Description</Text>
      <Input
        placeholder="Tell ballers what your club is about..."
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={3}
        style={[styles.field, styles.textArea]}
      />

      <Text style={styles.label}>Club Type</Text>
      <View style={styles.visibilityPicker}>
        <ClubVisibilityPicker
          value={visibility}
          onChange={setVisibility}
          isPro={isPro}
          onRequirePro={promptUpgrade}
        />
      </View>

      <Text style={styles.label}>Club Color</Text>
      <View style={styles.colorRow}>
        {AVATAR_COLORS.map((color) => (
          <Pressable
            key={color}
            onPress={() => setIconColor(color)}
            style={[
              styles.colorSwatch,
              { backgroundColor: color },
              iconColor === color && styles.colorSwatchActive,
            ]}
          >
            {iconColor === color ? (
              <Ionicons name="checkmark" size={18} color={colors.text} />
            ) : null}
          </Pressable>
        ))}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Button
        title="Create Club"
        onPress={handleCreate}
        disabled={!canSubmit}
        loading={loading}
        size="lg"
        style={styles.submit}
      />

      <UpgradeModal
        visible={upgradeVisible}
        reason={upgradeReason}
        onClose={closeUpgrade}
        onPurchased={() => {
          void upgradeToAllStar();
        }}
      />
    </ScrollView>
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
  planBanner: {
    backgroundColor: `${colors.primary}12`,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: `${colors.primary}44`,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  planBannerTitle: {
    ...typography.label,
    color: colors.primary,
  },
  planBannerText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  label: {
    ...typography.label,
    color: colors.textMuted,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  field: {
    marginBottom: spacing.sm,
  },
  visibilityPicker: {
    marginBottom: spacing.md,
  },
  textArea: {
    minHeight: 88,
    textAlignVertical: "top",
  },
  colorRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  colorSwatch: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  colorSwatchActive: {
    borderWidth: 3,
    borderColor: colors.text,
  },
  submit: {
    marginTop: spacing.lg,
  },
  error: {
    ...typography.body,
    color: colors.error,
    marginTop: spacing.md,
    textAlign: "center",
  },
});
