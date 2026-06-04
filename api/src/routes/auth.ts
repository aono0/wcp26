import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';

const router = Router();

// ローカル開発用モックログイン（Phase2でSign in with Appleに置き換える）
router.post('/dev-login', async (_req, res) => {
  if (process.env.NODE_ENV === 'production') {
    res.status(403).json({ error: 'Not available in production' });
    return;
  }

  const user = await prisma.user.upsert({
    where: { devUserId: 'dev-user-001' },
    update: {},
    create: { devUserId: 'dev-user-001' },
  });

  const token = jwt.sign(
    { userId: user.id },
    process.env.JWT_SECRET ?? 'fallback-secret',
    { expiresIn: '30d' }
  );

  res.json({ token, userId: user.id });
});

export default router;
