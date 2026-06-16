# WCP26 引き継ぎドキュメント

最終更新: 2026-06-16

---

## 現在地

**v1.1.0 App Store 申請済み**（審査待ち）  
git HEAD: `9ceb747` chore: bump version to 1.1.0

---

## アプリ概要

2026年サッカー世界大会トラッカー iOS アプリ「Never miss a match」

- **Bundle ID**: com.wcp26.app
- **App Store 名**: Never miss a match
- **バージョン**: 1.1.0（審査中）

---

## 技術スタック

| レイヤー | 技術 |
|---------|------|
| モバイル | Expo SDK 56 + React Native（expo-router） |
| 認証 | Sign in with Apple（本番）/ devLogin（__DEV__のみ） |
| バックエンド | Node.js + Prisma、Railway でホスト |
| DB | Supabase（PostgreSQL）Transaction Pooler |
| ビルド | EAS Build |
| 通知 | Expo Notifications（前日正午 + 試合前X分） |

### 接続情報
- 本番 API: `https://wc2026-production-76db.up.railway.app`
- Supabase Project ID: `lesjnvlwehifwiepukct`
- EAS Project ID: `e04d8335-da64-4ccb-9ea1-d30625d382c9`
- Bundle ID: `com.wcp26.app`
- プライバシーポリシー: `https://aono0.github.io/wcp26/privacy.html`

### Railway 環境変数（設定済み）
- `JWT_SECRET` / `DATABASE_URL` / `ADMIN_SECRET`
- `FOOTBALL_DATA_API_KEY`（スコア自動同期用）
- `PRE_MATCH_NOTIFY_MINUTES`（デフォルト15、未設定でも動作）
- `NODE_ENV=production` / `YOUTUBE_API_KEY` / `VIDEO_PUBLISHED_AFTER`

---

## v1.1.0 で対応したこと

### バグ修正
- お気に入り登録が無音で失敗していた → 楽観的UI更新 + エラーアラート追加
- 通知ベルも同様 → 楽観的UI更新
- 終わった試合が「SCHEDULED」のまま表示 → 110分経過後に自動 FINISHED 化（API キー不要）
- スコア null 時に「0」と表示 → 「- : -」に変更
- ホーム画面が API を無限ループ呼び出し → クエリキーを5分単位で安定化
- 国詳細でアプリクラッシュ（旧v1.0.0との互換性）→ `players:[]` を返すよう修正

### 機能追加・改善
- ホーム画面に「直近の試合」セクション（直近 FINISHED 日のグループ）
- ホーム「これからの試合」ラベル変更
- 試合タブのデフォルト日付を FINISHED 最新日に変更
- 試合タブの日付チップが選択日を左端に自動スクロール
- MatchCard の国旗・国名をタップで国詳細に遷移
- 国詳細画面の初速改善（選手データを遅延ロードに分離）
- 試合前通知タイミングを Railway 環境変数で変更可能に
- スタッツセクションをホーム・試合タブ両方から削除
- matches API に `?from=` `?to=` フィルタ追加
- 国詳細 API に `/countries/:code/players` エンドポイント追加

### セキュリティ
- `?from=` 不正日付でサーバーエラーになる問題修正
- `PRE_MATCH_NOTIFY_MINUTES` NaN ガード追加

---

## 重要なファイル

```
wcp26/
├── api/src/
│   ├── routes/matches.ts         # ?from= ?to= フィルタあり
│   ├── routes/countries.ts       # /:code と /:code/players
│   ├── routes/favorites.ts       # 要 requireAuth
│   ├── jobs/matchSync.ts         # autoFinish 5分ごと（API キー不要）
│   ├── jobs/matchNotifications.ts # PRE_MATCH_NOTIFY_MINUTES 環境変数
│   └── services/footballData.ts  # autoFinishOldMatches + syncAll
├── mobile/
│   ├── app.json                  # version: 1.1.0, icon3.png, splach-icon3.png
│   ├── app/(tabs)/index.tsx      # ホーム（stableTimestamp で無限ループ防止）
│   ├── app/(tabs)/news.tsx       # 試合・順位タブ（スタッツなし）
│   ├── app/country/[code].tsx    # 楽観的お気に入り更新
│   ├── components/MatchCard.tsx  # 国旗タップで遷移、楽観的通知更新
│   ├── hooks/useCountries.ts     # useCountryDetail + useCountryPlayers
│   └── hooks/useFavorites.ts     # onError オプション対応
└── docs/privacy.html             # GitHub Pages
```

---

## 次にやること候補

- v1.1.0 審査通過後に特になし（必要に応じて v1.2.0）
- football-data.org の国コード（TLA）と DB の code が一致しているか確認
  → スコア自動同期が効いているか Railway ログで確認する
- `PRE_MATCH_NOTIFY_MINUTES` を Railway に明示設定するか確認

---

## 開発コマンド

```bash
# シミュレーター（キャッシュクリア必須）
cd mobile && npx expo start --clear

# API ローカル起動（ポート競合時は lsof -ti:3000 | xargs kill -9）
cd api && npm run dev

# EAS 本番ビルド + 自動提出
cd mobile && npx eas-cli build --platform ios --profile production --auto-submit
```
