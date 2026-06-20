import 'react-native-url-polyfill/auto';
import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useColorScheme } from '@/components/useColorScheme';
import { useSetupNotifications } from '@/hooks/useNotifications';
import { SplashView } from '@/components/SplashView';
import { api } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { stableTimestamp } from '@/lib/matchUtils';
import { colors } from '@/constants/theme';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 24 * 60 * 60 * 1000,
      retry: 1,
    },
  },
});

const persister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'wcp26-query-cache',
  throttleTime: 1000,
});

const persistOptions = {
  persister,
  maxAge: 24 * 60 * 60 * 1000,
  buster: 'v2', // 認証方式変更のためキャッシュリセット
};

export {
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) return null;

  return <RootLayoutNav />;
}

const SPLASH_MIN_MS = 1000;

// リクエストごとに最新トークンを使う interceptor
api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const [isReady, setIsReady] = useState(false);
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);
  useSetupNotifications();

  useEffect(() => {
    // Supabase セッション確立（既存セッション継続 or 匿名ログイン）
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        await supabase.auth.signInAnonymously();
      }
      setIsReady(true);
    })();

    // スプラッシュ中にホーム・試合タブデータをプリフェッチ
    const scheduledFrom = stableTimestamp();
    const recentFrom = stableTimestamp(-4 * 86400000);
    [
      { queryKey: ['matches', { status: 'SCHEDULED', from: scheduledFrom }], params: { status: 'SCHEDULED', from: scheduledFrom } },
      { queryKey: ['matches', { status: 'FINISHED', from: recentFrom }],    params: { status: 'FINISHED', from: recentFrom } },
      { queryKey: ['matches', { stage: 'GROUP' }],                           params: { stage: 'GROUP' } },
    ].forEach(({ queryKey, params }) => {
      queryClient.prefetchQuery({
        queryKey,
        queryFn: () => api.get('/matches', { params }).then(r => r.data),
      });
    });
    queryClient.prefetchQuery({
      queryKey: ['standings', 'all'],
      queryFn: () => api.get('/countries/standings').then(r => r.data),
    });

    const timer = setTimeout(() => setMinTimeElapsed(true), SPLASH_MIN_MS);
    return () => clearTimeout(timer);
  }, []);

  if (!isReady || !minTimeElapsed) return <SplashView />;

  return (
    <PersistQueryClientProvider client={queryClient} persistOptions={persistOptions}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
          <Stack.Screen
            name="country/[code]"
            options={{
              headerStyle: { backgroundColor: colors.bg },
              headerTintColor: colors.gold,
              headerShadowVisible: false,
              headerBackTitle: '戻る',
            }}
          />
        </Stack>
      </ThemeProvider>
    </PersistQueryClientProvider>
  );
}
