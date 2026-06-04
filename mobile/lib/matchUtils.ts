const JST_OFFSET = 9 * 60 * 60 * 1000;
const DAYS = ['日', '月', '火', '水', '木', '金', '土'];

// UTCの文字列 → JST表示 "6/12 07:00"
export function formatMatchDate(utcDateStr: string): string {
  const d = new Date(utcDateStr);
  return d.toLocaleString('ja-JP', {
    timeZone: 'Asia/Tokyo',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// UTCの文字列 → JST短縮 "6/12"
export function formatMatchDateShort(utcDateStr: string): string {
  const d = new Date(utcDateStr);
  return d.toLocaleString('ja-JP', {
    timeZone: 'Asia/Tokyo',
    month: 'numeric',
    day: 'numeric',
  });
}

// UTCの文字列 → JSTの日付キー "2026-06-12"（グルーピング用）
export function toJSTDateKey(utcDateStr: string): string {
  const d = new Date(new Date(utcDateStr).getTime() + JST_OFFSET);
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${d.getUTCFullYear()}-${m}-${day}`;
}

// "2026-06-12" → "6/12 (金)" 形式
export function formatDatePill(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return `${m}/${d} (${DAYS[dow]})`;
}

export function formatScore(homeScore: number | null, awayScore: number | null): string {
  if (homeScore === null || awayScore === null) return '-';
  return `${homeScore} - ${awayScore}`;
}
