-- Supabase Dashboard > SQL Editor で実行してください。
-- ユーザー名の重複を許可し、1〜20文字に変更します。
-- デッキ詳細検索項目とフレンド向け非表示設定を追加します。

alter table public.profiles
  drop constraint if exists profiles_username_check;
alter table public.profiles
  drop constraint if exists profiles_username_length_check;
alter table public.profiles
  add constraint profiles_username_length_check
  check (char_length(trim(username)) between 1 and 20) not valid;
drop index if exists public.profiles_username_lower_key;

alter table public.decks add column if not exists deck_type text not null default 'casual';
alter table public.decks add column if not exists is_hidden_from_friends boolean not null default false;

alter table public.decks drop constraint if exists decks_deck_type_check;
alter table public.decks add constraint decks_deck_type_check
  check (deck_type in ('competitive', 'casual')) not valid;
-- 以前の検索項目は既存データを保持したまま、アプリでは参照しません。
drop index if exists public.decks_civilizations_gin_idx;
alter table public.decks drop constraint if exists decks_civilizations_check;
alter table public.decks drop constraint if exists decks_key_cards_length_check;
create index if not exists decks_type_idx on public.decks (deck_type);

drop policy if exists "Owners and friends can view decks" on public.decks;
create policy "Owners and friends can view decks" on public.decks for select to authenticated
  using (
    (select auth.uid()) = user_id
    or (not is_hidden_from_friends and public.are_friends((select auth.uid()), user_id))
  );

drop policy if exists "Owners and friends can view deck images" on storage.objects;
create policy "Owners and friends can view deck images" on storage.objects for select to authenticated
  using (bucket_id = 'deck-images' and (
    (storage.foldername(name))[1] = (select auth.uid()::text)
    or exists (
      select 1 from public.decks d
      where d.user_id = ((storage.foldername(name))[1])::uuid
        and d.image_path = storage.objects.name
        and not d.is_hidden_from_friends
        and public.are_friends((select auth.uid()), d.user_id)
    )
  ));

notify pgrst, 'reload schema';
