import axios from 'axios';
import { prisma } from '../lib/prisma';

const BASE = 'https://www.googleapis.com/youtube/v3';
const PUBLISHED_AFTER = process.env.VIDEO_PUBLISHED_AFTER ?? '2026-05-01T00:00:00Z';

type YTSearchItem = {
  id: { videoId: string };
  snippet: {
    title: string;
    description: string;
    publishedAt: string;
    thumbnails: { high?: { url: string }; medium?: { url: string }; default?: { url: string } };
    channelId: string;
  };
};

type YTVideoStatus = { id: string; status: { embeddable: boolean } };

// "PT1M30S" → 90秒
function parseDuration(iso: string): number {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return 0;
  return (parseInt(m[1] ?? '0') * 3600) + (parseInt(m[2] ?? '0') * 60) + parseInt(m[3] ?? '0');
}

export async function fetchAndStoreVideos(channelId: string) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    console.warn('[YouTube] YOUTUBE_API_KEY が設定されていません');
    return 0;
  }

  const channel = await prisma.youtubeChannel.findUnique({ where: { channelId } });
  if (!channel) return 0;

  try {
    const { data } = await axios.get<{ items: YTSearchItem[] }>(`${BASE}/search`, {
      params: {
        key: apiKey,
        channelId,
        part: 'snippet',
        order: 'date',
        maxResults: 20,
        type: 'video',
        publishedAfter: PUBLISHED_AFTER,
        videoDuration: 'short',   // 4分未満（Shorts中心）
      },
    });

    const items = data.items ?? [];
    if (items.length === 0) return 0;

    // 埋め込み可能 + 動画時間を一括チェック（API 1呼び出しで済む）
    const ids = items.map((i) => i.id.videoId).join(',');
    const { data: detailData } = await axios.get<{ items: (YTVideoStatus & { contentDetails?: { duration: string } })[] }>(`${BASE}/videos`, {
      params: { key: apiKey, id: ids, part: 'status,contentDetails' },
    });

    // 埋め込み可能 かつ 90秒以下（Shorts）のみ対象
    const embeddable = new Set(
      (detailData.items ?? [])
        .filter((v) => v.status?.embeddable && parseDuration(v.contentDetails?.duration ?? 'PT0S') <= 90)
        .map((v) => v.id)
    );

    let count = 0;
    for (const item of items) {
      if (!embeddable.has(item.id.videoId)) continue; // 埋め込み不可はスキップ

      const thumbnail =
        item.snippet.thumbnails.high?.url ??
        item.snippet.thumbnails.medium?.url ??
        item.snippet.thumbnails.default?.url ?? '';

      const dur = (detailData.items ?? []).find(v => v.id === item.id.videoId)?.contentDetails?.duration ?? 'PT0S';
      const isShort = parseDuration(dur) <= 60; // 60秒以下が実際のShorts

      await prisma.video.upsert({
        where: { videoId: item.id.videoId },
        update: { title: item.snippet.title, thumbnail, isShort },
        create: {
          videoId:     item.id.videoId,
          title:       item.snippet.title,
          thumbnail,
          description: item.snippet.description?.slice(0, 300) ?? null,
          publishedAt: new Date(item.snippet.publishedAt),
          channelId:   channel.id,
          isShort,
        },
      });
      count++;
    }
    console.log(`[YouTube] ${channel.name}: ${count}件更新`);
    return count;
  } catch (e: any) {
    console.error(`[YouTube] フェッチ失敗 ${channel.name}:`, e.response?.data?.error?.message ?? e.message);
    return 0;
  }
}

export async function fetchAllActiveChannels() {
  const channels = await prisma.youtubeChannel.findMany({ where: { active: true } });
  let total = 0;
  for (const ch of channels) {
    total += await fetchAndStoreVideos(ch.channelId);
  }
  console.log(`[YouTube] 合計 ${total}件更新`);
}
