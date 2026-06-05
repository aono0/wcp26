import cron from 'node-cron';
import { prisma } from '../lib/prisma';
import { sendPushNotifications } from '../services/notifications';

export function startNotificationJob() {
  // ① 前日正午通知: 毎日 03:00 UTC = 12:00 JST
  cron.schedule('0 3 * * *', async () => {
    console.log('[Job] 前日正午通知 実行開始');
    await sendDayBeforeNotifications().catch((e) => console.error('[Job] 前日通知エラー:', e.message));
  });

  // ② 試合1時間前通知: 5分ごとに確認
  cron.schedule('*/5 * * * *', async () => {
    await sendPreMatchNotifications().catch((e) => console.error('[Job] 1時間前通知エラー:', e.message));
  });

  console.log('[Job] 通知ジョブ登録完了（前日12時 / 試合1時間前）');
}

// ──────────────────────────────────────────────
// ① 前日正午通知（翌日JST日付の試合を通知）
// ──────────────────────────────────────────────
export async function sendDayBeforeNotifications() {
  const nowUTC = Date.now();
  const tomorrowJST = new Date(nowUTC + (9 + 24) * 3600 * 1000);
  const y  = tomorrowJST.getUTCFullYear();
  const mo = tomorrowJST.getUTCMonth();
  const d  = tomorrowJST.getUTCDate();

  const start = new Date(Date.UTC(y, mo, d, -9, 0, 0));
  const end   = new Date(Date.UTC(y, mo, d, 15, 0, 0));

  const matches = await prisma.match.findMany({
    where: { matchDate: { gte: start, lt: end }, status: 'SCHEDULED' },
    include: { entries: { include: { country: true } } },
  });

  if (!matches.length) { console.log('[Job] 明日の試合なし'); return; }

  const matchIds   = matches.map((m) => m.id);
  const countryIds = [...new Set(matches.flatMap((m) => m.entries.map((e) => e.countryId)))];

  const messages = await buildMessages(matches, matchIds, countryIds, 'tomorrow');
  await sendPushNotifications(messages);
  console.log(`[Job] 前日通知 ${messages.length}件送信`);
}

// ──────────────────────────────────────────────
// ② 試合1時間前通知（55〜75分前の試合 / 未送信のみ）
// ──────────────────────────────────────────────
async function sendPreMatchNotifications() {
  const now   = new Date();
  const from  = new Date(now.getTime() + 55 * 60 * 1000);
  const to    = new Date(now.getTime() + 75 * 60 * 1000);

  const matches = await prisma.match.findMany({
    where: {
      matchDate: { gte: from, lte: to },
      status: 'SCHEDULED',
      preMatchNotified: false,
    },
    include: { entries: { include: { country: true } } },
  });

  if (!matches.length) return;

  const matchIds   = matches.map((m) => m.id);
  const countryIds = [...new Set(matches.flatMap((m) => m.entries.map((e) => e.countryId)))];

  const messages = await buildMessages(matches, matchIds, countryIds, 'soon');
  if (messages.length > 0) {
    await sendPushNotifications(messages);
    console.log(`[Job] 1時間前通知 ${messages.length}件送信`);
  }

  // 送信済みフラグを立てる（重複送信防止）
  await prisma.match.updateMany({
    where: { id: { in: matchIds } },
    data: { preMatchNotified: true },
  });
}

// ──────────────────────────────────────────────
// 通知メッセージ構築（チームフォロー + 試合単位フォロー）
// ──────────────────────────────────────────────
async function buildMessages(
  matches: any[],
  matchIds: string[],
  countryIds: string[],
  timing: 'tomorrow' | 'soon'
) {
  const isSoon = timing === 'soon';

  // ① チームフォロー
  const teamUsers = await prisma.user.findMany({
    where: { notifyEnabled: true, pushToken: { not: null }, favorites: { some: { countryId: { in: countryIds } } } },
    include: { favorites: { where: { countryId: { in: countryIds } } } },
  });

  const teamMessages = teamUsers.flatMap((user) =>
    user.favorites.flatMap((fav) => {
      const match = matches.find((m) => m.entries.some((e: any) => e.countryId === fav.countryId));
      if (!match) return [];
      const home   = match.entries.find((e: any) => e.isHome);
      const away   = match.entries.find((e: any) => !e.isHome);
      const myTeam = match.entries.find((e: any) => e.countryId === fav.countryId)?.country;
      if (!myTeam || !home || !away) return [];
      const { hh, mm } = jstTime(match.matchDate);
      return [{
        to: user.pushToken!,
        sound: 'default' as const,
        title: isSoon
          ? `⚽ あと1時間！${myTeam.flagEmoji ?? ''} ${myTeam.name}`
          : `⚽ 明日の試合: ${myTeam.flagEmoji ?? ''} ${myTeam.name}`,
        body: `${home.country.flagEmoji ?? ''} ${home.country.name} vs ${away.country.flagEmoji ?? ''} ${away.country.name}  ${hh}:${mm} JST`,
        data: { matchId: match.id },
      }];
    })
  );

  // ② 試合単位フォロー
  const matchUsers = await prisma.user.findMany({
    where: { notifyEnabled: true, pushToken: { not: null }, matchNotifications: { some: { matchId: { in: matchIds } } } },
    include: { matchNotifications: { where: { matchId: { in: matchIds } } } },
  });

  const matchMessages = matchUsers.flatMap((user) =>
    user.matchNotifications.flatMap((mn) => {
      const match = matches.find((m) => m.id === mn.matchId);
      if (!match) return [];
      const home = match.entries.find((e: any) => e.isHome);
      const away = match.entries.find((e: any) => !e.isHome);
      if (!home || !away) return [];
      const { hh, mm } = jstTime(match.matchDate);
      const hl = home.country ? `${home.country.flagEmoji ?? ''} ${home.country.name}` : (match.homePlaceholder ?? 'TBD');
      const al = away.country ? `${away.country.flagEmoji ?? ''} ${away.country.name}` : (match.awayPlaceholder ?? 'TBD');
      return [{
        to: user.pushToken!,
        sound: 'default' as const,
        title: isSoon ? '⚽ あと1時間で試合が始まります' : '⚽ 明日フォロー中の試合があります',
        body: `${hl} vs ${al}  ${hh}:${mm} JST`,
        data: { matchId: match.id },
      }];
    })
  );

  // 同一ユーザーへの重複送信を除去
  const seen = new Set<string>();
  return [...teamMessages, ...matchMessages].filter((msg) => {
    const key = `${msg.to}-${(msg.data as any).matchId}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function jstTime(date: Date) {
  const jst = new Date(date.getTime() + 9 * 3600 * 1000);
  return { hh: String(jst.getUTCHours()).padStart(2, '0'), mm: String(jst.getUTCMinutes()).padStart(2, '0') };
}

// 手動テスト用エクスポート
export { sendPreMatchNotifications };
