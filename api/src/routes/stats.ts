import { Router } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

// 得点ランキング
router.get('/scorers', async (req, res) => {
  const limit = Math.min(Math.max(1, parseInt(String(req.query.limit ?? '20'))), 50);
  const players = await prisma.player.findMany({
    orderBy: [{ goalCount: 'desc' }, { assistCount: 'desc' }],
    take: limit,
    include: { country: { select: { name: true, code: true, flagEmoji: true } } },
  });
  res.json(players);
});

// アシストランキング
router.get('/assisters', async (req, res) => {
  const limit = Math.min(parseInt(String(req.query.limit ?? '20')), 50);
  const players = await prisma.player.findMany({
    orderBy: [{ assistCount: 'desc' }, { goalCount: 'desc' }],
    take: limit,
    include: { country: { select: { name: true, code: true, flagEmoji: true } } },
  });
  res.json(players);
});

export default router;
