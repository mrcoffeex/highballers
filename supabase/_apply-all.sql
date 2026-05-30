-- HighBallers: combined schema + migrations
-- Generated: 2026-05-30T12:00:17Z
-- Paste into Supabase Dashboard → SQL Editor → Run

-- ========== schema.sql (baseline) ==========
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

create table if not exists public.club_bans (
  club_id uuid not null references public.clubs(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  banned_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
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
  finished_at timestamptz,
  visibility text not null default 'open' check (visibility in ('open', 'private'))
);

create table if not exists public.event_invites (
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  primary key (event_id, user_id)
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
alter table public.club_bans enable row level security;
alter table public.events enable row level security;
alter table public.event_invites enable row level security;
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
drop policy if exists "Club bans are readable by authenticated users" on public.club_bans;
drop policy if exists "Club admins can ban members" on public.club_bans;
drop policy if exists "Club admins can unban members" on public.club_bans;
drop policy if exists "Users can join clubs" on public.club_members;
drop policy if exists "Users can leave clubs" on public.club_members;
drop policy if exists "Club admins can remove members" on public.club_members;
drop policy if exists "Events are readable by authenticated users" on public.events;
drop policy if exists "Event creator or club admin can delete events" on public.events;
drop policy if exists "Club members can create events" on public.events;
drop policy if exists "Event creators and club admins can update events" on public.events;
drop policy if exists "Event creators can update events" on public.events;
drop policy if exists "Participants are readable by authenticated users" on public.event_participants;
drop policy if exists "Event invites are readable by authenticated users" on public.event_invites;
drop policy if exists "Event creators can manage invites" on public.event_invites;
drop policy if exists "Event creators can remove invites" on public.event_invites;
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
  on public.clubs for update to authenticated
  using (auth.uid() = admin_id)
  with check (
    auth.uid() = admin_id
    and (
      visibility = 'open'
      or exists (
        select 1 from public.profiles p
        where p.id = auth.uid() and p.subscription_tier = 'all_star'
      )
    )
  );

create policy "Club members are readable by authenticated users"
  on public.club_members for select to authenticated using (true);

create policy "Club bans are readable by authenticated users"
  on public.club_bans for select to authenticated using (true);

create policy "Club admins can ban members"
  on public.club_bans for insert to authenticated
  with check (
    exists (
      select 1 from public.clubs
      where id = club_bans.club_id and admin_id = auth.uid()
    )
    and banned_by = auth.uid()
    and user_id <> auth.uid()
  );

create policy "Club admins can unban members"
  on public.club_bans for delete to authenticated
  using (
    exists (
      select 1 from public.clubs
      where id = club_bans.club_id and admin_id = auth.uid()
    )
  );

create policy "Users can join clubs"
  on public.club_members for insert to authenticated
  with check (
    auth.uid() = user_id
    and not exists (
      select 1 from public.club_bans
      where club_id = club_members.club_id and user_id = auth.uid()
    )
  );

create policy "Club admins can remove members"
  on public.club_members for delete to authenticated
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.clubs
      where id = club_members.club_id and admin_id = auth.uid()
    )
  );

create policy "Events are readable by authenticated users"
  on public.events for select to authenticated using (true);

create policy "Club members can create events"
  on public.events for insert to authenticated
  with check (
    auth.uid() = created_by
    and (
      exists (
        select 1 from public.club_members cm
        where cm.club_id = events.club_id and cm.user_id = auth.uid()
      )
      or exists (
        select 1 from public.clubs c
        where c.id = events.club_id and c.admin_id = auth.uid()
      )
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

create policy "Event creator or club admin can delete events"
  on public.events for delete to authenticated
  using (
    finished_at is null
    and (
      created_by = auth.uid()
      or exists (
        select 1 from public.clubs c
        where c.id = club_id and c.admin_id = auth.uid()
      )
    )
  );

create policy "Participants are readable by authenticated users"
  on public.event_participants for select to authenticated using (true);

create policy "Event invites are readable by authenticated users"
  on public.event_invites for select to authenticated using (true);

create policy "Event creators can manage invites"
  on public.event_invites for insert to authenticated
  with check (
    exists (
      select 1 from public.events e
      join public.club_members cm
        on cm.club_id = e.club_id and cm.user_id = event_invites.user_id
      where e.id = event_invites.event_id
        and e.created_by = auth.uid()
    )
  );

create policy "Event creators can remove invites"
  on public.event_invites for delete to authenticated
  using (
    exists (
      select 1 from public.events e
      where e.id = event_invites.event_id and e.created_by = auth.uid()
    )
  );

create policy "Users can join events"
  on public.event_participants for insert to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.events e
      join public.club_members cm
        on cm.club_id = e.club_id and cm.user_id = auth.uid()
      where e.id = event_id
        and (
          e.visibility = 'open'
          or e.created_by = auth.uid()
          or exists (
            select 1 from public.event_invites ei
            where ei.event_id = e.id and ei.user_id = auth.uid()
          )
        )
    )
  );

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
  on public.club_join_requests for insert to authenticated
  with check (
    auth.uid() = user_id
    and not exists (
      select 1 from public.club_bans
      where club_id = club_join_requests.club_id and user_id = auth.uid()
    )
  );

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

-- ========== migrations/20250110120000_club-visibility.sql ==========
-- Run if you already created the schema before open/private clubs existed.

alter table public.clubs
  add column if not exists visibility text not null default 'open'
  check (visibility in ('open', 'private'));

create table if not exists public.club_join_requests (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (club_id, user_id)
);

alter table public.club_join_requests enable row level security;

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

-- ========== migrations/20250110120100_event-coordinates.sql ==========
-- Run if events table was created before map coordinates existed.

alter table public.events
  add column if not exists latitude double precision,
  add column if not exists longitude double precision;

-- ========== migrations/20250110120200_event-max-players.sql ==========
-- Run if events.max_players still caps at 20.

alter table public.events
  drop constraint if exists events_max_players_check;

alter table public.events
  add constraint events_max_players_check check (max_players between 10 and 40);

-- ========== migrations/20250110120300_event-players-per-game.sql ==========
-- Configurable players per court when shuffling (default 10 = 5v5)
alter table public.events
  add column if not exists players_per_game int check (
    players_per_game is null or (players_per_game >= 4 and players_per_game <= 20 and mod(players_per_game, 2) = 0)
  );

update public.events
set players_per_game = 10
where players_per_game is null;

-- ========== migrations/20250110120400_court-games.sql ==========
-- Multi-court 5v5 shuffle storage (Game 1, Game 2, ...)

alter table public.events
  add column if not exists court_games jsonb;

update public.events
set court_games = jsonb_build_array(
  jsonb_build_object(
    'teamA', to_jsonb(team_a),
    'teamB', to_jsonb(team_b)
  )
)
where court_games is null
  and team_a is not null
  and team_b is not null
  and coalesce(array_length(team_a, 1), 0) > 0
  and coalesce(array_length(team_b, 1), 0) > 0;

-- ========== migrations/20250110120500_event-stats.sql ==========
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

-- ========== migrations/20250110120600_event-stats-rls.sql ==========
-- Fix event_player_stats upsert under RLS (explicit INSERT/UPDATE policies)

drop policy if exists "Creators and club admins can manage event stats"
  on public.event_player_stats;

drop policy if exists "Event stats are readable by authenticated users"
  on public.event_player_stats;

create policy "Event stats are readable by authenticated users"
  on public.event_player_stats for select to authenticated
  using (true);

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

-- ========== migrations/20250110120700_subscription-tier.sql ==========
-- Subscription tiers: basic (Basic Baller) | all_star (All-Star Baller)

alter table public.profiles
  add column if not exists subscription_tier text not null default 'basic'
  check (subscription_tier in ('basic', 'all_star'));

create index if not exists profiles_subscription_tier_idx
  on public.profiles (subscription_tier);

-- Enforce tier limits server-side
create or replace function public.enforce_club_member_limits()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  admin_tier text;
  member_count int;
  user_tier text;
  user_club_count int;
begin
  select p.subscription_tier
  into admin_tier
  from public.clubs c
  join public.profiles p on p.id = c.admin_id
  where c.id = new.club_id;

  select count(*)
  into member_count
  from public.club_members
  where club_id = new.club_id;

  if admin_tier = 'basic' and member_count >= 20 then
    raise exception 'Club member limit reached (Basic Baller max 20).';
  end if;

  select subscription_tier into user_tier
  from public.profiles
  where id = new.user_id;

  select count(*) into user_club_count
  from public.club_members
  where user_id = new.user_id;

  if user_tier = 'basic' and user_club_count >= 1 then
    raise exception 'Basic Ballers can belong to 1 club.';
  end if;

  return new;
end;
$$;

drop trigger if exists club_members_enforce_limits on public.club_members;
create trigger club_members_enforce_limits
  before insert on public.club_members
  for each row execute function public.enforce_club_member_limits();

drop policy if exists "All-star club members can create events" on public.events;
drop policy if exists "Club members can create events" on public.events;
create policy "Club members can create events"
  on public.events for insert to authenticated
  with check (
    auth.uid() = created_by
    and exists (
      select 1 from public.club_members
      where club_id = events.club_id and user_id = auth.uid()
    )
  );

drop policy if exists "Club members can send chat messages" on public.club_chat_messages;
create policy "All-star club members can send chat messages"
  on public.club_chat_messages for insert to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.profiles p
      where p.id = auth.uid() and p.subscription_tier = 'all_star'
    )
    and exists (
      select 1 from public.club_members cm
      where cm.club_id = club_chat_messages.club_id and cm.user_id = auth.uid()
    )
  );

drop policy if exists "Authenticated users can create clubs" on public.clubs;
create policy "Authenticated users can create clubs"
  on public.clubs for insert to authenticated
  with check (
    auth.uid() = admin_id
    and (
      visibility = 'open'
      or exists (
        select 1 from public.profiles p
        where p.id = auth.uid() and p.subscription_tier = 'all_star'
      )
    )
  );

-- ========== migrations/20250110120800_basic-create-game.sql ==========
-- Allow Basic Ballers to create games (club members who created the event)

drop policy if exists "All-star club members can create events" on public.events;
drop policy if exists "Club members can create events" on public.events;

create policy "Club members can create events"
  on public.events for insert to authenticated
  with check (
    auth.uid() = created_by
    and exists (
      select 1 from public.club_members
      where club_id = events.club_id and user_id = auth.uid()
    )
  );

-- ========== migrations/20250110120900_club-chats.sql ==========
-- Club group chats: one chat per club, messages visible to club members only.

create table if not exists public.club_chats (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null unique references public.clubs(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.club_chat_messages (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index if not exists club_chat_messages_club_id_created_at_idx
  on public.club_chat_messages (club_id, created_at desc);

alter table public.club_chats enable row level security;
alter table public.club_chat_messages enable row level security;

create policy "Club members can read club chats"
  on public.club_chats for select to authenticated
  using (
    exists (
      select 1 from public.club_members cm
      where cm.club_id = club_chats.club_id and cm.user_id = auth.uid()
    )
  );

create policy "Club members can read chat messages"
  on public.club_chat_messages for select to authenticated
  using (
    exists (
      select 1 from public.club_members cm
      where cm.club_id = club_chat_messages.club_id and cm.user_id = auth.uid()
    )
  );

create policy "Club members can send chat messages"
  on public.club_chat_messages for insert to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.club_members cm
      where cm.club_id = club_chat_messages.club_id and cm.user_id = auth.uid()
    )
  );

-- Backfill chats for existing clubs.
insert into public.club_chats (club_id)
select c.id from public.clubs c
on conflict (club_id) do nothing;

-- Auto-create a chat when a club is created.
create or replace function public.create_club_chat()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  insert into public.club_chats (club_id)
  values (new.id)
  on conflict (club_id) do nothing;
  return new;
end;
$$;

drop trigger if exists clubs_create_chat on public.clubs;
create trigger clubs_create_chat
  after insert on public.clubs
  for each row execute function public.create_club_chat();

-- Realtime for live chat updates.
alter publication supabase_realtime add table public.club_chat_messages;

grant select, insert on public.club_chats to authenticated;
grant select, insert on public.club_chat_messages to authenticated;

-- ========== migrations/20250110121000_basic-chat.sql ==========
-- Allow Basic Baller club members to send chat messages (read/send for all members).

drop policy if exists "All-star club members can send chat messages" on public.club_chat_messages;
drop policy if exists "Club members can send chat messages" on public.club_chat_messages;

create policy "Club members can send chat messages"
  on public.club_chat_messages for insert to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.club_members cm
      where cm.club_id = club_chat_messages.club_id and cm.user_id = auth.uid()
    )
  );

-- ========== migrations/20250110121100_iap-subscriptions.sql ==========
-- In-app purchase receipts and server-side subscription tier protection

create table if not exists public.subscription_receipts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  product_id text not null,
  transaction_id text not null,
  purchase_token text,
  platform text not null check (platform in ('ios', 'android', 'unknown')),
  transaction_date timestamptz not null default now(),
  restored boolean not null default false,
  created_at timestamptz not null default now(),
  unique (platform, transaction_id)
);

create index if not exists subscription_receipts_user_id_idx
  on public.subscription_receipts (user_id);

alter table public.subscription_receipts enable row level security;

create policy "Users can read own subscription receipts"
  on public.subscription_receipts for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- Prevent clients from self-upgrading subscription_tier; only service role may change it.
create or replace function public.protect_subscription_tier()
returns trigger
language plpgsql
as $$
begin
  if old.subscription_tier is distinct from new.subscription_tier then
    if current_user in ('service_role', 'postgres', 'supabase_admin') then
      return new;
    end if;
    new.subscription_tier := old.subscription_tier;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profiles_subscription_tier on public.profiles;
create trigger protect_profiles_subscription_tier
  before update on public.profiles
  for each row
  execute function public.protect_subscription_tier();

-- ========== migrations/20250110121200_push-notifications.sql ==========
-- Push notification edge functions (deploy separately):
--
--   supabase functions deploy notify-club-chat
--   supabase functions deploy notify-club-new-game
--   supabase secrets set EXPO_ACCESS_TOKEN=<your-expo-access-token>
--
-- Client invokes:
--   notify-club-chat   after club_chat_messages insert
--   notify-club-new-game after events insert
--
-- Requires profiles.push_token (saved on app launch via registerForPushNotifications).

-- ========== migrations/20250110121300_event-visibility.sql ==========
-- Open games: any club member can join. Private games: invited members only.

alter table public.events
  add column if not exists visibility text not null default 'open'
  check (visibility in ('open', 'private'));

create table if not exists public.event_invites (
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  primary key (event_id, user_id)
);

alter table public.event_invites enable row level security;

drop policy if exists "Event invites are readable by authenticated users" on public.event_invites;
drop policy if exists "Event creators can manage invites" on public.event_invites;
drop policy if exists "Users can join events" on public.event_participants;

create policy "Event invites are readable by authenticated users"
  on public.event_invites for select to authenticated using (true);

create policy "Event creators can manage invites"
  on public.event_invites for insert to authenticated
  with check (
    exists (
      select 1 from public.events e
      join public.club_members cm
        on cm.club_id = e.club_id and cm.user_id = event_invites.user_id
      where e.id = event_invites.event_id
        and e.created_by = auth.uid()
    )
  );

create policy "Event creators can remove invites"
  on public.event_invites for delete to authenticated
  using (
    exists (
      select 1 from public.events e
      where e.id = event_invites.event_id and e.created_by = auth.uid()
    )
  );

create policy "Users can join events"
  on public.event_participants for insert to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.events e
      join public.club_members cm
        on cm.club_id = e.club_id and cm.user_id = auth.uid()
      where e.id = event_id
        and (
          e.visibility = 'open'
          or e.created_by = auth.uid()
          or exists (
            select 1 from public.event_invites ei
            where ei.event_id = e.id and ei.user_id = auth.uid()
          )
        )
    )
  );

-- ========== migrations/20250110121400_club-bans.sql ==========
-- Club admins can kick members and ban them from rejoining.

create table if not exists public.club_bans (
  club_id uuid not null references public.clubs(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  banned_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (club_id, user_id)
);

alter table public.club_bans enable row level security;

drop policy if exists "Club bans are readable by authenticated users" on public.club_bans;
drop policy if exists "Club admins can ban members" on public.club_bans;
drop policy if exists "Club admins can unban members" on public.club_bans;
drop policy if exists "Users can join clubs" on public.club_members;
drop policy if exists "Club admins can remove members" on public.club_members;
drop policy if exists "Users can request to join private clubs" on public.club_join_requests;

create policy "Club bans are readable by authenticated users"
  on public.club_bans for select to authenticated using (true);

create policy "Club admins can ban members"
  on public.club_bans for insert to authenticated
  with check (
    exists (
      select 1 from public.clubs
      where id = club_bans.club_id and admin_id = auth.uid()
    )
    and banned_by = auth.uid()
    and user_id <> auth.uid()
  );

create policy "Club admins can unban members"
  on public.club_bans for delete to authenticated
  using (
    exists (
      select 1 from public.clubs
      where id = club_bans.club_id and admin_id = auth.uid()
    )
  );

create policy "Users can join clubs"
  on public.club_members for insert to authenticated
  with check (
    auth.uid() = user_id
    and not exists (
      select 1 from public.club_bans
      where club_id = club_members.club_id and user_id = auth.uid()
    )
  );

create policy "Club admins can remove members"
  on public.club_members for delete to authenticated
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.clubs
      where id = club_members.club_id and admin_id = auth.uid()
    )
  );

create policy "Users can request to join private clubs"
  on public.club_join_requests for insert to authenticated
  with check (
    auth.uid() = user_id
    and not exists (
      select 1 from public.club_bans
      where club_id = club_join_requests.club_id and user_id = auth.uid()
    )
  );

-- ========== migrations/20250110121500_club-visibility-update-rls.sql ==========
-- Only All-Star admins can set a club to private on update (open is always allowed).

drop policy if exists "Club admins can update clubs" on public.clubs;

create policy "Club admins can update clubs"
  on public.clubs for update to authenticated
  using (auth.uid() = admin_id)
  with check (
    auth.uid() = admin_id
    and (
      visibility = 'open'
      or exists (
        select 1 from public.profiles p
        where p.id = auth.uid() and p.subscription_tier = 'all_star'
      )
    )
  );

-- ========== migrations/20250110121600_event-cancel.sql ==========
-- Club admins and game creators can cancel (delete) games that are not finished.

drop policy if exists "Event creator or club admin can delete events" on public.events;

create policy "Event creator or club admin can delete events"
  on public.events for delete to authenticated
  using (
    finished_at is null
    and (
      created_by = auth.uid()
      or exists (
        select 1 from public.clubs c
        where c.id = club_id and c.admin_id = auth.uid()
      )
    )
  );

-- ========== migrations/20250110121700_event-create-rls.sql ==========
-- Allow any club member (or club admin) to create games.

drop policy if exists "Club members can create events" on public.events;

create policy "Club members can create events"
  on public.events for insert to authenticated
  with check (
    auth.uid() = created_by
    and (
      exists (
        select 1 from public.club_members cm
        where cm.club_id = events.club_id and cm.user_id = auth.uid()
      )
      or exists (
        select 1 from public.clubs c
        where c.id = events.club_id and c.admin_id = auth.uid()
      )
    )
  );

-- ========== migrations/20250110121800_club-sub-captains.sql ==========
-- Sub-captains (max 2 per club, enforced in app) and private-game create rules.

create table if not exists public.club_sub_captains (
  club_id uuid not null references public.clubs(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  assigned_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (club_id, user_id)
);

create index if not exists club_sub_captains_club_id_idx
  on public.club_sub_captains (club_id);

alter table public.club_sub_captains enable row level security;

drop policy if exists "Sub-captains are readable by authenticated users" on public.club_sub_captains;
drop policy if exists "Club captains can assign sub-captains" on public.club_sub_captains;
drop policy if exists "Club captains can remove sub-captains" on public.club_sub_captains;

create policy "Sub-captains are readable by authenticated users"
  on public.club_sub_captains for select to authenticated using (true);

create policy "Club captains can assign sub-captains"
  on public.club_sub_captains for insert to authenticated
  with check (
    exists (
      select 1 from public.clubs c
      where c.id = club_sub_captains.club_id and c.admin_id = auth.uid()
    )
    and club_sub_captains.user_id <> (
      select c.admin_id from public.clubs c where c.id = club_sub_captains.club_id
    )
    and exists (
      select 1 from public.club_members cm
      where cm.club_id = club_sub_captains.club_id
        and cm.user_id = club_sub_captains.user_id
    )
  );

create policy "Club captains can remove sub-captains"
  on public.club_sub_captains for delete to authenticated
  using (
    exists (
      select 1 from public.clubs c
      where c.id = club_sub_captains.club_id and c.admin_id = auth.uid()
    )
  );

grant select, insert, delete on public.club_sub_captains to authenticated;

-- Open games: any member. Private games: captain or sub-captain only.

drop policy if exists "Club members can create events" on public.events;

create policy "Club members can create open events"
  on public.events for insert to authenticated
  with check (
    auth.uid() = created_by
    and coalesce(visibility, 'open') = 'open'
    and (
      exists (
        select 1 from public.club_members cm
        where cm.club_id = events.club_id and cm.user_id = auth.uid()
      )
      or exists (
        select 1 from public.clubs c
        where c.id = events.club_id and c.admin_id = auth.uid()
      )
    )
  );

create policy "Club leaders can create private events"
  on public.events for insert to authenticated
  with check (
    auth.uid() = created_by
    and visibility = 'private'
    and (
      exists (
        select 1 from public.clubs c
        where c.id = events.club_id and c.admin_id = auth.uid()
      )
      or exists (
        select 1 from public.club_sub_captains sc
        where sc.club_id = events.club_id and sc.user_id = auth.uid()
      )
    )
    and exists (
      select 1 from public.club_members cm
      where cm.club_id = events.club_id and cm.user_id = auth.uid()
    )
  );

-- ========== migrations/20250110121900_event-create-captain-member-rls.sql ==========
-- Captains may create private games even when not listed in club_members.

drop policy if exists "Club leaders can create private events" on public.events;

create policy "Club leaders can create private events"
  on public.events for insert to authenticated
  with check (
    auth.uid() = created_by
    and visibility = 'private'
    and (
      exists (
        select 1 from public.clubs c
        where c.id = events.club_id and c.admin_id = auth.uid()
      )
      or exists (
        select 1 from public.club_sub_captains sc
        where sc.club_id = events.club_id and sc.user_id = auth.uid()
      )
    )
    and (
      exists (
        select 1 from public.club_members cm
        where cm.club_id = events.club_id and cm.user_id = auth.uid()
      )
      or exists (
        select 1 from public.clubs c
        where c.id = events.club_id and c.admin_id = auth.uid()
      )
    )
  );

-- Done.
-- Optional seeds (manual, filename order = run order):
--   seeds/20250115120000_dav-sur-dummy-players.sql
--   seeds/20250115120100_join-davsur-mga-par-event.sql
--   seeds/20250115120200_join-davsur-night-game.sql
