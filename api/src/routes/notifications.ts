import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

// 通知登録している試合の一覧（試合詳細つき）
router.get('/matches', async (req: AuthRequest, res) => {
  const notifications = await prisma.matchNotification.findMany({
    where: { userId: req.userId! },
    include: {
      match: {
        include: {
          entries: { include: { country: true }, orderBy: { isHome: 'desc' } },
        },
      },
    },
    orderBy: { match: { matchDate: 'asc' } },
  });
  res.json(notifications.map((n) => ({ id: n.id, matchId: n.matchId, match: n.match })));
});

// 試合通知を登録
router.post('/matches', async (req: AuthRequest, res) => {
  const { matchId } = req.body;
  if (!matchId) { res.status(400).json({ error: 'matchId required' }); return; }

  const notification = await prisma.matchNotification.upsert({
    where: { userId_matchId: { userId: req.userId!, matchId } },
    update: {},
    create: { userId: req.userId!, matchId },
  });
  res.status(201).json(notification);
});

// 試合通知を解除
router.delete('/matches/:matchId', async (req: AuthRequest, res) => {
  await prisma.matchNotification.deleteMany({
    where: { userId: req.userId!, matchId: req.params.matchId },
  });
  res.status(204).send();
});

export default router;
