import { ScrollView, StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { colors, r } from '@/constants/theme';

type Player = {
  id: string;
  name: string;
  position: string;
  number: number | null;
  clubTeam: string | null;
  height: number | null;
  weight: number | null;
  goalCount: number;
  assistCount: number;
  country: { name: string; code: string; flagEmoji: string | null };
};

const POS_LABEL: Record<string, string> = { GK: 'ゴールキーパー', DF: 'ディフェンダー', MF: 'ミッドフィールダー', FW: 'フォワード' };
const POS_COLOR: Record<string, string> = { GK: '#F59E0B', DF: '#3D8EFF', MF: '#22C55E', FW: '#EF4444' };

export default function PlayerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: player, isLoading, isError } = useQuery({
    queryKey: ['player', id],
    queryFn: async () => {
      const res = await api.get<Player>(`/players/${id}`);
      return res.data;
    },
    enabled: !!id,
  });

  if (isLoading) return <View style={styles.center}><ActivityIndicator size="large" color={colors.gold} /></View>;
  if (isError || !player) return <View style={styles.center}><Text style={styles.error}>読み込みエラー</Text></View>;

  const posColor = POS_COLOR[player.position] ?? colors.gold;

  return (
    <>
      <Stack.Screen options={{
        title: player.name,
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.gold,
        headerShadowVisible: false,
        headerBackTitle: '戻る',
      }} />
      <ScrollView style={styles.container}>
        {/* ヒーロー */}
        <View style={styles.hero}>
          {/* 背番号 */}
          {player.number != null && (
            <Text style={styles.number}>#{player.number}</Text>
          )}
          {/* 国旗 + 名前 */}
          <Text style={styles.flag}>{player.country.flagEmoji ?? '🏳️'}</Text>
          <Text style={styles.name}>{player.name}</Text>
          <Text style={styles.countryName}>{player.country.name}</Text>

          {/* ポジションバッジ */}
          <View style={[styles.posBadge, { borderColor: posColor }]}>
            <Text style={[styles.posText, { color: posColor }]}>{POS_LABEL[player.position] ?? player.position}</Text>
          </View>
        </View>

        {/* スタッツカード */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNum}>{player.goalCount}</Text>
            <Text style={styles.statLabel}>⚽ 得点</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNum}>{player.assistCount}</Text>
            <Text style={styles.statLabel}>🎯 アシスト</Text>
          </View>
        </View>

        {/* プロフィール */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>プロフィール</Text>
          <InfoRow label="所属クラブ" value={player.clubTeam ?? '—'} />
          <InfoRow label="ポジション" value={POS_LABEL[player.position] ?? player.position} />
          {player.number != null && <InfoRow label="背番号" value={`#${player.number}`} />}
          {player.height != null && <InfoRow label="身長" value={`${player.height} cm`} />}
          {player.weight != null && <InfoRow label="体重" value={`${player.weight} kg`} />}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  error: { color: colors.red },

  hero: { backgroundColor: colors.surface, alignItems: 'center', paddingVertical: 32, paddingHorizontal: 24, borderBottomWidth: 1, borderBottomColor: colors.border },
  number: { color: colors.textMuted, fontSize: 16, fontWeight: '700', letterSpacing: 1, marginBottom: 8 },
  flag: { fontSize: 52, marginBottom: 8 },
  name: { color: colors.white, fontSize: 26, fontWeight: '900', marginBottom: 4, textAlign: 'center' },
  countryName: { color: colors.textSec, fontSize: 14, marginBottom: 16 },
  posBadge: { paddingHorizontal: 16, paddingVertical: 5, borderRadius: r.full, borderWidth: 1.5 },
  posText: { fontSize: 13, fontWeight: '700' },

  statsRow: { flexDirection: 'row', margin: 16, gap: 8 },
  statCard: { flex: 1, backgroundColor: colors.surface, borderRadius: r.lg, borderWidth: 1, borderColor: colors.border, paddingVertical: 20, alignItems: 'center' },
  statNum: { color: colors.white, fontSize: 36, fontWeight: '900' },
  statLabel: { color: colors.textMuted, fontSize: 12, marginTop: 4 },

  section: { marginHorizontal: 16 },
  sectionTitle: { color: colors.gold, fontSize: 10, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  infoLabel: { color: colors.textMuted, fontSize: 13 },
  infoValue: { color: colors.white, fontSize: 14, fontWeight: '600', flex: 1, textAlign: 'right' },
});
