import { Request, Response, NextFunction } from 'express';

/**
 * 管理者専用エンドポイントの保護
 * リクエストヘッダー X-Admin-Secret に ADMIN_SECRET の値が必要
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) {
    res.status(503).json({ error: 'Admin endpoint not configured' });
    return;
  }
  if (req.headers['x-admin-secret'] !== secret) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }
  next();
}
