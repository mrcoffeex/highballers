-- Seed 20 dummy players and add them to the Dav Sur Ballers club.
-- Run in Supabase SQL Editor (postgres role).
-- Requires: a club named exactly "Dav Sur Ballers" must already exist.

create extension if not exists pgcrypto;

do $$
declare
  v_club_id uuid;
  v_user_id uuid;
  v_player record;
  v_password text := 'DavSurDummy123!';
begin
  select id into v_club_id
  from public.clubs
  where name = 'Dav Sur Ballers'
  limit 1;

  if v_club_id is null then
    raise exception 'Club "Dav Sur Ballers" not found. Create the club in the app first, then re-run this script.';
  end if;

  for v_player in
    select *
    from (
      values
        ('Jomari Santos', 'Jom', 'PG', '#FF6B2C', 179, 70, 4, 4, 4, 4, 5),
        ('Kenji Reyes', 'Kenji', 'SG', '#3B82F6', 183, 73, 6, 7, 6, 11, 6),
        ('Paolo Mendoza', 'Paolo', 'SF', '#22C55E', 187, 76, 8, 10, 8, 18, 7),
        ('Rico Villanueva', 'Rico', 'PF', '#A855F7', 191, 87, 10, 13, 10, 25, 8),
        ('Dylan Fernandez', 'Dylan', 'C', '#FFD166', 205, 95, 12, 16, 12, 32, 9),
        ('Miguel Torre', 'Miguel', 'PG', '#EC4899', 179, 70, 4, 4, 4, 4, 5),
        ('Andrei Cruz', 'Andrei', 'SG', '#14B8A6', 183, 73, 6, 7, 6, 11, 6),
        ('Luis Aguilar', 'Luis', 'SF', '#F97316', 187, 76, 8, 10, 8, 18, 7),
        ('Nathan Ocampo', 'Nathan', 'PF', '#FF6B2C', 191, 87, 10, 13, 10, 25, 8),
        ('Ethan Bautista', 'Ethan', 'C', '#3B82F6', 205, 95, 12, 16, 12, 32, 9),
        ('Carlo Dimaculangan', 'Carlo', 'SG', '#22C55E', 183, 73, 6, 7, 6, 11, 6),
        ('Jerome Pacquiao', 'Jerome', 'PG', '#A855F7', 179, 70, 4, 4, 4, 4, 5),
        ('Ivan Sarmiento', 'Ivan', 'SF', '#FFD166', 187, 76, 8, 10, 8, 18, 7),
        ('Marco Del Rosario', 'Marco', 'PF', '#EC4899', 191, 87, 10, 13, 10, 25, 8),
        ('Tristan Go', 'Tristan', 'C', '#14B8A6', 205, 95, 12, 16, 12, 32, 9),
        ('Felix Ramirez', 'Felix', 'SG', '#F97316', 183, 73, 6, 7, 6, 11, 6),
        ('Owen Castillo', 'Owen', 'PG', '#FF6B2C', 179, 70, 4, 4, 4, 4, 5),
        ('Sean Villafuerte', 'Sean', 'SF', '#3B82F6', 187, 76, 8, 10, 8, 18, 7),
        ('Ryan Monteverde', 'Ryan', 'PF', '#22C55E', 191, 87, 10, 13, 10, 25, 8),
        ('Leo Manigos', 'Leo', 'C', '#A855F7', 205, 95, 12, 16, 12, 32, 9)
    ) as t(
      full_name,
      nickname,
      position,
      avatar_color,
      height,
      weight,
      speed,
      strength,
      shooting,
      defense,
      stamina
    )
  loop
    v_user_id := gen_random_uuid();

    insert into auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token
    ) values (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      lower(replace(v_player.full_name, ' ', '.')) || '.davsur@highballers.test',
      crypt(v_password, gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('name', v_player.full_name),
      now(),
      now(),
      ''
    );

    insert into public.profiles (
      id,
      name,
      nickname,
      position,
      avatar_color,
      bio,
      stats,
      joined_at
    ) values (
      v_user_id,
      v_player.full_name,
      v_player.nickname,
      v_player.position,
      v_player.avatar_color,
      'Dav Sur pickup regular · ' || v_player.position,
      jsonb_build_object(
        'height', v_player.height,
        'weight', v_player.weight,
        'speed', v_player.speed,
        'strength', v_player.strength,
        'shooting', v_player.shooting,
        'defense', v_player.defense,
        'stamina', v_player.stamina
      ),
      now()
    );

    insert into public.club_members (club_id, user_id)
    values (v_club_id, v_user_id)
    on conflict do nothing;
  end loop;
end $$;
