import { ScrollView, StyleSheet, Text, View } from "react-native";

import type { LegalSection } from "@/lib/legalDocuments";
import { colors, spacing, typography } from "@/lib/theme";

interface LegalDocumentViewProps {
  title: string;
  sections: LegalSection[];
}

export function LegalDocumentView({ title, sections }: LegalDocumentViewProps) {
  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.pageTitle}>{title}</Text>
      {sections.map((section) => (
        <View key={section.title} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          {section.paragraphs.map((paragraph, index) => (
            <Text key={`${section.title}-p-${index}`} style={styles.paragraph}>
              {paragraph}
            </Text>
          ))}
          {section.bullets?.map((bullet, index) => (
            <View key={`${section.title}-b-${index}`} style={styles.bulletRow}>
              <Text style={styles.bulletMarker}>•</Text>
              <Text style={styles.bulletText}>{bullet}</Text>
            </View>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  pageTitle: {
    ...typography.title,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.heading,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  paragraph: {
    ...typography.body,
    color: colors.textMuted,
    marginBottom: spacing.sm,
    lineHeight: 22,
  },
  bulletRow: {
    flexDirection: "row",
    marginBottom: spacing.xs,
    paddingLeft: spacing.xs,
  },
  bulletMarker: {
    ...typography.body,
    color: colors.accent,
    width: 16,
    lineHeight: 22,
  },
  bulletText: {
    ...typography.body,
    flex: 1,
    color: colors.textMuted,
    lineHeight: 22,
  },
});
