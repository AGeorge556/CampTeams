-- Team switching rules with clear reasons and stricter balance constraints

-- New optional settings on camp_settings
alter table if exists camp_settings
  add column if not exists max_gender_difference integer default 1,
  add column if not exists max_per_grade integer default 4,
  add column if not exists max_team_size integer default 25;

-- Drop existing function first
drop function if exists can_switch_team_with_reason(uuid, text);

-- Function that returns whether a switch is allowed and why/why not
create or replace function can_switch_team_with_reason(user_id uuid, new_team text)
returns table(allowed boolean, reason text, details jsonb)
language plpgsql
security definer
as $$
declare
  user_profile profiles%rowtype;
  settings_locked boolean;
  max_size integer;
  -- team size counts
  red_count integer := 0;
  blue_count integer := 0;
  green_count integer := 0;
  yellow_count integer := 0;
  target_team_size integer := 0;
  male_count integer := 0;
  female_count integer := 0;
  new_male integer := 0;
  new_female integer := 0;
  -- after-move sizes
  red_after integer := 0;
  blue_after integer := 0;
  green_after integer := 0;
  yellow_after integer := 0;
  max_after integer := 0;
  min_after integer := 0;
begin
  -- Get user profile
  select * into user_profile from profiles where id = user_id;
  if not found then
    return query select false, 'user_not_found', jsonb_build_object('message', 'User profile not found'); return;
  end if;

  -- Admins can always move
  if coalesce(user_profile.is_admin, false) then
    return query select true, 'ok', jsonb_build_object('admin_override', true); return;
  end if;

  -- Read settings
  select teams_locked, coalesce(max_team_size, 25)
    into settings_locked, max_size
  from camp_settings
  limit 1;

  if settings_locked then
    return query select false, 'teams_locked', jsonb_build_object('message', 'Team switching is not allowed at this time.'); return;
  end if;

  -- Switch limit
  if coalesce(user_profile.switches_remaining, 0) <= 0 then
    return query select false, 'switch_limit', jsonb_build_object('message', 'You have no switches remaining.'); return;
  end if;

  -- Same team
  if user_profile.current_team = new_team then
    return query select false, 'same_team', jsonb_build_object('current_team', user_profile.current_team); return;
  end if;

  -- Current team sizes
  select
    count(*) filter (where current_team = 'red' and participate_in_teams = true),
    count(*) filter (where current_team = 'blue' and participate_in_teams = true),
    count(*) filter (where current_team = 'green' and participate_in_teams = true),
    count(*) filter (where current_team = 'yellow' and participate_in_teams = true)
  into red_count, blue_count, green_count, yellow_count
  from profiles;

  -- Target size
  if new_team = 'red' then target_team_size := red_count;
  elsif new_team = 'blue' then target_team_size := blue_count;
  elsif new_team = 'green' then target_team_size := green_count;
  else target_team_size := yellow_count; end if;

  -- Capacity
  if target_team_size >= max_size then
    return query select false, 'team_full', jsonb_build_object('message', 'This team is already full.'); return;
  end if;

  -- Gender balance in target team: |M - F| <= 1 after move
  select
    count(*) filter (where gender = 'male' and participate_in_teams = true),
    count(*) filter (where gender = 'female' and participate_in_teams = true)
  into male_count, female_count
  from profiles
  where current_team = new_team;

  new_male := male_count + case when user_profile.gender = 'male' then 1 else 0 end;
  new_female := female_count + case when user_profile.gender = 'female' then 1 else 0 end;
  if abs(new_male - new_female) > 1 then
    return query select false, 'gender_imbalance', jsonb_build_object('message', 'Switch not allowed: Teams must stay gender balanced.'); return;
  end if;

  -- Fair team distribution across all teams after the move: max - min <= 1
  red_after := red_count + case when new_team = 'red' then 1 else 0 end - case when user_profile.current_team = 'red' then 1 else 0 end;
  blue_after := blue_count + case when new_team = 'blue' then 1 else 0 end - case when user_profile.current_team = 'blue' then 1 else 0 end;
  green_after := green_count + case when new_team = 'green' then 1 else 0 end - case when user_profile.current_team = 'green' then 1 else 0 end;
  yellow_after := yellow_count + case when new_team = 'yellow' then 1 else 0 end - case when user_profile.current_team = 'yellow' then 1 else 0 end;

  max_after := greatest(red_after, blue_after, green_after, yellow_after);
  min_after := least(red_after, blue_after, green_after, yellow_after);
  if max_after - min_after > 1 then
    return query select false, 'size_imbalance', jsonb_build_object('message', 'Switch not allowed: Teams must stay balanced in size.'); return;
  end if;

  -- Allowed
  return query select true, 'ok', jsonb_build_object('switches_remaining', coalesce(user_profile.switches_remaining, 0) - 1);
end;
$$;


