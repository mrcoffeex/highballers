import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Input } from '../components/ui';
import { getOAuthRedirectUri } from '../lib/googleAuth';
import { isSupabaseEnabled } from '../lib/config';
import { validateSupabaseConnection } from '../lib/validateSupabase';
import { colors, radius, spacing, typography } from '../lib/theme';
import { useAppStore } from '../store/useAppStore';

export default function AuthScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const signIn = useAppStore((state) => state.signIn);
  const signUp = useAppStore((state) => state.signUp);
  const signInWithGoogle = useAppStore((state) => state.signInWithGoogle);
  const syncSessionFromSupabase = useAppStore((state) => state.syncSessionFromSupabase);

  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseEnabled) return;

    validateSupabaseConnection().then((message) => {
      if (message) setConfigError(message);
    });
  }, []);

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);

    const message = mode === 'signIn'
      ? await signIn(email.trim(), password)
      : await signUp(email.trim(), password);

    setLoading(false);

    if (message) {
      setError(message);
      return;
    }

    router.replace('/');
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setGoogleLoading(true);

    const message = await signInWithGoogle();
    if (message) {
      setGoogleLoading(false);
      setError(message);
      return;
    }

    // Web navigates away to Google; mobile completes inline below.
    if (Platform.OS !== 'web') {
      await syncSessionFromSupabase();
      setGoogleLoading(false);
      router.replace('/');
    }
  };

  const continueOffline = () => {
    router.replace('/onboarding');
  };

  return (
    <LinearGradient colors={['#0A0E14', '#141C28', '#0A0E14']} style={styles.container}>
      <View style={[styles.content, { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.lg }]}>
        <View style={styles.hero}>
          <View style={styles.logoCircle}>
            <Ionicons name="basketball" size={40} color={colors.primary} />
          </View>
          <Text style={styles.brand}>HighBallers</Text>
          <Text style={styles.tagline}>Sign in to sync clubs and games across devices.</Text>
        </View>

        {isSupabaseEnabled ? (
          <>
            <Button
              title="Continue with Google"
              onPress={handleGoogleSignIn}
              loading={googleLoading}
              disabled={loading || !!configError}
              variant="outline"
              size="lg"
              icon={<Ionicons name="logo-google" size={20} color={colors.text} />}
              style={styles.googleBtn}
            />

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or use email</Text>
              <View style={styles.dividerLine} />
            </View>
          </>
        ) : null}

        <View style={styles.tabs}>
          <Pressable
            onPress={() => setMode('signIn')}
            style={[styles.tab, mode === 'signIn' && styles.tabActive]}
          >
            <Text style={[styles.tabText, mode === 'signIn' && styles.tabTextActive]}>Sign In</Text>
          </Pressable>
          <Pressable
            onPress={() => setMode('signUp')}
            style={[styles.tab, mode === 'signUp' && styles.tabActive]}
          >
            <Text style={[styles.tabText, mode === 'signUp' && styles.tabTextActive]}>Sign Up</Text>
          </Pressable>
        </View>

        <Input
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          style={styles.field}
        />
        <Input
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={styles.field}
        />

        {configError ? <Text style={styles.configError}>{configError}</Text> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Button
          title={mode === 'signIn' ? 'Sign In' : 'Create Account'}
          onPress={handleSubmit}
          loading={loading}
          disabled={googleLoading || !!configError || !email.trim() || password.length < 6}
          size="lg"
          style={styles.submit}
        />

        {!isSupabaseEnabled ? (
          <>
            <Text style={styles.note}>
              Add Supabase env vars to enable cloud sync. You can still play locally.
            </Text>
            <Button title="Continue Offline" variant="outline" onPress={continueOffline} />
          </>
        ) : __DEV__ ? (
          <Text style={styles.note}>OAuth redirect: {getOAuthRedirectUri()}</Text>
        ) : null}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  hero: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${colors.primary}20`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: `${colors.primary}40`,
  },
  brand: {
    ...typography.hero,
    color: colors.text,
  },
  tagline: {
    ...typography.body,
    color: colors.textMuted,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  googleBtn: {
    marginBottom: spacing.lg,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.cardBorder,
  },
  dividerText: {
    ...typography.caption,
    color: colors.textDim,
  },
  tabs: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    alignItems: 'center',
  },
  tabActive: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}15`,
  },
  tabText: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '700',
  },
  tabTextActive: {
    color: colors.primary,
  },
  field: {
    marginBottom: spacing.sm,
  },
  error: {
    ...typography.caption,
    color: colors.error,
    marginBottom: spacing.sm,
  },
  configError: {
    ...typography.body,
    color: colors.error,
    backgroundColor: `${colors.error}15`,
    borderWidth: 1,
    borderColor: `${colors.error}40`,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  submit: {
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  note: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
});
