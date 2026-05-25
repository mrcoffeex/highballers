import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { StatSlider } from '../../components/StatSlider';
import { Button, Input } from '../../components/ui';
import { AVATAR_COLORS } from '../../lib/seedData';
import { colors, radius, spacing, typography } from '../../lib/theme';
import { POSITIONS, Position } from '../../lib/types';
import { useAppStore } from '../../store/useAppStore';

export default function EditProfileScreen() {
  const router = useRouter();
  const user = useAppStore((state) => state.getCurrentUser());
  const updateProfile = useAppStore((state) => state.updateProfile);
  const updateStats = useAppStore((state) => state.updateStats);

  const [name, setName] = useState(user?.name ?? '');
  const [nickname, setNickname] = useState(user?.nickname ?? '');
  const [position, setPosition] = useState<Position>(user?.position ?? 'SG');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [avatarColor, setAvatarColor] = useState(user?.avatarColor ?? AVATAR_COLORS[0]);
  const [stats, setStats] = useState(user?.stats);

  if (!user || !stats) {
    return null;
  }

  const handleSave = () => {
    updateProfile({
      name: name.trim(),
      nickname: nickname.trim() || undefined,
      position,
      bio: bio.trim() || undefined,
      avatarColor,
    });
    updateStats(stats);
    router.back();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.label}>Full Name</Text>
      <Input value={name} onChangeText={setName} style={styles.field} />

      <Text style={styles.label}>Nickname</Text>
      <Input value={nickname} onChangeText={setNickname} placeholder="Optional" style={styles.field} />

      <Text style={styles.label}>Bio</Text>
      <Input
        value={bio}
        onChangeText={setBio}
        placeholder="Tell others about your game..."
        multiline
        numberOfLines={2}
        style={[styles.field, styles.textArea]}
      />

      <Text style={styles.label}>Position</Text>
      <View style={styles.positionRow}>
        {POSITIONS.map((pos) => (
          <Pressable
            key={pos}
            onPress={() => setPosition(pos)}
            style={[styles.positionChip, position === pos && styles.positionChipActive]}
          >
            <Text style={[styles.positionText, position === pos && styles.positionTextActive]}>{pos}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Avatar Color</Text>
      <View style={styles.colorRow}>
        {AVATAR_COLORS.map((color) => (
          <Pressable
            key={color}
            onPress={() => setAvatarColor(color)}
            style={[
              styles.colorSwatch,
              { backgroundColor: color },
              avatarColor === color && styles.colorSwatchActive,
            ]}
          />
        ))}
      </View>

      <Text style={styles.sectionTitle}>Physical Stats</Text>
      <StatSlider label="Height" value={stats.height} onChange={(height) => setStats({ ...stats, height })} min={150} max={220} unit="cm" />
      <StatSlider label="Weight" value={stats.weight} onChange={(weight) => setStats({ ...stats, weight })} min={50} max={130} unit="kg" />
      <StatSlider label="Speed" value={stats.speed} onChange={(speed) => setStats({ ...stats, speed })} />
      <StatSlider label="Strength" value={stats.strength} onChange={(strength) => setStats({ ...stats, strength })} />
      <StatSlider label="Shooting" value={stats.shooting} onChange={(shooting) => setStats({ ...stats, shooting })} />
      <StatSlider label="Defense" value={stats.defense} onChange={(defense) => setStats({ ...stats, defense })} />
      <StatSlider label="Stamina" value={stats.stamina} onChange={(stamina) => setStats({ ...stats, stamina })} />

      <Button title="Save Changes" onPress={handleSave} size="lg" style={styles.submit} />
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
    paddingBottom: spacing.xxl,
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
  textArea: {
    minHeight: 72,
    textAlignVertical: 'top',
  },
  positionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  positionChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  positionChipActive: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}15`,
  },
  positionText: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '700',
  },
  positionTextActive: {
    color: colors.primary,
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  colorSwatch: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
  },
  colorSwatchActive: {
    borderWidth: 3,
    borderColor: colors.text,
  },
  sectionTitle: {
    ...typography.heading,
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  submit: {
    marginTop: spacing.lg,
  },
});
