/**
 * 放送情報を更新するスクリプト
 * 実行: cd api && npx ts-node prisma/updateBroadcast.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const UPDATES = [
  // ── R16 残り ─────────────────────────────────────────────
  { matchDate: '2026-07-06T01:00:00.000Z', broadcast: 'DAZN / NHK BSP4K 録画' },          // 7/6 10:00 MEX vs ENG
  { matchDate: '2026-07-06T19:00:00.000Z', broadcast: 'DAZN / 日本テレビ / NHK BSP4K 録画' }, // 7/7 04:00 POR vs ESP
  { matchDate: '2026-07-07T00:00:00.000Z', broadcast: 'DAZN / フジテレビ / NHK BSP4K 録画' }, // 7/7 09:00 USA vs BEL
  { matchDate: '2026-07-07T16:00:00.000Z', broadcast: 'DAZN / NHK BSP4K 録画' },          // 7/8 01:00 ARG vs EGY
  { matchDate: '2026-07-07T20:00:00.000Z', broadcast: 'DAZN / NHK総合 / NHK BSP4K 生' },  // 7/8 05:00 SUI vs COL
  // ── 準々決勝 ────────────────────────────────────────────
  { matchDate: '2026-07-09T20:00:00.000Z', broadcast: 'DAZN / NHK BSP4K 録画' },          // 7/10 05:00 FRA vs MAR
  { matchDate: '2026-07-10T19:00:00.000Z', broadcast: 'DAZN / フジテレビ / NHK BSP4K 録画' }, // 7/11 04:00 QF
  { matchDate: '2026-07-11T21:00:00.000Z', broadcast: 'DAZN / NHK総合 / NHK BSP4K 生' },  // 7/12 06:00 QF
  { matchDate: '2026-07-12T01:00:00.000Z', broadcast: 'DAZN / NHK BSP4K 録画' },          // 7/12 10:00 QF
  // ── 準決勝 ──────────────────────────────────────────────
  { matchDate: '2026-07-14T19:00:00.000Z', broadcast: 'DAZN / 日本テレビ / NHK BSP4K 録画' }, // 7/15 04:00 SF
  { matchDate: '2026-07-15T19:00:00.000Z', broadcast: 'DAZN / NHK総合 / NHK BSP4K 生' },  // 7/16 04:00 SF
  // ── 3位決定戦 ───────────────────────────────────────────
  { matchDate: '2026-07-18T21:00:00.000Z', broadcast: 'DAZN / NHK総合 / NHK BSP4K 生' },  // 7/19 06:00
  // ── 決勝 ────────────────────────────────────────────────
  // { matchDate: '2026-07-19T19:00:00.000Z', broadcast: 'DAZN / ...' }, // 7/20 04:00 ※放送情報確認中
];

async function main() {
  console.log('🔄 放送情報更新開始...\n');
  let updated = 0;

  for (const u of UPDATES) {
    const target = new Date(u.matchDate);
    const from   = new Date(target.getTime() - 30 * 60 * 1000);
    const to     = new Date(target.getTime() + 30 * 60 * 1000);

    const match = await prisma.match.findFirst({
      where: { matchDate: { gte: from, lte: to } },
    });

    if (!match) {
      console.warn(`⚠️  試合が見つかりません: ${u.matchDate}`);
      continue;
    }

    await prisma.match.update({
      where: { id: match.id },
      data: { broadcastInfo: u.broadcast },
    });

    const jst = new Date(target.getTime() + 9 * 3600 * 1000);
    console.log(`✅ ${jst.getUTCMonth()+1}/${jst.getUTCDate()} ${String(jst.getUTCHours()).padStart(2,'0')}:${String(jst.getUTCMinutes()).padStart(2,'0')} JST → ${u.broadcast}`);
    updated++;
  }

  console.log(`\n🎉 完了: ${updated}件更新`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
