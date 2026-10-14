-- Supabase Dashboard > SQL Editor で実行してください。
-- 再実行可能な移行SQLです。既存の対戦履歴は引き分け記録を含め保持します。

create table if not exists public.opponent_decks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 40),
  is_hidden boolean not null default false,
  created_at timestamptz not null default now(),
  constraint opponent_decks_user_id_name_key unique (user_id, name)
);

alter table public.opponent_decks
  add column if not exists is_hidden boolean not null default false;

alter table public.opponent_decks enable row level security;

drop policy if exists "Users can view their own opponent decks" on public.opponent_decks;
create policy "Users can view their own opponent decks"
  on public.opponent_decks for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can create their own opponent decks" on public.opponent_decks;
create policy "Users can create their own opponent decks"
  on public.opponent_decks for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own opponent decks" on public.opponent_decks;
create policy "Users can update their own opponent decks"
  on public.opponent_decks for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own opponent decks" on public.opponent_decks;
create policy "Users can delete their own opponent decks"
  on public.opponent_decks for delete to authenticated
  using (auth.uid() = user_id);

grant select, insert, update, delete on public.opponent_decks to authenticated;

create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  deck_id uuid references public.decks (id) on delete set null,
  deck_name text not null check (char_length(trim(deck_name)) between 1 and 40),
  opponent_deck_id uuid references public.opponent_decks (id) on delete set null,
  opponent_name text check (opponent_name is null or char_length(opponent_name) <= 40),
  opponent_deck text check (opponent_deck is null or char_length(opponent_deck) <= 40),
  opponent_deck_name text not null default '' check (char_length(opponent_deck_name) <= 40),
  result text not null,
  turn_order text not null,
  played_at date not null default current_date,
  memo text check (memo is null or char_length(memo) <= 500),
  created_at timestamptz not null default now(),
  constraint matches_result_win_loss_check check (result in ('win', 'loss'))
);

-- 先に作成済みのmatchesテーブルにも、アプリで使う列を補います。
alter table public.matches add column if not exists id uuid default gen_random_uuid();
alter table public.matches add column if not exists user_id uuid references auth.users (id) on delete cascade;
alter table public.matches add column if not exists deck_id uuid references public.decks (id) on delete set null;
alter table public.matches add column if not exists deck_name text;
alter table public.matches add column if not exists opponent_deck_id uuid references public.opponent_decks (id) on delete set null;
alter table public.matches add column if not exists opponent_name text;
alter table public.matches add column if not exists opponent_deck text;
alter table public.matches add column if not exists opponent_deck_name text not null default '';
alter table public.matches add column if not exists result text;
alter table public.matches add column if not exists turn_order text;
alter table public.matches add column if not exists played_at date default current_date;
alter table public.matches add column if not exists memo text;
alter table public.matches add column if not exists created_at timestamptz default now();

-- 紐づくデッキがある過去記録には、その当時のデッキ名を補完します。
update public.matches m
set deck_name = d.name
from public.decks d
where m.deck_name is null and m.deck_id = d.id;

-- 新規登録では勝ち・負けだけ許可します。既存の引き分け記録はそのまま残します。
alter table public.matches drop constraint if exists matches_result_check;
alter table public.matches drop constraint if exists matches_result_win_loss_check;
alter table public.matches
  add constraint matches_result_win_loss_check check (result in ('win', 'loss')) not valid;

alter table public.matches drop constraint if exists matches_turn_order_check;
alter table public.matches drop constraint if exists matches_turn_order_first_second_check;
alter table public.matches
  add constraint matches_turn_order_first_second_check check (turn_order in ('first', 'second')) not valid;

create index if not exists matches_user_id_played_at_idx
  on public.matches (user_id, played_at desc, created_at desc);

alter table public.matches enable row level security;

drop policy if exists "Users can view their own matches" on public.matches;
create policy "Users can view their own matches"
  on public.matches for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can create their own matches" on public.matches;
create policy "Users can create their own matches"
  on public.matches for insert to authenticated
  with check (
    auth.uid() = user_id
    and (deck_id is null or exists (
      select 1 from public.decks d
      where d.id = matches.deck_id and d.user_id = (select auth.uid())
    ))
    and (opponent_deck_id is null or exists (
      select 1 from public.opponent_decks od
      where od.id = matches.opponent_deck_id and od.user_id = (select auth.uid())
    ))
  );

drop policy if exists "Users can update their own matches" on public.matches;
create policy "Users can update their own matches"
  on public.matches for update to authenticated
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and (deck_id is null or exists (
      select 1 from public.decks d
      where d.id = matches.deck_id and d.user_id = (select auth.uid())
    ))
    and (opponent_deck_id is null or exists (
      select 1 from public.opponent_decks od
      where od.id = matches.opponent_deck_id and od.user_id = (select auth.uid())
    ))
  );

drop policy if exists "Users can delete their own matches" on public.matches;
create policy "Users can delete their own matches"
  on public.matches for delete to authenticated
  using (auth.uid() = user_id);

grant select, insert, update, delete on public.matches to authenticated;

notify pgrst, 'reload schema';
