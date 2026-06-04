import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

type PlayerEntry = {
  name: string;
  position: string;
  clubTeam?: string;
  number?: number;
  height?: number;
  weight?: number;
};

type CountryEntry = {
  countryCode: string;
  players: PlayerEntry[];
};

async function main() {
  const filePath = path.join(__dirname, '../../worldcup2026.json');
  const raw = fs.readFileSync(filePath, 'utf-8');
  const data: CountryEntry[] = JSON.parse(raw);

  console.log(`📂 読み込み: ${data.length}か国 ${data.reduce((s, c) => s + c.players.length, 0)}名`);

  // 既存の選手を削除してリセット
  const deleted = await prisma.player.deleteMany();
  console.log(`🗑  既存選手 ${deleted.count}名 削除`);

  let total = 0;
  let skipped = 0;

  for (const entry of data) {
    const country = await prisma.country.findUnique({ where: { code: entry.countryCode } });
    if (!country) {
      console.warn(`⚠  スキップ（国が見つかりません）: ${entry.countryCode}`);
      skipped++;
      continue;
    }

    await prisma.player.createMany({
      data: entry.players.map((p) => ({
        name:       p.name,
        countryId:  country.id,
        position:   p.position,
        clubTeam:   p.clubTeam  ?? null,
        number:     p.number    ?? null,
        height:     p.height    ?? null,
        weight:     p.weight    ?? null,
        goalCount:   0,
        assistCount: 0,
      })),
    });

    console.log(`✅  ${entry.countryCode} (${country.name}): ${entry.players.length}名`);
    total += entry.players.length;
  }

  console.log(`\n🎉 完了: ${total}名 投入 / ${skipped}か国スキップ`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
