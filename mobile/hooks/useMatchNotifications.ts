import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export type MatchNotification = {
  id: string;
  matchId: string;
  match: any;
};

export function useMatchNotifications() {
  return useQuery({
    queryKey: ['matchNotifications'],
    queryFn: async () => {
      const res = await api.get<MatchNotification[]>('/notifications/matches');
      return res.data;
    },
  });
}

export function useMatchNotificationIds() {
  const { data } = useMatchNotifications();
  return new Set(data?.map((n) => n.matchId) ?? []);
}

export function useAddMatchNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (matchId: string) => api.post('/notifications/matches', { matchId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['matchNotifications'] }),
  });
}

export function useRemoveMatchNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (matchId: string) => api.delete(`/notifications/matches/${matchId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['matchNotifications'] }),
  });
}
