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
