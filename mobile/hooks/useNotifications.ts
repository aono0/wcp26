import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export function useSetupNotifications() {
  const { isLoggedIn } = useAuthStore();

  useEffect(() => {
    if (!isLoggedIn) return;
    // エラーが他に影響しないよう完全に分離
    registerToken().catch((e) => console.warn('[Push] setup error:', e));
  }, [isLoggedIn]);
}

async function registerToken() {
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
      });
    }

    const { status: existing } = await Notifications.getPermissionsAsync();
    let status = existing;

    if (existing !== 'granted') {
      const { status: requested } = await Notifications.requestPermissionsAsync();
      status = requested;
    }

    if (status !== 'granted') {
      console.log('[Push] 通知許可なし');
      return;
    }

    const tokenResult = await Notifications.getExpoPushTokenAsync();
    await api.put('/users/push-token', { pushToken: tokenResult.data });
    console.log('[Push] トークン登録完了');
  } catch (e) {
    // 通知セットアップの失敗はアプリの他機能に影響させない
    console.warn('[Push] setup failed (non-fatal):', e);
  }
}
