-- Supabase Dashboard > SQL Editor で実行してください。
-- デッキ管理から対戦登録プルダウンへの表示・非表示を切り替える列を追加します。

alter table public.decks
  add column if not exists is_hidden boolean not null default false;

alter table public.opponent_decks
  add column if not exists is_hidden boolean not null default false;

notify pgrst, 'reload schema';
