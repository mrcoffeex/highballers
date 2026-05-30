-- Allow Basic Baller club members to send chat messages (read/send for all members).

drop policy if exists "All-star club members can send chat messages" on public.club_chat_messages;
drop policy if exists "Club members can send chat messages" on public.club_chat_messages;

create policy "Club members can send chat messages"
  on public.club_chat_messages for insert to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.club_members cm
      where cm.club_id = club_chat_messages.club_id and cm.user_id = auth.uid()
    )
  );
