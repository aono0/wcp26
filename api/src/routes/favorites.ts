import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

router.use(requireAuth);

// お気に入り一覧
router.get('/', async (req: AuthRequest, res) => {
  const favorites = await prisma.userFavorite.findMany({
    where: { userId: req.userId! },
    include: {
      country: {
        include: {
          matchEntries: {
            include: { match: { include: { entries: { include: { country: true } } } } },
            orderBy: { match: { matchDate: 'asc' } },
            take: 5,
          },
        },
      },
    },
  });
  res.json(favorites.map((f) => f.country));
});

// お気に入り追加（チームの試合をMatchNotificationに自動登録）
router.post('/', async (req: AuthRequest, res) => {
  const { countryId } = req.body;
  if (!countryId) {
    res.status(400).json({ error: 'countryId is required' });
    return;
  }

  const favorite = await prisma.userFavorite.upsert({
    where: { userId_countryId: { userId: req.userId!, countryId } },
    update: {},
    create: { userId: req.userId!, countryId },
  });

  // 追加したチームの今後の試合をMatchNotificationに自動登録
  const upcoming = await prisma.countryMatch.findMany({
    where: { countryId, match: { status: 'SCHEDULED' } },
    select: { matchId: true },
  });

  if (upcoming.length > 0) {
    await prisma.matchNotification.createMany({
      data: upcoming.map((m) => ({ userId: req.userId!, matchId: m.matchId })),
      skipDuplicates: true,
    });
  }

  res.status(201).json(favorite);
});

// お気に入り削除
router.delete('/:countryId', async (req: AuthRequest, res) => {
  await prisma.userFavorite.deleteMany({
    where: { userId: req.userId!, countryId: req.params.countryId },
  });
  res.status(204).send();
});

export default router;
