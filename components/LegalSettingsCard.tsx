import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import {
  openSubscriptionManagement,
  restoreAllStarSubscription,
} from '@/lib/allStarPurchase';
import { isIapSupportedEnvironment } from '@/lib/iapConfig';
import { getAccountDeletionMailto, LEGAL_EMAIL } from '@/lib/legal';
import { SubscriptionError } from '@/lib/subscription';
import { colors, spacing, typography } from '@/lib/theme';
import { useAppStore } from '@/store/useAppStore';

interface LegalRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  destructive?: boolean;
}

function LegalRow({ icon, label, onPress, destructive }: LegalRowProps) {
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <Ionicons
        name={icon}
        size={20}
        color={destructive ? colors.error : colors.textMuted}
      />
      <Text style={[styles.rowLabel, destructive && styles.destructive]}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </Pressable>
  );
}

export function LegalSettingsCard() {
  const router = useRouter();
  const upgradeToAllStar = useAppStore((state) => state.upgradeToAllStar);
  const storeAvailable = isIapSupportedEnvironment();

  const openDeleteAccount = () => {
    Alert.alert(
      'Delete account',
      `To delete your account and personal data, email ${LEGAL_EMAIL} from the address linked to your account. We will confirm deletion within a reasonable time.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Email support',
          onPress: () => {
            void Linking.openURL(getAccountDeletionMailto());
          },
        },
      ],
    );
  };

  const handleRestorePurchases = async () => {
    try {
      const restored = await restoreAllStarSubscription();
      if (restored) {
        await upgradeToAllStar();
        Alert.alert('Restored', 'Your All-Star Baller subscription is active.');
        return;
      }
      Alert.alert(
        'No subscription found',
        'We could not find an active All-Star subscription for this store account.',
      );
    } catch (error) {
      Alert.alert(
        'Restore failed',
        error instanceof SubscriptionError
          ? error.message
          : 'Could not restore purchases. Try again.',
      );
    }
  };

  const handleManageSubscription = async () => {
    try {
      await openSubscriptionManagement();
    } catch (error) {
      Alert.alert(
        'Unavailable',
        error instanceof SubscriptionError
          ? error.message
          : 'Could not open subscription settings.',
      );
    }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.heading}>Legal</Text>
      <LegalRow
        icon="document-text-outline"
        label="Terms & Conditions"
        onPress={() => router.push('/legal/terms')}
      />
      <LegalRow
        icon="shield-checkmark-outline"
        label="Privacy Policy"
        onPress={() => router.push('/legal/privacy')}
      />
      {storeAvailable ? (
        <>
          <LegalRow
            icon="refresh-outline"
            label="Restore purchases"
            onPress={() => {
              void handleRestorePurchases();
            }}
          />
          <LegalRow
            icon="card-outline"
            label="Manage subscription"
            onPress={() => {
              void handleManageSubscription();
            }}
          />
        </>
      ) : null}
      <LegalRow
        icon="mail-outline"
        label="Contact support"
        onPress={() => void Linking.openURL(`mailto:${LEGAL_EMAIL}`)}
      />
      <LegalRow
        icon="trash-outline"
        label="Delete account"
        onPress={openDeleteAccount}
        destructive
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  heading: {
    ...typography.caption,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.cardBorder,
  },
  rowLabel: {
    ...typography.body,
    flex: 1,
    color: colors.text,
  },
  destructive: {
    color: colors.error,
  },
});
