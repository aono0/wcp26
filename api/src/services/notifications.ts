import Expo, { ExpoPushMessage } from 'expo-server-sdk';

const expo = new Expo();

export async function sendPushNotifications(messages: ExpoPushMessage[]) {
  const valid = messages.filter((m) => Expo.isExpoPushToken(m.to as string));
  if (!valid.length) return;

  const chunks = expo.chunkPushNotifications(valid);
  for (const chunk of chunks) {
    try {
      await expo.sendPushNotificationsAsync(chunk);
    } catch (e) {
      console.error('[Push] 送信エラー:', e);
    }
  }
  console.log(`[Push] ${valid.length}件送信`);
}
