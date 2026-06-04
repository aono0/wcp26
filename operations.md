# WCP26 運用仕様書

**バージョン**: 1.0  
**最終更新**: 2026-06-04

---

## 1. Cronジョブ一覧

サーバー起動時に3つのジョブが登録される。

### 1.1 試合前日通知ジョブ

| 項目 | 内容 |
|------|------|
| スケジュール | `0 0 * * *`（毎日 00:00 UTC = 09:00 JST） |
| 処理内容 | 翌日（JST）に試合があるフォロー中ユーザーにPush通知送信 |
| 対象ユーザー条件 | `notifyEnabled=true` かつ `pushToken` が存在 |
| 通知トリガー① | チームフォロー（UserFavorite）経由 |
| 通知トリガー② | 試合単位フォロー（MatchNotification）経由 |
| 重複排除 | なし（チームフォローと試合フォロー両方で登録していると2通届く可能性あり） |

**日付の判定ロジック**
```
翌日のJST日付範囲 = 翌日のJST 00:00〜24:00 → UTCに変換してDB検索
例: 翌日のJST 00:00 = UTC 15:00（前日）
    翌日のJST 24:00 = UTC 15:00（当日）
```

深夜の試合（例: 3:00 JST）も「翌日の試合」として前日朝9:00に通知される。

---

### 1.2 動画フェッチジョブ

| 項目 | 内容 |
|------|------|
| スケジュール | `0 */3 * * *`（3時間ごと: 0:00 / 3:00 / 6:00 ...） |
| 処理内容 | 全アクティブチャンネルの動画をYouTube Data API v3から取得・DB保存 |
| API利用量目安 | 1チャンネルあたり約200 units（search + status確認）×チャンネル数 |
| 無料枠 | 10,000 units/日（余裕あり） |

**動画取得条件（1チャンネルあたり）**

```
1. YouTube Search API で最新20件を取得
   - order: date（新しい順）
   - maxResults: 20
   - type: video
   - videoDuration: short（4分未満）
   - publishedAfter: 2026-05-01T00:00:00Z（固定）

2. 取得した動画IDで一括チェック（videos?part=status,contentDetails）
   - 条件①: embeddable = true（WebViewに埋め込み可能）
   - 条件②: duration ≤ 90秒（YouTube Shorts相当）

3. 両条件をクリアした動画のみ upsert でDB保存
   - 既存動画はタイトル・サムネイルのみ更新
   - isShort: duration ≤ 60秒 なら true
```

**モバイルでの表示分岐**
- `isShort = true`: YouTube Shorts URL (`/shorts/VIDEO_ID`) で WebView 再生
- `isShort = false`: サムネイル表示 + 「YouTubeで見る」ボタン

---

### 1.3 試合データ同期ジョブ（スマートポーリング）

| 項目 | 内容 |
|------|------|
| スケジュール | `*/5 * * * *`（5分ごとに起動） |
| 実際の同期頻度 | 状況に応じて可変（下記参照） |
| データソース | football-data.org 無料API |
| 1日の消費リクエスト | ピーク時 約100回（無料枠 14,400回/日に対し1%未満） |

**スマートポーリングのロジック**

```
① LIVEの試合がある → 5分ごとに同期（cronの最大頻度）
② 1時間以内にキックオフがある → 15分ごとに同期
③ 当日に試合がある（待機中）→ 1時間ごとに同期
④ 試合のない日 → 6時間ごとに同期（0:00/6:00/12:00/18:00 UTC）
```

**同期する内容**
- Match.status の更新（SCHEDULED → LIVE → FINISHED）
- CountryMatch.score の更新（各チームの得点）
- CountryMatch.result の更新（WIN / DRAW / LOSS）
- Player.goalCount / assistCount の更新（得点ランキング）

**チームコードのマッピング**
- football-data.org の TLA コード（3文字）= 当アプリの Country.code
- 例: JPN, BRA, FRA など

---

## 2. データ管理

### 2.1 チャンネル管理

**登録チャンネル一覧（初期設定 + 追加分）**

| カテゴリ | チャンネル |
|---------|---------|
| 公式メディア | FIFA, サッカーキング Japan, Goal Japan, JFA, DAZN Japan |
| コンテンツクリエイター | shunfreestyle, r football jpn, footballshukyu, z-jajan, gunsou720, foot ok rock, football factory zuki, footballfrisk 等 |
| 各国代表公式 | ブラジル, アルゼンチン, フランス, ドイツ, スペイン, イングランド, ポルトガル, オランダ, 日本(JFATV), 韓国, メキシコ |

**チャンネルの追加・変更方法**

方法①: Supabase Table Editor → `YoutubeChannel` テーブルを直接編集

方法②: APIエンドポイント
```bash
curl -X POST https://wc2026-production-76db.up.railway.app/videos/channels \
  -H "Content-Type: application/json" \
  -H "X-Admin-Secret: [ADMIN_SECRET]" \
  -d '{"channelId": "UCxxxxxxxx", "name": "チャンネル名"}'
```

変更後すぐ反映させる場合は手動フェッチ：
```bash
curl -X POST https://wc2026-production-76db.up.railway.app/videos/refresh \
  -H "X-Admin-Secret: [ADMIN_SECRET]"
```

### 2.2 試合データの手動更新

決勝トーナメントの対戦カードが確定した際の更新手順：

1. Supabase Table Editor → `Match` テーブル
2. 該当の試合（`stage = 'ROUND_OF_32'` 等）を検索
3. `homePlaceholder` / `awayPlaceholder` をクリアし、代わりに `CountryMatch` を追加

またはAPIで試合データを強制同期：
```bash
curl -X POST https://wc2026-production-76db.up.railway.app/matches/sync \
  -H "X-Admin-Secret: [ADMIN_SECRET]"
```

### 2.3 選手スタッツの更新

試合データ同期ジョブ（1.3）が自動更新するが、手動でも実行可能：
```bash
curl -X POST https://wc2026-production-76db.up.railway.app/matches/sync \
  -H "X-Admin-Secret: [ADMIN_SECRET]"
```

---

## 3. インフラ設定

### 3.1 環境変数一覧

**Railway（本番）**

| 変数名 | 用途 | 備考 |
|--------|------|------|
| `NODE_ENV` | `production` | 必須 |
| `DATABASE_URL` | Supabase Transaction Pooler URL | `?pgbouncer=true&connection_limit=1` 必須 |
| `JWT_SECRET` | JWT署名キー | 32バイト以上のランダム文字列 |
| `ADMIN_SECRET` | 管理者API認証 | 32バイト以上のランダム文字列 |
| `YOUTUBE_API_KEY` | YouTube Data API v3 | Google Cloud Console で取得 |
| `VIDEO_PUBLISHED_AFTER` | `2026-05-01T00:00:00Z` | 動画取得の開始日 |
| `FOOTBALL_DATA_API_KEY` | 試合データAPI | football-data.org で取得（無料） |
| `ALLOWED_ORIGINS` | CORS許可オリジン | 本番では適切に設定 |

**Supabase接続について**
- アプリ用: Transaction Pooler（port 6543）+ `?pgbouncer=true&connection_limit=1`
- ローカル開発・マイグレーション用: Direct connection（port 5432）

### 3.2 デプロイ方法

```bash
# GitHubにプッシュすると Railway が自動デプロイ
cd /Users/apple/Desktop/wcp26/api
git add .
git commit -m "update"
git push
```

Railway は GitHub の `main` ブランチを監視して自動デプロイ。

### 3.3 DB マイグレーション手順

```bash
cd /Users/apple/Desktop/wcp26/api
# スキーマ変更後
npx prisma migrate dev --name [変更内容]
npx prisma generate
git add prisma/
git commit -m "db: [変更内容]"
git push
# Railway上では migrate deploy が自動実行される（設定済み）
```

---

## 4. 監視・アラート

| 項目 | 確認方法 |
|------|---------|
| APIサーバーの稼働 | Railway Dashboard → Deployments → View logs |
| DBの状態 | Supabase Dashboard → Table Editor |
| API疎通確認 | `curl https://wc2026-production-76db.up.railway.app/health` |
| 動画取得状況 | Railway ログで `[YouTube]` プレフィックスのログを確認 |
| 試合同期状況 | Railway ログで `[FootballData]` / `[Job]` プレフィックスのログを確認 |

---

## 5. 緊急時対応

### サーバーが落ちている場合
1. Railway → Deployments → 最新デプロイの `Redeploy`

### データが古い場合
```bash
curl -X POST https://wc2026-production-76db.up.railway.app/matches/sync \
  -H "X-Admin-Secret: [ADMIN_SECRET]"
```

### 動画が表示されない場合
```bash
curl -X POST https://wc2026-production-76db.up.railway.app/videos/refresh \
  -H "X-Admin-Secret: [ADMIN_SECRET]"
```

### DBをリセットしたい場合（注意: 全データ削除）
```bash
cd /Users/apple/Desktop/wcp26/api
npx prisma db seed
npm run db:import-players
npm run db:seed-channels
npx tsx prisma/addNationalChannels.ts
```
