-- Join all Dav Sur Ballers club members into the "Night Game" event.
-- Run in Supabase SQL Editor after the event exists.
-- Matches event title case-insensitively (e.g. "Night Game", "night game").

do $$
declare
  v_club_id uuid;
  v_event_id uuid;
  v_max_players int;
  v_member_count int;
  v_joined int;
begin
  select id into v_club_id
  from public.clubs
  where name = 'Dav Sur Ballers'
  limit 1;

  if v_club_id is null then
    raise exception 'Club "Dav Sur Ballers" not found.';
  end if;

  select e.id, e.max_players
  into v_event_id, v_max_players
  from public.events e
  where e.club_id = v_club_id
    and e.title ilike '%night game%'
  order by e.date_time desc
  limit 1;

  if v_event_id is null then
    raise exception 'Event "Night Game" not found in Dav Sur Ballers. Create the event first, then re-run.';
  end if;

  select count(*) into v_member_count
  from public.club_members
  where club_id = v_club_id;

  if v_max_players < v_member_count then
    update public.events
    set max_players = least(greatest(v_member_count, 10), 40)
    where id = v_event_id
    returning max_players into v_max_players;
  end if;

  insert into public.event_participants (event_id, user_id)
  select v_event_id, cm.user_id
  from public.club_members cm
  where cm.club_id = v_club_id
    and not exists (
      select 1
      from public.event_participants ep
      where ep.event_id = v_event_id
        and ep.user_id = cm.user_id
    );

  get diagnostics v_joined = row_count;

  raise notice 'Joined % member(s) to Night Game (%). Event max players: %.', v_joined, v_event_id, v_max_players;
end $$;
