-- Allow event max_players up to 100 (Basic Baller create/join cap)

alter table public.events
  drop constraint if exists events_max_players_check;

alter table public.events
  add constraint events_max_players_check check (max_players between 10 and 100);
