import axios from 'axios';

// 実機で確認する場合はPCのIPアドレスに変更（例: 'http://192.168.1.x:3000'）
const BASE_URL = __DEV__ ? 'http://localhost:3000' : 'https://wc2026-production-76db.up.railway.app';

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// 認証トークンを全リクエストに自動付与
api.interceptors.request.use((config) => {
  // Phase2でSign in with Appleのトークンを取得してセットする
  // const token = useAuthStore.getState().token;
  // if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
