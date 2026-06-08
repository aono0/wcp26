import { Router } from 'express';
import jwt from 'jsonwebtoken';
import appleSignin from 'apple-signin-auth';
import { prisma } from '../lib/prisma';

const router = Router();

const APPLE_BUNDLE_ID = process.env.APPLE_BUNDLE_ID ?? 'com.wcp26.app';
const JWT_SECRET = process.env.JWT_SECRET ?? 'fallback-secret';

function issueToken(userId: string) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '90d' });
}

// ──────────────────────────────────────────────
// Sign in with Apple（本番認証）
// ──────────────────────────────────────────────
router.post('/apple', async (req, res) => {
  const { identityToken } = req.body;
  if (!identityToken) {
    res.status(400).json({ error: 'identityToken is required' });
    return;
  }

  try {
    // Appleの公開鍵でidentityTokenを検証し、sub（Apple匿名ユーザーID）を取得
    const payload = await appleSignin.verifyIdToken(identityToken, {
      audience: APPLE_BUNDLE_ID,
      ignoreExpiration: false,
    });

    const appleUserId = payload.sub;

    const user = await prisma.user.upsert({
      where:  { appleUserId },
      update: {},
      create: { appleUserId },
    });

    res.json({ token: issueToken(user.id), userId: user.id });
  } catch (e: any) {
    console.error('[Auth] Apple検証失敗:', e.message);
    res.status(401).json({ error: 'Invalid Apple token' });
  }
});

// ──────────────────────────────────────────────
// 開発用モックログイン（本番では無効）
// ──────────────────────────────────────────────
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

  res.json({ token: issueToken(user.id), userId: user.id });
});

export default router;
