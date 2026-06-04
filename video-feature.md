# 動画機能 設計書

**作成日**: 2026-06-03  
**ステータス**: 設計中

---

## 概要

ワールドカップ・サッカー関連のYouTube動画をアプリ内で視聴できる「動画タブ」を追加する。  
動画のホスティングは一切行わず、YouTubeのインフラを利用する。

---

## データ収集方法の比較

| 方法 | コスト | 制限 | 向き・不向き |
|------|--------|------|------------|
| **YouTube RSS フィード** | 無料・API不要 | チャンネル単位のみ | ✅ チャンネルキュレーション方式に最適 |
| YouTube Data API v3 | 無料枠あり（10,000units/日） | 枠超過で停止 | キーワード検索したい場合 |
| TikTok | 非公開API | ToS違反リスク | ❌ 現状非推奨 |

### 採用: YouTube RSS フィード（APIキー不要）

YouTubeのチャンネルRSSフィードはAPIキー不要で無料利用できる。  
`https://www.youtube.com/feeds/videos.xml?channel_id=CHANNEL_ID`

取得できる情報:
- 動画ID・タイトル・サムネイルURL
- 公開日時・チャンネル名
- 概要文（一部）

---

## アーキテクチャ

```
YouTubeチャンネル（複数）
        ↓ RSS フェッチ（cronジョブ / 3時間ごと）
  バックエンド API（Node.js）
        ↓ 動画メタデータをDB保存
  PostgreSQL（Prisma）
        ↓ GET /videos
  iOSアプリ（React Native）
        ↓ タップ
  WebView（react-native-webview）で YouTube 再生
```

---

## DBスキーマ追加

```prisma
// 登録済みYouTubeチャンネル
model YoutubeChannel {
  id          String   @id @default(cuid())
  channelId   String   @unique   // YouTube channel_id
  name        String             // チャンネル名
  description String?
  active      Boolean  @default(true)
  createdAt   DateTime @default(now())
  videos      Video[]
}

// フェッチ済み動画
model Video {
  id          String         @id @default(cuid())
  videoId     String         @unique   // YouTube video ID
  title       String
  thumbnail   String                   // サムネイルURL
  publishedAt DateTime
  channelId   String
  createdAt   DateTime       @default(now())
  channel     YoutubeChannel @relation(fields: [channelId], references: [id])
}
```

---

## 初期登録チャンネル候補

| カテゴリ | チャンネル名 | 備考 |
|---------|------------|------|
| 公式 | FIFA | WC2026公式ハイライト |
| 公式 | JFA（日本サッカー協会） | 日本代表関連 |
| メディア | GOAL Japan | サッカーニュース日本語 |
| メディア | DAZN Japan | 試合ハイライト |
| メディア | サッカーキング | 日本語解説 |
| YouTuber | （運営が追加・管理） | |

> チャンネルIDは管理画面 or 直接DBに登録する方式

---

## API設計

| エンドポイント | 説明 |
|-------------|------|
| `GET /videos` | 動画フィード一覧（?channel=, ?page=, ?limit=） |
| `GET /channels` | 登録チャンネル一覧 |
| `POST /channels` | チャンネル追加（管理者用） |
| `POST /videos/refresh` | 手動フェッチトリガー（管理者用） |

---

## モバイル UI

### 動画タブ（5タブ目）

```
┌─────────────────────────────────────┐
│  [全て] [日本代表] [FIFA] [ハイライト] │ ← チャンネルフィルタ
│─────────────────────────────────────│
│  ┌───────────────────────────────┐  │
│  │       [サムネイル画像]         │  │
│  │                               │  │
│  │ ▶                             │  │
│  └───────────────────────────────┘  │
│  チャンネル名 · 3時間前              │
│  三笘薫がまたやった！WC2026 vs...    │
│─────────────────────────────────────│
│  ┌───────────────────────────────┐  │
│  │       [サムネイル画像]         │  │
```

### 動画再生画面

```
┌─────────────────────────────────────┐
│ ← 戻る                              │
│─────────────────────────────────────│
│                                     │
│     [YouTube プレイヤー (WebView)]   │
│                                     │
│─────────────────────────────────────│
│  動画タイトル                        │
│  チャンネル名 · 公開日              │
│  YouTubeで見る ↗                    │
└─────────────────────────────────────┘
```

---

## 実装ロードマップ

### Step 1: バックエンド（半日）
- [ ] DB スキーマ追加（YoutubeChannel・Video）
- [ ] RSS フェッチ処理（`fast-xml-parser` 使用）
- [ ] cronジョブ（3時間ごとに全チャンネルをフェッチ）
- [ ] API エンドポイント（GET /videos, GET /channels, POST /channels）
- [ ] 初期チャンネルシード

### Step 2: モバイル（半日）
- [ ] `react-native-webview` インストール
- [ ] 動画タブ追加（5タブ目）
- [ ] 動画フィード UI（サムネイル・タイトル・チャンネル・時刻）
- [ ] 動画再生画面（WebView + YouTube embed）

### Step 3: チューニング（適宜）
- [ ] チャンネルフィルタ機能
- [ ] 動画キャッシュ（古い動画は定期削除）
- [ ] お気に入りチームに関連するチャンネルのフィルタ

---

## 注意事項

- **YouTube ToS**: YouTubeのRSS利用・embeds利用は利用規約内。ただしダウンロード・保存は禁止
- **著作権**: 動画コンテンツは保存せず、YouTubeのプレイヤー経由で表示するため問題なし
- **TikTok**: 現状は公式APIなし。将来的にTikTok Embedを試す場合はToS確認が必要
- **チャンネル管理**: 不適切なコンテンツを配信するチャンネルを登録しないよう注意

---

## 未決事項

| # | 項目 | 確認が必要なタイミング |
|---|------|----------------------|
| Q1 | 初期登録チャンネルの具体的なChannel IDリスト | 実装前 |
| Q2 | YouTubeアプリへの「外部で開く」ボタンも付けるか | 実装前 |
| Q3 | 動画の保存件数上限（古い動画の削除タイミング） | 実装前 |
