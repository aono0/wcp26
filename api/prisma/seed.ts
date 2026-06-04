import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const countriesData = [
  // Group A
  { name: 'メキシコ',              nameEn: 'Mexico',               code: 'MEX', flagEmoji: '🇲🇽', groupStage: 'A', federation: 'CONCACAF' },
  { name: '南アフリカ',            nameEn: 'South Africa',          code: 'RSA', flagEmoji: '🇿🇦', groupStage: 'A', federation: 'CAF' },
  { name: '韓国',                  nameEn: 'South Korea',           code: 'KOR', flagEmoji: '🇰🇷', groupStage: 'A', federation: 'AFC' },
  { name: 'チェコ',                nameEn: 'Czechia',               code: 'CZE', flagEmoji: '🇨🇿', groupStage: 'A', federation: 'UEFA' },
  // Group B
  { name: 'カナダ',                nameEn: 'Canada',                code: 'CAN', flagEmoji: '🇨🇦', groupStage: 'B', federation: 'CONCACAF' },
  { name: 'ボスニア・ヘルツェゴビナ', nameEn: 'Bosnia and Herzegovina', code: 'BIH', flagEmoji: '🇧🇦', groupStage: 'B', federation: 'UEFA' },
  { name: 'カタール',              nameEn: 'Qatar',                 code: 'QAT', flagEmoji: '🇶🇦', groupStage: 'B', federation: 'AFC' },
  { name: 'スイス',                nameEn: 'Switzerland',           code: 'SUI', flagEmoji: '🇨🇭', groupStage: 'B', federation: 'UEFA' },
  // Group C
  { name: 'ブラジル',              nameEn: 'Brazil',                code: 'BRA', flagEmoji: '🇧🇷', groupStage: 'C', federation: 'CONMEBOL' },
  { name: 'モロッコ',              nameEn: 'Morocco',               code: 'MAR', flagEmoji: '🇲🇦', groupStage: 'C', federation: 'CAF' },
  { name: 'ハイチ',                nameEn: 'Haiti',                 code: 'HAI', flagEmoji: '🇭🇹', groupStage: 'C', federation: 'CONCACAF' },
  { name: 'スコットランド',        nameEn: 'Scotland',              code: 'SCO', flagEmoji: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', groupStage: 'C', federation: 'UEFA' },
  // Group D
  { name: 'アメリカ',              nameEn: 'United States',         code: 'USA', flagEmoji: '🇺🇸', groupStage: 'D', federation: 'CONCACAF' },
  { name: 'パラグアイ',            nameEn: 'Paraguay',              code: 'PAR', flagEmoji: '🇵🇾', groupStage: 'D', federation: 'CONMEBOL' },
  { name: 'オーストラリア',        nameEn: 'Australia',             code: 'AUS', flagEmoji: '🇦🇺', groupStage: 'D', federation: 'AFC' },
  { name: 'トルコ',                nameEn: 'Turkiye',               code: 'TUR', flagEmoji: '🇹🇷', groupStage: 'D', federation: 'UEFA' },
  // Group E
  { name: 'ドイツ',                nameEn: 'Germany',               code: 'GER', flagEmoji: '🇩🇪', groupStage: 'E', federation: 'UEFA' },
  { name: 'キュラソー',            nameEn: 'Curacao',               code: 'CUW', flagEmoji: '🇨🇼', groupStage: 'E', federation: 'CONCACAF' },
  { name: 'コートジボワール',      nameEn: 'Ivory Coast',           code: 'CIV', flagEmoji: '🇨🇮', groupStage: 'E', federation: 'CAF' },
  { name: 'エクアドル',            nameEn: 'Ecuador',               code: 'ECU', flagEmoji: '🇪🇨', groupStage: 'E', federation: 'CONMEBOL' },
  // Group F
  { name: 'オランダ',              nameEn: 'Netherlands',           code: 'NED', flagEmoji: '🇳🇱', groupStage: 'F', federation: 'UEFA' },
  { name: '日本',                  nameEn: 'Japan',                 code: 'JPN', flagEmoji: '🇯🇵', groupStage: 'F', federation: 'AFC' },
  { name: 'スウェーデン',          nameEn: 'Sweden',                code: 'SWE', flagEmoji: '🇸🇪', groupStage: 'F', federation: 'UEFA' },
  { name: 'チュニジア',            nameEn: 'Tunisia',               code: 'TUN', flagEmoji: '🇹🇳', groupStage: 'F', federation: 'CAF' },
  // Group G
  { name: 'ベルギー',              nameEn: 'Belgium',               code: 'BEL', flagEmoji: '🇧🇪', groupStage: 'G', federation: 'UEFA' },
  { name: 'エジプト',              nameEn: 'Egypt',                 code: 'EGY', flagEmoji: '🇪🇬', groupStage: 'G', federation: 'CAF' },
  { name: 'イラン',                nameEn: 'Iran',                  code: 'IRN', flagEmoji: '🇮🇷', groupStage: 'G', federation: 'AFC' },
  { name: 'ニュージーランド',      nameEn: 'New Zealand',           code: 'NZL', flagEmoji: '🇳🇿', groupStage: 'G', federation: 'OFC' },
  // Group H
  { name: 'スペイン',              nameEn: 'Spain',                 code: 'ESP', flagEmoji: '🇪🇸', groupStage: 'H', federation: 'UEFA' },
  { name: 'カーボベルデ',          nameEn: 'Cape Verde',            code: 'CPV', flagEmoji: '🇨🇻', groupStage: 'H', federation: 'CAF' },
  { name: 'サウジアラビア',        nameEn: 'Saudi Arabia',          code: 'KSA', flagEmoji: '🇸🇦', groupStage: 'H', federation: 'AFC' },
  { name: 'ウルグアイ',            nameEn: 'Uruguay',               code: 'URU', flagEmoji: '🇺🇾', groupStage: 'H', federation: 'CONMEBOL' },
  // Group I
  { name: 'フランス',              nameEn: 'France',                code: 'FRA', flagEmoji: '🇫🇷', groupStage: 'I', federation: 'UEFA' },
  { name: 'セネガル',              nameEn: 'Senegal',               code: 'SEN', flagEmoji: '🇸🇳', groupStage: 'I', federation: 'CAF' },
  { name: 'イラク',                nameEn: 'Iraq',                  code: 'IRQ', flagEmoji: '🇮🇶', groupStage: 'I', federation: 'AFC' },
  { name: 'ノルウェー',            nameEn: 'Norway',                code: 'NOR', flagEmoji: '🇳🇴', groupStage: 'I', federation: 'UEFA' },
  // Group J
  { name: 'アルゼンチン',          nameEn: 'Argentina',             code: 'ARG', flagEmoji: '🇦🇷', groupStage: 'J', federation: 'CONMEBOL' },
  { name: 'アルジェリア',          nameEn: 'Algeria',               code: 'ALG', flagEmoji: '🇩🇿', groupStage: 'J', federation: 'CAF' },
  { name: 'オーストリア',          nameEn: 'Austria',               code: 'AUT', flagEmoji: '🇦🇹', groupStage: 'J', federation: 'UEFA' },
  { name: 'ヨルダン',              nameEn: 'Jordan',                code: 'JOR', flagEmoji: '🇯🇴', groupStage: 'J', federation: 'AFC' },
  // Group K
  { name: 'ポルトガル',            nameEn: 'Portugal',              code: 'POR', flagEmoji: '🇵🇹', groupStage: 'K', federation: 'UEFA' },
  { name: 'コンゴ民主共和国',      nameEn: 'DR Congo',              code: 'COD', flagEmoji: '🇨🇩', groupStage: 'K', federation: 'CAF' },
  { name: 'ウズベキスタン',        nameEn: 'Uzbekistan',            code: 'UZB', flagEmoji: '🇺🇿', groupStage: 'K', federation: 'AFC' },
  { name: 'コロンビア',            nameEn: 'Colombia',              code: 'COL', flagEmoji: '🇨🇴', groupStage: 'K', federation: 'CONMEBOL' },
  // Group L
  { name: 'イングランド',          nameEn: 'England',               code: 'ENG', flagEmoji: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', groupStage: 'L', federation: 'UEFA' },
  { name: 'クロアチア',            nameEn: 'Croatia',               code: 'CRO', flagEmoji: '🇭🇷', groupStage: 'L', federation: 'UEFA' },
  { name: 'ガーナ',                nameEn: 'Ghana',                 code: 'GHA', flagEmoji: '🇬🇭', groupStage: 'L', federation: 'CAF' },
  { name: 'パナマ',                nameEn: 'Panama',                code: 'PAN', flagEmoji: '🇵🇦', groupStage: 'L', federation: 'CONCACAF' },
];

type MatchSeed = {
  matchDate: string; venue: string; venueCity: string;
  round: string; homeCode: string; awayCode: string;
};

const matchesData: MatchSeed[] = [
  // ── Group A ──
  { matchDate: '2026-06-11T04:00:00+09:00', venue: 'エスタディオ・アステカ',      venueCity: 'メキシコシティ', round: 'Group A MD1', homeCode: 'MEX', awayCode: 'RSA' },
  { matchDate: '2026-06-12T11:00:00+09:00', venue: 'エスタディオ・アクロン',      venueCity: 'グアダラハラ',   round: 'Group A MD1', homeCode: 'KOR', awayCode: 'CZE' },
  { matchDate: '2026-06-18T01:00:00+09:00', venue: 'メルセデス・ベンツ・スタジアム', venueCity: 'アトランタ',   round: 'Group A MD2', homeCode: 'CZE', awayCode: 'RSA' },
  { matchDate: '2026-06-19T10:00:00+09:00', venue: 'エスタディオ・アクロン',      venueCity: 'グアダラハラ',   round: 'Group A MD2', homeCode: 'MEX', awayCode: 'KOR' },
  { matchDate: '2026-06-25T10:00:00+09:00', venue: 'エスタディオ・アステカ',      venueCity: 'メキシコシティ', round: 'Group A MD3', homeCode: 'CZE', awayCode: 'MEX' },
  { matchDate: '2026-06-25T10:00:00+09:00', venue: 'エスタディオ・BBVA',          venueCity: 'モンテレー',     round: 'Group A MD3', homeCode: 'RSA', awayCode: 'KOR' },
  // ── Group B ──
  { matchDate: '2026-06-13T04:00:00+09:00', venue: 'BMOフィールド',               venueCity: 'トロント',       round: 'Group B MD1', homeCode: 'CAN', awayCode: 'BIH' },
  { matchDate: '2026-06-14T04:00:00+09:00', venue: 'リーバイス・スタジアム',      venueCity: 'サンフランシスコ', round: 'Group B MD1', homeCode: 'QAT', awayCode: 'SUI' },
  { matchDate: '2026-06-19T04:00:00+09:00', venue: 'SoFiスタジアム',              venueCity: 'ロサンゼルス',   round: 'Group B MD2', homeCode: 'SUI', awayCode: 'BIH' },
  { matchDate: '2026-06-19T07:00:00+09:00', venue: 'BCプレイス',                  venueCity: 'バンクーバー',   round: 'Group B MD2', homeCode: 'CAN', awayCode: 'QAT' },
  { matchDate: '2026-06-25T04:00:00+09:00', venue: 'BCプレイス',                  venueCity: 'バンクーバー',   round: 'Group B MD3', homeCode: 'SUI', awayCode: 'CAN' },
  { matchDate: '2026-06-25T04:00:00+09:00', venue: 'ルーメンフィールド',           venueCity: 'シアトル',       round: 'Group B MD3', homeCode: 'BIH', awayCode: 'QAT' },
  // ── Group C ──
  { matchDate: '2026-06-14T07:00:00+09:00', venue: 'メットライフ・スタジアム',    venueCity: 'ニューヨーク',   round: 'Group C MD1', homeCode: 'BRA', awayCode: 'MAR' },
  { matchDate: '2026-06-14T10:00:00+09:00', venue: 'ジレット・スタジアム',        venueCity: 'ボストン',       round: 'Group C MD1', homeCode: 'HAI', awayCode: 'SCO' },
  { matchDate: '2026-06-20T07:00:00+09:00', venue: 'ジレット・スタジアム',        venueCity: 'ボストン',       round: 'Group C MD2', homeCode: 'SCO', awayCode: 'MAR' },
  { matchDate: '2026-06-20T10:00:00+09:00', venue: 'リンカーン・フィナンシャル・フィールド', venueCity: 'フィラデルフィア', round: 'Group C MD2', homeCode: 'BRA', awayCode: 'HAI' },
  { matchDate: '2026-06-25T07:00:00+09:00', venue: 'ハード・ロック・スタジアム',  venueCity: 'マイアミ',       round: 'Group C MD3', homeCode: 'SCO', awayCode: 'BRA' },
  { matchDate: '2026-06-25T07:00:00+09:00', venue: 'メルセデス・ベンツ・スタジアム', venueCity: 'アトランタ',   round: 'Group C MD3', homeCode: 'MAR', awayCode: 'HAI' },
  // ── Group D ──
  { matchDate: '2026-06-13T10:00:00+09:00', venue: 'SoFiスタジアム',              venueCity: 'ロサンゼルス',   round: 'Group D MD1', homeCode: 'USA', awayCode: 'PAR' },
  { matchDate: '2026-06-13T13:00:00+09:00', venue: 'BCプレイス',                  venueCity: 'バンクーバー',   round: 'Group D MD1', homeCode: 'AUS', awayCode: 'TUR' },
  { matchDate: '2026-06-20T04:00:00+09:00', venue: 'ルーメンフィールド',           venueCity: 'シアトル',       round: 'Group D MD2', homeCode: 'USA', awayCode: 'AUS' },
  { matchDate: '2026-06-20T13:00:00+09:00', venue: 'リーバイス・スタジアム',      venueCity: 'サンフランシスコ', round: 'Group D MD2', homeCode: 'TUR', awayCode: 'PAR' },
  { matchDate: '2026-06-26T11:00:00+09:00', venue: 'SoFiスタジアム',              venueCity: 'ロサンゼルス',   round: 'Group D MD3', homeCode: 'TUR', awayCode: 'USA' },
  { matchDate: '2026-06-26T11:00:00+09:00', venue: 'リーバイス・スタジアム',      venueCity: 'サンフランシスコ', round: 'Group D MD3', homeCode: 'PAR', awayCode: 'AUS' },
  // ── Group E ──
  { matchDate: '2026-06-14T22:00:00+09:00', venue: 'NRGスタジアム',               venueCity: 'ヒューストン',   round: 'Group E MD1', homeCode: 'GER', awayCode: 'CUW' },
  { matchDate: '2026-06-15T04:00:00+09:00', venue: 'リンカーン・フィナンシャル・フィールド', venueCity: 'フィラデルフィア', round: 'Group E MD1', homeCode: 'CIV', awayCode: 'ECU' },
  { matchDate: '2026-06-21T05:00:00+09:00', venue: 'BMOフィールド',               venueCity: 'トロント',       round: 'Group E MD2', homeCode: 'GER', awayCode: 'CIV' },
  { matchDate: '2026-06-21T09:00:00+09:00', venue: 'アローヘッド・スタジアム',    venueCity: 'カンザスシティ', round: 'Group E MD2', homeCode: 'ECU', awayCode: 'CUW' },
  { matchDate: '2026-06-26T05:00:00+09:00', venue: 'メットライフ・スタジアム',    venueCity: 'ニューヨーク',   round: 'Group E MD3', homeCode: 'ECU', awayCode: 'GER' },
  { matchDate: '2026-06-26T05:00:00+09:00', venue: 'リンカーン・フィナンシャル・フィールド', venueCity: 'フィラデルフィア', round: 'Group E MD3', homeCode: 'CUW', awayCode: 'CIV' },
  // ── Group F ──
  { matchDate: '2026-06-15T05:00:00+09:00', venue: 'AT&Tスタジアム',              venueCity: 'ダラス',         round: 'Group F MD1', homeCode: 'NED', awayCode: 'JPN' },
  { matchDate: '2026-06-15T11:00:00+09:00', venue: 'エスタディオ・BBVA',          venueCity: 'モンテレー',     round: 'Group F MD1', homeCode: 'SWE', awayCode: 'TUN' },
  { matchDate: '2026-06-20T22:00:00+09:00', venue: 'NRGスタジアム',               venueCity: 'ヒューストン',   round: 'Group F MD2', homeCode: 'NED', awayCode: 'SWE' },
  { matchDate: '2026-06-21T13:00:00+09:00', venue: 'エスタディオ・BBVA',          venueCity: 'モンテレー',     round: 'Group F MD2', homeCode: 'TUN', awayCode: 'JPN' },
  { matchDate: '2026-06-26T08:00:00+09:00', venue: 'AT&Tスタジアム',              venueCity: 'ダラス',         round: 'Group F MD3', homeCode: 'JPN', awayCode: 'SWE' },
  { matchDate: '2026-06-26T08:00:00+09:00', venue: 'アローヘッド・スタジアム',    venueCity: 'カンザスシティ', round: 'Group F MD3', homeCode: 'TUN', awayCode: 'NED' },
  // ── Group G ──
  { matchDate: '2026-06-16T04:00:00+09:00', venue: 'ルーメンフィールド',           venueCity: 'シアトル',       round: 'Group G MD1', homeCode: 'BEL', awayCode: 'EGY' },
  { matchDate: '2026-06-16T10:00:00+09:00', venue: 'SoFiスタジアム',              venueCity: 'ロサンゼルス',   round: 'Group G MD1', homeCode: 'IRN', awayCode: 'NZL' },
  { matchDate: '2026-06-22T04:00:00+09:00', venue: 'SoFiスタジアム',              venueCity: 'ロサンゼルス',   round: 'Group G MD2', homeCode: 'BEL', awayCode: 'IRN' },
  { matchDate: '2026-06-22T10:00:00+09:00', venue: 'BCプレイス',                  venueCity: 'バンクーバー',   round: 'Group G MD2', homeCode: 'NZL', awayCode: 'EGY' },
  { matchDate: '2026-06-27T12:00:00+09:00', venue: 'ルーメンフィールド',           venueCity: 'シアトル',       round: 'Group G MD3', homeCode: 'EGY', awayCode: 'IRN' },
  { matchDate: '2026-06-27T12:00:00+09:00', venue: 'BCプレイス',                  venueCity: 'バンクーバー',   round: 'Group G MD3', homeCode: 'NZL', awayCode: 'BEL' },
  // ── Group H ──
  { matchDate: '2026-06-15T21:00:00+09:00', venue: 'メルセデス・ベンツ・スタジアム', venueCity: 'アトランタ',   round: 'Group H MD1', homeCode: 'ESP', awayCode: 'CPV' },
  { matchDate: '2026-06-16T07:00:00+09:00', venue: 'ハード・ロック・スタジアム',  venueCity: 'マイアミ',       round: 'Group H MD1', homeCode: 'KSA', awayCode: 'URU' },
  { matchDate: '2026-06-21T21:00:00+09:00', venue: 'メルセデス・ベンツ・スタジアム', venueCity: 'アトランタ',   round: 'Group H MD2', homeCode: 'ESP', awayCode: 'KSA' },
  { matchDate: '2026-06-22T07:00:00+09:00', venue: 'ハード・ロック・スタジアム',  venueCity: 'マイアミ',       round: 'Group H MD2', homeCode: 'URU', awayCode: 'CPV' },
  { matchDate: '2026-06-27T09:00:00+09:00', venue: 'NRGスタジアム',               venueCity: 'ヒューストン',   round: 'Group H MD3', homeCode: 'CPV', awayCode: 'KSA' },
  { matchDate: '2026-06-27T09:00:00+09:00', venue: 'エスタディオ・アクロン',      venueCity: 'グアダラハラ',   round: 'Group H MD3', homeCode: 'URU', awayCode: 'ESP' },
  // ── Group I ──
  { matchDate: '2026-06-17T04:00:00+09:00', venue: 'メットライフ・スタジアム',    venueCity: 'ニューヨーク',   round: 'Group I MD1', homeCode: 'FRA', awayCode: 'SEN' },
  { matchDate: '2026-06-17T07:00:00+09:00', venue: 'ジレット・スタジアム',        venueCity: 'ボストン',       round: 'Group I MD1', homeCode: 'IRQ', awayCode: 'NOR' },
  { matchDate: '2026-06-23T06:00:00+09:00', venue: 'リンカーン・フィナンシャル・フィールド', venueCity: 'フィラデルフィア', round: 'Group I MD2', homeCode: 'FRA', awayCode: 'IRQ' },
  { matchDate: '2026-06-23T09:00:00+09:00', venue: 'メットライフ・スタジアム',    venueCity: 'ニューヨーク',   round: 'Group I MD2', homeCode: 'NOR', awayCode: 'SEN' },
  { matchDate: '2026-06-27T04:00:00+09:00', venue: 'ジレット・スタジアム',        venueCity: 'ボストン',       round: 'Group I MD3', homeCode: 'NOR', awayCode: 'FRA' },
  { matchDate: '2026-06-27T04:00:00+09:00', venue: 'BMOフィールド',               venueCity: 'トロント',       round: 'Group I MD3', homeCode: 'SEN', awayCode: 'IRQ' },
  // ── Group J ──
  { matchDate: '2026-06-17T10:00:00+09:00', venue: 'アローヘッド・スタジアム',    venueCity: 'カンザスシティ', round: 'Group J MD1', homeCode: 'ARG', awayCode: 'ALG' },
  { matchDate: '2026-06-17T13:00:00+09:00', venue: 'リーバイス・スタジアム',      venueCity: 'サンフランシスコ', round: 'Group J MD1', homeCode: 'AUT', awayCode: 'JOR' },
  { matchDate: '2026-06-22T22:00:00+09:00', venue: 'AT&Tスタジアム',              venueCity: 'ダラス',         round: 'Group J MD2', homeCode: 'ARG', awayCode: 'AUT' },
  { matchDate: '2026-06-23T12:00:00+09:00', venue: 'リーバイス・スタジアム',      venueCity: 'サンフランシスコ', round: 'Group J MD2', homeCode: 'JOR', awayCode: 'ALG' },
  { matchDate: '2026-06-28T11:00:00+09:00', venue: 'アローヘッド・スタジアム',    venueCity: 'カンザスシティ', round: 'Group J MD3', homeCode: 'ALG', awayCode: 'AUT' },
  { matchDate: '2026-06-28T11:00:00+09:00', venue: 'AT&Tスタジアム',              venueCity: 'ダラス',         round: 'Group J MD3', homeCode: 'JOR', awayCode: 'ARG' },
  // ── Group K ──
  { matchDate: '2026-06-17T22:00:00+09:00', venue: 'NRGスタジアム',               venueCity: 'ヒューストン',   round: 'Group K MD1', homeCode: 'POR', awayCode: 'COD' },
  { matchDate: '2026-06-18T11:00:00+09:00', venue: 'エスタディオ・アステカ',      venueCity: 'メキシコシティ', round: 'Group K MD1', homeCode: 'UZB', awayCode: 'COL' },
  { matchDate: '2026-06-23T22:00:00+09:00', venue: 'NRGスタジアム',               venueCity: 'ヒューストン',   round: 'Group K MD2', homeCode: 'POR', awayCode: 'UZB' },
  { matchDate: '2026-06-24T11:00:00+09:00', venue: 'エスタディオ・アクロン',      venueCity: 'グアダラハラ',   round: 'Group K MD2', homeCode: 'COL', awayCode: 'COD' },
  { matchDate: '2026-06-28T08:00:00+09:00', venue: 'ハード・ロック・スタジアム',  venueCity: 'マイアミ',       round: 'Group K MD3', homeCode: 'COL', awayCode: 'POR' },
  { matchDate: '2026-06-28T08:00:00+09:00', venue: 'メルセデス・ベンツ・スタジアム', venueCity: 'アトランタ',   round: 'Group K MD3', homeCode: 'COD', awayCode: 'UZB' },
  // ── Group L ──
  { matchDate: '2026-06-18T05:00:00+09:00', venue: 'AT&Tスタジアム',              venueCity: 'ダラス',         round: 'Group L MD1', homeCode: 'ENG', awayCode: 'CRO' },
  { matchDate: '2026-06-18T08:00:00+09:00', venue: 'BMOフィールド',               venueCity: 'トロント',       round: 'Group L MD1', homeCode: 'GHA', awayCode: 'PAN' },
  { matchDate: '2026-06-24T05:00:00+09:00', venue: 'ジレット・スタジアム',        venueCity: 'ボストン',       round: 'Group L MD2', homeCode: 'ENG', awayCode: 'GHA' },
  { matchDate: '2026-06-24T08:00:00+09:00', venue: 'BMOフィールド',               venueCity: 'トロント',       round: 'Group L MD2', homeCode: 'PAN', awayCode: 'CRO' },
  { matchDate: '2026-06-28T06:00:00+09:00', venue: 'メットライフ・スタジアム',    venueCity: 'ニューヨーク',   round: 'Group L MD3', homeCode: 'PAN', awayCode: 'ENG' },
  { matchDate: '2026-06-28T06:00:00+09:00', venue: 'リンカーン・フィナンシャル・フィールド', venueCity: 'フィラデルフィア', round: 'Group L MD3', homeCode: 'CRO', awayCode: 'GHA' },
];

type KnockoutSeed = {
  matchDate: string; venue: string; venueCity: string;
  round: string; stage: string;
  homePlaceholder: string; awayPlaceholder: string;
};

const knockoutData: KnockoutSeed[] = [
  // ── ラウンド32（R32）: 16試合 ──
  // 12グループ上位2チーム + 各グループ3位上位8チーム = 32チームが進出
  { matchDate: '2026-07-01T22:00:00+09:00', venue: 'メットライフ・スタジアム',    venueCity: 'ニューヨーク',   round: 'R32 第1試合',  stage: 'ROUND_OF_32', homePlaceholder: 'グループA 1位', awayPlaceholder: 'グループB 2位' },
  { matchDate: '2026-07-02T01:00:00+09:00', venue: 'SoFiスタジアム',              venueCity: 'ロサンゼルス',   round: 'R32 第2試合',  stage: 'ROUND_OF_32', homePlaceholder: 'グループC 1位', awayPlaceholder: 'グループD 2位' },
  { matchDate: '2026-07-02T22:00:00+09:00', venue: 'AT&Tスタジアム',              venueCity: 'ダラス',         round: 'R32 第3試合',  stage: 'ROUND_OF_32', homePlaceholder: 'グループE 1位', awayPlaceholder: 'グループF 2位' },
  { matchDate: '2026-07-03T01:00:00+09:00', venue: 'エスタディオ・アステカ',      venueCity: 'メキシコシティ', round: 'R32 第4試合',  stage: 'ROUND_OF_32', homePlaceholder: 'グループG 1位', awayPlaceholder: 'グループH 2位' },
  { matchDate: '2026-07-03T22:00:00+09:00', venue: 'アローヘッド・スタジアム',    venueCity: 'カンザスシティ', round: 'R32 第5試合',  stage: 'ROUND_OF_32', homePlaceholder: 'グループI 1位', awayPlaceholder: 'グループJ 2位' },
  { matchDate: '2026-07-04T01:00:00+09:00', venue: 'ハード・ロック・スタジアム',  venueCity: 'マイアミ',       round: 'R32 第6試合',  stage: 'ROUND_OF_32', homePlaceholder: 'グループK 1位', awayPlaceholder: 'グループL 2位' },
  { matchDate: '2026-07-04T22:00:00+09:00', venue: 'ルーメンフィールド',           venueCity: 'シアトル',       round: 'R32 第7試合',  stage: 'ROUND_OF_32', homePlaceholder: 'グループB 1位', awayPlaceholder: 'グループA 2位' },
  { matchDate: '2026-07-05T01:00:00+09:00', venue: 'NRGスタジアム',               venueCity: 'ヒューストン',   round: 'R32 第8試合',  stage: 'ROUND_OF_32', homePlaceholder: 'グループD 1位', awayPlaceholder: 'グループC 2位' },
  { matchDate: '2026-07-05T22:00:00+09:00', venue: 'BMOフィールド',               venueCity: 'トロント',       round: 'R32 第9試合',  stage: 'ROUND_OF_32', homePlaceholder: 'グループF 1位', awayPlaceholder: 'グループE 2位' },
  { matchDate: '2026-07-06T01:00:00+09:00', venue: 'メルセデス・ベンツ・スタジアム', venueCity: 'アトランタ',   round: 'R32 第10試合', stage: 'ROUND_OF_32', homePlaceholder: 'グループH 1位', awayPlaceholder: 'グループG 2位' },
  { matchDate: '2026-07-06T22:00:00+09:00', venue: 'リンカーン・フィナンシャル・フィールド', venueCity: 'フィラデルフィア', round: 'R32 第11試合', stage: 'ROUND_OF_32', homePlaceholder: 'グループJ 1位', awayPlaceholder: 'グループI 2位' },
  { matchDate: '2026-07-07T01:00:00+09:00', venue: 'エスタディオ・BBVA',          venueCity: 'モンテレー',     round: 'R32 第12試合', stage: 'ROUND_OF_32', homePlaceholder: 'グループL 1位', awayPlaceholder: 'グループK 2位' },
  { matchDate: '2026-07-07T22:00:00+09:00', venue: 'リーバイス・スタジアム',      venueCity: 'サンフランシスコ', round: 'R32 第13試合', stage: 'ROUND_OF_32', homePlaceholder: '3位グループ上位 (1)', awayPlaceholder: '1位または2位' },
  { matchDate: '2026-07-08T01:00:00+09:00', venue: 'BCプレイス',                  venueCity: 'バンクーバー',   round: 'R32 第14試合', stage: 'ROUND_OF_32', homePlaceholder: '3位グループ上位 (2)', awayPlaceholder: '1位または2位' },
  { matchDate: '2026-07-08T22:00:00+09:00', venue: 'ジレット・スタジアム',        venueCity: 'ボストン',       round: 'R32 第15試合', stage: 'ROUND_OF_32', homePlaceholder: '3位グループ上位 (3)', awayPlaceholder: '1位または2位' },
  { matchDate: '2026-07-09T01:00:00+09:00', venue: 'エスタディオ・アクロン',      venueCity: 'グアダラハラ',   round: 'R32 第16試合', stage: 'ROUND_OF_32', homePlaceholder: '3位グループ上位 (4)', awayPlaceholder: '1位または2位' },
  // ── ラウンド16（R16）: 8試合 ──
  { matchDate: '2026-07-11T22:00:00+09:00', venue: 'メットライフ・スタジアム',    venueCity: 'ニューヨーク',   round: 'R16 第1試合', stage: 'ROUND_OF_16', homePlaceholder: 'R32第1試合 勝者', awayPlaceholder: 'R32第2試合 勝者' },
  { matchDate: '2026-07-12T01:00:00+09:00', venue: 'SoFiスタジアム',              venueCity: 'ロサンゼルス',   round: 'R16 第2試合', stage: 'ROUND_OF_16', homePlaceholder: 'R32第3試合 勝者', awayPlaceholder: 'R32第4試合 勝者' },
  { matchDate: '2026-07-12T22:00:00+09:00', venue: 'AT&Tスタジアム',              venueCity: 'ダラス',         round: 'R16 第3試合', stage: 'ROUND_OF_16', homePlaceholder: 'R32第5試合 勝者', awayPlaceholder: 'R32第6試合 勝者' },
  { matchDate: '2026-07-13T01:00:00+09:00', venue: 'エスタディオ・アステカ',      venueCity: 'メキシコシティ', round: 'R16 第4試合', stage: 'ROUND_OF_16', homePlaceholder: 'R32第7試合 勝者', awayPlaceholder: 'R32第8試合 勝者' },
  { matchDate: '2026-07-13T22:00:00+09:00', venue: 'アローヘッド・スタジアム',    venueCity: 'カンザスシティ', round: 'R16 第5試合', stage: 'ROUND_OF_16', homePlaceholder: 'R32第9試合 勝者',  awayPlaceholder: 'R32第10試合 勝者' },
  { matchDate: '2026-07-14T01:00:00+09:00', venue: 'ハード・ロック・スタジアム',  venueCity: 'マイアミ',       round: 'R16 第6試合', stage: 'ROUND_OF_16', homePlaceholder: 'R32第11試合 勝者', awayPlaceholder: 'R32第12試合 勝者' },
  { matchDate: '2026-07-14T22:00:00+09:00', venue: 'ルーメンフィールド',           venueCity: 'シアトル',       round: 'R16 第7試合', stage: 'ROUND_OF_16', homePlaceholder: 'R32第13試合 勝者', awayPlaceholder: 'R32第14試合 勝者' },
  { matchDate: '2026-07-15T01:00:00+09:00', venue: 'メルセデス・ベンツ・スタジアム', venueCity: 'アトランタ',   round: 'R16 第8試合', stage: 'ROUND_OF_16', homePlaceholder: 'R32第15試合 勝者', awayPlaceholder: 'R32第16試合 勝者' },
  // ── 準々決勝（QF）: 4試合 ──
  { matchDate: '2026-07-17T22:00:00+09:00', venue: 'メットライフ・スタジアム',    venueCity: 'ニューヨーク',   round: '準々決勝 第1試合', stage: 'QUARTER_FINAL', homePlaceholder: 'R16第1試合 勝者', awayPlaceholder: 'R16第2試合 勝者' },
  { matchDate: '2026-07-18T01:00:00+09:00', venue: 'SoFiスタジアム',              venueCity: 'ロサンゼルス',   round: '準々決勝 第2試合', stage: 'QUARTER_FINAL', homePlaceholder: 'R16第3試合 勝者', awayPlaceholder: 'R16第4試合 勝者' },
  { matchDate: '2026-07-18T22:00:00+09:00', venue: 'AT&Tスタジアム',              venueCity: 'ダラス',         round: '準々決勝 第3試合', stage: 'QUARTER_FINAL', homePlaceholder: 'R16第5試合 勝者', awayPlaceholder: 'R16第6試合 勝者' },
  { matchDate: '2026-07-19T01:00:00+09:00', venue: 'エスタディオ・アステカ',      venueCity: 'メキシコシティ', round: '準々決勝 第4試合', stage: 'QUARTER_FINAL', homePlaceholder: 'R16第7試合 勝者', awayPlaceholder: 'R16第8試合 勝者' },
  // ── 準決勝（SF）: 2試合 ──
  { matchDate: '2026-07-21T22:00:00+09:00', venue: 'メットライフ・スタジアム',    venueCity: 'ニューヨーク',   round: '準決勝 第1試合', stage: 'SEMI_FINAL', homePlaceholder: 'QF第1試合 勝者', awayPlaceholder: 'QF第2試合 勝者' },
  { matchDate: '2026-07-22T22:00:00+09:00', venue: 'SoFiスタジアム',              venueCity: 'ロサンゼルス',   round: '準決勝 第2試合', stage: 'SEMI_FINAL', homePlaceholder: 'QF第3試合 勝者', awayPlaceholder: 'QF第4試合 勝者' },
  // ── 3位決定戦 ──
  { matchDate: '2026-07-25T22:00:00+09:00', venue: 'AT&Tスタジアム',              venueCity: 'ダラス',         round: '3位決定戦', stage: 'THIRD_PLACE', homePlaceholder: 'SF第1試合 敗者', awayPlaceholder: 'SF第2試合 敗者' },
  // ── 決勝 ──
  { matchDate: '2026-07-26T22:00:00+09:00', venue: 'メットライフ・スタジアム',    venueCity: 'ニューヨーク',   round: '決勝', stage: 'FINAL', homePlaceholder: 'SF第1試合 勝者', awayPlaceholder: 'SF第2試合 勝者' },
];

async function main() {
  console.log('🌱 Seeding...');

  await prisma.matchNotification.deleteMany();
  await prisma.countryMatch.deleteMany();
  await prisma.match.deleteMany();
  await prisma.player.deleteMany();
  await prisma.userFavorite.deleteMany();
  await prisma.country.deleteMany();

  // createMany で1クエリにまとめる（同時接続数超過を防ぐ）
  await prisma.country.createMany({ data: countriesData });
  const countries = await prisma.country.findMany();
  console.log(`✅ ${countries.length}か国 挿入完了`);

  const codeToId = new Map(countries.map((c) => [c.code, c.id]));

  let groupCount = 0;
  for (const m of matchesData) {
    const homeId = codeToId.get(m.homeCode);
    const awayId = codeToId.get(m.awayCode);
    if (!homeId || !awayId) { console.warn(`⚠ コード不明: ${m.homeCode} or ${m.awayCode}`); continue; }
    const match = await prisma.match.create({
      data: { matchDate: new Date(m.matchDate), venue: m.venue, venueCity: m.venueCity, round: m.round, stage: 'GROUP', status: 'SCHEDULED' },
    });
    await prisma.countryMatch.createMany({
      data: [
        { matchId: match.id, countryId: homeId, isHome: true },
        { matchId: match.id, countryId: awayId, isHome: false },
      ],
    });
    groupCount++;
  }
  console.log(`✅ グループステージ ${groupCount}試合 挿入完了`);

  for (const k of knockoutData) {
    await prisma.match.create({
      data: { matchDate: new Date(k.matchDate), venue: k.venue, venueCity: k.venueCity, round: k.round, stage: k.stage, status: 'SCHEDULED', homePlaceholder: k.homePlaceholder, awayPlaceholder: k.awayPlaceholder },
    });
  }
  console.log(`✅ 決勝トーナメント ${knockoutData.length}試合 挿入完了`);
  console.log('🎉 Seed 完了！');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
