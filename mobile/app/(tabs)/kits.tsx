import {
  FlatList, Text, View, StyleSheet,
  useWindowDimensions, ScrollView, TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState, useMemo, useEffect } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { KitCard } from '@/components/KitCard';
import { TEAM_KITS, TeamKit } from '@/constants/teamKits';
import { colors, r } from '@/constants/theme';
import { useFavorites } from '@/hooks/useFavorites';

// ── ヘッダー ────────────────────────────────────────────────────────
function Header() {
  return (
    <View style={s.header}>
      <View style={s.labelRow}>
        <View style={s.labelBar} />
        <Text style={s.labelText}>KITS</Text>
      </View>
      <Text style={s.title}>決勝T出場国ユニフォーム</Text>
      <Text style={s.sub}>32チームのホーム・アウェイユニフォームと購入先</Text>
    </View>
  );
}

// ── フィルターバー ──────────────────────────────────────────────────
function FilterBar({
  selected,
  onSelect,
  sortedTeams,
  favCodes,
}: {
  selected: string | null;
  onSelect: (code: string | null) => void;
  sortedTeams: TeamKit[];
  favCodes: Set<string>;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={f.bar}
    >
      {/* すべて */}
      <TouchableOpacity
        style={[f.chip, selected === null && f.chipActive]}
        onPress={() => onSelect(null)}
        activeOpacity={0.7}
      >
        <Text style={[f.chipText, selected === null && f.chipTextActive]}>すべて</Text>
      </TouchableOpacity>

      {sortedTeams.map((team) => {
        const isFav = favCodes.has(team.code);
        const isSelected = selected === team.code;
        return (
          <TouchableOpacity
            key={team.code}
            style={[
              f.chip,
              isFav && f.chipFav,
              isSelected && f.chipActive,
            ]}
            onPress={() => onSelect(isSelected ? null : team.code)}
            activeOpacity={0.7}
          >
            <Text style={[f.chipText, isSelected && f.chipTextActive]}>
              {team.flag} {team.code}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

// ── メイン画面 ──────────────────────────────────────────────────────
export default function KitsScreen() {
  const { width } = useWindowDimensions();
  const { top } = useSafeAreaInsets();
  const { code: codeParam } = useLocalSearchParams<{ code?: string }>();
  const [selected, setSelected] = useState<string | null>(codeParam ?? null);

  // ホーム画面からの遷移でフィルターを更新
  useEffect(() => {
    if (codeParam) setSelected(codeParam);
  }, [codeParam]);

  const { data: favorites } = useFavorites();
  const favCodes = useMemo(
    () => new Set((favorites ?? []).map((f) => f.code)),
    [favorites],
  );

  const imgW = Math.floor((width - 16 * 2 - 16 * 2 - 12) / 2);

  // お気に入りを先頭に、その他はグループ順（TEAM_KITS の並び）
  const sortedTeams = useMemo(
    () =>
      [...TEAM_KITS].sort((a, b) => {
        const aFav = favCodes.has(a.code) ? 0 : 1;
        const bFav = favCodes.has(b.code) ? 0 : 1;
        return aFav - bFav;
      }),
    [favCodes],
  );

  const displayTeams = useMemo(
    () => (selected ? sortedTeams.filter((t) => t.code === selected) : sortedTeams),
    [selected, sortedTeams],
  );

  return (
    <FlatList
      style={[s.container, { paddingTop: top }]}
      data={displayTeams}
      keyExtractor={(item) => item.code}
      renderItem={({ item }) => <KitCard team={item} imgW={imgW} />}
      ListHeaderComponent={
        <>
          <Header />
          <FilterBar
            selected={selected}
            onSelect={setSelected}
            sortedTeams={sortedTeams}
            favCodes={favCodes}
          />
        </>
      }
      contentContainerStyle={s.list}
      initialNumToRender={4}
      maxToRenderPerBatch={4}
      windowSize={8}
      removeClippedSubviews
    />
  );
}

// ── スタイル ────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  list:      { paddingBottom: 40 },

  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 18,
  },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  labelBar: { width: 3, height: 14, borderRadius: 2, backgroundColor: colors.gold },
  labelText: {
    color: colors.gold,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  title: { color: colors.white, fontSize: 20, fontWeight: '800', marginBottom: 4 },
  sub:   { color: colors.textMuted, fontSize: 12 },
});

const f = StyleSheet.create({
  bar: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chip: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: r.full,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  chipFav: {
    borderColor: colors.gold,
  },
  chipActive: {
    backgroundColor: colors.gold,
    borderColor: colors.gold,
  },
  chipText: {
    color: colors.textSec,
    fontSize: 12,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#000',
  },
});
