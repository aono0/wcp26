import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { fetchAllActiveChannels } from '../services/youtube';
import { requireAdmin } from '../middleware/adminAuth';

const router = Router();

// 動画フィード（最新順・ランダムミックス対応）
router.get('/', async (req, res) => {
  const limit   = Math.min(Math.max(1, parseInt(String(req.query.limit ?? '30'))), 100);
  const page    = Math.max(0, parseInt(String(req.query.page ?? '0')));
  const channelId = req.query.channelId as string | undefined;

  const videos = await prisma.video.findMany({
    where: channelId ? { channel: { channelId } } : undefined,
    include: { channel: { select: { name: true, channelId: true } } },
    orderBy: { publishedAt: 'desc' },
    take: limit,
    skip: page * limit,
  });

  res.json(videos);
});

// チャンネル一覧
router.get('/channels', async (_req, res) => {
  const channels = await prisma.youtubeChannel.findMany({
    where: { active: true },
    include: { _count: { select: { videos: true } } },
    orderBy: { name: 'asc' },
  });
  res.json(channels);
});

// チャンネル追加（管理者用）
router.post('/channels', requireAdmin, async (req, res) => {
  const { channelId, name } = req.body;
  if (!channelId || !name) { res.status(400).json({ error: 'channelId と name が必要です' }); return; }

  const channel = await prisma.youtubeChannel.upsert({
    where: { channelId },
    update: { name, active: true },
    create: { channelId, name },
  });
  res.status(201).json(channel);
});

// 手動フェッチトリガー（管理者用）
router.post('/refresh', requireAdmin, async (_req, res) => {
  fetchAllActiveChannels().catch(console.error);
  res.json({ message: 'フェッチ開始しました' });
});

// 全動画リセット（管理者用）
router.delete('/all', requireAdmin, async (_req, res) => {
  const { count } = await prisma.video.deleteMany();
  res.json({ deleted: count });
});

export default router;
