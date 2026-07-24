/**
 * 決勝トーナメント結果を更新するスクリプト
 * 実行: cd api && npx ts-node prisma/updateResults.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ── R32 結果 ─────────────────────────────────────────────────────────
// matchDate昇順（updateR32.tsと同じ順序）
// score: 延長・PKを含む最終スコア（PK戦の得点はscoreに含めない）
const R32_RESULTS = [
  { matchDate: '2026-06-28T19:00:00.000Z', homeCode: 'RSA', awayCode: 'CAN', homeScore: 0, awayScore: 1 }, // カナダ勝利
  { matchDate: '2026-06-29T17:00:00.000Z', homeCode: 'BRA', awayCode: 'JPN', homeScore: 2, awayScore: 1 }, // ブラジル勝利
  { matchDate: '2026-06-29T20:30:00.000Z', homeCode: 'GER', awayCode: 'PAR', homeScore: 1, awayScore: 1 }, // パラグアイ勝利(PK)
  { matchDate: '2026-06-30T01:00:00.000Z', homeCode: 'NED', awayCode: 'MAR', homeScore: 1, awayScore: 1 }, // モロッコ勝利(PK)
  { matchDate: '2026-06-30T17:00:00.000Z', homeCode: 'CIV', awayCode: 'NOR', homeScore: 1, awayScore: 2 }, // ノルウェー勝利
  { matchDate: '2026-06-30T21:00:00.000Z', homeCode: 'FRA', awayCode: 'SWE', homeScore: 3, awayScore: 0 }, // フランス勝利
  { matchDate: '2026-07-01T01:00:00.000Z', homeCode: 'MEX', awayCode: 'ECU', homeScore: 2, awayScore: 0 }, // メキシコ勝利
  { matchDate: '2026-07-01T16:00:00.000Z', homeCode: 'ENG', awayCode: 'COD', homeScore: 2, awayScore: 1 }, // イングランド勝利
  { matchDate: '2026-07-01T20:00:00.000Z', homeCode: 'BEL', awayCode: 'SEN', homeScore: 3, awayScore: 2 }, // ベルギー勝利(延長)
  { matchDate: '2026-07-02T00:00:00.000Z', homeCode: 'USA', awayCode: 'BIH', homeScore: 2, awayScore: 0 }, // アメリカ勝利
  { matchDate: '2026-07-02T19:00:00.000Z', homeCode: 'ESP', awayCode: 'AUT', homeScore: 3, awayScore: 0 }, // スペイン勝利
  { matchDate: '2026-07-02T23:00:00.000Z', homeCode: 'POR', awayCode: 'CRO', homeScore: 2, awayScore: 1 }, // ポルトガル勝利
  { matchDate: '2026-07-03T03:00:00.000Z', homeCode: 'SUI', awayCode: 'ALG', homeScore: 2, awayScore: 0 }, // スイス勝利
  { matchDate: '2026-07-03T18:00:00.000Z', homeCode: 'AUS', awayCode: 'EGY', homeScore: 1, awayScore: 1 }, // エジプト勝利(PK)
  { matchDate: '2026-07-03T22:00:00.000Z', homeCode: 'ARG', awayCode: 'CPV', homeScore: 3, awayScore: 2 }, // アルゼンチン勝利(延長)
  { matchDate: '2026-07-04T01:30:00.000Z', homeCode: 'COL', awayCode: 'GHA', homeScore: 1, awayScore: 0 }, // コロンビア勝利
];

// PKで勝者が決まった試合（スコアが同点でも勝者を正しく記録する）
const PK_WINNERS = new Set(['MAR', 'PAR', 'EGY']); // PK勝利国

// ── R16 確定データ ────────────────────────────────────────────────────
// matchDate昇順
const R16_MATCHES = [
  {
    matchDate: '2026-07-04T17:00:00.000Z', homeCode: 'MAR', awayCode: 'CAN',
    homeScore: 3, awayScore: 0, status: 'FINISHED',
  },
  {
    matchDate: '2026-07-04T21:00:00.000Z', homeCode: 'FRA', awayCode: 'PAR',
    homeScore: 1, awayScore: 0, status: 'FINISHED',
  },
  {
    matchDate: '2026-07-05T20:00:00.000Z', homeCode: 'BRA', awayCode: 'NOR',
    homeScore: 1, awayScore: 2, status: 'FINISHED',
  },
  {
    matchDate: '2026-07-06T01:00:00.000Z', homeCode: 'MEX', awayCode: 'ENG',
    homeScore: null, awayScore: null, status: 'SCHEDULED', // 雷雨遅延・未終了
  },
  {
    matchDate: '2026-07-06T19:00:00.000Z', homeCode: 'POR', awayCode: 'ESP',
    homeScore: null, awayScore: null, status: 'SCHEDULED',
  },
  {
    matchDate: '2026-07-07T00:00:00.000Z', homeCode: 'USA', awayCode: 'BEL',
    homeScore: null, awayScore: null, status: 'SCHEDULED',
  },
  {
    matchDate: '2026-07-07T16:00:00.000Z', homeCode: 'ARG', awayCode: 'EGY',
    homeScore: null, awayScore: null, status: 'SCHEDULED',
  },
  {
    matchDate: '2026-07-07T20:00:00.000Z', homeCode: 'SUI', awayCode: 'COL',
    homeScore: null, awayScore: null, status: 'SCHEDULED',
  },
];

// ── ユーティリティ ────────────────────────────────────────────────────
function getResult(myScore: number, oppScore: number, myCode: string, oppCode: string, isPK: boolean): string {
  if (myScore > oppScore) return 'WIN';
  if (myScore < oppScore) return 'LOSS';
  // 同点 = PK決着
  if (isPK) return PK_WINNERS.has(myCode) ? 'WIN' : 'LOSS';
  return 'DRAW';
}

async function main() {
  const countries = await prisma.country.findMany({ select: { id: true, code: true, name: true } });
  const codeToId   = new Map(countries.map(c => [c.code, c.id]));
  const codeToName = new Map(countries.map(c => [c.code, c.name]));

  // ── R32 更新 ──────────────────────────────────────────────────────
  console.log('━━━ R32 結果更新 ━━━');
  const r32Matches = await prisma.match.findMany({
    where: { stage: 'ROUND_OF_32' },
    orderBy: { matchDate: 'asc' },
    include: { entries: true },
  });

  if (r32Matches.length !== 16) throw new Error(`R32試合数が不正: ${r32Matches.length}`);

  for (let i = 0; i < R32_RESULTS.length; i++) {
    const ref   = R32_RESULTS[i];
    const match = r32Matches[i];
    const homeId = codeToId.get(ref.homeCode)!;
    const awayId = codeToId.get(ref.awayCode)!;
    const isPK = ref.homeScore === ref.awayScore;

    // スコア・結果を CountryMatch に書き込み
    await prisma.countryMatch.updateMany({
      where: { matchId: match.id, countryId: homeId },
      data: {
        score:  ref.homeScore,
        result: getResult(ref.homeScore, ref.awayScore, ref.homeCode, ref.awayCode, isPK),
      },
    });
    await prisma.countryMatch.updateMany({
      where: { matchId: match.id, countryId: awayId },
      data: {
        score:  ref.awayScore,
        result: getResult(ref.awayScore, ref.homeScore, ref.awayCode, ref.homeCode, isPK),
      },
    });

    // 試合ステータスを FINISHED に
    await prisma.match.update({
      where: { id: match.id },
      data: { status: 'FINISHED' },
    });

    const winner = isPK ? PK_WINNERS.has(ref.homeCode) ? codeToName.get(ref.homeCode) : codeToName.get(ref.awayCode)
                        : ref.homeScore > ref.awayScore ? codeToName.get(ref.homeCode) : codeToName.get(ref.awayCode);
    console.log(`✅ ${codeToName.get(ref.homeCode)} ${ref.homeScore}-${ref.awayScore} ${codeToName.get(ref.awayCode)}${isPK ? ' (PK)' : ''} → ${winner}`);
  }

  // ── R16 更新 ──────────────────────────────────────────────────────
  console.log('\n━━━ R16 対戦国確定・結果更新 ━━━');
  const r16Matches = await prisma.match.findMany({
    where: { stage: 'ROUND_OF_16' },
    orderBy: { matchDate: 'asc' },
    include: { entries: true },
  });

  if (r16Matches.length !== 8) throw new Error(`R16試合数が不正: ${r16Matches.length}`);

  for (let i = 0; i < R16_MATCHES.length; i++) {
    const ref   = R16_MATCHES[i];
    const match = r16Matches[i];
    const homeId = codeToId.get(ref.homeCode)!;
    const awayId = codeToId.get(ref.awayCode)!;

    // CountryMatch を再作成（対戦国確定）
    await prisma.countryMatch.deleteMany({ where: { matchId: match.id } });

    if (ref.status === 'FINISHED' && ref.homeScore !== null && ref.awayScore !== null) {
      const isPK = ref.homeScore === ref.awayScore;
      await prisma.countryMatch.createMany({
        data: [
          {
            matchId: match.id, countryId: homeId, isHome: true,
            score:  ref.homeScore,
            result: getResult(ref.homeScore, ref.awayScore, ref.homeCode, ref.awayCode, isPK),
          },
          {
            matchId: match.id, countryId: awayId, isHome: false,
            score:  ref.awayScore,
            result: getResult(ref.awayScore, ref.homeScore, ref.awayCode, ref.homeCode, isPK),
          },
        ],
      });
      await prisma.match.update({
        where: { id: match.id },
        data: { status: 'FINISHED', homePlaceholder: null, awayPlaceholder: null },
      });
      const winner = ref.homeScore > ref.awayScore ? codeToName.get(ref.homeCode) : codeToName.get(ref.awayCode);
      console.log(`✅ ${codeToName.get(ref.homeCode)} ${ref.homeScore}-${ref.awayScore} ${codeToName.get(ref.awayCode)} → ${winner}`);
    } else {
      // 未終了・未開催：対戦国だけ確定、スコアなし
      await prisma.countryMatch.createMany({
        data: [
          { matchId: match.id, countryId: homeId, isHome: true },
          { matchId: match.id, countryId: awayId, isHome: false },
        ],
      });
      await prisma.match.update({
        where: { id: match.id },
        data: { homePlaceholder: null, awayPlaceholder: null },
      });
      const label = ref.status === 'SCHEDULED' ? '未開催' : '未終了';
      console.log(`⏳ ${codeToName.get(ref.homeCode)} vs ${codeToName.get(ref.awayCode)} (${label})`);
    }
  }

  console.log('\n🎉 完了');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
