# WCP26 システムアーキテクチャ設計書（最終版）

**バージョン**: 2.0  
**最終更新**: 2026-06-04

---

## 1. システム構成

```
iOSアプリ (Expo SDK 56 / React Native)
    ↕ HTTPS
Railway (Node.js + Express API)
    ↕ PostgreSQL
Supabase (PostgreSQL)

外部サービス連携:
    ← football-data.org (試合データ)
    ← YouTube Data API v3 (動画データ)
    → Expo Push Service (Push通知)
```

---

## 2. 技術スタック

### 2.1 バックエンド（`api/`）

| カテゴリ | 採用技術 |
|---------|---------|
| ランタイム | Node.js v20 LTS |
| フレームワーク | Express.js |
| ORM | Prisma v5 |
| DB | PostgreSQL (Supabase) |
| 言語 | TypeScript + tsx |
| 認証 | JWT (jsonwebtoken) |
| 圧縮 | compression (gzip) |
| レートリミット | express-rate-limit |
| スケジューラ | node-cron |
| Push通知送信 | expo-server-sdk |
| HTTPクライアント | axios |

### 2.2 フロントエンド（`mobile/`）

| カテゴリ | 採用技術 |
|---------|---------|
| フレームワーク | Expo SDK 56 + React Native 0.85 |
| ナビゲーション | Expo Router v3（ファイルベース） |
| 状態管理 | Zustand |
| データフェッチ | TanStack Query v5 |
| スタイル | StyleSheet（カスタムテーマ） |
| 動画再生 | react-native-webview（YouTube Shorts埋め込み） |
| Push通知 | expo-notifications |
| HTTPクライアント | axios |

### 2.3 インフラ

| サービス | 用途 | コスト |
|---------|------|--------|
| Supabase | PostgreSQL DB | 無料枠 |
| Railway | APIサーバーホスティング | $5〜10/月 |
| Expo EAS Build | iOSビルド・App Store提出 | 無料〜 |
| GitHub Pages | プライバシーポリシー公開 | 無料 |

---

## 3. DBスキーマ

### テーブル一覧

| テーブル | 主な用途 |
|---------|---------|
| `User` | ユーザー（Apple ID Sub / Push Token） |
| `UserFavorite` | チームフォロー（userId × countryId） |
| `MatchNotification` | 試合単位通知登録（userId × matchId） |
| `Country` | 出場48か国 |
| `Player` | 選手データ（1,248名） |
| `Match` | 試合日程・スコア・ステータス |
| `CountryMatch` | 試合参加国・スコア・結果 |
| `YoutubeChannel` | 登録YouTubeチャンネル |
| `Video` | 取得済み動画メタデータ |
| `News` | ニュース（未使用・将来用） |
| `CountryNews` | ニュース×国紐付け（未使用） |

### 主要インデックス

```
Match:        matchDate / status / (stage, status)
CountryMatch: countryId / matchId
Player:       countryId / goalCount / assistCount
Video:        publishedAt / (channelId, publishedAt)
```

---

## 4. API エンドポイント一覧

### 認証
| Method | Path | 説明 | 認証 |
|--------|------|------|------|
| POST | `/auth/dev-login` | 開発用モックログイン（production無効） | - |

### 国・チーム
| Method | Path | 説明 | 認証 |
|--------|------|------|------|
| GET | `/countries` | 出場国一覧 | - |
| GET | `/countries/standings` | 全グループ順位表（1クエリ最適化済み） | - |
| GET | `/countries/standings/:group` | 特定グループ順位表 | - |
| GET | `/countries/:code` | 国詳細（試合・選手込み） | - |

### 試合
| Method | Path | 説明 | 認証 |
|--------|------|------|------|
| GET | `/matches` | 試合一覧（?stage= ?status= ?md=） | - |
| GET | `/matches/:id` | 試合詳細 | - |
| POST | `/matches/sync` | 手動試合データ同期 | Admin |

### スタッツ
| Method | Path | 説明 | 認証 |
|--------|------|------|------|
| GET | `/stats/scorers` | 得点ランキング（?limit=） | - |
| GET | `/stats/assisters` | アシストランキング（?limit=） | - |

### 選手
| Method | Path | 説明 | 認証 |
|--------|------|------|------|
| GET | `/players/:id` | 選手詳細 | - |

### お気に入り
| Method | Path | 説明 | 認証 |
|--------|------|------|------|
| GET | `/favorites` | フォロー中チーム一覧（試合データ込み） | JWT |
| POST | `/favorites` | チームフォロー追加 | JWT |
| DELETE | `/favorites/:countryId` | チームフォロー解除 | JWT |

### 通知
| Method | Path | 説明 | 認証 |
|--------|------|------|------|
| GET | `/notifications/matches` | 個別通知登録試合一覧 | JWT |
| POST | `/notifications/matches` | 試合通知登録 | JWT |
| DELETE | `/notifications/matches/:matchId` | 試合通知解除 | JWT |

### ユーザー
| Method | Path | 説明 | 認証 |
|--------|------|------|------|
| GET | `/users/me` | ユーザー情報（内部フィールド除外） | JWT |
| PUT | `/users/push-token` | Push通知トークン更新 | JWT |
| PUT | `/users/notify` | 通知ON/OFF切替 | JWT |
| DELETE | `/users/me` | アカウント削除 | JWT |

### 動画
| Method | Path | 説明 | 認証 |
|--------|------|------|------|
| GET | `/videos` | 動画フィード（?channelId= ?page= ?limit=） | - |
| GET | `/videos/channels` | 登録チャンネル一覧 | - |
| POST | `/videos/channels` | チャンネル追加 | Admin |
| POST | `/videos/refresh` | 手動動画フェッチ | Admin |
| DELETE | `/videos/all` | 全動画削除（リセット用） | Admin |

> **Admin認証**: `X-Admin-Secret: [ADMIN_SECRET]` ヘッダーが必要

---

## 5. セキュリティ設計

| 項目 | 実装内容 |
|------|---------|
| 認証 | JWT（Bearer Token）、30日有効期限 |
| 管理者API | X-Admin-Secretヘッダー認証 |
| レートリミット | 一般: 300回/15分、認証: 20回/15分 |
| CORS | 本番では ALLOWED_ORIGINS 環境変数で制限 |
| ボディ制限 | 100KB上限 |
| 必須環境変数チェック | 本番起動時に JWT_SECRET 等が未設定なら即終了 |
| データ保護 | pushToken・appleUserId は GET /users/me から除外 |

---

## 6. モバイルアプリ構成

```
mobile/
├── app/
│   ├── (tabs)/
│   │   ├── _layout.tsx     # 5タブ構成（マイチームが中央・強調）
│   │   ├── index.tsx       # ホーム
│   │   ├── videos.tsx      # 動画（YouTube Shorts フィード）
│   │   ├── favorites.tsx   # マイチーム
│   │   ├── news.tsx        # 試合・順位
│   │   └── countries.tsx   # 出場国
│   ├── country/[code].tsx  # 国詳細
│   ├── player/[id].tsx     # 選手詳細
│   ├── video/[id].tsx      # 動画プレイヤー
│   └── modal.tsx           # 設定画面
├── components/
│   └── MatchCard.tsx       # 共通試合カード（ベルボタン込み）
├── hooks/                  # TanStack Query フック群
├── stores/                 # Zustand ストア（認証）
├── lib/
│   ├── api.ts              # Axios インスタンス（本番URL設定済み）
│   └── matchUtils.ts       # 日時フォーマット・JST変換ユーティリティ
└── constants/
    └── theme.ts            # カラーパレット・デザイントークン
```
