-- Add configurable limits and a reasoned RPC for team switching

-- New optional settings on camp_settings
alter table if exists camp_settings
  add column if not exists max_gender_difference integer default 2,
  add column if not exists max_per_grade integer default 4;

-- Function that returns whether a switch is allowed and why/why not
create or replace function can_switch_team_with_reason(user_id uuid, new_team text)
returns table(allowed boolean, reason text)
language plpgsql
security definer
as $$
declare
  user_profile profiles%rowtype;
  current_team_size integer;
  max_size integer;
  settings_locked boolean;
  players_in_same_grade integer;
  max_players_per_grade integer;
  current_male_count integer;
  current_female_count integer;
  new_male_count integer;
  new_female_count integer;
  max_gender_diff integer;
begin
  -- Get user profile
  select * into user_profile from profiles where id = user_id;
  if not found then
    return query select false as allowed, 'user_not_found'::text as reason; return;
  end if;

  -- Read settings (with sensible defaults)
  select teams_locked, max_team_size,
         coalesce(max_per_grade, 4),
         coalesce(max_gender_difference, 2)
    into settings_locked, max_size, max_players_per_grade, max_gender_diff
  from camp_settings
  limit 1;

  -- Switches remaining
  if coalesce(user_profile.switches_remaining, 0) <= 0 then
    return query select false, 'no_switches_left'; return;
  end if;

  -- Teams locked
  if settings_locked then
    return query select false, 'teams_locked'; return;
  end if;

  -- Same team
  if user_profile.current_team = new_team then
    return query select false, 'same_team'; return;
  end if;

  -- Team full (count only participating campers)
  select count(*) into current_team_size
  from profiles
  where current_team = new_team and participate_in_teams = true;
  if current_team_size >= max_size then
    return query select false, 'team_full'; return;
  end if;

  -- Grade cap per team
  select count(*) into players_in_same_grade
  from profiles
  where current_team = new_team
    and grade = user_profile.grade
    and participate_in_teams = true;
  if players_in_same_grade >= max_players_per_grade then
    return query select false, 'grade_cap'; return;
  end if;

  -- Per-team gender balance
  select count(*) filter (where gender = 'male' and participate_in_teams = true),
         count(*) filter (where gender = 'female' and participate_in_teams = true)
    into current_male_count, current_female_count
  from profiles where current_team = new_team;

  new_male_count := current_male_count + case when user_profile.gender = 'male' then 1 else 0 end;
  new_female_count := current_female_count + case when user_profile.gender = 'female' then 1 else 0 end;
  if abs(new_male_count - new_female_count) > max_gender_diff then
    return query select false, 'gender_team_imbalance'; return;
  end if;

  -- Allowed
  return query select true, 'ok';
end;
$$;


