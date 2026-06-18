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
import { useAuthStore } from '@/stores/authStore';
import { useSetupNotifications } from '@/hooks/useNotifications';
import { SplashView } from '@/components/SplashView';
import { api } from '@/lib/api';
import { stableTimestamp } from '@/lib/matchUtils';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,   // 5分間はキャッシュを新鮮とみなす
      gcTime: 24 * 60 * 60 * 1000, // 永続化対象なので24時間保持
      retry: 1,
    },
  },
});

const persister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'wcp26-query-cache',
  throttleTime: 1000, // 書き込みを1秒間隔に制限
});

const persistOptions = {
  persister,
  maxAge: 24 * 60 * 60 * 1000, // 24時間でキャッシュ失効
  buster: 'v1',                  // アプデでキャッシュ形式が変わる場合はここを変える
};

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

const SPLASH_MIN_MS = 800;

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { isReady, isLoggedIn, restoreSession } = useAuthStore();
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);
  useSetupNotifications();

  useEffect(() => {
    restoreSession();

    // スプラッシュ中にホーム画面データをプリフェッチ（ベストエフォート）
    const scheduledFrom = stableTimestamp();
    const recentFrom = stableTimestamp(-4 * 86400000);
    queryClient.prefetchQuery({
      queryKey: ['matches', { status: 'SCHEDULED', from: scheduledFrom }],
      queryFn: () => api.get('/matches', { params: { status: 'SCHEDULED', from: scheduledFrom } }).then(r => r.data),
    });
    queryClient.prefetchQuery({
      queryKey: ['matches', { status: 'FINISHED', from: recentFrom }],
      queryFn: () => api.get('/matches', { params: { status: 'FINISHED', from: recentFrom } }).then(r => r.data),
    });

    const timer = setTimeout(() => setMinTimeElapsed(true), SPLASH_MIN_MS);
    return () => clearTimeout(timer);
  }, []);

  if (!isReady || !minTimeElapsed) return <SplashView />;

  return (
    <PersistQueryClientProvider client={queryClient} persistOptions={persistOptions}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        {isLoggedIn ? (
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
          </Stack>
        ) : (
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="login" />
          </Stack>
        )}
      </ThemeProvider>
    </PersistQueryClientProvider>
  );
}
