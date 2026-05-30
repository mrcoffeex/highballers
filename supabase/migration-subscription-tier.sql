-- Subscription tiers: basic (Basic Baller) | all_star (All-Star Baller)

alter table public.profiles
  add column if not exists subscription_tier text not null default 'basic'
  check (subscription_tier in ('basic', 'all_star'));

create index if not exists profiles_subscription_tier_idx
  on public.profiles (subscription_tier);

-- Enforce tier limits server-side
create or replace function public.enforce_club_member_limits()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  admin_tier text;
  member_count int;
  user_tier text;
  user_club_count int;
begin
  select p.subscription_tier
  into admin_tier
  from public.clubs c
  join public.profiles p on p.id = c.admin_id
  where c.id = new.club_id;

  select count(*)
  into member_count
  from public.club_members
  where club_id = new.club_id;

  if admin_tier = 'basic' and member_count >= 20 then
    raise exception 'Club member limit reached (Basic Baller max 20).';
  end if;

  select subscription_tier into user_tier
  from public.profiles
  where id = new.user_id;

  select count(*) into user_club_count
  from public.club_members
  where user_id = new.user_id;

  if user_tier = 'basic' and user_club_count >= 1 then
    raise exception 'Basic Ballers can belong to 1 club.';
  end if;

  return new;
end;
$$;

drop trigger if exists club_members_enforce_limits on public.club_members;
create trigger club_members_enforce_limits
  before insert on public.club_members
  for each row execute function public.enforce_club_member_limits();

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

drop policy if exists "Club members can send chat messages" on public.club_chat_messages;
create policy "All-star club members can send chat messages"
  on public.club_chat_messages for insert to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.profiles p
      where p.id = auth.uid() and p.subscription_tier = 'all_star'
    )
    and exists (
      select 1 from public.club_members cm
      where cm.club_id = club_chat_messages.club_id and cm.user_id = auth.uid()
    )
  );

drop policy if exists "Authenticated users can create clubs" on public.clubs;
create policy "Authenticated users can create clubs"
  on public.clubs for insert to authenticated
  with check (
    auth.uid() = admin_id
    and (
      visibility = 'open'
      or exists (
        select 1 from public.profiles p
        where p.id = auth.uid() and p.subscription_tier = 'all_star'
      )
    )
  );
