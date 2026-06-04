/**
 * football-data.org 無料API を使って WC2026 のデータを取得・同期する
 * https://www.football-data.org/documentation/quickstart
 *
 * 無料枠: 10リクエスト/分
 * WC2026 competition code: WC (要確認、変わる可能性あり)
 */

import axios from 'axios';
import { prisma } from '../lib/prisma';

const BASE  = 'https://api.football-data.org/v4';
const TOKEN = process.env.FOOTBALL_DATA_API_KEY ?? '';
const WC_ID = 2000; // FIFA World Cup のCompetition ID (football-data.orgの値)

const client = axios.create({
  baseURL: BASE,
  headers: { 'X-Auth-Token': TOKEN },
  timeout: 10000,
});

// ──────────────────────────────────────────────
// 試合スコア・ステータスの同期
// ──────────────────────────────────────────────
export async function syncMatchResults() {
  if (!TOKEN) { console.warn('[FootballData] APIキー未設定'); return; }

  try {
    const { data } = await client.get(`/competitions/${WC_ID}/matches`);
    const matches: any[] = data.matches ?? [];

    let updated = 0;
    for (const m of matches) {
      const status    = mapStatus(m.status);
      const homeScore = m.score?.fullTime?.home ?? null;
      const awayScore = m.score?.fullTime?.away ?? null;

      // 我々のDBではチームコードで照合する
      const homeCode = m.homeTeam?.tla?.toUpperCase();
      const awayCode = m.awayTeam?.tla?.toUpperCase();
      if (!homeCode || !awayCode) continue;

      // 該当するMatchを見つける（日付 ± 1日 + 両チームで絞り込む）
      const matchDate = new Date(m.utcDate);
      const dayStart  = new Date(matchDate); dayStart.setUTCHours(0, 0, 0, 0);
      const dayEnd    = new Date(matchDate); dayEnd.setUTCHours(23, 59, 59, 999);

      const homeCountry = await prisma.country.findUnique({ where: { code: homeCode } });
      const awayCountry = await prisma.country.findUnique({ where: { code: awayCode } });
      if (!homeCountry || !awayCountry) continue;

      const dbMatch = await prisma.match.findFirst({
        where: {
          matchDate: { gte: dayStart, lte: dayEnd },
          entries: {
            some: { countryId: homeCountry.id, isHome: true },
          },
        },
      });
      if (!dbMatch) continue;

      // Matchのステータスを更新
      await prisma.match.update({
        where: { id: dbMatch.id },
        data: { status },
      });

      // スコアと結果を更新
      if (homeScore !== null && awayScore !== null) {
        await prisma.countryMatch.updateMany({
          where: { matchId: dbMatch.id, countryId: homeCountry.id },
          data: {
            score: homeScore,
            result: homeScore > awayScore ? 'WIN' : homeScore < awayScore ? 'LOSS' : 'DRAW',
          },
        });
        await prisma.countryMatch.updateMany({
          where: { matchId: dbMatch.id, countryId: awayCountry.id },
          data: {
            score: awayScore,
            result: awayScore > homeScore ? 'WIN' : awayScore < homeScore ? 'LOSS' : 'DRAW',
          },
        });
        updated++;
      }
    }

    console.log(`[FootballData] 試合データ同期完了: ${updated}件更新`);
  } catch (e: any) {
    console.error('[FootballData] 試合同期エラー:', e.response?.data?.message ?? e.message);
  }
}

// ──────────────────────────────────────────────
// 得点ランキングの同期（選手のgoalCount更新）
// ──────────────────────────────────────────────
export async function syncTopScorers() {
  if (!TOKEN) return;

  try {
    const { data } = await client.get(`/competitions/${WC_ID}/scorers?limit=20`);
    const scorers: any[] = data.scorers ?? [];

    for (const s of scorers) {
      const playerName = s.player?.name;
      const goals      = s.goals ?? 0;
      const assists    = s.assists ?? 0;
      if (!playerName) continue;

      // 名前で照合（曖昧なので複数ヒットの可能性あり → 最初の1件を更新）
      await prisma.player.updateMany({
        where: { name: { contains: playerName.split(' ').pop() ?? playerName } },
        data: { goalCount: goals, assistCount: assists },
      });
    }

    console.log(`[FootballData] 得点ランキング同期: ${scorers.length}人`);
  } catch (e: any) {
    console.error('[FootballData] 得点ランキング同期エラー:', e.response?.data?.message ?? e.message);
  }
}

// ──────────────────────────────────────────────
// まとめて同期
// ──────────────────────────────────────────────
export async function syncAll() {
  await syncMatchResults();
  await syncTopScorers();
}

function mapStatus(apiStatus: string): string {
  switch (apiStatus) {
    case 'FINISHED':    return 'FINISHED';
    case 'IN_PLAY':
    case 'PAUSED':      return 'LIVE';
    case 'TIMED':
    case 'SCHEDULED':   return 'SCHEDULED';
    case 'POSTPONED':   return 'POSTPONED';
    default:            return 'SCHEDULED';
  }
}
