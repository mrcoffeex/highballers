-- Run if you already created the schema before open/private clubs existed.

alter table public.clubs
  add column if not exists visibility text not null default 'open'
  check (visibility in ('open', 'private'));

create table if not exists public.club_join_requests (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (club_id, user_id)
);

alter table public.club_join_requests enable row level security;

create policy "Join requests are readable by authenticated users"
  on public.club_join_requests for select to authenticated using (true);

create policy "Users can request to join private clubs"
  on public.club_join_requests for insert to authenticated with check (auth.uid() = user_id);

create policy "Users can cancel their join request"
  on public.club_join_requests for delete to authenticated
  using (auth.uid() = user_id);

create policy "Club admins can manage join requests"
  on public.club_join_requests for delete to authenticated
  using (
    exists (
      select 1 from public.clubs
      where id = club_join_requests.club_id and admin_id = auth.uid()
    )
  );
