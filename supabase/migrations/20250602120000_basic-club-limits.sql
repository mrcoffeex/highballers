-- Basic Baller club limits: 1 owned club (100 members), join up to 5 other clubs

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
  user_joined_count int;
  is_own_club boolean;
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

  if admin_tier = 'basic' and member_count >= 100 then
    raise exception 'Club member limit reached (Basic Baller max 100).';
  end if;

  select subscription_tier into user_tier
  from public.profiles
  where id = new.user_id;

  if user_tier <> 'basic' then
    return new;
  end if;

  select (c.admin_id = new.user_id)
  into is_own_club
  from public.clubs c
  where c.id = new.club_id;

  if is_own_club then
    return new;
  end if;

  select count(*)
  into user_joined_count
  from public.club_members cm
  join public.clubs c on c.id = cm.club_id
  where cm.user_id = new.user_id
    and c.admin_id <> new.user_id;

  if user_joined_count >= 5 then
    raise exception 'Basic Ballers can join only 5 other clubs.';
  end if;

  return new;
end;
$$;

create or replace function public.enforce_club_creation_limits()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  user_tier text;
  owned_count int;
begin
  select subscription_tier into user_tier
  from public.profiles
  where id = new.admin_id;

  if user_tier <> 'basic' then
    return new;
  end if;

  select count(*)
  into owned_count
  from public.clubs
  where admin_id = new.admin_id;

  if owned_count >= 1 then
    raise exception 'Basic Ballers can create only 1 club.';
  end if;

  return new;
end;
$$;

drop trigger if exists clubs_enforce_creation_limits on public.clubs;
create trigger clubs_enforce_creation_limits
  before insert on public.clubs
  for each row execute function public.enforce_club_creation_limits();
