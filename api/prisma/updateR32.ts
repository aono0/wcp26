/**
 * R32試合の対戦国・放送情報を最終確定データで上書きするスクリプト
 * 実行: cd api && npx ts-node prisma/updateR32.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// R32 確定対戦カード（matchDate昇順＝APIソート順と同じ）
const R32_MATCHES = [
  // No.1  6/29(月) 4:00 JST = 2026-06-28T19:00:00Z
  { matchDate: '2026-06-28T19:00:00.000Z', homeCode: 'RSA', awayCode: 'CAN', broadcast: 'DAZN / NHK総合 / NHK BSP4K' },
  // No.2  6/30(火) 2:00 JST = 2026-06-29T17:00:00Z
  { matchDate: '2026-06-29T17:00:00.000Z', homeCode: 'BRA', awayCode: 'JPN', broadcast: 'DAZN / フジテレビ / NHK BS / NHK BSP4K' },
  // No.3  6/30(火) 5:30 JST = 2026-06-29T20:30:00Z
  { matchDate: '2026-06-29T20:30:00.000Z', homeCode: 'GER', awayCode: 'PAR', broadcast: 'DAZN / NHK BSP4K' },
  // No.4  6/30(火) 10:00 JST = 2026-06-30T01:00:00Z
  { matchDate: '2026-06-30T01:00:00.000Z', homeCode: 'NED', awayCode: 'MAR', broadcast: 'DAZN / NHK総合 / NHK BSP4K' },
  // No.5  7/1(水) 2:00 JST = 2026-06-30T17:00:00Z
  { matchDate: '2026-06-30T17:00:00.000Z', homeCode: 'CIV', awayCode: 'NOR', broadcast: 'DAZN / 日本テレビ / NHK BSP4K' },
  // No.6  7/1(水) 6:00 JST = 2026-06-30T21:00:00Z
  { matchDate: '2026-06-30T21:00:00.000Z', homeCode: 'FRA', awayCode: 'SWE', broadcast: 'DAZN / フジテレビ / NHK BSP4K' },
  // No.7  7/1(水) 10:00 JST = 2026-07-01T01:00:00Z
  { matchDate: '2026-07-01T01:00:00.000Z', homeCode: 'MEX', awayCode: 'ECU', broadcast: 'DAZN / NHK総合 / NHK BSP4K' },
  // No.8  7/2(木) 1:00 JST = 2026-07-01T16:00:00Z
  { matchDate: '2026-07-01T16:00:00.000Z', homeCode: 'ENG', awayCode: 'COD', broadcast: 'DAZN / フジテレビ / NHK BSP4K' },
  // No.9  7/2(木) 5:00 JST = 2026-07-01T20:00:00Z
  { matchDate: '2026-07-01T20:00:00.000Z', homeCode: 'BEL', awayCode: 'SEN', broadcast: 'DAZN / NHK総合 / NHK BSP4K' },
  // No.10 7/2(木) 9:00 JST = 2026-07-02T00:00:00Z
  { matchDate: '2026-07-02T00:00:00.000Z', homeCode: 'USA', awayCode: 'BIH', broadcast: 'DAZN / NHK総合 / NHK BSP4K' },
  // No.11 7/3(金) 4:00 JST = 2026-07-02T19:00:00Z
  { matchDate: '2026-07-02T19:00:00.000Z', homeCode: 'ESP', awayCode: 'AUT', broadcast: 'DAZN / NHK総合 / NHK BSP4K' },
  // No.12 7/3(金) 8:00 JST = 2026-07-02T23:00:00Z
  { matchDate: '2026-07-02T23:00:00.000Z', homeCode: 'POR', awayCode: 'CRO', broadcast: 'DAZN / 日本テレビ / NHK BSP4K' },
  // No.13 7/3(金) 12:00 JST = 2026-07-03T03:00:00Z
  { matchDate: '2026-07-03T03:00:00.000Z', homeCode: 'SUI', awayCode: 'ALG', broadcast: 'DAZN / NHK Eテレ→NHK総合 / NHK BSP4K' },
  // No.14 7/4(土) 3:00 JST = 2026-07-03T18:00:00Z
  { matchDate: '2026-07-03T18:00:00.000Z', homeCode: 'AUS', awayCode: 'EGY', broadcast: 'DAZN / NHK総合 / NHK BSP4K' },
  // No.15 7/4(土) 7:00 JST = 2026-07-03T22:00:00Z
  { matchDate: '2026-07-03T22:00:00.000Z', homeCode: 'ARG', awayCode: 'CPV', broadcast: 'DAZN / 日本テレビ / NHK BSP4K' },
  // No.16 7/4(土) 10:30 JST = 2026-07-04T01:30:00Z
  { matchDate: '2026-07-04T01:30:00.000Z', homeCode: 'COL', awayCode: 'GHA', broadcast: 'DAZN / NHK BSP4K' },
];

async function main() {
  console.log('🔄 R32 対戦国・放送情報の更新開始...\n');

  // 国コード→ID のマップを作成
  const countries = await prisma.country.findMany({ select: { id: true, code: true, name: true } });
  const codeToId = new Map(countries.map(c => [c.code, c.id]));
  const codeToName = new Map(countries.map(c => [c.code, c.name]));

  // 現在のR32試合を日付昇順で取得
  const r32Matches = await prisma.match.findMany({
    where: { stage: 'ROUND_OF_32' },
    orderBy: { matchDate: 'asc' },
    include: { entries: true },
  });

  if (r32Matches.length !== 16) {
    throw new Error(`R32試合が16件ではありません（現在: ${r32Matches.length}件）`);
  }

  let updated = 0;

  for (let i = 0; i < R32_MATCHES.length; i++) {
    const ref = R32_MATCHES[i];
    const match = r32Matches[i];

    const homeId = codeToId.get(ref.homeCode);
    const awayId = codeToId.get(ref.awayCode);
    if (!homeId || !awayId) {
      console.error(`❌ 国コード不明: ${ref.homeCode} or ${ref.awayCode}`);
      continue;
    }

    const homeName = codeToName.get(ref.homeCode);
    const awayName = codeToName.get(ref.awayCode);

    // 既存のCountryMatchを削除し再作成
    await prisma.countryMatch.deleteMany({ where: { matchId: match.id } });

    await prisma.countryMatch.createMany({
      data: [
        { matchId: match.id, countryId: homeId, isHome: true },
        { matchId: match.id, countryId: awayId, isHome: false },
      ],
    });

    // プレースホルダーを消去し放送情報を設定
    await prisma.match.update({
      where: { id: match.id },
      data: {
        homePlaceholder: null,
        awayPlaceholder: null,
        broadcastInfo: ref.broadcast,
      },
    });

    console.log(`✅ No.${i + 1} ${homeName} vs ${awayName}  [${ref.broadcast}]`);
    updated++;
  }

  console.log(`\n🎉 完了: ${updated}/16 試合を更新しました`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
