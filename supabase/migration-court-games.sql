-- Multi-court 5v5 shuffle storage (Game 1, Game 2, ...)

alter table public.events
  add column if not exists court_games jsonb;

update public.events
set court_games = jsonb_build_array(
  jsonb_build_object(
    'teamA', to_jsonb(team_a),
    'teamB', to_jsonb(team_b)
  )
)
where court_games is null
  and team_a is not null
  and team_b is not null
  and coalesce(jsonb_array_length(team_a), 0) > 0
  and coalesce(jsonb_array_length(team_b), 0) > 0;
