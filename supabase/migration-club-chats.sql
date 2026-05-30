-- Club group chats: one chat per club, messages visible to club members only.

create table if not exists public.club_chats (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null unique references public.clubs(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.club_chat_messages (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index if not exists club_chat_messages_club_id_created_at_idx
  on public.club_chat_messages (club_id, created_at desc);

alter table public.club_chats enable row level security;
alter table public.club_chat_messages enable row level security;

create policy "Club members can read club chats"
  on public.club_chats for select to authenticated
  using (
    exists (
      select 1 from public.club_members cm
      where cm.club_id = club_chats.club_id and cm.user_id = auth.uid()
    )
  );

create policy "Club members can read chat messages"
  on public.club_chat_messages for select to authenticated
  using (
    exists (
      select 1 from public.club_members cm
      where cm.club_id = club_chat_messages.club_id and cm.user_id = auth.uid()
    )
  );

create policy "Club members can send chat messages"
  on public.club_chat_messages for insert to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.club_members cm
      where cm.club_id = club_chat_messages.club_id and cm.user_id = auth.uid()
    )
  );

-- Backfill chats for existing clubs.
insert into public.club_chats (club_id)
select c.id from public.clubs c
on conflict (club_id) do nothing;

-- Auto-create a chat when a club is created.
create or replace function public.create_club_chat()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  insert into public.club_chats (club_id)
  values (new.id)
  on conflict (club_id) do nothing;
  return new;
end;
$$;

drop trigger if exists clubs_create_chat on public.clubs;
create trigger clubs_create_chat
  after insert on public.clubs
  for each row execute function public.create_club_chat();

-- Realtime for live chat updates.
alter publication supabase_realtime add table public.club_chat_messages;

grant select, insert on public.club_chats to authenticated;
grant select, insert on public.club_chat_messages to authenticated;
