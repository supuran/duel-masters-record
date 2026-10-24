-- Supabase Dashboard > SQL Editor で実行してください。
-- 既存の友達データを保持したまま、古いRLS許可と不要な関数実行権限を整理します。

begin;

-- RLS policies are permissive by default and combine with OR. Remove older
-- policies that bypass hidden-deck and match/deck ownership checks.
drop policy if exists decks_select_own_or_friend on public.decks;
drop policy if exists matches_select_own_or_friend on public.matches;
drop policy if exists matches_insert_own on public.matches;
drop policy if exists matches_update_own on public.matches;

-- Prevent legacy direct friendship writes from manufacturing accepted friends.
drop policy if exists friendships_insert_request on public.friendships;
create policy friendships_insert_request on public.friendships for insert to authenticated
  with check (
    requester_id = (select auth.uid())
    and addressee_id <> (select auth.uid())
    and status = 'pending'
  );

-- Keep only the function calls used by authenticated app users. The profile
-- trigger function is not a client-facing RPC.
revoke all on function public.are_friends(uuid, uuid) from public, anon;
grant execute on function public.are_friends(uuid, uuid) to authenticated;

revoke all on function public.request_friend(uuid) from public, anon;
grant execute on function public.request_friend(uuid) to authenticated;

revoke all on function public.respond_friend(uuid, text) from public, anon;
grant execute on function public.respond_friend(uuid, text) to authenticated;

revoke all on function public.is_friend(uuid) from public, anon, authenticated;
revoke all on function public.handle_new_user() from public, anon, authenticated;

notify pgrst, 'reload schema';
commit;
