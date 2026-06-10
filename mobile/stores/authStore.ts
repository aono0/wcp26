import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as AppleAuthentication from 'expo-apple-authentication';
import { api } from '@/lib/api';

const TOKEN_KEY = 'wcp26_token';
const USER_KEY  = 'wcp26_user';

interface AuthState {
  token: string | null;
  userId: string | null;
  isLoggedIn: boolean;
  isReady: boolean; // セッション復元が完了したか
  restoreSession: () => Promise<void>;
  appleLogin: () => Promise<void>;
  devLogin: () => Promise<void>;
  logout: () => Promise<void>;
}

async function persistAndSet(set: any, token: string, userId: string) {
  await AsyncStorage.setItem(TOKEN_KEY, token);
  await AsyncStorage.setItem(USER_KEY, userId);
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  set({ token, userId, isLoggedIn: true });
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  userId: null,
  isLoggedIn: false,
  isReady: false,

  // 起動時：保存済みトークンを復元
  restoreSession: async () => {
    try {
      const token  = await AsyncStorage.getItem(TOKEN_KEY);
      const userId = await AsyncStorage.getItem(USER_KEY);
      if (token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        set({ token, userId, isLoggedIn: true, isReady: true });
        return;
      }
    } catch (e) {
      console.warn('[Auth] セッション復元失敗:', e);
    }
    set({ isReady: true });
  },

  // Sign in with Apple（本番）
  appleLogin: async () => {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });
    if (!credential.identityToken) throw new Error('No identity token');
    const res = await api.post<{ token: string; userId: string }>('/auth/apple', {
      identityToken: credential.identityToken,
    });
    await persistAndSet(set, res.data.token, res.data.userId);
  },

  // 開発用モックログイン（本番APIでは403）
  devLogin: async () => {
    const res = await api.post<{ token: string; userId: string }>('/auth/dev-login');
    await persistAndSet(set, res.data.token, res.data.userId);
  },

  logout: async () => {
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
    delete api.defaults.headers.common['Authorization'];
    set({ token: null, userId: null, isLoggedIn: false });
  },
}));
