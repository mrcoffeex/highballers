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
