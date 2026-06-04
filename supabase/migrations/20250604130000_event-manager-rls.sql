-- Game creator, club captain, and sub-captains can update/cancel games and manage stats.

drop policy if exists "Event creators and club admins can update events" on public.events;
drop policy if exists "Event creator or club admin can delete events" on public.events;
drop policy if exists "Event stats insert by creator or club admin" on public.event_player_stats;
drop policy if exists "Event stats update by creator or club admin" on public.event_player_stats;
drop policy if exists "Event stats delete by creator or club admin" on public.event_player_stats;

create policy "Event managers can update events"
  on public.events for update to authenticated
  using (
    auth.uid() = created_by
    or exists (
      select 1 from public.clubs c
      where c.id = events.club_id and c.admin_id = auth.uid()
    )
    or exists (
      select 1 from public.club_sub_captains sc
      where sc.club_id = events.club_id and sc.user_id = auth.uid()
    )
  );

create policy "Event managers can delete events"
  on public.events for delete to authenticated
  using (
    finished_at is null
    and (
      created_by = auth.uid()
      or exists (
        select 1 from public.clubs c
        where c.id = club_id and c.admin_id = auth.uid()
      )
      or exists (
        select 1 from public.club_sub_captains sc
        where sc.club_id = club_id and sc.user_id = auth.uid()
      )
    )
  );

create policy "Event stats insert by event managers"
  on public.event_player_stats for insert to authenticated
  with check (
    exists (
      select 1 from public.events e
      join public.clubs c on c.id = e.club_id
      where e.id = event_player_stats.event_id
        and (
          e.created_by = auth.uid()
          or c.admin_id = auth.uid()
          or exists (
            select 1 from public.club_sub_captains sc
            where sc.club_id = e.club_id and sc.user_id = auth.uid()
          )
        )
    )
  );

create policy "Event stats update by event managers"
  on public.event_player_stats for update to authenticated
  using (
    exists (
      select 1 from public.events e
      join public.clubs c on c.id = e.club_id
      where e.id = event_player_stats.event_id
        and (
          e.created_by = auth.uid()
          or c.admin_id = auth.uid()
          or exists (
            select 1 from public.club_sub_captains sc
            where sc.club_id = e.club_id and sc.user_id = auth.uid()
          )
        )
    )
  )
  with check (
    exists (
      select 1 from public.events e
      join public.clubs c on c.id = e.club_id
      where e.id = event_player_stats.event_id
        and (
          e.created_by = auth.uid()
          or c.admin_id = auth.uid()
          or exists (
            select 1 from public.club_sub_captains sc
            where sc.club_id = e.club_id and sc.user_id = auth.uid()
          )
        )
    )
  );

create policy "Event stats delete by event managers"
  on public.event_player_stats for delete to authenticated
  using (
    exists (
      select 1 from public.events e
      join public.clubs c on c.id = e.club_id
      where e.id = event_player_stats.event_id
        and (
          e.created_by = auth.uid()
          or c.admin_id = auth.uid()
          or exists (
            select 1 from public.club_sub_captains sc
            where sc.club_id = e.club_id and sc.user_id = auth.uid()
          )
        )
    )
  );
