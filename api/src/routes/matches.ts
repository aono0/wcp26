import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { syncAll } from '../services/footballData';
import { requireAdmin } from '../middleware/adminAuth';

const router = Router();

// 試合一覧
// クエリパラメータ:
//   ?stage=GROUP
//   ?status=SCHEDULED|FINISHED|LIVE
//   ?md=1|2|3  (グループステージのマッチデー)
//   ?from=ISO日付  (この日時以降の試合のみ)
//   ?to=ISO日付    (この日時より前の試合のみ)
router.get('/', async (req, res) => {
  const { stage, status, md, from, to } = req.query;

  const parseDate = (v: unknown) => { const d = new Date(String(v)); return isNaN(d.getTime()) ? null : d; };

  const matches = await prisma.match.findMany({
    where: {
      ...(stage && stage !== 'KNOCKOUT' ? { stage: String(stage) } : {}),
      ...(stage === 'KNOCKOUT' ? { stage: { not: 'GROUP' } } : {}),
      ...(status ? { status: String(status) } : {}),
      ...(md     ? { round: { contains: `MD${md}` } } : {}),
      ...(from || to ? { matchDate: {
        ...(from ? (() => { const d = parseDate(from); return d ? { gte: d } : {}; })() : {}),
        ...(to   ? (() => { const d = parseDate(to);   return d ? { lt:  d } : {}; })() : {}),
      } } : {}),
    },
    include: {
      entries: {
        include: { country: true },
        orderBy: { isHome: 'desc' },
      },
    },
    orderBy: { matchDate: 'asc' },
  });

  res.json(matches);
});

// 試合詳細
router.get('/:id', async (req, res) => {
  const match = await prisma.match.findUnique({
    where: { id: req.params.id },
    include: {
      entries: {
        include: { country: true }, // players は別途 /countries/:code で取得
        orderBy: { isHome: 'desc' },
      },
    },
  });

  if (!match) {
    res.status(404).json({ error: 'Match not found' });
    return;
  }
  res.json(match);
});

// 手動同期トリガー（管理者用）
router.post('/sync', requireAdmin, async (_req, res) => {
  syncAll().catch(console.error);
  res.json({ message: '試合データ同期を開始しました' });
});

// 決勝T試合のチームを手動で確定する（管理者用）
// curl -X POST .../matches/:id/fill-teams \
//   -H "X-Admin-Secret: xxx" \
//   -H "Content-Type: application/json" \
//   -d '{"homeCode":"JPN","awayCode":"BRA"}'
router.post('/:id/fill-teams', requireAdmin, async (req, res) => {
  const { homeCode, awayCode } = req.body;
  if (!homeCode || !awayCode) {
    res.status(400).json({ error: 'homeCode and awayCode are required' });
    return;
  }

  const [homeCountry, awayCountry] = await Promise.all([
    prisma.country.findUnique({ where: { code: String(homeCode).toUpperCase() } }),
    prisma.country.findUnique({ where: { code: String(awayCode).toUpperCase() } }),
  ]);
  if (!homeCountry) { res.status(404).json({ error: `Country not found: ${homeCode}` }); return; }
  if (!awayCountry) { res.status(404).json({ error: `Country not found: ${awayCode}` }); return; }

  await prisma.countryMatch.upsert({
    where: { matchId_countryId: { matchId: req.params.id, countryId: homeCountry.id } },
    update: { isHome: true },
    create: { matchId: req.params.id, countryId: homeCountry.id, isHome: true },
  });
  await prisma.countryMatch.upsert({
    where: { matchId_countryId: { matchId: req.params.id, countryId: awayCountry.id } },
    update: { isHome: false },
    create: { matchId: req.params.id, countryId: awayCountry.id, isHome: false },
  });
  await prisma.match.update({
    where: { id: req.params.id },
    data: { homePlaceholder: null, awayPlaceholder: null },
  });

  res.json({ message: `${homeCode} vs ${awayCode} を確定しました` });
});

export default router;
