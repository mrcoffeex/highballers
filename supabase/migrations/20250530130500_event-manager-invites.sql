-- Creators and club leaders can add players to games and manage private invites.

drop policy if exists "Event creators can manage invites" on public.event_invites;
drop policy if exists "Event creators can remove invites" on public.event_invites;
drop policy if exists "Event managers can add invites" on public.event_invites;
drop policy if exists "Event managers can remove invites" on public.event_invites;
drop policy if exists "Event managers can add participants" on public.event_participants;

create policy "Event managers can add invites"
  on public.event_invites for insert to authenticated
  with check (
    exists (
      select 1
      from public.events e
      join public.clubs c on c.id = e.club_id
      join public.club_members cm
        on cm.club_id = e.club_id and cm.user_id = event_invites.user_id
      where e.id = event_invites.event_id
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

create policy "Event managers can remove invites"
  on public.event_invites for delete to authenticated
  using (
    exists (
      select 1
      from public.events e
      join public.clubs c on c.id = e.club_id
      where e.id = event_invites.event_id
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

create policy "Event managers can add participants"
  on public.event_participants for insert to authenticated
  with check (
    exists (
      select 1
      from public.events e
      join public.clubs c on c.id = e.club_id
      join public.club_members cm
        on cm.club_id = e.club_id and cm.user_id = event_participants.user_id
      where e.id = event_participants.event_id
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
