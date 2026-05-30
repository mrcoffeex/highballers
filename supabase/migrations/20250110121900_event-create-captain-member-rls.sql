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
