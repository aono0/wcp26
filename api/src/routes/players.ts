import { Router } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

// 選手詳細
router.get('/:id', async (req, res) => {
  const player = await prisma.player.findUnique({
    where: { id: req.params.id },
    include: { country: true },
  });
  if (!player) { res.status(404).json({ error: 'Player not found' }); return; }
  res.json(player);
});

export default router;
