import { ScrollView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator, StatusBar } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { useFavorites } from '@/hooks/useFavorites';
import { useMatches } from '@/hooks/useMatches';
import { useTopScorers, useTopAssisters } from '@/hooks/useStats';
import { MatchCard } from '@/components/MatchCard';
import { colors, r } from '@/constants/theme';

export default function HomeScreen() {
  const router = useRouter();
  const { data: favorites, isLoading: favLoading } = useFavorites();
  const { data: matches, isLoading: matchLoading, isError: matchError } = useMatches({ status: 'SCHEDULED' });
  const upcomingMatches = matches?.slice(0, 5) ?? [];
  const hasFavorites = favorites && favorites.length > 0;

  return (
    <ScrollView style={styles.container} contentInsetAdjustmentBehavior="never">
      <StatusBar barStyle="light-content" />

      {/* ヒーローヘッダー */}
      <View style={styles.hero}>
        <View style={styles.heroTop}>
          <View>
            <Text style={styles.heroEyebrow}>USA · CANADA · MEXICO</Text>
            <Text style={styles.heroTitle}>FIFA</Text>
            <Text style={styles.heroTitleSub}>WORLD CUP 2026</Text>
          </View>
          <Link href="/modal" asChild>
            <TouchableOpacity style={styles.settingsBtn}>
              <Text style={styles.settingsIcon}>⚙️</Text>
            </TouchableOpacity>
          </Link>
        </View>
        <View style={styles.heroBadge}>
          <View style={styles.heroDot} />
          <Text style={styles.heroBadgeText}>USA · Canada · Mexico</Text>
        </View>
      </View>

      {/* マイチームセクション */}
      <View style={styles.section}>
        <View style={styles.sectionRow}>
          <SectionLabel text="マイチーム" />
          {hasFavorites && (
            <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/(tabs)/countries')}>
              <Text style={styles.addBtnText}>＋ 追加</Text>
            </TouchableOpacity>
          )}
        </View>
        {favLoading ? (
          <ActivityIndicator color={colors.gold} style={{ marginTop: 16 }} />
        ) : !hasFavorites ? (
          <TouchableOpacity style={styles.emptyCard} onPress={() => router.push('/(tabs)/countries')}>
            <Text style={styles.emptyIcon}>👕</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.emptyTitle}>マイチームを追加</Text>
              <Text style={styles.emptySub}>出場国タブから好きなチームを登録</Text>
            </View>
            <Text style={styles.emptyArrow}>›</Text>
          </TouchableOpacity>
        ) : (
          favorites.map((country) => {
            const nextMatch = country.matchEntries
              .map((e: any) => e.match)
              .find((m: any) => m.status === 'SCHEDULED');
            return (
              <TouchableOpacity
                key={country.id}
                style={styles.favCard}
                onPress={() => router.push(`/country/${country.code}`)}
                activeOpacity={0.8}
              >
                <View style={styles.favCardInner}>
                  <Text style={styles.favFlag}>{country.flagEmoji ?? '🏳️'}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.favName}>{country.name}</Text>
                    <Text style={styles.favMeta}>グループ {country.groupStage} · {country.federation}</Text>
                  </View>
                  <View style={styles.groupBadge}>
                    <Text style={styles.groupBadgeText}>{country.groupStage}</Text>
                  </View>
                </View>
                {nextMatch && (
                  <View style={styles.favNextMatch}>
                    {(() => {
                      const home = nextMatch.entries?.find((e: any) => e.isHome);
                      const away = nextMatch.entries?.find((e: any) => !e.isHome);
                      if (!home || !away) return null;
                      return (
                        <Text style={styles.favNextText}>
                          次の試合: {home.country?.flagEmoji} {home.country?.name} vs {away.country?.flagEmoji} {away.country?.name}
                        </Text>
                      );
                    })()}
                  </View>
                )}
              </TouchableOpacity>
            );
          })
        )}
      </View>

      {/* 直近の試合セクション */}
      <View style={styles.section}>
        <View style={styles.sectionRow}>
          <SectionLabel text="直近の試合" />
        </View>
        {matchLoading
          ? <ActivityIndicator color={colors.gold} style={{ marginTop: 16 }} />
          : matchError
          ? <Text style={{ color: colors.red, fontSize: 13 }}>⚠ 試合データの取得に失敗しました</Text>
          : upcomingMatches.map((m) => <MatchCard key={m.id} match={m} />)
        }
      </View>

      {/* スタッツセクション */}
      <StatsWidget />

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

function StatsWidget() {
  const router = useRouter();
  const { data: scorers } = useTopScorers(3);
  const { data: assisters } = useTopAssisters(3);

  const topScorers   = scorers?.filter((p) => p.goalCount > 0) ?? [];
  const topAssisters = assisters?.filter((p) => p.assistCount > 0) ?? [];

  const noData = topScorers.length === 0 && topAssisters.length === 0;

  return (
    <View style={styles.section}>
      <View style={styles.sectionRow}>
        <SectionLabel text="スタッツ" />
        {!noData && (
          <TouchableOpacity onPress={() => router.push('/(tabs)/news')}>
            <Text style={styles.addBtnText}>もっと見る ›</Text>
          </TouchableOpacity>
        )}
      </View>

      {noData ? (
        <TouchableOpacity style={styles.statsPlaceholder} onPress={() => router.push('/(tabs)/news')}>
          <Text style={styles.statsPlaceholderIcon}>📊</Text>
          <Text style={styles.statsPlaceholderText}>得点・アシストランキングは{'\n'}大会開幕後に表示されます</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.statsRow}>
          {topScorers.length > 0 && (
            <View style={styles.statsCard}>
              <Text style={styles.statsCardLabel}>⚽ 得点</Text>
              {topScorers.map((p, i) => (
                <View key={p.id} style={styles.statsItem}>
                  <Text style={styles.statsRank}>{i + 1}</Text>
                  <Text style={styles.statsFlag}>{p.country.flagEmoji ?? '🏳️'}</Text>
                  <Text style={styles.statsName} numberOfLines={1}>{p.name}</Text>
                  <Text style={styles.statsStat}>{p.goalCount}</Text>
                </View>
              ))}
            </View>
          )}
          {topAssisters.length > 0 && (
            <View style={styles.statsCard}>
              <Text style={styles.statsCardLabel}>🎯 アシスト</Text>
              {topAssisters.map((p, i) => (
                <View key={p.id} style={styles.statsItem}>
                  <Text style={styles.statsRank}>{i + 1}</Text>
                  <Text style={styles.statsFlag}>{p.country.flagEmoji ?? '🏳️'}</Text>
                  <Text style={styles.statsName} numberOfLines={1}>{p.name}</Text>
                  <Text style={styles.statsStat}>{p.assistCount}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );
}

function SectionLabel({ text }: { text: string }) {
  return (
    <View style={styles.sectionLabel}>
      <View style={styles.sectionLabelBar} />
      <Text style={styles.sectionLabelText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  statsRow: { flexDirection: 'row', gap: 8 },
  statsCard: { flex: 1, backgroundColor: colors.surface, borderRadius: r.md, borderWidth: 1, borderColor: colors.border, padding: 12 },
  statsCardLabel: { color: colors.gold, fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 10, textTransform: 'uppercase' },
  statsItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 6 },
  statsRank: { color: colors.textMuted, fontSize: 11, width: 14, textAlign: 'center' },
  statsFlag: { fontSize: 16 },
  statsName: { color: colors.white, fontSize: 12, fontWeight: '600', flex: 1 },
  statsStat: { color: colors.white, fontSize: 16, fontWeight: '900', minWidth: 20, textAlign: 'right' },
  statsPlaceholder: { backgroundColor: colors.surface, borderRadius: r.md, borderWidth: 1, borderColor: colors.border, padding: 20, alignItems: 'center', gap: 8 },
  statsPlaceholderIcon: { fontSize: 28 },
  statsPlaceholderText: { color: colors.textMuted, fontSize: 13, textAlign: 'center', lineHeight: 20 },
  hero: {
    backgroundColor: colors.surface,
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 28,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  heroEyebrow: { color: colors.textMuted, fontSize: 10, fontWeight: '600', letterSpacing: 2, marginBottom: 4 },
  heroTitle: { color: colors.gold, fontSize: 28, fontWeight: '900', letterSpacing: 2 },
  heroTitleSub: { color: colors.white, fontSize: 26, fontWeight: '900', letterSpacing: 1, marginTop: -2 },
  settingsBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border, marginTop: 8 },
  settingsIcon: { fontSize: 18 },
  heroBadge: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 6 },
  heroDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.green },
  heroBadgeText: { color: colors.textSec, fontSize: 12 },
  section: { paddingHorizontal: 16, paddingTop: 24, paddingBottom: 4 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  sectionLabel: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  addBtn: { backgroundColor: colors.surfaceAlt, borderRadius: r.full, paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1, borderColor: colors.border },
  addBtnText: { color: colors.gold, fontSize: 12, fontWeight: '700' },
  sectionLabelBar: { width: 3, height: 16, borderRadius: 2, backgroundColor: colors.gold },
  sectionLabelText: { color: colors.gold, fontSize: 11, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' },
  emptyCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface, borderRadius: r.lg,
    borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed',
    padding: 16, gap: 12,
  },
  emptyIcon: { fontSize: 24 },
  emptyTitle: { color: colors.textPrimary, fontSize: 14, fontWeight: '600' },
  emptySub: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  emptyArrow: { color: colors.textMuted, fontSize: 20 },
  favCard: {
    backgroundColor: colors.surface, borderRadius: r.lg,
    borderWidth: 1, borderColor: colors.border,
    marginBottom: 8, overflow: 'hidden',
  },
  favCardInner: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  favFlag: { fontSize: 34 },
  favName: { color: colors.white, fontSize: 16, fontWeight: '700' },
  favMeta: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  groupBadge: { backgroundColor: colors.surfaceAlt, borderRadius: r.sm, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: colors.border },
  groupBadgeText: { color: colors.gold, fontSize: 12, fontWeight: '700' },
  favNextMatch: { borderTopWidth: 1, borderTopColor: colors.border, paddingHorizontal: 14, paddingVertical: 10 },
  favNextText: { color: colors.textSec, fontSize: 12 },
});
