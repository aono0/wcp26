import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

router.use(requireAuth);

// Push通知トークンを登録
router.put('/push-token', async (req: AuthRequest, res) => {
  const { pushToken } = req.body;
  await prisma.user.update({
    where: { id: req.userId! },
    data: { pushToken: pushToken ?? null },
  });
  res.json({ ok: true });
});

// 通知ON/OFF
router.put('/notify', async (req: AuthRequest, res) => {
  const { enabled } = req.body;
  const user = await prisma.user.update({
    where: { id: req.userId! },
    data: { notifyEnabled: Boolean(enabled) },
  });
  res.json({ notifyEnabled: user.notifyEnabled });
});

// ユーザー情報取得（内部フィールドは除外）
router.get('/me', async (req: AuthRequest, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId! },
    select: {
      id: true,
      notifyEnabled: true,
      sex: true,
      ageGroup: true,
      region: true,
      createdAt: true,
      // pushToken, appleUserId, devUserId は返さない
    },
  });
  if (!user) { res.status(404).json({ error: 'Not found' }); return; }
  res.json(user);
});

// アカウント削除（App Store必須要件）
router.delete('/me', async (req: AuthRequest, res) => {
  await prisma.user.delete({ where: { id: req.userId! } });
  res.status(204).send();
});

export default router;
