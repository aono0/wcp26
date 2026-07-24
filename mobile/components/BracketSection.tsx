import { ScrollView, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useMemo } from 'react';
import { useRouter } from 'expo-router';
import { colors } from '@/constants/theme';
import { useMatches } from '@/hooks/useMatches';

// ── Layout constants ──────────────────────────────────────────
const TW = 86;   // team tile width
const TH = 26;   // team tile height
const MH = TH * 2 + 2;  // match height = 54
const CW = 24;   // connector column width

// ── Y positions (pre-calculated from top) ────────────────────
const GAP_I = 8;   // gap between the 2 R32 matches in a pair → same R16
const GAP_P = 22;  // gap between pairs → same QF
const GAP_G = 44;  // gap between QF groups → same SF

function buildSY(): number[] {
  const y = new Array(8);
  y[0] = 0;
  y[1] = y[0] + MH + GAP_I;
  y[2] = y[1] + MH + GAP_P;
  y[3] = y[2] + MH + GAP_I;
  y[4] = y[3] + MH + GAP_G;
  y[5] = y[4] + MH + GAP_I;
  y[6] = y[5] + MH + GAP_P;
  y[7] = y[6] + MH + GAP_I;
  return y;
}

const SY = buildSY();
const TOTAL_H = SY[7] + MH;

const mc = (y: number) => y + MH / 2;
const mid = (a: number, b: number) => (mc(a) + mc(b)) / 2 - MH / 2;

const R16Y = [mid(SY[0], SY[1]), mid(SY[2], SY[3]), mid(SY[4], SY[5]), mid(SY[6], SY[7])];
const QFY  = [mid(R16Y[0], R16Y[1]), mid(R16Y[2], R16Y[3])];
const SFY  = mid(QFY[0], QFY[1]);

// ── X positions ───────────────────────────────────────────────
const COL = TW + CW;
const XL_R32 = 0;
const XL_R16 = COL;
const XL_QF  = COL * 2;
const XL_SF  = COL * 3;
const X_FIN  = COL * 4;
const XR_SF  = COL * 5;
const XR_QF  = COL * 6;
const XR_R16 = COL * 7;
const XR_R32 = COL * 8;
const TOTAL_W = XR_R32 + TW;

// ── Bracket match-index mapping ───────────────────────────────
// Matches are sorted by matchDate ascending (0=earliest R32, 31=Final)
const L_R32 = [2, 5, 0, 3, 11, 10, 9, 8];   // matchDate昇順インデックス: GER,FRA,RSA,NED,POR,ESP,USA,BEL
const L_R16 = [17, 16, 20, 21];
const L_QF  = [24, 25];
const L_SF  = 28;
const R_R32 = [1, 4, 6, 7, 14, 13, 12, 15]; // BRA,CIV,MEX,ENG,ARG,AUS,SUI,COL
const R_R16 = [18, 19, 22, 23];
const R_QF  = [26, 27];
const R_SF  = 29;
const I_FIN = 31;

// ── Name abbreviation for tight bracket tiles ─────────────────
function abbr(name: string): string {
  if (!name || name === '?') return '?';
  const g = name.match(/^グループ([A-L])\s*(\d)位$/);
  if (g) return `G${g[1]} ${g[2]}位`;
  if (name.includes('3位通過')) return '3位通過';
  if (name.includes('の勝者')) return '勝者';
  if (name.length <= 7) return name;
  return name.slice(0, 6) + '…';
}

// ── Date formatter (UTC → JST) ────────────────────────────────
function fmtBracketDate(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  const jst = new Date(d.getTime() + 9 * 3600 * 1000);
  const DAYS = ['日','月','火','水','木','金','土'];
  const mo  = jst.getUTCMonth() + 1;
  const dy  = jst.getUTCDate();
  const dow = DAYS[jst.getUTCDay()];
  const h   = jst.getUTCHours();
  const mi  = jst.getUTCMinutes();
  return {
    date: `${mo}/${dy}(${dow})`,
    time: `${h}:${mi.toString().padStart(2,'0')}`,
  };
}

// ── Data type ─────────────────────────────────────────────────
type BM = {
  status: string;
  hs: number | null;
  as: number | null;
  hr: string | null;  // home result: WIN / LOSS / DRAW / null
  ar: string | null;  // away result
  hn: string;
  an: string;
  hf: string;
  af: string;
  hc: string | null;
  ac: string | null;
  matchDate: string;
};

function winSide(m: BM | null): 'h' | 'a' | null {
  if (!m || m.status !== 'FINISHED') return null;
  // resultフィールドがあればそちらを優先（PK決着に対応）
  if (m.hr === 'WIN')  return 'h';
  if (m.ar === 'WIN')  return 'a';
  // fallback: スコア比較
  if (m.hs == null || m.as == null) return null;
  return m.hs > m.as ? 'h' : m.as > m.hs ? 'a' : null;
}

// ── Team tile ─────────────────────────────────────────────────
function Tile({ name, flag, won, lost, code }: { name: string; flag: string; won: boolean; lost: boolean; code?: string | null }) {
  const router = useRouter();
  const inner = (
    <View style={[s.tile, won && s.tileWon, lost && s.tileLost]}>
      <Text style={s.flag}>{flag || '🏳️'}</Text>
      <Text style={[s.name, won && s.nameWon, lost && s.nameLost]} numberOfLines={1}>
        {abbr(name)}
      </Text>
    </View>
  );
  if (!code) return inner;
  return (
    <TouchableOpacity activeOpacity={0.7} onPress={() => router.push(`/country/${code}`)}>
      {inner}
    </TouchableOpacity>
  );
}

// ── Match slot ────────────────────────────────────────────────
function Slot({ m, x, y }: { m: BM | null; x: number; y: number }) {
  const w = winSide(m);
  return (
    <View style={{ position: 'absolute', left: x, top: y, width: TW }}>
      <Tile name={m?.hn ?? '?'} flag={m?.hf ?? ''} won={w === 'h'} lost={w === 'a'} code={m?.hc} />
      <View style={s.div} />
      <Tile name={m?.an ?? '?'} flag={m?.af ?? ''} won={w === 'a'} lost={w === 'h'} code={m?.ac} />
    </View>
  );
}

// ── Date-only slot (R16 / QF / SF – all placeholders) ─────────
function DateSlot({ m, x, y }: { m: BM | null; x: number; y: number }) {
  const { date, time } = m?.matchDate ? fmtBracketDate(m.matchDate) : { date: '?', time: '' };
  return (
    <View style={[s.dateSlot, { left: x, top: y }]}>
      <Text style={s.dateSlotDate}>{date}</Text>
      {!!time && <Text style={s.dateSlotTime}>{time}</Text>}
    </View>
  );
}

// ── Trophy slot (Final) ───────────────────────────────────────
function TrophySlot({ x, y }: { x: number; y: number }) {
  return (
    <View style={[s.trophySlot, { left: x, top: y }]}>
      <Text style={s.trophyEmoji}>🏆</Text>
    </View>
  );
}

// ── Bracket connector lines ───────────────────────────────────
// teamSlots=true  → source slots are R32 (2 tiles). Only winner's tile gets a stub.
//   Winner tile center → horizontal stub → bend down/up to match center → bridge → inter-vert → output
// teamSlots=false → source slots are DateSlots, connect at slot center (simple bracket)
function Line({
  topY, botY, connX, dir, topDone, botDone,
  teamSlots = false, topWin = null, botWin = null,
}: {
  topY: number; botY: number; connX: number;
  dir: 'right' | 'left'; topDone: boolean; botDone: boolean;
  teamSlots?: boolean;
  topWin?: 'h' | 'a' | null;
  botWin?: 'h' | 'a' | null;
}) {
  const LW = 1.5;
  const topCol = topDone  ? colors.gold : 'rgba(255,255,255,0.15)';
  const botCol = botDone  ? colors.gold : 'rgba(255,255,255,0.15)';
  const midCol = (topDone && botDone) ? colors.gold : 'rgba(255,255,255,0.15)';

  const hl = (l: number, t: number, w: number, c: string) =>
    <View style={{ position: 'absolute', left: l, top: t - LW / 2, width: w, height: LW, backgroundColor: c }} />;
  const vl = (l: number, t: number, h: number, c: string) =>
    <View style={{ position: 'absolute', left: l - LW / 2, top: t, width: LW, height: h, backgroundColor: c }} />;

  const tc = topY + MH / 2;
  const bc = botY + MH / 2;
  const mm = (tc + bc) / 2;

  if (!teamSlots) {
    if (dir === 'right') return <>
      {hl(connX,           tc, CW / 2, topCol)}
      {hl(connX,           bc, CW / 2, botCol)}
      {vl(connX + CW / 2,  tc, bc - tc, midCol)}
      {hl(connX + CW / 2,  mm, CW / 2, midCol)}
    </>;
    return <>
      {hl(connX + CW / 2, tc, CW / 2, topCol)}
      {hl(connX + CW / 2, bc, CW / 2, botCol)}
      {vl(connX + CW / 2, tc, bc - tc, midCol)}
      {hl(connX,           mm, CW / 2, midCol)}
    </>;
  }

  // teamSlots: 3-segment [stub | bridge | output]
  const seg = CW / 3;
  const t_h = topY + TH / 2;
  const t_a = topY + TH + 2 + TH / 2;
  const b_h = botY + TH / 2;
  const b_a = botY + TH + 2 + TH / 2;

  // Winner's tile center (or match center if undecided)
  const tWY = topDone && topWin ? (topWin === 'h' ? t_h : t_a) : tc;
  const bWY = botDone && botWin ? (botWin === 'h' ? b_h : b_a) : bc;
  const tBend = topDone && topWin !== null;
  const bBend = botDone && botWin !== null;

  if (dir === 'right') return <>
    {hl(connX,           tWY, seg, topCol)}
    {tBend && vl(connX + seg, Math.min(tWY, tc), Math.abs(tWY - tc), topCol)}
    {hl(connX + seg,     tc,  seg, topCol)}
    {hl(connX,           bWY, seg, botCol)}
    {bBend && vl(connX + seg, Math.min(bWY, bc), Math.abs(bWY - bc), botCol)}
    {hl(connX + seg,     bc,  seg, botCol)}
    {vl(connX + seg * 2, tc, bc - tc, midCol)}
    {hl(connX + seg * 2, mm,  seg, midCol)}
  </>;

  // dir === 'left' (mirror)
  return <>
    {hl(connX + seg * 2, tWY, seg, topCol)}
    {tBend && vl(connX + seg * 2, Math.min(tWY, tc), Math.abs(tWY - tc), topCol)}
    {hl(connX + seg,     tc,  seg, topCol)}
    {hl(connX + seg * 2, bWY, seg, botCol)}
    {bBend && vl(connX + seg * 2, Math.min(bWY, bc), Math.abs(bWY - bc), botCol)}
    {hl(connX + seg,     bc,  seg, botCol)}
    {vl(connX + seg,     tc, bc - tc, midCol)}
    {hl(connX,           mm,  seg, midCol)}
  </>;
}

// Single horizontal line (SF → Final)
function HLine({ x, y, len, done }: { x: number; y: number; len: number; done: boolean }) {
  return (
    <View style={{
      position: 'absolute', left: x, top: mc(y) - 0.75,
      width: len, height: 1.5,
      backgroundColor: done ? colors.gold : 'rgba(255,255,255,0.15)',
    }} />
  );
}

// ── Debug: simulate Japan & CIV advancing (remove before ship) ─
const _DEBUG_ADVANCE = false;

// ── Main component ────────────────────────────────────────────
export function BracketSection() {
  const { data: raw } = useMatches({ stage: 'KNOCKOUT' });

  const ms: (BM | null)[] = useMemo(() => {
    if (!raw) return [];
    const sorted = [...raw].sort((a, b) => a.matchDate.localeCompare(b.matchDate));
    const arr: (BM | null)[] = sorted.map(m => {
      const h = m.entries?.find((e: any) => e.isHome);
      const a = m.entries?.find((e: any) => !e.isHome);
      return {
        status: m.status,
        hs: h?.score ?? null,
        as: a?.score ?? null,
        hr: h?.result ?? null,
        ar: a?.result ?? null,
        hn: h?.country?.name ?? m.homePlaceholder ?? '?',
        an: a?.country?.name ?? m.awayPlaceholder ?? '?',
        hf: h?.country?.flagEmoji ?? '',
        af: a?.country?.flagEmoji ?? '',
        hc: h?.country?.code ?? null,
        ac: a?.country?.code ?? null,
        matchDate: m.matchDate ?? '',
      };
    });
    if (_DEBUG_ADVANCE && arr.length >= 3) {
      // L_R32 slot 0 (ms[0]) → Japan wins 2-1
      if (arr[0]) arr[0] = { ...arr[0]!, status: 'FINISHED', hs: 2, as: 1,
        hn: '日本', hf: '🇯🇵', hc: 'JPN' };
      // L_R32 slot 1 (ms[2]) → CIV wins 1-0  ※ペアにするとコネクターも金になる
      if (arr[2]) arr[2] = { ...arr[2]!, status: 'FINISHED', hs: 1, as: 0,
        hn: 'コートジボワール', hf: '🇨🇮', hc: 'CIV' };
    }
    return arr;
  }, [raw]);

  if (!ms.length) return null;

  const g  = (i: number) => ms[i] ?? null;
  const dn = (i: number) => ms[i]?.status === 'FINISHED';
  const ws = (i: number) => winSide(ms[i] ?? null);

  return (
    <View style={s.outer}>
      <View style={s.labelRow}>
        <View style={s.labelBar} />
        <Text style={s.labelText}>決勝トーナメント表</Text>
      </View>
      <View style={s.hint}>
        <Text style={s.hintText}>← スクロールで全体表示</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.scroll}>
        <View style={{ width: TOTAL_W, height: TOTAL_H, position: 'relative' }}>

          {/* ── Match slots ── */}
          {L_R32.map((idx, i) => <Slot     key={`lr32${i}`} m={g(idx)} x={XL_R32} y={SY[i]}   />)}
          {L_R16.map((idx, i) => <Slot     key={`lr16${i}`} m={g(idx)} x={XL_R16} y={R16Y[i]} />)}
          {L_QF.map((idx, i)  => <Slot     key={`lqf${i}`}  m={g(idx)} x={XL_QF}  y={QFY[i]} />)}
          <Slot m={g(L_SF)} x={XL_SF} y={SFY} />
          <TrophySlot x={X_FIN} y={SFY} />
          <Slot m={g(R_SF)} x={XR_SF} y={SFY} />
          {R_QF.map((idx, i)  => <Slot     key={`rqf${i}`}  m={g(idx)} x={XR_QF}  y={QFY[i]} />)}
          {R_R16.map((idx, i) => <Slot     key={`rr16${i}`} m={g(idx)} x={XR_R16} y={R16Y[i]} />)}
          {R_R32.map((idx, i) => <Slot     key={`rr32${i}`} m={g(idx)} x={XR_R32} y={SY[i]}   />)}

          {/* ── Left connectors ── */}
          {[0,1,2,3].map(i => (
            <Line key={`lc1-${i}`} topY={SY[i*2]} botY={SY[i*2+1]}
              connX={XL_R32+TW} dir="right" teamSlots
              topDone={dn(L_R32[i*2])} botDone={dn(L_R32[i*2+1])}
              topWin={ws(L_R32[i*2])}  botWin={ws(L_R32[i*2+1])} />
          ))}
          {[0,1].map(i => (
            <Line key={`lc2-${i}`} topY={R16Y[i*2]} botY={R16Y[i*2+1]}
              connX={XL_R16+TW} dir="right" teamSlots
              topDone={dn(L_R16[i*2])} botDone={dn(L_R16[i*2+1])}
              topWin={ws(L_R16[i*2])}  botWin={ws(L_R16[i*2+1])} />
          ))}
          <Line topY={QFY[0]} botY={QFY[1]} connX={XL_QF+TW} dir="right" teamSlots
            topDone={dn(L_QF[0])} botDone={dn(L_QF[1])}
            topWin={ws(L_QF[0])}  botWin={ws(L_QF[1])} />
          <HLine x={XL_SF+TW} y={SFY} len={CW} done={dn(L_SF)} />

          {/* ── Right connectors ── */}
          {[0,1,2,3].map(i => (
            <Line key={`rc1-${i}`} topY={SY[i*2]} botY={SY[i*2+1]}
              connX={XR_R16+TW} dir="left" teamSlots
              topDone={dn(R_R32[i*2])} botDone={dn(R_R32[i*2+1])}
              topWin={ws(R_R32[i*2])}  botWin={ws(R_R32[i*2+1])} />
          ))}
          {[0,1].map(i => (
            <Line key={`rc2-${i}`} topY={R16Y[i*2]} botY={R16Y[i*2+1]}
              connX={XR_QF+TW} dir="left" teamSlots
              topDone={dn(R_R16[i*2])} botDone={dn(R_R16[i*2+1])}
              topWin={ws(R_R16[i*2])}  botWin={ws(R_R16[i*2+1])} />
          ))}
          <Line topY={QFY[0]} botY={QFY[1]} connX={XR_SF+TW} dir="left" teamSlots
            topDone={dn(R_QF[0])} botDone={dn(R_QF[1])}
            topWin={ws(R_QF[0])}  botWin={ws(R_QF[1])} />
          <HLine x={X_FIN+TW} y={SFY} len={CW} done={dn(R_SF)} />
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  outer:    { paddingHorizontal: 16, paddingTop: 15, paddingBottom: 4 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  labelBar: { width: 3, height: 16, borderRadius: 2, backgroundColor: colors.gold },
  labelText:{ color: colors.gold, fontSize: 11, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' },
  hint:     { marginBottom: 8 },
  hintText: { color: colors.textMuted, fontSize: 10 },
  scroll:   { marginHorizontal: -4 },

  tile: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    height: TH, paddingHorizontal: 4,
    backgroundColor: '#0D1425',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  tileWon:  { backgroundColor: 'rgba(240,180,41,0.12)', borderColor: colors.gold },
  tileLost: { opacity: 0.4 },
  flag:     { fontSize: 13 },
  name:     { flex: 1, color: colors.textSec, fontSize: 10, fontWeight: '600' },
  nameWon:  { color: colors.gold },
  nameLost: { color: colors.textMuted },
  div:      { height: 2, backgroundColor: colors.bg },

  dateSlot: {
    position: 'absolute', width: TW, height: MH,
    backgroundColor: '#0D1425',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center', justifyContent: 'center', gap: 2,
  },
  dateSlotDate: { color: colors.textSec, fontSize: 10, fontWeight: '700' },
  dateSlotTime: { color: colors.textMuted, fontSize: 9 },

  trophySlot: {
    position: 'absolute', width: TW, height: MH,
    backgroundColor: 'rgba(240,180,41,0.06)',
    borderWidth: 1, borderColor: colors.gold,
    alignItems: 'center', justifyContent: 'center',
  },
  trophyEmoji: { fontSize: 26 },
});
