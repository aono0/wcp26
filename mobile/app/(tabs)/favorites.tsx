import { ScrollView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState, useMemo } from 'react';
import { useFavorites } from '@/hooks/useFavorites';
import { useGroupStanding } from '@/hooks/useStandings';
import { useMatchNotifications } from '@/hooks/useMatchNotifications';
import { MatchCard } from '@/components/MatchCard';
import { colors, r } from '@/constants/theme';

type Tab = 'teams' | 'matches';

export default function FavoritesScreen() {
  const { top } = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>('teams');

  return (
    <View style={[styles.container, { paddingTop: top }]}>
      {/* タブ切り替え */}
      <View style={styles.tabBar}>
        <TouchableOpacity style={[styles.tabBtn, tab === 'teams' && styles.tabBtnActive]} onPress={() => setTab('teams')}>
          <Text style={[styles.tabBtnText, tab === 'teams' && styles.tabBtnTextActive]}>マイチーム</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tabBtn, tab === 'matches' && styles.tabBtnActive]} onPress={() => setTab('matches')}>
          <Text style={[styles.tabBtnText, tab === 'matches' && styles.tabBtnTextActive]}>試合通知</Text>
        </TouchableOpacity>
      </View>

      {tab === 'teams' ? <TeamsTab /> : <MatchesTab />}
    </View>
  );
}

// ──────────────────────────────────────────────
// マイチームタブ
// ──────────────────────────────────────────────
function TeamsTab() {
  const router = useRouter();
  const { data: favorites, isLoading } = useFavorites();

  if (isLoading) return <View style={styles.center}><ActivityIndicator size="large" color={colors.gold} /></View>;

  if (!favorites || favorites.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyIcon}>👕</Text>
        <Text style={styles.emptyTitle}>チームが登録されていません</Text>
        <Text style={styles.emptyText}>「出場国」タブから好きなチームを登録しましょう</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/(tabs)/countries')}>
          <Text style={styles.addBtnText}>出場国を見る →</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView>
      {favorites.map((country) => {
        const upcoming = country.matchEntries.map((e: any) => e.match).filter((m: any) => m.status !== 'FINISHED').slice(0, 2);
        const past     = country.matchEntries.map((e: any) => e.match).filter((m: any) => m.status === 'FINISHED').slice(-2);

        return (
          <View key={country.id} style={styles.teamBlock}>
            <TouchableOpacity style={styles.teamHeader} onPress={() => router.push(`/country/${country.code}`)} activeOpacity={0.8}>
              <Text style={styles.teamFlag}>{country.flagEmoji ?? '🏳️'}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.teamName}>{country.name}</Text>
                <Text style={styles.teamMeta}>{country.nameEn} · {country.federation}</Text>
              </View>
              <View style={styles.groupPill}><Text style={styles.groupPillText}>{country.groupStage}</Text></View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>

            <View style={styles.teamBody}>
              {upcoming.length > 0 && (
                <View style={styles.matchBlock}>
                  <TouchableOpacity
                    style={styles.matchBlockHeader}
                    onPress={() => router.push(`/country/${country.code}`)}
                  >
                    <Text style={styles.blockLabel}>次の試合</Text>
                    <Text style={styles.blockLabelArrow}>全日程を見る ›</Text>
                  </TouchableOpacity>
                  {upcoming.map((m: any) => <MatchCard key={m.id} match={m} />)}
                </View>
              )}
              {past.length > 0 && (
                <View style={styles.matchBlock}>
                  <Text style={styles.blockLabel}>直近の結果</Text>
                  {past.map((m: any) => <MatchCard key={m.id} match={m} />)}
                </View>
              )}
              <GroupStandingsMini group={country.groupStage} highlightCode={country.code} />
            </View>
          </View>
        );
      })}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

// ──────────────────────────────────────────────
// 試合通知タブ
// お気に入りチームの試合 + 個別登録した試合をまとめて表示
// ──────────────────────────────────────────────
function MatchesTab() {
  const { data: favorites, isLoading: favLoading } = useFavorites();
  const { data: individualNotifs, isLoading: notifLoading } = useMatchNotifications();
  const isLoading = favLoading || notifLoading;

  const allMatches = useMemo(() => {
    const matchMap = new Map<string, { match: any; source: 'team' | 'individual'; teamName?: string }>();

    // お気に入りチームの試合を自動追加
    for (const country of favorites ?? []) {
      for (const entry of country.matchEntries ?? []) {
        const m = entry.match;
        if (!m) continue;
        if (!matchMap.has(m.id)) {
          matchMap.set(m.id, { match: m, source: 'team', teamName: country.name });
        }
      }
    }

    // 個別登録した試合を追加（重複は上書きしない）
    for (const n of individualNotifs ?? []) {
      if (!matchMap.has(n.matchId)) {
        matchMap.set(n.matchId, { match: n.match, source: 'individual' });
      }
    }

    return [...matchMap.values()].sort(
      (a, b) => new Date(a.match.matchDate).getTime() - new Date(b.match.matchDate).getTime()
    );
  }, [favorites, individualNotifs]);

  if (isLoading) return <View style={styles.center}><ActivityIndicator size="large" color={colors.gold} /></View>;

  if (allMatches.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyIcon}>🔔</Text>
        <Text style={styles.emptyTitle}>通知中の試合はありません</Text>
        <Text style={styles.emptyText}>チームをお気に入り登録するとその試合が自動で追加されます</Text>
      </View>
    );
  }

  const upcoming = allMatches.filter((m) => m.match?.status !== 'FINISHED');
  const past     = allMatches.filter((m) => m.match?.status === 'FINISHED');

  return (
    <ScrollView contentContainerStyle={styles.matchesContent}>
      {upcoming.length > 0 && (
        <View style={styles.matchSection}>
          <Text style={styles.matchSectionLabel}>通知予定の試合 ({upcoming.length})</Text>
          {upcoming.map(({ match }) => (
            <MatchCard key={match.id} match={match} />
          ))}
        </View>
      )}
      {past.length > 0 && (
        <View style={styles.matchSection}>
          <Text style={styles.matchSectionLabel}>終了した試合</Text>
          {past.map(({ match }) => <MatchCard key={match.id} match={match} />)}
        </View>
      )}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

// ──────────────────────────────────────────────
// グループ順位ミニ表
// ──────────────────────────────────────────────
function GroupStandingsMini({ group, highlightCode }: { group: string; highlightCode: string }) {
  const { data } = useGroupStanding(group);
  if (!data) return null;
  return (
    <View style={styles.standingsWrap}>
      <Text style={styles.blockLabel}>グループ {group} 順位</Text>
      <View style={styles.standingsTable}>
        <View style={styles.tableHead}>
          {['#', 'チーム', 'P', 'W', 'D', 'L', 'GF', 'GA', 'Pts'].map((h) => (
            <Text key={h} style={[h === 'チーム' ? styles.colName : styles.colNum, styles.headText]}>{h}</Text>
          ))}
        </View>
        {data.standings.map((row, i) => (
          <View key={row.country.id} style={[styles.tableRow, row.country.code === highlightCode && styles.tableRowHL]}>
            <Text style={[styles.colNum, i < 2 && styles.qualifyNum]}>{i + 1}</Text>
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
            <Text style={[styles.colNum, styles.ptsText]}>{row.points}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { color: colors.white, fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  emptyText: { color: colors.textMuted, fontSize: 14, textAlign: 'center', marginBottom: 24 },
  addBtn: { backgroundColor: colors.gold, paddingHorizontal: 24, paddingVertical: 12, borderRadius: r.full },
  addBtnText: { color: colors.bg, fontWeight: '800', fontSize: 14 },

  tabBar: { flexDirection: 'row', backgroundColor: colors.surfaceAlt, margin: 12, borderRadius: r.lg, padding: 3 },
  tabBtn: { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: r.md },
  tabBtnActive: { backgroundColor: colors.gold },
  tabBtnText: { color: colors.textMuted, fontWeight: '700', fontSize: 13 },
  tabBtnTextActive: { color: colors.bg },

  teamBlock: { marginBottom: 4, borderBottomWidth: 6, borderBottomColor: colors.bg },
  teamHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surfaceAlt, padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  teamFlag: { fontSize: 36 },
  teamName: { color: colors.white, fontSize: 18, fontWeight: '800' },
  teamMeta: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  groupPill: { backgroundColor: colors.surface, borderRadius: r.full, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: colors.gold },
  groupPillText: { color: colors.gold, fontSize: 11, fontWeight: '700' },
  chevron: { color: colors.textMuted, fontSize: 20 },
  teamBody: { backgroundColor: colors.surface, padding: 16, paddingTop: 12 },
  matchBlock: { marginBottom: 12 },
  matchBlockHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  blockLabel: { color: colors.gold, fontSize: 10, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' },
  blockLabelArrow: { color: colors.textMuted, fontSize: 11 },

  matchesContent: { padding: 12 },
  matchSection: { marginBottom: 20 },
  matchSectionLabel: { color: colors.gold, fontSize: 10, fontWeight: '700', letterSpacing: 1.5, marginBottom: 8, textTransform: 'uppercase' },
  teamBadge: { color: colors.textMuted, fontSize: 11, marginBottom: 2, paddingLeft: 2 },

  standingsWrap: { marginTop: 4 },
  standingsTable: { borderRadius: r.md, overflow: 'hidden', borderWidth: 1, borderColor: colors.border },
  tableHead: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceAlt, paddingHorizontal: 10, paddingVertical: 7 },
  headText: { color: colors.textMuted, fontSize: 10, fontWeight: '700', textAlign: 'center' },
  tableRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 9, borderTopWidth: 1, borderTopColor: colors.border },
  tableRowHL: { backgroundColor: '#1A2540' },
  colName: { flex: 3, flexDirection: 'row', alignItems: 'center', gap: 6 },
  colNum: { flex: 1, color: colors.textSec, fontSize: 11, textAlign: 'center' },
  qualifyNum: { color: colors.green },
  rowFlag: { fontSize: 14 },
  rowName: { color: colors.textPrimary, fontSize: 11, fontWeight: '600', flex: 1 },
  ptsText: { color: colors.white, fontWeight: '800' },
});
