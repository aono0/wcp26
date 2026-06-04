import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { colors, r } from '@/constants/theme';
import { formatMatchDate, formatMatchDateShort } from '@/lib/matchUtils';
import { useMatchNotificationIds, useAddMatchNotification, useRemoveMatchNotification } from '@/hooks/useMatchNotifications';
import { useFavorites } from '@/hooks/useFavorites';

type Entry = {
  isHome: boolean;
  score: number | null;
  country?: { name: string; flagEmoji: string | null };
};

type Match = {
  id: string;
  matchDate: string;
  venueCity: string | null;
  round: string;
  status: string;
  homePlaceholder?: string | null;
  awayPlaceholder?: string | null;
  entries?: Entry[];
};

export function MatchCard({ match }: { match: Match }) {
  const home = match.entries?.find((e) => e.isHome);
  const away = match.entries?.find((e) => !e.isHome);
  const finished   = match.status === 'FINISHED';
  const live       = match.status === 'LIVE';
  const isPH       = !home?.country || !away?.country;

  const notificationIds = useMatchNotificationIds();
  const addNotification = useAddMatchNotification();
  const removeNotification = useRemoveMatchNotification();
  const { data: favorites } = useFavorites();
  const favCodes = new Set(favorites?.map((f) => f.code) ?? []);
  const isTeamFav = match.entries?.some((e) => e.country && favCodes.has((e.country as any).code)) ?? false;
  const isNotified = notificationIds.has(match.id) || isTeamFav;

  const handleBell = () => {
    if (finished || live) return;
    Alert.alert(
      isNotified ? '通知を解除' : 'この試合を通知',
      isNotified
        ? 'この試合の前日通知を解除しますか？'
        : 'この試合の前日（朝9時）に通知しますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: isNotified ? '解除する' : '通知する',
          onPress: () => isNotified
            ? removeNotification.mutate(match.id)
            : addNotification.mutate(match.id),
        },
      ]
    );
  };

  const homeFlag = home?.country?.flagEmoji;
  const awayFlag = away?.country?.flagEmoji;
  const homeName = home?.country?.name ?? match.homePlaceholder ?? 'TBD';
  const awayName = away?.country?.name ?? match.awayPlaceholder ?? 'TBD';

  return (
    <View style={[styles.card, isPH && styles.cardPH]}>
      {/* ヘッダー行 */}
      <View style={styles.header}>
        <Text style={styles.round} numberOfLines={1}>{match.round}</Text>
        <View style={styles.headerRight}>
          {live ? (
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          ) : finished ? (
            <Text style={styles.finishedText}>終了</Text>
          ) : (
            <Text style={styles.dateText}>{formatMatchDateShort(match.matchDate)}</Text>
          )}
          {!finished && !live && (
            <TouchableOpacity onPress={handleBell} hitSlop={6} style={[styles.bellBtn, isNotified && styles.bellBtnActive]}>
              <SymbolView
                name={isNotified ? 'bell.fill' : 'bell'}
                size={15}
                tintColor={isNotified ? colors.bg : colors.textSec}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* チーム＋スコア */}
      <View style={styles.body}>
        {/* ホーム */}
        <View style={styles.team}>
          {homeFlag
            ? <Text style={styles.flag}>{homeFlag}</Text>
            : <View style={styles.flagPH}><Text style={styles.flagPHText}>?</Text></View>
          }
          <Text style={[styles.teamName, isPH && styles.teamNamePH]} numberOfLines={2}>{homeName}</Text>
        </View>

        {/* 中央：スコア or 時刻 or VS */}
        <View style={styles.center}>
          {finished || live ? (
            <View style={styles.scoreWrap}>
              <Text style={[styles.scoreNum, live && styles.scoreNumLive]}>{home?.score ?? 0}</Text>
              <Text style={styles.scoreSep}>-</Text>
              <Text style={[styles.scoreNum, live && styles.scoreNumLive]}>{away?.score ?? 0}</Text>
            </View>
          ) : isPH ? (
            <Text style={styles.vs}>VS</Text>
          ) : (
            <View style={styles.timeWrap}>
              <Text style={styles.time}>{formatMatchDate(match.matchDate).split(' ')[1] ?? formatMatchDate(match.matchDate)}</Text>
              <Text style={styles.timeLabel}>JST</Text>
            </View>
          )}
          {match.venueCity && !finished && !live && (
            <Text style={styles.venue}>{match.venueCity}</Text>
          )}
        </View>

        {/* アウェイ */}
        <View style={[styles.team, styles.teamRight]}>
          {awayFlag
            ? <Text style={styles.flag}>{awayFlag}</Text>
            : <View style={styles.flagPH}><Text style={styles.flagPHText}>?</Text></View>
          }
          <Text style={[styles.teamName, isPH && styles.teamNamePH]} numberOfLines={2}>{awayName}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: r.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 8,
  },
  cardPH: {
    borderStyle: 'dashed',
    borderColor: colors.borderLight,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  round: { color: colors.textMuted, fontSize: 11, fontWeight: '600', letterSpacing: 0.5, flex: 1 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bellBtn: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1, borderColor: '#3D5A8A',
    alignItems: 'center', justifyContent: 'center',
  },
  bellBtnActive: {
    backgroundColor: colors.gold,
    borderColor: colors.gold,
  },
  liveBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#3B0A0A', borderRadius: r.full, paddingHorizontal: 8, paddingVertical: 3, gap: 4 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.red },
  liveText: { color: colors.red, fontSize: 10, fontWeight: '700' },
  finishedText: { color: colors.textMuted, fontSize: 11 },
  dateText: { color: colors.gold, fontSize: 11, fontWeight: '600' },

  body: { flexDirection: 'row', alignItems: 'center' },
  team: { flex: 2.5, alignItems: 'center', gap: 6 },
  teamRight: {},
  flag: { fontSize: 32 },
  flagPH: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed' },
  flagPHText: { color: colors.textMuted, fontSize: 14, fontWeight: 'bold' },
  teamName: { color: colors.textPrimary, fontSize: 11, fontWeight: '600', textAlign: 'center' },
  teamNamePH: { color: colors.textMuted, fontStyle: 'italic' },

  center: { flex: 2, alignItems: 'center', gap: 4 },
  scoreWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  scoreNum: { color: colors.white, fontSize: 26, fontWeight: '800' },
  scoreNumLive: { color: colors.red },
  scoreSep: { color: colors.textMuted, fontSize: 20, fontWeight: '300' },
  vs: { color: colors.textMuted, fontSize: 13, fontWeight: '700', letterSpacing: 2 },
  timeWrap: { alignItems: 'center' },
  time: { color: colors.white, fontSize: 16, fontWeight: '700' },
  timeLabel: { color: colors.textMuted, fontSize: 9, marginTop: 1 },
  venue: { color: colors.textMuted, fontSize: 10, marginTop: 2 },
});
