# WCP26 開発ロードマップ（実績版）

**最終更新**: 2026-06-04  
**開幕日**: 2026年6月11日（残り7日）

---

## 完了済み

### Phase 1: ローカル開発
- ✅ プロジェクト構成（Expo + Node.js + Prisma）
- ✅ SQLite → PostgreSQL 移行
- ✅ 全DBスキーマ設計・実装
- ✅ 初期データ投入（48か国・104試合・1,248選手）
- ✅ 全APIエンドポイント実装
- ✅ 5タブUI（ホーム・動画・マイチーム・試合順位・出場国）
- ✅ 試合日程・グループ順位・決勝トーナメント（プレースホルダー）
- ✅ チームフォロー・試合単位通知
- ✅ Push通知（cronジョブ・スマートポーリング）
- ✅ YouTube Shorts フィード（TikTok風縦スクロール）
- ✅ 試合リアルタイム同期（football-data.org 無料API）
- ✅ スタッツ画面（得点/アシストランキング）
- ✅ 選手詳細ページ
- ✅ 設定画面（通知ON/OFF・アカウント削除）
- ✅ セキュリティ対応（認証・レートリミット・圧縮）
- ✅ パフォーマンス最適化（DBインデックス・クエリ最適化・キャッシュ）

### Phase 2: デプロイ
- ✅ Supabase（PostgreSQL）セットアップ
- ✅ Railway（APIサーバー）デプロイ・稼働確認
- ✅ 本番DBデータ投入完了
- ✅ モバイルのAPI URLを本番に切り替え
- ✅ プライバシーポリシー公開（GitHub Pages）
- ✅ ドキュメント整備

---

## 残り作業

### 最優先（Apple Developer承認後）

| タスク | 内容 | 工数 |
|--------|------|------|
| Sign in with Apple | `expo-apple-authentication` 実装 | 半日 |
| Bundle ID登録 | App Store Connectで設定 | 30分 |
| APNs証明書設定 | EAS経由で自動設定 | 30分 |

### App Store提出

| タスク | 内容 | 工数 |
|--------|------|------|
| EAS Build | 本番ビルド: `eas build --platform ios` | 20〜30分 |
| App Store Connect | アプリ情報入力・スクリーンショット登録 | 1〜2時間 |
| 提出 | `eas submit --platform ios` | 30分 |
| 審査 | App Store審査（1〜3日） | 待機 |

---

## インフラURL

| サービス | URL |
|---------|-----|
| 本番API | https://wc2026-production-76db.up.railway.app |
| ヘルスチェック | https://wc2026-production-76db.up.railway.app/health |
| プライバシーポリシー | https://aono0.github.io/wcp26/privacy.html |
| GitHub (API) | https://github.com/aono0/wc2026 |
| Supabase | https://supabase.com/dashboard/project/lesjnvlwehifwiepukct |
| Railway | https://railway.app |

---

## Phase 3（大会期間中・将来）

| 時期 | 内容 |
|------|------|
| 6/11〜 | 試合開幕・リアルタイムスコア更新の動作確認 |
| 6/18〜 | ユーザーフィードバックを基にUI微調整 |
| 7/〜 | 決勝Tの対戦カード確定後にDBを更新 |
| 将来 | Android対応・ニュース機能・マネタイズ |
