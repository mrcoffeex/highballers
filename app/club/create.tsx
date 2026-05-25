import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button, Input } from '../../components/ui';
import { AVATAR_COLORS } from '../../lib/seedData';
import { colors, radius, spacing, typography } from '../../lib/theme';
import { useAppStore } from '../../store/useAppStore';

export default function CreateClubScreen() {
  const router = useRouter();
  const createClub = useAppStore((state) => state.createClub);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [iconColor, setIconColor] = useState(AVATAR_COLORS[0]);

  const canCreate = name.trim().length >= 3 && location.trim().length >= 3;

  const handleCreate = () => {
    const id = createClub({
      name: name.trim(),
      description: description.trim() || 'A new basketball club on HighBallers.',
      location: location.trim(),
      iconColor,
    });

    if (id) {
      router.replace(`/club/${id}`);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.label}>Club Name</Text>
      <Input placeholder="e.g. Downtown Hoopers" value={name} onChangeText={setName} style={styles.field} />

      <Text style={styles.label}>Location</Text>
      <Input placeholder="Where do you play?" value={location} onChangeText={setLocation} style={styles.field} />

      <Text style={styles.label}>Description</Text>
      <Input
        placeholder="Tell ballers what your club is about..."
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={3}
        style={[styles.field, styles.textArea]}
      />

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

      <Button title="Create Club" onPress={handleCreate} disabled={!canCreate} size="lg" style={styles.submit} />
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
    minHeight: 88,
    textAlignVertical: 'top',
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  colorSwatch: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorSwatchActive: {
    borderWidth: 3,
    borderColor: colors.text,
  },
  submit: {
    marginTop: spacing.lg,
  },
});
