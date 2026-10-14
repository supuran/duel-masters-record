-- Supabase Dashboard > SQL Editor で実行してください。
-- デッキは所有者だけが操作でき、画像は非公開バケットに保存されます。

create table if not exists public.decks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 40),
  image_path text,
  is_hidden boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.decks
  add column if not exists image_path text;
alter table public.decks
  add column if not exists is_hidden boolean not null default false;

create index if not exists decks_user_id_created_at_idx
  on public.decks (user_id, created_at desc);

alter table public.decks enable row level security;

drop policy if exists "Users can view their own decks" on public.decks;
create policy "Users can view their own decks"
  on public.decks for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can create their own decks" on public.decks;
create policy "Users can create their own decks"
  on public.decks for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own decks" on public.decks;
create policy "Users can update their own decks"
  on public.decks for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own decks" on public.decks;
create policy "Users can delete their own decks"
  on public.decks for delete
  to authenticated
  using (auth.uid() = user_id);

grant select, insert, update, delete on public.decks to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('deck-images', 'deck-images', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Users can view their own deck images" on storage.objects;
create policy "Users can view their own deck images"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'deck-images' and (storage.foldername(name))[1] = (select auth.uid()::text));

drop policy if exists "Users can upload their own deck images" on storage.objects;
create policy "Users can upload their own deck images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'deck-images' and (storage.foldername(name))[1] = (select auth.uid()::text));

drop policy if exists "Users can update their own deck images" on storage.objects;
create policy "Users can update their own deck images"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'deck-images' and (storage.foldername(name))[1] = (select auth.uid()::text))
  with check (bucket_id = 'deck-images' and (storage.foldername(name))[1] = (select auth.uid()::text));

drop policy if exists "Users can delete their own deck images" on storage.objects;
create policy "Users can delete their own deck images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'deck-images' and (storage.foldername(name))[1] = (select auth.uid()::text));

-- SQL Editorからの実行後、Data APIにテーブル定義を再読込させる。
notify pgrst, 'reload schema';
