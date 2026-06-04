import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export type VideoChannel = { name: string; channelId: string };

export type Video = {
  id: string;
  videoId: string;
  title: string;
  thumbnail: string;
  description: string | null;
  publishedAt: string;
  channelId: string;
  isShort: boolean;
  channel: VideoChannel;
};

export function useVideos(channelId?: string, limit = 30) {
  return useQuery({
    queryKey: ['videos', channelId, limit],
    queryFn: async () => {
      const res = await api.get<Video[]>('/videos', { params: { channelId, limit } });
      return res.data;
    },
    staleTime: 15 * 60 * 1000, // 動画は15分キャッシュ
  });
}

export function useVideoChannels() {
  return useQuery({
    queryKey: ['videoChannels'],
    queryFn: async () => {
      const res = await api.get<(VideoChannel & { id: string; _count: { videos: number } })[]>('/videos/channels');
      return res.data;
    },
  });
}
