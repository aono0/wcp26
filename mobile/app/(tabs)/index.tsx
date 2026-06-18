import { ScrollView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator, StatusBar } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { useMemo, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useFavorites } from '@/hooks/useFavorites';
import { useMatches } from '@/hooks/useMatches';
import { MatchCard } from '@/components/MatchCard';
import { VideoStories } from '@/components/VideoStories';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { toJSTDateKey, stableTimestamp } from '@/lib/matchUtils';
import { colors, r } from '@/constants/theme';
import { api } from '@/lib/api';

export default function HomeScreen() {
  const { top } = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const scheduledFrom = useMemo(() => stableTimestamp(), []);
  const recentFrom    = useMemo(() => stableTimestamp(-4 * 86400000), []);

  const { data: favorites, isLoading: favLoading } = useFavorites();
  const { data: matches, isLoading: matchLoading, isError: matchError } = useMatches({
    status: 'SCHEDULED',
    from: scheduledFrom,
  });
  const { data: recentFinished } = useMatches({ status: 'FINISHED', from: recentFrom });

  // ホーム画面に表示される国の詳細をバックグラウンドでプリフェッチ
  const prefetchedCodes = useRef(new Set<string>());
  useEffect(() => {
    const codes = new Set<string>();
    favorites?.forEach(f => codes.add(f.code));
    matches?.slice(0, 5).forEach(m => m.entries?.forEach(e => { if (e.country?.code) codes.add(e.country.code); }));
    recentFinished?.forEach(m => m.entries?.forEach(e => { if (e.country?.code) codes.add(e.country.code); }));

    codes.forEach(code => {
      if (prefetchedCodes.current.has(code)) return;
      prefetchedCodes.current.add(code);
      queryClient.prefetchQuery({
        queryKey: ['country', code],
        queryFn: () => api.get(`/countries/${code}`).then(r => r.data),
      });
    });
  }, [favorites, matches, recentFinished]);

  // 直近にFINISHEDの試合があった日のマッチを取得（今日の午前含む）
  const recentDayMatches = useMemo(() => {
    if (!recentFinished?.length) return [];
    const byDate: Record<string, typeof recentFinished> = {};
    for (const m of recentFinished) {
      const key = toJSTDateKey(m.matchDate);
      if (!byDate[key]) byDate[key] = [];
      byDate[key].push(m);
    }
    const latestKey = Object.keys(byDate).sort().at(-1);
    return latestKey ? byDate[latestKey]! : [];
  }, [recentFinished]);

  const upcomingMatches = matches?.slice(0, 5) ?? [];
  const hasFavorites = favorites && favorites.length > 0;

  return (
    <ScrollView style={styles.container} contentInsetAdjustmentBehavior="never">
      <StatusBar barStyle="light-content" />

      {/* ヒーローヘッダー */}
      <View style={[styles.hero, { paddingTop: top + 8 }]}>
        <View style={styles.heroTop}>
          <View>
            <Text style={styles.heroTitleSub}>Your team, your moment.</Text>
            <Text style={styles.heroTitle}>Never miss a match</Text>
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

      {/* 動画ストーリー */}
      <View style={styles.storiesSection}>
        <VideoStories />
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

      {/* 直近の試合セクション（最後にFINISHEDがあった日） */}
      {recentDayMatches.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <SectionLabel text="直近の試合" />
          </View>
          {recentDayMatches.map((m) => <MatchCard key={m.id} match={m} />)}
        </View>
      )}

      {/* これからの試合セクション */}
      <View style={styles.section}>
        <View style={styles.sectionRow}>
          <SectionLabel text="これからの試合" />
        </View>
        {matchLoading
          ? <ActivityIndicator color={colors.gold} style={{ marginTop: 16 }} />
          : matchError
          ? <Text style={{ color: colors.red, fontSize: 13 }}>⚠ 試合データの取得に失敗しました</Text>
          : upcomingMatches.map((m) => <MatchCard key={m.id} match={m} />)
        }
      </View>

      <View style={{ height: 32 }} />
    </ScrollView>
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
hero: {
    backgroundColor: colors.surface,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 7,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 5 },
  heroEyebrow: { color: colors.textMuted, fontSize: 10, fontWeight: '600', letterSpacing: 2, marginBottom: 4 },
  heroTitle: { color: colors.gold, fontSize: 20, fontWeight: '800', letterSpacing: 0.5 },
  heroTitleSub: { color: colors.white, fontSize: 26, fontWeight: '900', letterSpacing: 1, marginTop: -2 },
  settingsBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border, marginTop: 8 },
  settingsIcon: { fontSize: 18 },
  heroBadge: { flexDirection: 'row', alignItems: 'center', marginTop: 1, gap: 6 },
  heroDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.green },
  heroBadgeText: { color: colors.textSec, fontSize: 12 },
  section: { paddingHorizontal: 16, paddingTop: 15, paddingBottom: 4 },
  storiesSection: { paddingTop: 15 },
  storiesHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 12 },
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
