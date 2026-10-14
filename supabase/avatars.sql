-- Supabase Dashboard > SQL Editor で実行してください。
-- ユーザーアイコンを非公開ストレージに保存します。

alter table public.profiles add column if not exists avatar_path text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('user-avatars', 'user-avatars', false, 3145728, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Users can view user avatars" on storage.objects;
create policy "Users can view user avatars"
  on storage.objects for select to authenticated
  using (bucket_id = 'user-avatars');

drop policy if exists "Users can upload their own avatar" on storage.objects;
create policy "Users can upload their own avatar"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'user-avatars' and (storage.foldername(name))[1] = (select auth.uid()::text));

drop policy if exists "Users can update their own avatar" on storage.objects;
create policy "Users can update their own avatar"
  on storage.objects for update to authenticated
  using (bucket_id = 'user-avatars' and (storage.foldername(name))[1] = (select auth.uid()::text))
  with check (bucket_id = 'user-avatars' and (storage.foldername(name))[1] = (select auth.uid()::text));

drop policy if exists "Users can delete their own avatar" on storage.objects;
create policy "Users can delete their own avatar"
  on storage.objects for delete to authenticated
  using (bucket_id = 'user-avatars' and (storage.foldername(name))[1] = (select auth.uid()::text));

notify pgrst, 'reload schema';
