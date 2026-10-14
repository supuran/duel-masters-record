-- Supabase Dashboard > SQL Editor で実行してください。
-- デッキと対戦記録にND/ADフォーマットを保存します。
-- 既存データにはNDを設定します。必要に応じて登録後にADへ変更してください。

alter table public.decks
  add column if not exists format text not null default 'ND';

alter table public.matches
  add column if not exists format text not null default 'ND';

notify pgrst, 'reload schema';
