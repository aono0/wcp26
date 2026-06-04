import { Router } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

// 出場国一覧
router.get('/', async (_req, res) => {
  const countries = await prisma.country.findMany({
    orderBy: [{ groupStage: 'asc' }, { nameEn: 'asc' }],
  });
  res.json(countries);
});

// 全グループ順位表（1クエリで全データ取得→JS側でグループ分け）
router.get('/standings', async (_req, res) => {
  const allCountries = await prisma.country.findMany({
    include: {
      matchEntries: {
        where: { match: { stage: 'GROUP', status: 'FINISHED' } },
        include: { match: { include: { entries: true } } },
      },
    },
  });

  // グループ別に集計
  const byGroup: Record<string, typeof allCountries> = {};
  for (const c of allCountries) {
    if (!byGroup[c.groupStage]) byGroup[c.groupStage] = [];
    byGroup[c.groupStage].push(c);
  }

  const result = Object.keys(byGroup).sort().map((group) => {
    const standings = byGroup[group].map((c) => {
      const played       = c.matchEntries.length;
      const wins         = c.matchEntries.filter((e) => e.result === 'WIN').length;
      const draws        = c.matchEntries.filter((e) => e.result === 'DRAW').length;
      const losses       = c.matchEntries.filter((e) => e.result === 'LOSS').length;
      const goalsFor     = c.matchEntries.reduce((s, e) => s + (e.score ?? 0), 0);
      const goalsAgainst = c.matchEntries.reduce((s, e) => {
        const opp = e.match.entries.find((x) => x.countryId !== c.id);
        return s + (opp?.score ?? 0);
      }, 0);
      const goalDiff = goalsFor - goalsAgainst;
      const points   = wins * 3 + draws;
      return {
        country: { id: c.id, name: c.name, nameEn: c.nameEn, code: c.code, flagEmoji: c.flagEmoji },
        played, wins, draws, losses, goalsFor, goalsAgainst, goalDiff, points,
      };
    });
    standings.sort((a, b) => b.points - a.points || b.goalDiff - a.goalDiff || b.goalsFor - a.goalsFor);
    return { group, standings };
  });

  res.json(result);
});

// 特定グループ順位表
router.get('/standings/:group', async (req, res) => {
  const group = req.params.group.toUpperCase();
  const result = await calcStandings(group);
  res.json(result);
});

// 国詳細（試合・選手つき）
router.get('/:code', async (req, res) => {
  const country = await prisma.country.findUnique({
    where: { code: req.params.code.toUpperCase() },
    include: {
      players: { orderBy: [{ position: 'asc' }, { name: 'asc' }] },
      matchEntries: {
        include: {
          match: { include: { entries: { include: { country: true } } } },
        },
        orderBy: { match: { matchDate: 'asc' } },
      },
    },
  });

  if (!country) {
    res.status(404).json({ error: 'Country not found' });
    return;
  }
  res.json(country);
});

export default router;

// ──────────────────────────────────────────────
// 順位計算ヘルパー（GA・GD・勝ち点を正確に算出）
// ──────────────────────────────────────────────
async function calcStandings(group: string) {
  const countries = await prisma.country.findMany({
    where: { groupStage: group },
    include: {
      matchEntries: {
        where: { match: { stage: 'GROUP', status: 'FINISHED' } },
        include: {
          match: { include: { entries: true } },
        },
      },
    },
  });

  const standings = countries.map((c) => {
    const played  = c.matchEntries.length;
    const wins    = c.matchEntries.filter((e) => e.result === 'WIN').length;
    const draws   = c.matchEntries.filter((e) => e.result === 'DRAW').length;
    const losses  = c.matchEntries.filter((e) => e.result === 'LOSS').length;
    const goalsFor = c.matchEntries.reduce((s, e) => s + (e.score ?? 0), 0);
    const goalsAgainst = c.matchEntries.reduce((s, e) => {
      const opp = e.match.entries.find((x) => x.countryId !== c.id);
      return s + (opp?.score ?? 0);
    }, 0);
    const goalDiff = goalsFor - goalsAgainst;
    const points   = wins * 3 + draws;
    return {
      country: { id: c.id, name: c.name, nameEn: c.nameEn, code: c.code, flagEmoji: c.flagEmoji },
      played, wins, draws, losses, goalsFor, goalsAgainst, goalDiff, points,
    };
  });

  standings.sort((a, b) =>
    b.points - a.points ||
    b.goalDiff - a.goalDiff ||
    b.goalsFor - a.goalsFor
  );

  return { group, standings };
}
