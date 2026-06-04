import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export type Country = {
  id: string;
  name: string;
  nameEn: string;
  code: string;
  flagEmoji: string | null;
  groupStage: string;
  federation: string | null;
};

export type CountryDetail = Country & {
  players: Player[];
  matchEntries: MatchEntry[];
};

export type Player = {
  id: string;
  name: string;
  position: string;
  clubTeam: string | null;
  height: number | null;
  weight: number | null;
  number: number | null;
  goalCount: number;
  assistCount: number;
};

export type MatchEntry = {
  id: string;
  isHome: boolean;
  score: number | null;
  result: string | null;
  match: {
    id: string;
    matchDate: string;
    venue: string | null;
    venueCity: string | null;
    round: string;
    stage: string;
    status: string;
    entries: {
      isHome: boolean;
      score: number | null;
      country: Country;
    }[];
  };
};

export function useCountries() {
  return useQuery({
    queryKey: ['countries'],
    queryFn: async () => {
      const res = await api.get<Country[]>('/countries');
      return res.data;
    },
    staleTime: 30 * 60 * 1000, // 国一覧は30分キャッシュ（変化しない）
  });
}

export function useCountryDetail(code: string) {
  return useQuery({
    queryKey: ['country', code],
    queryFn: async () => {
      const res = await api.get<CountryDetail>(`/countries/${code}`);
      return res.data;
    },
    enabled: !!code,
  });
}
