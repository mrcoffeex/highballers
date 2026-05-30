-- Club admins and game creators can cancel (delete) games that are not finished.

drop policy if exists "Event creator or club admin can delete events" on public.events;

create policy "Event creator or club admin can delete events"
  on public.events for delete to authenticated
  using (
    finished_at is null
    and (
      created_by = auth.uid()
      or exists (
        select 1 from public.clubs c
        where c.id = club_id and c.admin_id = auth.uid()
      )
    )
  );
