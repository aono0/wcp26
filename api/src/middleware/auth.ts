import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';

export interface AuthRequest extends Request {
  userId?: string;
}

export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const token = header.slice(7);
    // Supabase の JWT Secret で検証（Dashboard → Settings → API → JWT Secret）
    const payload = jwt.verify(token, process.env.SUPABASE_JWT_SECRET!) as { sub: string };

    // supabaseId でユーザーを取得 or 初回自動作成
    const user = await prisma.user.upsert({
      where:  { supabaseId: payload.sub },
      update: {},
      create: { supabaseId: payload.sub },
      select: { id: true },
    });
    req.userId = user.id;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}
