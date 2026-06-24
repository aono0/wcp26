import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { colors } from '@/constants/theme';
import { formatMatchDate, formatMatchDateShort, roundLabel } from '@/lib/matchUtils';
import { useMatchNotificationIds, useAddMatchNotification, useRemoveMatchNotification, useNotificationSettings } from '@/hooks/useMatchNotifications';

type Entry = {
  isHome: boolean;
  score: number | null;
  country?: { name: string; flagEmoji: string | null; code?: string };
};

type Match = {
  id: string;
  matchDate: string;
  venueCity: string | null;
  broadcastInfo?: string | null;
  round: string;
  stage?: string;
  status: string;
  homePlaceholder?: string | null;
  awayPlaceholder?: string | null;
  entries?: Entry[];
};

export function MatchCard({ match }: { match: Match }) {
  const home = match.entries?.find((e) => e.isHome);
  const away = match.entries?.find((e) => !e.isHome);
  const finished = match.status === 'FINISHED';
  const live     = match.status === 'LIVE';
  const isPH     = !home?.country || !away?.country;

  const router = useRouter();
  const notificationIds = useMatchNotificationIds();
  const addNotification = useAddMatchNotification();
  const removeNotification = useRemoveMatchNotification();
  const { data: notifSettings } = useNotificationSettings();
  const preMatchMinutes = notifSettings?.preMatchMinutes ?? 15;
  const serverIsNotified = notificationIds.has(match.id);
  const [optimisticNotified, setOptimisticNotified] = useState<boolean | null>(null);
  const isNotified = optimisticNotified !== null ? optimisticNotified : serverIsNotified;

  const homeFlag = home?.country?.flagEmoji;
  const awayFlag = away?.country?.flagEmoji;
  const homeName = home?.country?.name ?? match.homePlaceholder ?? 'TBD';
  const awayName = away?.country?.name ?? match.awayPlaceholder ?? 'TBD';

  const handleBell = () => {
    if (finished || live) return;
    Alert.alert(
      isNotified ? '通知を解除' : 'この試合を通知',
      isNotified ? 'この試合の通知を解除しますか？' : `前日の正午と試合${preMatchMinutes}分前に通知しますか？`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: isNotified ? '解除する' : '通知する',
          onPress: () => {
            const next = !isNotified;
            setOptimisticNotified(next);
            if (isNotified) {
              removeNotification.mutate(match.id, { onError: () => setOptimisticNotified(!next) });
            } else {
              addNotification.mutate(match.id, { onError: () => setOptimisticNotified(!next) });
            }
          },
        },
      ]
    );
  };

  // 日付と時刻を分離
  const dateStr  = formatMatchDateShort(match.matchDate);       // "6/15"
  const timeStr  = formatMatchDate(match.matchDate).split(' ').pop() ?? ''; // "7:00"

  return (
    <View style={styles.card}>
      <View style={styles.matchRow}>
      {/* ホーム */}
      <TouchableOpacity
        style={styles.team}
        activeOpacity={home?.country?.code ? 0.7 : 1}
        onPress={() => home?.country?.code && router.push(`/country/${home.country!.code}`)}
      >
        <Text style={styles.flag}>{homeFlag ?? '🏳️'}</Text>
        <Text style={styles.name} numberOfLines={2}>{homeName}</Text>
      </TouchableOpacity>

      {/* センター：スコア or 時刻（日付は重複しない） */}
      <View style={styles.center}>
        {finished || live ? (
          <>
            {home?.score != null && away?.score != null ? (
              <View style={styles.scoreWrap}>
                <Text style={[styles.scoreNum, live && styles.scoreNumLive]}>{home.score}</Text>
                <Text style={styles.scoreDash}>-</Text>
                <Text style={[styles.scoreNum, live && styles.scoreNumLive]}>{away.score}</Text>
              </View>
            ) : (
              <Text style={styles.scoreTbd}>- : -</Text>
            )}
            <Text style={[styles.status, live && styles.statusLive]}>{live ? 'LIVE' : 'FT'}</Text>
          </>
        ) : (
          <View style={styles.timeRow}>
            <Text style={styles.dateStr}>{dateStr}</Text>
            <Text style={styles.time}>{timeStr}</Text>
          </View>
        )}
        {match.venueCity && <Text style={styles.venue}>{match.venueCity}</Text>}
      </View>

      {/* アウェイ */}
      <TouchableOpacity
        style={[styles.team, styles.teamRight]}
        activeOpacity={away?.country?.code ? 0.7 : 1}
        onPress={() => away?.country?.code && router.push(`/country/${away.country!.code}`)}
      >
        <Text style={styles.flag}>{awayFlag ?? '🏳️'}</Text>
        <Text style={[styles.name, styles.nameRight]} numberOfLines={2}>{awayName}</Text>
      </TouchableOpacity>

      {/* ベルボタン */}
      {!finished && !live && (
        <TouchableOpacity onPress={handleBell} hitSlop={8} style={[styles.bellBtn, isNotified && styles.bellBtnActive]}>
          <SymbolView name={isNotified ? 'bell.fill' : 'bell'} size={13} tintColor={isNotified ? colors.bg : colors.textMuted} />
        </TouchableOpacity>
      )}
      </View>
      {match.stage && roundLabel(match.stage) && (
        <Text style={styles.roundLabel}>{roundLabel(match.stage)}</Text>
      )}
      {match.broadcastInfo && (
        <Text style={styles.broadcast}>放送：{match.broadcastInfo}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.07)',
    backgroundColor: 'transparent',
  },
  matchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  rowPH: { opacity: 0.7 },
  roundLabel: {
    color: colors.gold,
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 1,
    paddingBottom: 4,
  },
  broadcast: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    paddingBottom: 10,
  },

  team: { flex: 2.8, alignItems: 'center', gap: 5 },
  teamRight: {},
  flag: { fontSize: 28 },
  flagPH: { fontSize: 20, opacity: 0.5 },
  name: { color: colors.textPrimary, fontSize: 11, fontWeight: '600', textAlign: 'center' },
  nameRight: {},
  namePH: { color: colors.textSec, fontStyle: 'italic', fontSize: 10 },

  center: { flex: 2, alignItems: 'center', gap: 2 },
  scoreWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  scoreNum: { color: '#fff', fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
  scoreTbd: { color: colors.textMuted, fontSize: 16, fontWeight: '600', letterSpacing: 1 },
  scoreNumLive: { color: '#ff4444' },
  scoreDash: { color: 'rgba(255,255,255,0.3)', fontSize: 18, fontWeight: '300' },
  time: { color: '#fff', fontSize: 15, fontWeight: '800', letterSpacing: -0.5 },
  timePH: { color: colors.textMuted, fontSize: 13, fontWeight: '700' },
  timeRow: { flexDirection: 'row', alignItems: 'baseline', gap: 5 },
  dateStr: { color: colors.textSec, fontSize: 12, fontWeight: '600' },
  status: { color: colors.textMuted, fontSize: 10, letterSpacing: 0.5, textTransform: 'uppercase' },
  statusLive: { color: '#ff4444', fontWeight: '700' },
  venue: { color: 'rgba(255,255,255,0.45)', fontSize: 9, textAlign: 'center' },

  bellBtn: {
    position: 'absolute', right: 6, top: '50%',
    marginTop: -12,
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center', justifyContent: 'center',
  },
  bellBtnActive: { backgroundColor: colors.gold },
});
