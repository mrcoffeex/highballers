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
