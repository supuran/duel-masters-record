-- Supabase Dashboard > SQL Editor で実行してください。
-- 承認済みフレンド間だけデッキ・対戦履歴・デッキ画像を共有します。

create table if not exists public.friend_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint friend_requests_no_self check (requester_id <> recipient_id),
  constraint friend_requests_pair_unique unique (requester_id, recipient_id)
);

create index if not exists friend_requests_recipient_status_idx on public.friend_requests (recipient_id, status, created_at desc);
create index if not exists friend_requests_requester_status_idx on public.friend_requests (requester_id, status, created_at desc);

alter table public.friend_requests enable row level security;
drop policy if exists "Users can view their own friend requests" on public.friend_requests;
create policy "Users can view their own friend requests"
  on public.friend_requests for select to authenticated
  using ((select auth.uid()) in (requester_id, recipient_id));
grant select on public.friend_requests to authenticated;
revoke insert, update, delete on public.friend_requests from authenticated;

create or replace function public.are_friends(user_a uuid, user_b uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.friend_requests fr where fr.status = 'accepted'
    and (user_a = (select auth.uid()) or user_b = (select auth.uid()))
    and ((fr.requester_id = user_a and fr.recipient_id = user_b)
      or (fr.requester_id = user_b and fr.recipient_id = user_a)));
$$;
revoke all on function public.are_friends(uuid, uuid) from public;
grant execute on function public.are_friends(uuid, uuid) to authenticated;

create or replace function public.request_friend(target_user_id uuid)
returns void language plpgsql security definer set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  existing_status text;
begin
  if current_user_id is null then raise exception 'ログインしてください'; end if;
  if target_user_id is null or target_user_id = current_user_id then raise exception '自分自身には申請できません'; end if;
  if not exists (select 1 from public.profiles p where p.id = target_user_id) then raise exception 'ユーザーが見つかりません'; end if;
  if public.are_friends(current_user_id, target_user_id) then raise exception 'すでにフレンドです'; end if;
  select fr.status into existing_status from public.friend_requests fr where fr.requester_id = current_user_id and fr.recipient_id = target_user_id;
  if existing_status = 'pending' then raise exception '申請はすでに送信済みです'; end if;
  if existing_status = 'accepted' then raise exception 'すでにフレンドです'; end if;
  insert into public.friend_requests as current_request (requester_id, recipient_id, status, created_at, updated_at)
  values (current_user_id, target_user_id, 'pending', now(), now())
  on conflict (requester_id, recipient_id) do update
    set status = 'pending', created_at = now(), updated_at = now()
    where current_request.status = 'rejected';
end;
$$;

create or replace function public.respond_friend(request_id uuid, decision text)
returns void language plpgsql security definer set search_path = ''
as $$
begin
  if auth.uid() is null then raise exception 'ログインしてください'; end if;
  if decision not in ('accepted', 'rejected') then raise exception '応答内容が不正です'; end if;
  update public.friend_requests set status = decision, updated_at = now()
    where id = request_id and recipient_id = auth.uid() and status = 'pending';
  if not found then raise exception '申請が見つからないか、すでに処理されています'; end if;
end;
$$;
revoke all on function public.request_friend(uuid) from public;
revoke all on function public.respond_friend(uuid, text) from public;
grant execute on function public.request_friend(uuid) to authenticated;
grant execute on function public.respond_friend(uuid, text) to authenticated;

drop policy if exists "Users can view their own decks" on public.decks;
drop policy if exists "Owners and friends can view decks" on public.decks;
create policy "Owners and friends can view decks" on public.decks for select to authenticated
  using ((select auth.uid()) = user_id or public.are_friends((select auth.uid()), user_id));

drop policy if exists "Users can view their own matches" on public.matches;
drop policy if exists "Owners and friends can view matches" on public.matches;
create policy "Owners and friends can view matches" on public.matches for select to authenticated
  using ((select auth.uid()) = user_id or public.are_friends((select auth.uid()), user_id));

drop policy if exists "Users can view their own deck images" on storage.objects;
drop policy if exists "Owners and friends can view deck images" on storage.objects;
create policy "Owners and friends can view deck images" on storage.objects for select to authenticated
  using (bucket_id = 'deck-images' and (
    (storage.foldername(name))[1] = (select auth.uid()::text)
    or public.are_friends((select auth.uid()), ((storage.foldername(name))[1])::uuid)
  ));

notify pgrst, 'reload schema';
