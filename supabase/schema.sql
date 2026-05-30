-- Run in Supabase SQL Editor to enable cloud sync.

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  nickname text,
  position text not null check (position in ('PG', 'SG', 'SF', 'PF', 'C')),
  avatar_color text not null,
  avatar_url text,
  bio text,
  stats jsonb not null default '{}'::jsonb,
  push_token text,
  subscription_tier text not null default 'basic' check (subscription_tier in ('basic', 'all_star')),
  joined_at timestamptz not null default now()
);

create table if not exists public.clubs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  location text not null,
  admin_id uuid not null references public.profiles(id) on delete cascade,
  icon_color text not null,
  icon_url text,
  visibility text not null default 'open' check (visibility in ('open', 'private')),
  created_at timestamptz not null default now()
);

create table if not exists public.club_join_requests (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (club_id, user_id)
);

create table if not exists public.club_members (
  club_id uuid not null references public.clubs(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (club_id, user_id)
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  title text not null,
  description text not null default '',
  location text not null,
  latitude double precision,
  longitude double precision,
  date_time timestamptz not null,
  max_players int not null check (max_players between 10 and 40),
  players_per_game int check (
    players_per_game is null or (players_per_game >= 4 and players_per_game <= 20 and mod(players_per_game, 2) = 0)
  ),
  created_by uuid not null references public.profiles(id) on delete cascade,
  shuffled boolean not null default false,
  team_a uuid[],
  team_b uuid[],
  court_games jsonb,
  finished_at timestamptz
);

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

create table if not exists public.event_participants (
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (event_id, user_id)
);

alter table public.profiles enable row level security;
alter table public.clubs enable row level security;
alter table public.club_members enable row level security;
alter table public.events enable row level security;
alter table public.event_participants enable row level security;
alter table public.event_player_stats enable row level security;
alter table public.club_join_requests enable row level security;

-- Policies are recreated idempotently (safe to re-run on an existing project).
drop policy if exists "Profiles are readable by authenticated users" on public.profiles;
drop policy if exists "Users can insert their own profile" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;
drop policy if exists "Clubs are readable by authenticated users" on public.clubs;
drop policy if exists "Authenticated users can create clubs" on public.clubs;
drop policy if exists "Club admins can update clubs" on public.clubs;
drop policy if exists "Club members are readable by authenticated users" on public.club_members;
drop policy if exists "Users can join clubs" on public.club_members;
drop policy if exists "Users can leave clubs" on public.club_members;
drop policy if exists "Events are readable by authenticated users" on public.events;
drop policy if exists "Club members can create events" on public.events;
drop policy if exists "Event creators and club admins can update events" on public.events;
drop policy if exists "Event creators can update events" on public.events;
drop policy if exists "Participants are readable by authenticated users" on public.event_participants;
drop policy if exists "Users can join events" on public.event_participants;
drop policy if exists "Users can leave events" on public.event_participants;
drop policy if exists "Event stats are readable by authenticated users" on public.event_player_stats;
drop policy if exists "Event stats insert by creator or club admin" on public.event_player_stats;
drop policy if exists "Event stats update by creator or club admin" on public.event_player_stats;
drop policy if exists "Event stats delete by creator or club admin" on public.event_player_stats;
drop policy if exists "Creators and club admins can manage event stats" on public.event_player_stats;
drop policy if exists "Join requests are readable by authenticated users" on public.club_join_requests;
drop policy if exists "Users can request to join private clubs" on public.club_join_requests;
drop policy if exists "Users can cancel their join request" on public.club_join_requests;
drop policy if exists "Club admins can manage join requests" on public.club_join_requests;

create policy "Profiles are readable by authenticated users"
  on public.profiles for select to authenticated using (true);

create policy "Users can insert their own profile"
  on public.profiles for insert to authenticated with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update to authenticated using (auth.uid() = id);

create policy "Clubs are readable by authenticated users"
  on public.clubs for select to authenticated using (true);

create policy "Authenticated users can create clubs"
  on public.clubs for insert to authenticated with check (auth.uid() = admin_id);

create policy "Club admins can update clubs"
  on public.clubs for update to authenticated using (auth.uid() = admin_id);

create policy "Club members are readable by authenticated users"
  on public.club_members for select to authenticated using (true);

create policy "Users can join clubs"
  on public.club_members for insert to authenticated with check (auth.uid() = user_id);

create policy "Users can leave clubs"
  on public.club_members for delete to authenticated using (auth.uid() = user_id);

create policy "Events are readable by authenticated users"
  on public.events for select to authenticated using (true);

create policy "Club members can create events"
  on public.events for insert to authenticated
  with check (
    auth.uid() = created_by
    and exists (
      select 1 from public.club_members
      where club_id = events.club_id and user_id = auth.uid()
    )
  );

create policy "Event creators and club admins can update events"
  on public.events for update to authenticated
  using (
    auth.uid() = created_by
    or exists (
      select 1 from public.clubs
      where id = events.club_id and admin_id = auth.uid()
    )
  );

create policy "Participants are readable by authenticated users"
  on public.event_participants for select to authenticated using (true);

create policy "Users can join events"
  on public.event_participants for insert to authenticated with check (auth.uid() = user_id);

create policy "Users can leave events"
  on public.event_participants for delete to authenticated using (auth.uid() = user_id);

create policy "Event stats are readable by authenticated users"
  on public.event_player_stats for select to authenticated using (true);

create policy "Event stats insert by creator or club admin"
  on public.event_player_stats for insert to authenticated
  with check (
    exists (
      select 1 from public.events e
      join public.clubs c on c.id = e.club_id
      where e.id = event_player_stats.event_id
        and (e.created_by = auth.uid() or c.admin_id = auth.uid())
    )
  );

create policy "Event stats update by creator or club admin"
  on public.event_player_stats for update to authenticated
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

create policy "Event stats delete by creator or club admin"
  on public.event_player_stats for delete to authenticated
  using (
    exists (
      select 1 from public.events e
      join public.clubs c on c.id = e.club_id
      where e.id = event_player_stats.event_id
        and (e.created_by = auth.uid() or c.admin_id = auth.uid())
    )
  );

create policy "Join requests are readable by authenticated users"
  on public.club_join_requests for select to authenticated using (true);

create policy "Users can request to join private clubs"
  on public.club_join_requests for insert to authenticated with check (auth.uid() = user_id);

create policy "Users can cancel their join request"
  on public.club_join_requests for delete to authenticated
  using (auth.uid() = user_id);

create policy "Club admins can manage join requests"
  on public.club_join_requests for delete to authenticated
  using (
    exists (
      select 1 from public.clubs
      where id = club_join_requests.club_id and admin_id = auth.uid()
    )
  );

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true), ('club-logos', 'club-logos', true)
on conflict (id) do nothing;

drop policy if exists "Avatar images are publicly readable" on storage.objects;
drop policy if exists "Users can upload their avatar" on storage.objects;
drop policy if exists "Users can update their avatar" on storage.objects;
drop policy if exists "Club logos are publicly readable" on storage.objects;
drop policy if exists "Authenticated users can upload club logos" on storage.objects;
drop policy if exists "Authenticated users can update club logos" on storage.objects;

create policy "Avatar images are publicly readable"
  on storage.objects for select using (bucket_id = 'avatars');

create policy "Users can upload their avatar"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can update their avatar"
  on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Club logos are publicly readable"
  on storage.objects for select using (bucket_id = 'club-logos');

create policy "Authenticated users can upload club logos"
  on storage.objects for insert to authenticated with check (bucket_id = 'club-logos');

create policy "Authenticated users can update club logos"
  on storage.objects for update to authenticated using (bucket_id = 'club-logos');
