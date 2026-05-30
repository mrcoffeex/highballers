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
