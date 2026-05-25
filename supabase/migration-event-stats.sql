-- Post-game stats and event finish state

alter table public.events
  add column if not exists finished_at timestamptz;

create table if not exists public.event_player_stats (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  points int not null default 0 check (points >= 0),
  rebounds int not null default 0 check (rebounds >= 0),
  assists int not null default 0 check (assists >= 0),
  blocks int not null default 0 check (blocks >= 0),
  steals int not null default 0 check (steals >= 0),
  recorded_at timestamptz not null default now(),
  unique (event_id, user_id)
);

alter table public.event_player_stats enable row level security;

create policy "Event stats are readable by authenticated users"
  on public.event_player_stats for select to authenticated using (true);

create policy "Creators and club admins can manage event stats"
  on public.event_player_stats for all to authenticated
  using (
    exists (
      select 1 from public.events e
      join public.clubs c on c.id = e.club_id
      where e.id = event_player_stats.event_id
        and (e.created_by = auth.uid() or c.admin_id = auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.events e
      join public.clubs c on c.id = e.club_id
      where e.id = event_player_stats.event_id
        and (e.created_by = auth.uid() or c.admin_id = auth.uid())
    )
  );

drop policy if exists "Event creators can update events" on public.events;

create policy "Event creators and club admins can update events"
  on public.events for update to authenticated
  using (
    auth.uid() = created_by
    or exists (
      select 1 from public.clubs
      where id = events.club_id and admin_id = auth.uid()
    )
  );
