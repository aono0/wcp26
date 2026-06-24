/**
 * 決勝トーナメントの試合データをDBに投入するスクリプト
 * 実行: npx ts-node prisma/importKnockout.ts
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  const filePath = process.argv[2] ?? path.join(__dirname, '../../..', 'world_cup_2026_knockout_readable_placeholders.json');
  const raw = fs.readFileSync(filePath, 'utf-8');
  const matches: any[] = JSON.parse(raw);

  let created = 0;
  let skipped = 0;

  for (const m of matches) {
    const matchDate = new Date(m.matchDate);

    // 同じ試合時刻（±30分以内）・stageが既に存在する場合はスキップ
    const window = 30 * 60 * 1000;
    const from = new Date(matchDate.getTime() - window);
    const to   = new Date(matchDate.getTime() + window);
    const exists = await prisma.match.findFirst({
      where: { stage: m.stage, matchDate: { gte: from, lte: to } },
    });
    if (exists) {
      console.log(`[SKIP] ${m.stage} ${matchDate.toISOString()} - already exists`);
      skipped++;
      continue;
    }

    const homeCountry = m.home ? await prisma.country.findUnique({ where: { code: m.home } }) : null;
    const awayCountry = m.away ? await prisma.country.findUnique({ where: { code: m.away } }) : null;

    const newMatch = await prisma.match.create({
      data: {
        matchDate,
        venueCity:       m.venueCity ?? null,
        round:           m.stage,
        stage:           m.stage,
        status:          'SCHEDULED',
        homePlaceholder: homeCountry ? null : (m.homePlaceholder ?? null),
        awayPlaceholder: awayCountry ? null : (m.awayPlaceholder ?? null),
        broadcastInfo:   m.broadcastInfo ?? null,
      },
    });

    if (homeCountry) {
      await prisma.countryMatch.create({ data: { matchId: newMatch.id, countryId: homeCountry.id, isHome: true } });
    }
    if (awayCountry) {
      await prisma.countryMatch.create({ data: { matchId: newMatch.id, countryId: awayCountry.id, isHome: false } });
    }

    console.log(`[OK] ${m.stage} ${matchDate.toISOString()} - ${m.venueCity}`);
    created++;
  }

  console.log(`\n完了: ${created}件作成、${skipped}件スキップ`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
