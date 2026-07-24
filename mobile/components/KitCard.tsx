import {
  View, Text, StyleSheet, Animated, TouchableOpacity, Linking,
} from 'react-native';
import { useRef, useEffect, useState, useCallback } from 'react';
import { colors, r } from '@/constants/theme';
import { TeamKit, Kit } from '@/constants/teamKits';

// ── Shimmer（画像読み込み中のパルスアニメーション）────────────────
function Shimmer({ w, h }: { w: number; h: number }) {
  const pulse = useRef(new Animated.Value(0.35)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.7,  duration: 750, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.35, duration: 750, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [pulse]);
  return (
    <Animated.View style={[s.shimmer, { width: w, height: h, opacity: pulse }]} />
  );
}

// ── ユニフォーム画像（URL読み込み + フェードイン）──────────────────
function KitImage({ kit, w, h }: { kit: Kit; w: number; h: number }) {
  const [loaded, setLoaded] = useState(false);
  const fade = useRef(new Animated.Value(0)).current;

  const onLoad = useCallback(() => {
    setLoaded(true);
    Animated.timing(fade, { toValue: 1, duration: 250, useNativeDriver: true }).start();
  }, [fade]);

  // URLなし → 👕 プレースホルダー表示
  if (!kit.imageUrl) {
    return (
      <View style={[s.imgBox, { width: w, height: h }]}>
        <Text style={s.placeholderIcon}>👕</Text>
        <Text style={s.placeholderText}>画像準備中</Text>
      </View>
    );
  }

  // URLあり → シマー → フェードイン
  return (
    <View style={[s.imgBox, { width: w, height: h }]}>
      {!loaded && <Shimmer w={w} h={h} />}
      <Animated.Image
        source={{ uri: kit.imageUrl }}
        style={[StyleSheet.absoluteFill, { opacity: fade }]}
        resizeMode="contain"
        onLoad={onLoad}
      />
    </View>
  );
}

// ── 購入ボタン ─────────────────────────────────────────────────
function BuyButton({ kit }: { kit: Kit }) {
  if (!kit.purchaseUrl) {
    return <Text style={s.notAvailable}>情報準備中</Text>;
  }
  return (
    <TouchableOpacity
      style={s.buyBtn}
      onPress={() => Linking.openURL(kit.purchaseUrl!)}
      activeOpacity={0.75}
    >
      <Text style={s.buyBtnText}>🛒 {kit.purchaseSite ?? '購入する'}</Text>
    </TouchableOpacity>
  );
}

// ── メインカード ───────────────────────────────────────────────
export function KitCard({ team, imgW }: { team: TeamKit; imgW: number }) {
  const imgH = Math.round(imgW * 1.25);

  return (
    <View style={s.card}>
      {/* ヘッダー */}
      <View style={s.header}>
        <Text style={s.flag}>{team.flag}</Text>
        <Text style={s.name} numberOfLines={1}>{team.name}</Text>
        <View style={s.groupBadge}>
          <Text style={s.groupText}>G{team.group}</Text>
        </View>
        <Text style={s.mfr}>{team.manufacturer}</Text>
      </View>

      {/* HOME / AWAY 2列 */}
      <View style={s.row}>
        {(['home', 'away'] as const).map((type) => (
          <View key={type} style={[s.col, { width: imgW }]}>
            <Text style={s.kitLabel}>{type === 'home' ? 'HOME' : 'AWAY'}</Text>
            <KitImage kit={team[type]} w={imgW} h={imgH} />
            <BuyButton kit={team[type]} />
          </View>
        ))}
      </View>

      <Text style={s.disclaimer}>在庫・価格・配送可否は購入先でご確認ください</Text>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: r.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
  },

  // ヘッダー
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  flag:   { fontSize: 26 },
  name:   { flex: 1, color: colors.white, fontSize: 15, fontWeight: '700' },
  groupBadge: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: r.sm,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  groupText: { color: colors.gold, fontSize: 11, fontWeight: '700' },
  mfr:       { color: colors.textMuted, fontSize: 11, fontWeight: '600' },

  // 画像行
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  col: { alignItems: 'center', gap: 8 },

  kitLabel: {
    color: colors.textSec,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
  },

  // 画像ボックス
  imgBox: {
    borderRadius: r.sm,
    overflow: 'hidden',
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shimmer: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: colors.border,
    borderRadius: r.sm,
  },
  placeholderIcon: { fontSize: 40 },
  placeholderText: { color: colors.textMuted, fontSize: 10, marginTop: 6 },

  // 購入ボタン
  buyBtn: {
    backgroundColor: colors.gold,
    borderRadius: r.sm,
    paddingVertical: 7,
    paddingHorizontal: 12,
    alignItems: 'center',
    width: '100%',
  },
  buyBtnText:   { color: '#000', fontSize: 11, fontWeight: '700' },
  notAvailable: { color: colors.textMuted, fontSize: 10, marginTop: 4 },

  // 注意書き
  disclaimer: {
    color: colors.textMuted,
    fontSize: 10,
    marginTop: 14,
    textAlign: 'center',
  },
});
