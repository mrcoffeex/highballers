-- Configurable players per court when shuffling (default 10 = 5v5)
alter table public.events
  add column if not exists players_per_game int check (
    players_per_game is null or (players_per_game >= 4 and players_per_game <= 20 and mod(players_per_game, 2) = 0)
  );

update public.events
set players_per_game = 10
where players_per_game is null;
