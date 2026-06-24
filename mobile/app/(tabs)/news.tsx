import { FlatList, ScrollView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { useMatches } from '@/hooks/useMatches';
import { useAllStandings } from '@/hooks/useStandings';
import { MatchCard } from '@/components/MatchCard';
import { colors, r } from '@/constants/theme';
import { toJSTDateKey, formatDatePill } from '@/lib/matchUtils';

type MainTab = 'matches' | 'standings';
type MatchStage = 'group' | 'knockout';

export default function MatchesStandingsScreen() {
  const { top } = useSafeAreaInsets();
  const [mainTab, setMainTab] = useState<MainTab>('matches');
  const [matchStage, setMatchStage] = useState<MatchStage>('group');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  return (
    <View style={[styles.container, { paddingTop: top }]}>
      {/* PLスタイルのアンダーラインタブ */}
      <View style={styles.mainTabBar}>
        {([['matches','試合'], ['standings','順位表']] as [MainTab, string][]).map(([tab, label]) => (
          <TouchableOpacity key={tab} style={styles.mainTabBtn} onPress={() => setMainTab(tab)}>
            <Text style={[styles.mainTabText, mainTab === tab && styles.mainTabTextActive]}>{label}</Text>
            {mainTab === tab && <View style={styles.mainTabUnderline} />}
          </TouchableOpacity>
        ))}
      </View>

      {mainTab === 'matches' ? (
        <MatchesView {...{ matchStage, setMatchStage, selectedDate, setSelectedDate }} />
      ) : (
        <StandingsView />
      )}
    </View>
  );
}

type MVProps = {
  matchStage: MatchStage; setMatchStage: (v: MatchStage) => void;
  selectedDate: string | null; setSelectedDate: (v: string) => void;
};

function MatchesView({ matchStage, setMatchStage, selectedDate, setSelectedDate }: MVProps) {
  const isGroup = matchStage === 'group';

  // グループ・決勝T ともに全件取得して日付でフィルター
  const { data: allGroupMatches, isLoading: groupLoading } = useMatches(isGroup ? { stage: 'GROUP' } : undefined);
  const { data: allKnockoutMatches, isLoading: knockoutLoading } = useMatches(!isGroup ? { stage: 'KNOCKOUT' } : undefined);
  const allMatches = isGroup ? allGroupMatches : allKnockoutMatches;
  const isLoading = isGroup ? groupLoading : knockoutLoading;

  // JST日付ごとに仕分け
  const dateMap = useMemo(() => {
    const map: Record<string, typeof allMatches> = {};
    for (const m of allMatches ?? []) {
      const key = toJSTDateKey(m.matchDate);
      if (!map[key]) map[key] = [];
      map[key]!.push(m);
    }
    return map;
  }, [allMatches]);

  const sortedDates = useMemo(() => Object.keys(dateMap).sort(), [dateMap]);

  // デフォルト: FINISHEDの試合がある最新日 → なければ最初の日付
  const defaultDate = useMemo(() => {
    if (!sortedDates.length) return null;
    const datesWithFinished = sortedDates
      .filter((d) => dateMap[d]?.some((m) => m.status === 'FINISHED' || m.status === 'LIVE'))
      .sort();
    return datesWithFinished.at(-1) ?? sortedDates[0];
  }, [sortedDates, dateMap]);

  const activeDate = selectedDate && sortedDates.includes(selectedDate)
    ? selectedDate
    : defaultDate;

  const displayMatches = dateMap[activeDate ?? ''] ?? [];

  const chipListRef = useRef<FlatList>(null);
  const activeDateIndex = activeDate ? sortedDates.indexOf(activeDate) : -1;
  const activeDateIndexRef = useRef(activeDateIndex);
  activeDateIndexRef.current = activeDateIndex;
  const isUserTap = useRef(false);

  // 初回表示・デフォルト日付確定時のみスクロール（ユーザータップ時はスキップ）
  useEffect(() => {
    if (activeDateIndex < 0) return;
    if (isUserTap.current) {
      isUserTap.current = false;
      return;
    }
    const timer = setTimeout(() => {
      chipListRef.current?.scrollToIndex({ index: activeDateIndex, animated: false, viewPosition: 0 });
    }, 150);
    return () => clearTimeout(timer);
  }, [activeDateIndex]);

  // タブ戻り時にアクティブ日付を左端へスクロール
  useFocusEffect(
    useCallback(() => {
      const idx = activeDateIndexRef.current;
      if (idx < 0) return;
      const timer = setTimeout(() => {
        chipListRef.current?.scrollToIndex({ index: idx, animated: false, viewPosition: 0 });
      }, 200);
      return () => clearTimeout(timer);
    }, [])
  );

  return (
    <View style={{ flex: 1 }}>
      {/* グループステージ | 決勝T */}
      <View style={styles.stageRow}>
        {(['group', 'knockout'] as MatchStage[]).map((s) => (
          <TouchableOpacity key={s} style={styles.stageTabItem} onPress={() => setMatchStage(s)}>
            <Text style={[styles.stageTabText, matchStage === s && styles.stageTabTextActive]}>
              {s === 'group' ? 'グループステージ' : '決勝トーナメント'}
            </Text>
            {matchStage === s && <View style={styles.stageTabUnderline} />}
          </TouchableOpacity>
        ))}
      </View>

      {/* 日付チップ（グループ・決勝T 共通） */}
      <FlatList
        ref={chipListRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipScroll}
        contentContainerStyle={styles.chipContent}
        data={sortedDates}
        keyExtractor={(d) => d}
        onScrollToIndexFailed={() => {}}
        renderItem={({ item: d }) => (
          <TouchableOpacity style={[styles.chip, activeDate === d && styles.chipActive]} onPress={() => {
              isUserTap.current = true;
              setSelectedDate(d);
            }}>
            <Text style={[styles.chipText, activeDate === d && styles.chipTextActive]}>{formatDatePill(d)}</Text>
          </TouchableOpacity>
        )}
      />

      {isLoading ? (
        <View style={styles.center}><ActivityIndicator color={colors.gold} /></View>
      ) : !displayMatches.length ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>試合データなし</Text>
        </View>
      ) : (
        <ScrollView>
          <View style={styles.matchSurface}>
            {activeDate && (
              <Text style={styles.dateHeading}>{formatDatePill(activeDate)}</Text>
            )}
            {displayMatches.map((m) => <MatchCard key={m.id} match={m} />)}
          </View>
          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </View>
  );
}

function StandingsView() {
  const { data, isLoading } = useAllStandings();
  if (isLoading) return <View style={styles.center}><ActivityIndicator color={colors.gold} /></View>;
  return (
    <ScrollView contentContainerStyle={styles.standingsContent}>
      {data?.map(({ group, standings }) => (
        <View key={group} style={styles.standingsGroup}>
          <View style={styles.standingsGroupHeader}>
            <Text style={styles.standingsGroupLabel}>GROUP</Text>
            <Text style={styles.standingsGroupTitle}>{group}</Text>
          </View>
          <View style={styles.table}>
            <View style={styles.tableHead}>
              {['#', 'チーム', 'P', 'W', 'D', 'L', 'GF', 'GA', 'GD', 'Pts'].map((h) => (
                <Text key={h} style={[h === 'チーム' ? styles.colName : styles.colNum, styles.headText]}>{h}</Text>
              ))}
            </View>
            {standings.map((row, i) => {
              const qualify = i < 2;
              return (
                <View key={row.country.id} style={[styles.tableRow, i % 2 === 1 && styles.tableRowAlt]}>
                  <Text style={[styles.colNum, qualify && styles.qualifyText]}>{i + 1}</Text>
                  <View style={styles.colName}>
                    <Text style={styles.rowFlag}>{row.country.flagEmoji ?? '🏳️'}</Text>
                    <Text style={styles.rowName} numberOfLines={1}>{row.country.name}</Text>
                  </View>
                  <Text style={styles.colNum}>{row.played}</Text>
                  <Text style={styles.colNum}>{row.wins}</Text>
                  <Text style={styles.colNum}>{row.draws}</Text>
                  <Text style={styles.colNum}>{row.losses}</Text>
                  <Text style={styles.colNum}>{row.goalsFor}</Text>
                  <Text style={styles.colNum}>{row.goalsAgainst}</Text>
                  <Text style={[styles.colNum, { color: row.goalDiff > 0 ? colors.green : row.goalDiff < 0 ? colors.red : colors.textSec }]}>
                    {row.goalDiff > 0 ? `+${row.goalDiff}` : row.goalDiff}
                  </Text>
                  <Text style={[styles.colNum, styles.ptsText]}>{row.points}</Text>
                </View>
              );
            })}
          </View>
        </View>
      ))}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: colors.textMuted, fontSize: 14, textAlign: 'center', paddingHorizontal: 32 },
  // ── PLスタイルのアンダーラインタブ ──
  mainTabBar: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 4,
    marginBottom: 4,
  },
  mainTabBtn: { flex: 1, alignItems: 'center', paddingVertical: 12, position: 'relative' },
  mainTabText: { color: colors.textMuted, fontWeight: '500', fontSize: 13 },
  mainTabTextActive: { color: colors.white, fontWeight: '700' },
  mainTabUnderline: { position: 'absolute', bottom: 0, left: 16, right: 16, height: 2, backgroundColor: colors.gold, borderRadius: 1 },

  // ── ステージ切替（アンダーラインスタイル） ──
  stageRow: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 4,
    marginBottom: 4,
  },
  stageTabItem: { flex: 1, alignItems: 'center', paddingVertical: 10, position: 'relative' },
  stageTabText: { color: colors.textMuted, fontSize: 12, fontWeight: '500' },
  stageTabTextActive: { color: colors.white, fontWeight: '700' },
  stageTabUnderline: { position: 'absolute', bottom: 0, left: 12, right: 12, height: 2, backgroundColor: colors.gold, borderRadius: 1 },

  // ── 日付チップ ──
  chip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: r.full, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  chipActive: { backgroundColor: 'rgba(240,180,41,0.15)', borderColor: colors.gold },
  chipText: { color: colors.textMuted, fontWeight: '500', fontSize: 12 },
  chipTextActive: { color: colors.gold, fontWeight: '700' },

  // ── 試合リスト ──
  matchSurface: { backgroundColor: colors.surface, marginHorizontal: 12, borderRadius: 12, overflow: 'hidden' },
  matchGroup: { marginBottom: 16 },
  groupLabel: { color: colors.gold, fontSize: 10, fontWeight: '700', letterSpacing: 1.5, marginBottom: 8, textTransform: 'uppercase' },
  dateHeading: { color: colors.textSec, fontSize: 11, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },

  // ── 日付チップスクロール ──
  chipScroll: { maxHeight: 46 },
  chipContent: { paddingHorizontal: 12, gap: 8, paddingBottom: 8, alignItems: 'center' },

standingsContent: { padding: 12 },
  standingsGroup: { marginBottom: 20 },
  standingsGroupHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  standingsGroupLabel: { color: colors.gold, fontSize: 9, fontWeight: '700', letterSpacing: 1.5 },
  standingsGroupTitle: { color: colors.white, fontSize: 16, fontWeight: '800' },
  table: { borderRadius: r.md, overflow: 'hidden', borderWidth: 1, borderColor: colors.border },
  tableHead: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceAlt, paddingHorizontal: 8, paddingVertical: 7 },
  headText: { color: colors.textMuted, fontSize: 9, fontWeight: '700', textAlign: 'center' },
  tableRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, paddingHorizontal: 8, paddingVertical: 9, borderTopWidth: 1, borderTopColor: colors.border },
  tableRowAlt: { backgroundColor: '#0A1020' },
  colName: { flex: 3.5, flexDirection: 'row', alignItems: 'center', gap: 5 },
  colNum: { flex: 1, color: colors.textSec, fontSize: 11, textAlign: 'center' },
  qualifyText: { color: colors.green, fontWeight: '700' },
  rowFlag: { fontSize: 14 },
  rowName: { color: colors.textPrimary, fontSize: 11, fontWeight: '600', flex: 1 },
  ptsText: { color: colors.white, fontWeight: '800' },
});
