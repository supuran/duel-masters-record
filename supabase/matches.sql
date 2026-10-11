-- Supabase Dashboard > SQL Editor で実行してください。
-- 対戦履歴は本人だけが閲覧・編集でき、デッキ削除後も記録は残ります。

create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  deck_id uuid references public.decks (id) on delete set null,
  deck_name text not null check (char_length(trim(deck_name)) between 1 and 40),
  opponent_name text check (opponent_name is null or char_length(opponent_name) <= 40),
  opponent_deck text check (opponent_deck is null or char_length(opponent_deck) <= 40),
  result text not null check (result in ('win', 'loss', 'draw')),
  turn_order text not null check (turn_order in ('first', 'second')),
  played_at date not null default current_date,
  memo text check (memo is null or char_length(memo) <= 500),
  created_at timestamptz not null default now()
);

create index if not exists matches_user_id_played_at_idx
  on public.matches (user_id, played_at desc, created_at desc);

alter table public.matches enable row level security;

drop policy if exists "Users can view their own matches" on public.matches;
create policy "Users can view their own matches"
  on public.matches for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can create their own matches" on public.matches;
create policy "Users can create their own matches"
  on public.matches for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and (
      deck_id is null
      or exists (
        select 1 from public.decks d
        where d.id = matches.deck_id and d.user_id = (select auth.uid())
      )
    )
  );

drop policy if exists "Users can update their own matches" on public.matches;
create policy "Users can update their own matches"
  on public.matches for update
  to authenticated
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and (
      deck_id is null
      or exists (
        select 1 from public.decks d
        where d.id = matches.deck_id and d.user_id = (select auth.uid())
      )
    )
  );

drop policy if exists "Users can delete their own matches" on public.matches;
create policy "Users can delete their own matches"
  on public.matches for delete
  to authenticated
  using (auth.uid() = user_id);

grant select, insert, update, delete on public.matches to authenticated;

notify pgrst, 'reload schema';
