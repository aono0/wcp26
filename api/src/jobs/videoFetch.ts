import cron from 'node-cron';
import { fetchAllActiveChannels } from '../services/youtube';

// 3時間ごとに動画を取得（0:00, 3:00, 6:00 ...）
export function startVideoFetchJob() {
  cron.schedule('0 */3 * * *', async () => {
    console.log('[Job] 動画フェッチ 開始');
    await fetchAllActiveChannels();
  });
  console.log('[Job] 動画フェッチジョブ 登録完了（3時間ごと）');
}
