# デュエプレ戦績管理｜DUEL LOG

デュエプレの対戦結果や使用デッキを記録し、戦績を振り返るWebアプリです。

## アプリ

- 公開URL: [https://record-rho-flame.vercel.app](https://record-rho-flame.vercel.app)
- GitHub: [supuran/duel-masters-record](https://github.com/supuran/duel-masters-record)

## 主な機能

- メールアドレスとパスワードによる新規登録・ログイン
- マイページで総試合数、勝率、先攻勝率、後攻勝率を表示
- 直近1か月のデッキ使用割合をND／AD別の円グラフで表示
- デッキの登録（画像・ND／AD設定）、削除、対戦候補への表示／非表示
- デッキごとにガチデッキ／カジュアルデッキ、文明、キーカードを登録
- デッキ検索（デッキ名の入力候補、文明、キーカード、デッキタイプで詳細検索）
- デッキをフレンドに公開／非表示に設定
- 対戦記録の登録・編集・削除
- ND対戦ではNDデッキのみ、AD対戦ではND／ADデッキを使用デッキ・相手デッキとして選択
- 日付、勝敗、使用デッキによる対戦履歴の検索
- 相手デッキ候補の登録・削除・表示／非表示と、ND／ADフォーマット設定
- ユーザー名検索、プロフィール閲覧、フレンド申請・承認・拒否
- ユーザー名の重複を許可し、1〜20文字で設定
- ユーザー検索で入力中に候補を表示
- 承認済みフレンド間でプロフィール、デッキ、戦績を閲覧

## 使用技術

- Next.js 16（App Router）
- React 19 / TypeScript
- Supabase Auth、Postgres、Storage
- Vercel

## ローカルで起動する

```bash
npm install
```

プロジェクト直下に `.env.local` を作成し、SupabaseのProject URLとPublishable Keyを設定します。

```env
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<publishable-key>
```

SupabaseのSQL Editorで、次のSQLファイルを順番に実行してください。

1. `supabase/profiles.sql`
2. `supabase/decks.sql`
3. `supabase/matches.sql`
4. `supabase/deck-visibility.sql`
5. `supabase/duel-formats.sql`
6. `supabase/opponent-deck-formats.sql`
7. `supabase/friends.sql`
8. `supabase/avatars.sql`
9. `supabase/profile-deck-search.sql`（今回追加。既存ユーザー名・デッキを保ったまま設定を更新）

メール認証を使う場合は、Supabase AuthのURL ConfigurationにローカルURL（`http://localhost:3000`）と公開URLを設定してください。認証コールバックのパスは `/auth/callback` です。

開発サーバーを起動します。

```bash
npm run dev
```

ブラウザーで [http://localhost:3000](http://localhost:3000) を開きます。

## チェック

```bash
npm run lint
npm run build
```
