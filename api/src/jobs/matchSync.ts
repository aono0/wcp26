import cron from 'node-cron';
import { prisma } from '../lib/prisma';
import { syncAll } from '../services/footballData';

export function startMatchSyncJob() {
  if (!process.env.FOOTBALL_DATA_API_KEY) {
    console.log('[Job] FOOTBALL_DATA_API_KEY 未設定のため試合同期ジョブをスキップ');
    return;
  }

  // 5分ごとに実行（スマートポーリングで不要な時は早期リターン）
  cron.schedule('*/5 * * * *', async () => {
    try {
      if (await shouldSync()) {
        console.log('[Job] 試合データ同期 開始');
        await syncAll();
      }
    } catch (e: any) {
      console.error('[Job] 試合同期エラー:', e.message);
    }
  });

  console.log('[Job] 試合データ同期ジョブ 登録完了（5分ごと・スマートポーリング）');
}

// スマートポーリング判定
// 優先度: LIVE > 1時間以内に試合開始 > 当日試合あり > それ以外
async function shouldSync(): Promise<boolean> {
  const now    = new Date();
  const h      = now.getUTCHours();
  const min    = now.getUTCMinutes();

  // ① LIVE中 → 5分ごと（cron間隔のまま）
  const live = await prisma.match.findFirst({ where: { status: 'LIVE' } });
  if (live) return true;

  // ② 1時間以内にキックオフ → 15分ごと
  const soon = await prisma.match.findFirst({
    where: {
      status: 'SCHEDULED',
      matchDate: { gte: now, lte: new Date(now.getTime() + 60 * 60 * 1000) },
    },
  });
  if (soon) return min % 15 === 0;

  // ③ 当日に試合あり → 1時間ごと
  const todayStart = new Date(now); todayStart.setUTCHours(0, 0, 0, 0);
  const todayEnd   = new Date(now); todayEnd.setUTCHours(23, 59, 59, 999);
  const today = await prisma.match.findFirst({
    where: { status: 'SCHEDULED', matchDate: { gte: todayStart, lte: todayEnd } },
  });
  if (today) return min === 0;

  // ④ 試合のない日 → 6時間ごと（00:00 / 06:00 / 12:00 / 18:00 UTC）
  return h % 6 === 0 && min === 0;
}
