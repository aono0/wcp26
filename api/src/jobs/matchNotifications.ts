import cron from 'node-cron';
import { prisma } from '../lib/prisma';
import { sendPushNotifications } from '../services/notifications';

export function startNotificationJob() {
  cron.schedule('0 0 * * *', async () => {
    console.log('[Job] 試合前日通知 実行開始');
    await notifyUpcomingMatches();
  });
  console.log('[Job] 試合前日通知ジョブ 登録完了（毎日 9:00 JST）');
}

export async function notifyUpcomingMatches() {
  const nowUTC = Date.now();
  const tomorrowJSTMidnight = new Date(nowUTC + (9 + 24) * 3600 * 1000);
  const y = tomorrowJSTMidnight.getUTCFullYear();
  const mo = tomorrowJSTMidnight.getUTCMonth();
  const d = tomorrowJSTMidnight.getUTCDate();

  const start = new Date(Date.UTC(y, mo, d, -9, 0, 0));
  const end   = new Date(Date.UTC(y, mo, d, 15, 0, 0));

  const matches = await prisma.match.findMany({
    where: { matchDate: { gte: start, lt: end }, status: 'SCHEDULED' },
    include: { entries: { include: { country: true } } },
  });

  if (!matches.length) { console.log('[Job] 明日の試合なし'); return; }

  const matchIds   = matches.map((m) => m.id);
  const countryIds = [...new Set(matches.flatMap((m) => m.entries.map((e) => e.countryId)))];

  // ① チームフォローユーザー
  const teamUsers = await prisma.user.findMany({
    where: { notifyEnabled: true, pushToken: { not: null }, favorites: { some: { countryId: { in: countryIds } } } },
    include: { favorites: { where: { countryId: { in: countryIds } } } },
  });

  const teamMessages = teamUsers.flatMap((user) =>
    user.favorites.flatMap((fav) => {
      const match = matches.find((m) => m.entries.some((e) => e.countryId === fav.countryId));
      if (!match) return [];
      const home   = match.entries.find((e) => e.isHome);
      const away   = match.entries.find((e) => !e.isHome);
      const myTeam = match.entries.find((e) => e.countryId === fav.countryId)?.country;
      if (!myTeam || !home || !away) return [];
      const { hh, mm } = jstTime(match.matchDate);
      return [{ to: user.pushToken!, sound: 'default' as const,
        title: `⚽ 明日の試合: ${myTeam.flagEmoji ?? ''} ${myTeam.name}`,
        body: `${home.country.flagEmoji ?? ''} ${home.country.name} vs ${away.country.flagEmoji ?? ''} ${away.country.name}  ${hh}:${mm} JST`,
        data: { matchId: match.id } }];
    })
  );

  // ② 試合単位フォローユーザー
  const matchUsers = await prisma.user.findMany({
    where: { notifyEnabled: true, pushToken: { not: null }, matchNotifications: { some: { matchId: { in: matchIds } } } },
    include: { matchNotifications: { where: { matchId: { in: matchIds } } } },
  });

  const matchMessages = matchUsers.flatMap((user) =>
    user.matchNotifications.flatMap((mn) => {
      const match = matches.find((m) => m.id === mn.matchId);
      if (!match) return [];
      const home = match.entries.find((e) => e.isHome);
      const away = match.entries.find((e) => !e.isHome);
      if (!home || !away) return [];
      const { hh, mm } = jstTime(match.matchDate);
      const hl = home.country ? `${home.country.flagEmoji ?? ''} ${home.country.name}` : (match.homePlaceholder ?? 'TBD');
      const al = away.country ? `${away.country.flagEmoji ?? ''} ${away.country.name}` : (match.awayPlaceholder ?? 'TBD');
      return [{ to: user.pushToken!, sound: 'default' as const,
        title: '⚽ 明日フォロー中の試合があります',
        body: `${hl} vs ${al}  ${hh}:${mm} JST`,
        data: { matchId: match.id } }];
    })
  );

  await sendPushNotifications([...teamMessages, ...matchMessages]);
  console.log(`[Job] 送信: チーム ${teamMessages.length}件 + 試合 ${matchMessages.length}件`);
}

function jstTime(date: Date) {
  const jst = new Date(date.getTime() + 9 * 3600 * 1000);
  return { hh: String(jst.getUTCHours()).padStart(2, '0'), mm: String(jst.getUTCMinutes()).padStart(2, '0') };
}
