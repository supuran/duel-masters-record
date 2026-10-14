-- Supabase Dashboard > SQL Editor で実行してください。
-- 相手デッキ候補にND/ADフォーマットを保存します。既存候補はNDになります。

alter table public.opponent_decks
  add column if not exists format text not null default 'ND';

alter table public.opponent_decks
  drop constraint if exists opponent_decks_user_id_name_key;
alter table public.opponent_decks
  drop constraint if exists opponent_decks_user_id_name_format_key;
alter table public.opponent_decks
  add constraint opponent_decks_user_id_name_format_key unique (user_id, name, format);

alter table public.opponent_decks
  drop constraint if exists opponent_decks_format_check;
alter table public.opponent_decks
  add constraint opponent_decks_format_check check (format in ('ND', 'AD')) not valid;

notify pgrst, 'reload schema';
