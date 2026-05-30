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
