import { ScrollView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { useState, useMemo } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMatches } from '@/hooks/useMatches';
import { useAllStandings } from '@/hooks/useStandings';
import { useTopScorers, useTopAssisters, PlayerStat } from '@/hooks/useStats';
import { MatchCard } from '@/components/MatchCard';
import { colors, r } from '@/constants/theme';
import { toJSTDateKey, formatDatePill } from '@/lib/matchUtils';

type MainTab = 'matches' | 'standings' | 'stats';
type MatchStage = 'group' | 'knockout';
type KnockoutRound = 'ROUND_OF_32' | 'ROUND_OF_16' | 'QUARTER_FINAL' | 'SEMI_FINAL' | 'THIRD_PLACE' | 'FINAL';

const KNOCKOUT_ROUNDS: { key: KnockoutRound; label: string }[] = [
  { key: 'ROUND_OF_32', label: 'R32' },
  { key: 'ROUND_OF_16', label: 'R16' },
  { key: 'QUARTER_FINAL', label: 'QF' },
  { key: 'SEMI_FINAL', label: 'SF' },
  { key: 'THIRD_PLACE', label: '3位' },
  { key: 'FINAL', label: '決勝' },
];

export default function MatchesStandingsScreen() {
  const { top } = useSafeAreaInsets();
  const [mainTab, setMainTab] = useState<MainTab>('matches');
  const [matchStage, setMatchStage] = useState<MatchStage>('group');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedRound, setSelectedRound] = useState<KnockoutRound>('ROUND_OF_32');

  return (
    <View style={[styles.container, { paddingTop: top }]}>
      <View style={styles.mainTabBar}>
        {([['matches','試合'], ['standings','順位表'], ['stats','スタッツ']] as [MainTab, string][]).map(([tab, label]) => (
          <TouchableOpacity key={tab} style={[styles.mainTabBtn, mainTab === tab && styles.mainTabBtnActive]} onPress={() => setMainTab(tab)}>
            <Text style={[styles.mainTabText, mainTab === tab && styles.mainTabTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {mainTab === 'matches' ? (
        <MatchesView {...{ matchStage, setMatchStage, selectedDate, setSelectedDate, selectedRound, setSelectedRound }} />
      ) : mainTab === 'standings' ? (
        <StandingsView />
      ) : (
        <StatsView />
      )}
    </View>
  );
}

type MVProps = {
  matchStage: MatchStage; setMatchStage: (v: MatchStage) => void;
  selectedDate: string | null; setSelectedDate: (v: string) => void;
  selectedRound: KnockoutRound; setSelectedRound: (v: KnockoutRound) => void;
};

function MatchesView({ matchStage, setMatchStage, selectedDate, setSelectedDate, selectedRound, setSelectedRound }: MVProps) {
  const isGroup = matchStage === 'group';

  // グループステージは全件取得して日付でフィルター
  const { data: allGroupMatches, isLoading: groupLoading } = useMatches(isGroup ? { stage: 'GROUP' } : undefined);
  const { data: knockoutMatches, isLoading: knockoutLoading } = useMatches(!isGroup ? { stage: selectedRound } : undefined);
  const isLoading = isGroup ? groupLoading : knockoutLoading;

  // JST日付ごとに仕分け
  const dateMap = useMemo(() => {
    const map: Record<string, typeof allGroupMatches> = {};
    for (const m of allGroupMatches ?? []) {
      const key = toJSTDateKey(m.matchDate);
      if (!map[key]) map[key] = [];
      map[key]!.push(m);
    }
    return map;
  }, [allGroupMatches]);

  const sortedDates = useMemo(() => Object.keys(dateMap).sort(), [dateMap]);

  // 初回ロード時に最初の日付を自動選択
  const activeDate = selectedDate && sortedDates.includes(selectedDate)
    ? selectedDate
    : sortedDates[0] ?? null;

  const displayMatches = isGroup ? (dateMap[activeDate ?? ''] ?? []) : (knockoutMatches ?? []);

  return (
    <View style={{ flex: 1 }}>
      {/* グループステージ | 決勝T */}
      <View style={styles.stageRow}>
        {(['group', 'knockout'] as MatchStage[]).map((s) => (
          <TouchableOpacity key={s} style={[styles.stageBtn, matchStage === s && styles.stageBtnActive]} onPress={() => setMatchStage(s)}>
            <Text style={[styles.stageBtnText, matchStage === s && styles.stageBtnTextActive]}>
              {s === 'group' ? 'グループステージ' : '決勝トーナメント'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 日付 or ラウンド チップ */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll} contentContainerStyle={styles.chipContent}>
        {isGroup
          ? sortedDates.map((d) => (
              <TouchableOpacity key={d} style={[styles.chip, activeDate === d && styles.chipActive]} onPress={() => setSelectedDate(d)}>
                <Text style={[styles.chipText, activeDate === d && styles.chipTextActive]}>{formatDatePill(d)}</Text>
              </TouchableOpacity>
            ))
          : KNOCKOUT_ROUNDS.map(({ key, label }) => (
              <TouchableOpacity key={key} style={[styles.chip, selectedRound === key && styles.chipActive]} onPress={() => setSelectedRound(key)}>
                <Text style={[styles.chipText, selectedRound === key && styles.chipTextActive]}>{label}</Text>
              </TouchableOpacity>
            ))
        }
      </ScrollView>

      {isLoading ? (
        <View style={styles.center}><ActivityIndicator color={colors.gold} /></View>
      ) : !displayMatches.length ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>{isGroup ? '試合データなし' : 'このラウンドはまだ確定していません'}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.matchList}>
          {isGroup && activeDate && (
            <Text style={styles.dateHeading}>{formatDatePill(activeDate)}</Text>
          )}
          {!isGroup && (
            <Text style={styles.dateHeading}>{KNOCKOUT_ROUNDS.find((x) => x.key === selectedRound)?.label}</Text>
          )}
          {displayMatches.map((m) => <MatchCard key={m.id} match={m} />)}
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

// ──────────────────────────────────────────────
// スタッツビュー
// ──────────────────────────────────────────────
function StatsView() {
  const [statsTab, setStatsTab] = useState<'scorers' | 'assisters'>('scorers');
  const { data: scorers, isLoading: sLoading } = useTopScorers(20);
  const { data: assisters, isLoading: aLoading } = useTopAssisters(20);
  const isLoading = statsTab === 'scorers' ? sLoading : aLoading;
  const players   = statsTab === 'scorers' ? scorers : assisters;
  const statKey   = statsTab === 'scorers' ? 'goalCount' : 'assistCount';
  const statLabel = statsTab === 'scorers' ? '⚽' : '🎯';

  const ranked = players?.filter((p) => (p as any)[statKey] > 0) ?? [];

  return (
    <View style={{ flex: 1 }}>
      {/* 得点 / アシスト 切り替え */}
      <View style={styles.statsSubBar}>
        {([['scorers','得点ランキング'], ['assisters','アシストランキング']] as const).map(([key, label]) => (
          <TouchableOpacity key={key} style={[styles.statsSubBtn, statsTab === key && styles.statsSubBtnActive]} onPress={() => setStatsTab(key)}>
            <Text style={[styles.statsSubText, statsTab === key && styles.statsSubTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <View style={styles.center}><ActivityIndicator color={colors.gold} /></View>
      ) : ranked.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>大会開幕後にランキングが表示されます</Text>
        </View>
      ) : (
        <ScrollView>
          <View style={styles.rankTable}>
            {ranked.map((player, i) => (
              <PlayerRankRow key={player.id} player={player} rank={i + 1} statKey={statKey} statLabel={statLabel} />
            ))}
          </View>
          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </View>
  );
}

function PlayerRankRow({ player, rank, statKey, statLabel }: { player: PlayerStat; rank: number; statKey: string; statLabel: string }) {
  const stat = (player as any)[statKey] as number;
  return (
    <View style={[styles.rankRow, rank % 2 === 0 && styles.rankRowAlt]}>
      <Text style={[styles.rankNum, rank <= 3 && styles.rankNumTop]}>{rank}</Text>
      <Text style={styles.rankFlag}>{player.country.flagEmoji ?? '🏳️'}</Text>
      <View style={styles.rankInfo}>
        <Text style={styles.rankName} numberOfLines={1}>{player.name}</Text>
        <Text style={styles.rankClub} numberOfLines={1}>{player.clubTeam ?? player.country.name}</Text>
      </View>
      <View style={styles.rankStat}>
        <Text style={styles.rankStatNum}>{stat}</Text>
        <Text style={styles.rankStatLabel}>{statLabel}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: colors.textMuted, fontSize: 14, textAlign: 'center', paddingHorizontal: 32 },
  mainTabBar: { flexDirection: 'row', backgroundColor: colors.surfaceAlt, margin: 12, borderRadius: r.lg, padding: 3 },
  mainTabBtn: { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: r.md },
  mainTabBtnActive: { backgroundColor: colors.gold },
  mainTabText: { color: colors.textMuted, fontWeight: '700', fontSize: 13 },
  mainTabTextActive: { color: colors.bg },
  stageRow: { flexDirection: 'row', paddingHorizontal: 12, gap: 8, marginBottom: 8 },
  stageBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: r.md, borderWidth: 1, borderColor: colors.border },
  stageBtnActive: { borderColor: colors.gold, backgroundColor: '#1A2030' },
  stageBtnText: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },
  stageBtnTextActive: { color: colors.gold },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: r.full, borderWidth: 1, borderColor: colors.border },
  chipActive: { backgroundColor: colors.gold, borderColor: colors.gold },
  chipText: { color: colors.textMuted, fontWeight: '600', fontSize: 12 },
  chipTextActive: { color: colors.bg, fontWeight: '800' },
  matchList: { paddingHorizontal: 12, paddingTop: 4 },
  matchGroup: { marginBottom: 16 },
  groupLabel: { color: colors.gold, fontSize: 10, fontWeight: '700', letterSpacing: 1.5, marginBottom: 8, textTransform: 'uppercase' },
  dateHeading: { color: colors.white, fontSize: 16, fontWeight: '800', marginBottom: 12 },
  chipScroll: { maxHeight: 46 },
  chipContent: { paddingHorizontal: 12, gap: 8, paddingBottom: 8, alignItems: 'center' },
  statsSubBar: { flexDirection: 'row', paddingHorizontal: 12, gap: 8, paddingBottom: 10 },
  statsSubBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: r.md, borderWidth: 1, borderColor: colors.border },
  statsSubBtnActive: { borderColor: colors.gold, backgroundColor: '#1A2030' },
  statsSubText: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },
  statsSubTextActive: { color: colors.gold },
  rankTable: { paddingHorizontal: 12 },
  rankRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, paddingHorizontal: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  rankRowAlt: { backgroundColor: '#0A1020' },
  rankNum: { color: colors.textMuted, fontSize: 13, width: 28, textAlign: 'center', fontWeight: '600' },
  rankNumTop: { color: colors.gold, fontWeight: '800' },
  rankFlag: { fontSize: 22, marginRight: 10 },
  rankInfo: { flex: 1 },
  rankName: { color: colors.white, fontSize: 14, fontWeight: '700' },
  rankClub: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  rankStat: { alignItems: 'center', minWidth: 44 },
  rankStatNum: { color: colors.white, fontSize: 22, fontWeight: '900' },
  rankStatLabel: { color: colors.textMuted, fontSize: 10 },
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
