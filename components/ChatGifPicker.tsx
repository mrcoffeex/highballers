import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  fetchTrendingGifs,
  GiphyGif,
  isGiphyConfigured,
  searchGifs,
} from "../lib/giphy";
import { colors, radius, spacing, typography } from "../lib/theme";

type ChatGifPickerProps = {
  onPick: (gif: GiphyGif) => void;
};

export function ChatGifPicker({ onPick }: ChatGifPickerProps) {
  const [query, setQuery] = useState("");
  const [gifs, setGifs] = useState<GiphyGif[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const configured = isGiphyConfigured();

  useEffect(() => {
    if (!configured) return;

    const term = query.trim();
    let cancelled = false;
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    const timer = setTimeout(
      () => {
        setLoading(true);
        setError(null);
        const load = term ? searchGifs(term) : fetchTrendingGifs();
        void load
          .then((items) => {
            if (cancelled || requestIdRef.current !== requestId) return;
            setGifs(items);
          })
          .catch((err) => {
            if (cancelled || requestIdRef.current !== requestId) return;
            setGifs([]);
            setError(
              err instanceof Error ? err.message : "Could not load GIFs.",
            );
          })
          .finally(() => {
            if (cancelled || requestIdRef.current !== requestId) return;
            setLoading(false);
          });
      },
      term ? 350 : 0,
    );

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [configured, query]);

  if (!configured) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyWrap}>
          <Ionicons name="images-outline" size={28} color={colors.textDim} />
          <Text style={styles.emptyTitle}>GIF search not configured</Text>
          <Text style={styles.emptyText}>
            Add EXPO_PUBLIC_GIPHY_API_KEY to your .env file. Get a free key at
            developers.giphy.com
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchWrap}>
        <Ionicons
          name="search-outline"
          size={18}
          color={colors.textDim}
          style={styles.searchIcon}
        />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search GIFs"
          placeholderTextColor={colors.textMuted}
          style={styles.searchInput}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      {loading && gifs.length === 0 ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : (
        <FlatList
          data={gifs}
          keyExtractor={(item) => item.id}
          numColumns={3}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.column}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => onPick(item)}
              style={({ pressed }) => [
                styles.gifCell,
                pressed && styles.gifCellPressed,
              ]}
              accessibilityLabel={`Send GIF ${item.title}`}
            >
              <Image
                source={{ uri: item.previewUrl }}
                style={styles.gifPreview}
                contentFit="cover"
              />
            </Pressable>
          )}
          ListEmptyComponent={
            !loading ? (
              <Text style={styles.emptyText}>
                No GIFs found. Try another search.
              </Text>
            ) : null
          }
        />
      )}

      <Text style={styles.attribution}>Powered by GIPHY</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 260,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
    backgroundColor: colors.surface,
  },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.card,
    paddingHorizontal: spacing.sm,
  },
  searchIcon: {
    marginRight: spacing.xs,
  },
  searchInput: {
    flex: 1,
    height: 40,
    color: colors.text,
    fontSize: 15,
  },
  grid: {
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.xs,
  },
  column: {
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  gifCell: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: radius.md,
    overflow: "hidden",
    backgroundColor: colors.card,
  },
  gifCellPressed: {
    opacity: 0.85,
  },
  gifPreview: {
    width: "100%",
    height: "100%",
  },
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    ...typography.caption,
    color: colors.error,
    textAlign: "center",
    padding: spacing.md,
  },
  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
    gap: spacing.sm,
  },
  emptyTitle: {
    ...typography.label,
    color: colors.text,
    textAlign: "center",
  },
  emptyText: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: "center",
  },
  attribution: {
    ...typography.caption,
    color: colors.textDim,
    fontSize: 10,
    textAlign: "center",
    paddingBottom: spacing.xs,
  },
});
