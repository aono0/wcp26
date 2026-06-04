import { ScrollView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { useCountryDetail } from '@/hooks/useCountries';
import { useFavorites, useAddFavorite, useRemoveFavorite } from '@/hooks/useFavorites';
import { MatchCard } from '@/components/MatchCard';
import { colors, r } from '@/constants/theme';

const POS_ORDER = ['GK', 'DF', 'MF', 'FW'];

export default function CountryDetailScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const router = useRouter();
  const { data: country, isLoading, isError } = useCountryDetail(code);
  const { data: favorites } = useFavorites();
  const addFav = useAddFavorite();
  const removeFav = useRemoveFavorite();
  const isFav = favorites?.some((f) => f.code === code);

  if (isLoading) return <View style={styles.center}><ActivityIndicator size="large" color={colors.gold} /></View>;
  if (isError || !country) return <View style={styles.center}><Text style={styles.error}>読み込みエラー</Text></View>;

  const matches = country.matchEntries.map((e: any) => e.match);

  return (
    <>
      <Stack.Screen options={{
        title: `${country.flagEmoji ?? ''} ${country.name}`,
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.gold,
        headerShadowVisible: false,
        headerBackTitle: '戻る',
      }} />
      <ScrollView style={styles.container} bounces>
      {/* ヒーローヘッダー */}
      <View style={styles.hero}>
        <Text style={styles.heroFlag}>{country.flagEmoji ?? '🏳️'}</Text>
        <Text style={styles.heroName}>{country.name}</Text>
        <View style={styles.heroMeta}>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>グループ {country.groupStage}</Text>
          </View>
          <Text style={styles.heroDot}>·</Text>
          <Text style={styles.heroFed}>{country.federation}</Text>
        </View>
        <TouchableOpacity
          style={[styles.favBtn, isFav && styles.favBtnActive]}
          onPress={() => isFav ? removeFav.mutate(country.id) : addFav.mutate(country.id)}
        >
          <Text style={[styles.favBtnText, isFav && styles.favBtnTextActive]}>
            {isFav ? '★ お気に入り登録済み' : '☆ お気に入りに追加'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 試合日程・結果 */}
      <View style={styles.section}>
        <SectionLabel text="試合日程・結果" />
        {matches.length === 0
          ? <Text style={styles.empty}>試合データなし</Text>
          : matches.map((m: any) => <MatchCard key={m.id} match={m} />)
        }
      </View>

      {/* 選手一覧 */}
      {country.players.length > 0 && (
        <View style={styles.section}>
          <SectionLabel text="選手" />
          {POS_ORDER.map((pos) => {
            const players = country.players.filter((p: any) => p.position === pos);
            if (!players.length) return null;
            return (
              <View key={pos}>
                <Text style={styles.posLabel}>{pos}</Text>
                {players.map((p: any) => (
                  <TouchableOpacity
                    key={p.id}
                    style={styles.playerRow}
                    onPress={() => router.push(`/player/${p.id}`)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.playerNum}>{p.number ?? '-'}</Text>
                    <Text style={styles.playerName}>{p.name}</Text>
                    {p.goalCount > 0 && <Text style={styles.goalBadge}>⚽ {p.goalCount}</Text>}
                    <Text style={styles.playerClub}>{p.clubTeam ?? ''}</Text>
                    <Text style={styles.playerArrow}>›</Text>
                  </TouchableOpacity>
                ))}
              </View>
            );
          })}
        </View>
      )}
      <View style={{ height: 48 }} />
    </ScrollView>
    </>
  );
}

function SectionLabel({ text }: { text: string }) {
  return (
    <View style={styles.sectionLabelRow}>
      <View style={styles.sectionBar} />
      <Text style={styles.sectionLabelText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  error: { color: colors.red },
  hero: { backgroundColor: colors.surface, alignItems: 'center', paddingTop: 24, paddingBottom: 24, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: colors.border },
  heroFlag: { fontSize: 64, marginBottom: 8 },
  heroName: { color: colors.white, fontSize: 28, fontWeight: '800', marginBottom: 8 },
  heroMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  heroBadge: { backgroundColor: colors.surfaceAlt, borderRadius: r.full, paddingHorizontal: 12, paddingVertical: 4, borderWidth: 1, borderColor: colors.gold },
  heroBadgeText: { color: colors.gold, fontSize: 12, fontWeight: '700' },
  heroDot: { color: colors.textMuted },
  heroFed: { color: colors.textSec, fontSize: 13 },
  favBtn: { paddingHorizontal: 24, paddingVertical: 10, borderRadius: r.full, borderWidth: 1.5, borderColor: colors.textMuted },
  favBtnActive: { backgroundColor: colors.gold, borderColor: colors.gold },
  favBtnText: { color: colors.textSec, fontWeight: '700', fontSize: 13 },
  favBtnTextActive: { color: colors.bg },
  section: { padding: 16, paddingBottom: 4 },
  sectionLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  sectionBar: { width: 3, height: 16, borderRadius: 2, backgroundColor: colors.gold },
  sectionLabelText: { color: colors.gold, fontSize: 11, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' },
  empty: { color: colors.textMuted, fontSize: 14 },
  posLabel: { color: colors.blue, fontSize: 10, fontWeight: '700', letterSpacing: 1, marginTop: 12, marginBottom: 6, textTransform: 'uppercase' },
  playerRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border, gap: 8 },
  playerArrow: { color: colors.textMuted, fontSize: 18 },
  playerNum: { color: colors.textMuted, fontSize: 12, width: 22, textAlign: 'center' },
  playerName: { color: colors.textPrimary, fontSize: 14, fontWeight: '600', flex: 1 },
  goalBadge: { backgroundColor: '#1B2F1A', borderRadius: r.full, paddingHorizontal: 8, paddingVertical: 2 },
  playerClub: { color: colors.textMuted, fontSize: 12 },
});
