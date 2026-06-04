import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { MatchEntry } from './useCountries';

export type Match = {
  id: string;
  matchDate: string;
  venue: string | null;
  venueCity: string | null;
  round: string;
  stage: string;
  status: string;
  homePlaceholder: string | null;
  awayPlaceholder: string | null;
  entries: {
    isHome: boolean;
    score: number | null;
    country: { id: string; name: string; code: string; flagEmoji: string | null };
  }[];
};

export function useMatches(params?: { stage?: string; status?: string; md?: number }) {
  return useQuery({
    queryKey: ['matches', params],
    queryFn: async () => {
      const res = await api.get<Match[]>('/matches', { params });
      return res.data;
    },
  });
}
