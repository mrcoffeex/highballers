-- Allow the current club captain to transfer admin_id to another club member.
-- The previous "Club admins can update clubs" WITH CHECK required auth.uid() = admin_id on
-- the new row, which blocks changing admin_id to someone else.

drop policy if exists "Club captains can transfer captaincy" on public.clubs;

create policy "Club captains can transfer captaincy"
  on public.clubs for update to authenticated
  using (auth.uid() = admin_id)
  with check (
    clubs.admin_id <> auth.uid()
    and exists (
      select 1 from public.club_members cm
      where cm.club_id = clubs.id
        and cm.user_id = clubs.admin_id
    )
  );
