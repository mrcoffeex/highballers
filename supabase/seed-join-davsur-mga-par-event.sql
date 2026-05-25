-- Join all 20 Dav Sur dummy players into the "G Mga Par" event.
-- Run in Supabase SQL Editor after seed-dav-sur-dummy-players.sql.
-- Matches event title case-insensitively (e.g. "G Mga Par", "g mga par").

do $$
declare
  v_club_id uuid;
  v_event_id uuid;
  v_max_players int;
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
    and e.title ilike '%mga par%'
  order by e.date_time desc
  limit 1;

  if v_event_id is null then
    raise exception 'Event "G Mga Par" not found in Dav Sur Ballers. Create the event first, then re-run.';
  end if;

  insert into public.event_participants (event_id, user_id)
  select v_event_id, cm.user_id
  from public.club_members cm
  join auth.users u on u.id = cm.user_id
  where cm.club_id = v_club_id
    and u.email like '%.davsur@highballers.test'
    and not exists (
      select 1
      from public.event_participants ep
      where ep.event_id = v_event_id
        and ep.user_id = cm.user_id
    )
  limit v_max_players;

  get diagnostics v_joined = row_count;

  raise notice 'Joined % dummy player(s) to event % (max %).', v_joined, v_event_id, v_max_players;
end $$;
