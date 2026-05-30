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
