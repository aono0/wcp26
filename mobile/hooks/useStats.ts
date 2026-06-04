import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export type PlayerStat = {
  id: string;
  name: string;
  position: string;
  clubTeam: string | null;
  goalCount: number;
  assistCount: number;
  country: { name: string; code: string; flagEmoji: string | null };
};

export function useTopScorers(limit = 20) {
  return useQuery({
    queryKey: ['stats', 'scorers', limit],
    queryFn: async () => {
      const res = await api.get<PlayerStat[]>('/stats/scorers', { params: { limit } });
      return res.data;
    },
  });
}

export function useTopAssisters(limit = 20) {
  return useQuery({
    queryKey: ['stats', 'assisters', limit],
    queryFn: async () => {
      const res = await api.get<PlayerStat[]>('/stats/assisters', { params: { limit } });
      return res.data;
    },
  });
}
