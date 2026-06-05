import express from 'express';
import cors from 'cors';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import authRouter from './routes/auth';
import countriesRouter from './routes/countries';
import matchesRouter from './routes/matches';
import favoritesRouter from './routes/favorites';
import usersRouter from './routes/users';
import notificationsRouter from './routes/notifications';
import statsRouter from './routes/stats';
import playersRouter from './routes/players';
import videosRouter from './routes/videos';
import { startNotificationJob } from './jobs/matchNotifications';
import { startVideoFetchJob } from './jobs/videoFetch';
import { startMatchSyncJob } from './jobs/matchSync';

dotenv.config();

// 本番環境で必須の環境変数チェック（未設定なら即座に落とす）
if (process.env.NODE_ENV === 'production') {
  const required = ['JWT_SECRET', 'DATABASE_URL', 'ADMIN_SECRET'];
  for (const key of required) {
    if (!process.env[key]) {
      console.error(`[Startup] 必須環境変数 ${key} が設定されていません`);
      process.exit(1);
    }
  }
}

const app  = express();
const PORT = process.env.PORT ?? 3000;
const isProd = process.env.NODE_ENV === 'production';

// CORS: 本番では ALLOWED_ORIGINS で制限、開発では全許可
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') ?? [];
app.use(compression()); // gzip圧縮（レスポンスサイズを60〜80%削減）
app.use(cors({
  origin: isProd && allowedOrigins.length > 0
    ? allowedOrigins
    : true, // 開発・ステージングは全許可
}));

app.use(express.json({ limit: '100kb' })); // リクエストボディサイズ制限

// レートリミット: 認証エンドポイントは特に厳しく
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // 15分で20回まで
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many auth requests' },
});

app.use(generalLimiter);

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/auth',          authLimiter, authRouter);
app.use('/countries',     countriesRouter);
app.use('/matches',       matchesRouter);
app.use('/favorites',     favoritesRouter);
app.use('/users',         usersRouter);
app.use('/notifications', notificationsRouter);
app.use('/stats',         statsRouter);
app.use('/players',       playersRouter);
app.use('/videos',        videosRouter);

// グローバルエラーハンドラー（未捕捉エラーを500で返す）
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Error]', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

const server = app.listen(PORT, () => {
  console.log(`WCP26 API: http://localhost:${PORT}`);
  startNotificationJob();
  startVideoFetchJob();
  startMatchSyncJob();
});

// Graceful Shutdown（Railway の再デプロイ時にDB接続を安全に閉じる）
async function shutdown(signal: string) {
  console.log(`[Shutdown] ${signal} received, shutting down gracefully...`);
  server.close(async () => {
    const { prisma } = await import('./lib/prisma');
    await prisma.$disconnect();
    console.log('[Shutdown] DB disconnected. Bye.');
    process.exit(0);
  });

  // 10秒でタイムアウト
  setTimeout(() => {
    console.error('[Shutdown] Timeout, forcing exit.');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));
