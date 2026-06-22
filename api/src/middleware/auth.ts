import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import { prisma } from '../lib/prisma';

export interface AuthRequest extends Request {
  userId?: string;
}

// Supabase の公開鍵を JWKS エンドポイントから取得（キャッシュ付き）
const client = jwksClient({
  jwksUri: 'https://lesjnvlwehifwiepukct.supabase.co/auth/v1/.well-known/jwks.json',
  cache: true,
  cacheMaxAge: 10 * 60 * 1000, // 10分キャッシュ
});

async function verifySupabaseToken(token: string): Promise<string> {
  const decoded = jwt.decode(token, { complete: true });
  if (!decoded || typeof decoded === 'string') throw new Error('Invalid token format');

  const kid = decoded.header.kid;

  if (kid) {
    // ECC P-256（新しい署名方式）
    const key = await client.getSigningKey(kid);
    const publicKey = key.getPublicKey();
    const payload = jwt.verify(token, publicKey) as { sub: string };
    return payload.sub;
  } else {
    // Legacy HS256（古い署名方式・フォールバック）
    const secret = process.env.SUPABASE_JWT_SECRET;
    if (!secret) throw new Error('SUPABASE_JWT_SECRET not set');
    const payload = jwt.verify(token, secret) as { sub: string };
    return payload.sub;
  }
}

export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const token = header.slice(7);
    const supabaseUserId = await verifySupabaseToken(token);

    // supabaseId でユーザーを取得 or 初回自動作成
    const user = await prisma.user.upsert({
      where:  { supabaseId: supabaseUserId },
      update: {},
      create: { supabaseId: supabaseUserId },
      select: { id: true },
    });
    req.userId = user.id;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}
