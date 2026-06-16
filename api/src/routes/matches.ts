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
      ...(stage  ? { stage: String(stage) }   : {}),
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

export default router;
