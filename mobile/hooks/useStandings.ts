import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export type Standing = {
  country: {
    id: string;
    name: string;
    nameEn: string;
    code: string;
    flagEmoji: string | null;
  };
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
};

export type GroupStanding = {
  group: string;
  standings: Standing[];
};

export function useAllStandings() {
  return useQuery({
    queryKey: ['standings', 'all'],
    queryFn: async () => {
      const res = await api.get<GroupStanding[]>('/countries/standings');
      return res.data;
    },
  });
}

export function useGroupStanding(group: string) {
  return useQuery({
    queryKey: ['standings', group],
    queryFn: async () => {
      const res = await api.get<GroupStanding>(`/countries/standings/${group}`);
      return res.data;
    },
    enabled: !!group,
  });
}
