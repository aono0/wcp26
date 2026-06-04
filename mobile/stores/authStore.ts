import { create } from 'zustand';
import { api } from '@/lib/api';

interface AuthState {
  token: string | null;
  userId: string | null;
  isLoggedIn: boolean;
  devLogin: () => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  userId: null,
  isLoggedIn: false,

  // ローカル開発用モックログイン。Phase2でSign in with Appleに置き換える
  devLogin: async () => {
    const res = await api.post<{ token: string; userId: string }>('/auth/dev-login');
    set({ token: res.data.token, userId: res.data.userId, isLoggedIn: true });
    api.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
  },

  logout: () => {
    delete api.defaults.headers.common['Authorization'];
    set({ token: null, userId: null, isLoggedIn: false });
  },
}));
