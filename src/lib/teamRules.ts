// Pure, dependency-free rules engine for team assignment.
//
// The core problem this file solves: team balance targets (equal gender split,
// spread-out grades) were previously enforced as HARD caps identical in kind to
// team capacity. That's wrong — capacity is a real physical constraint (you can't
// seat a 25th camper), balance is a preference. When every team happened to be
// full on a camper's gender or grade at once, the old logic left them with zero
// joinable teams. See the escape valve in `evaluateTeamEligibility` (step 5) for
// the fix: soft rules never get to be the last thing standing between a camper
// and every team.
import { TeamColor } from './supabase';
import { MAX_TEAM_SIZE, MAX_PLAYERS_PER_GRADE } from './constants';

export const TEAM_KEYS: readonly TeamColor[] = [
  'red',
  'blue',
  'green',
  'yellow',
];

export interface TeamCounts {
  team: TeamColor;
  total: number;
  male: number;
  female: number;
  byGrade: Record<number, number>;
}

export interface TeamRulesConfig {
  maxTeamSize: number; // HARD
  maxPerGender: number; // SOFT
  maxPerGrade: number; // SOFT
  lockedTeams: TeamColor[]; // HARD (per-team admin lock)
  teamsLocked: boolean; // HARD (global lock)
}

export const DEFAULT_TEAM_RULES: TeamRulesConfig = {
  maxTeamSize: MAX_TEAM_SIZE,
  maxPerGender: 12,
  maxPerGrade: MAX_PLAYERS_PER_GRADE,
  lockedTeams: [],
  teamsLocked: false,
};

export type BlockReason =
  | 'already_on_team'
  | 'teams_locked'
  | 'team_locked'
  | 'at_capacity'
  | 'gender_cap'
  | 'grade_cap'
  | 'no_switches_remaining';

export interface TeamEligibility {
  team: TeamColor;
  canJoin: boolean;
  blockedBy: BlockReason | null;
  reason: string; // short human-readable sentence
  relaxed: boolean; // true = only joinable because soft rules were dropped
  isFull: boolean; // total >= maxTeamSize
}

export interface CamperContext {
  gender: 'male' | 'female';
  grade: number;
  currentTeam: TeamColor | null;
  switchesRemaining: number;
}

export interface TeamEligibilityResult {
  teams: Record<TeamColor, TeamEligibility>;
  anyAvailable: boolean;
  relaxedApplied: boolean;
  blockingReason: BlockReason | null; // set only when !anyAvailable
}

// Precedence used both for step-3 blocking and for the step-6 "most frequent
// hard reason" tie-break.
const HARD_REASON_PRECEDENCE: BlockReason[] = [
  'teams_locked',
  'team_locked',
  'at_capacity',
];

function emptyCounts(team: TeamColor): TeamCounts {
  return { team, total: 0, male: 0, female: 0, byGrade: {} };
}

function countsFor(counts: TeamCounts[], team: TeamColor): TeamCounts {
  const found = counts.find(c => c && c.team === team);
  if (!found) return emptyCounts(team);
  // Defensive: coerce missing/malformed fields rather than throwing.
  return {
    team,
    total: typeof found.total === 'number' ? found.total : 0,
    male: typeof found.male === 'number' ? found.male : 0,
    female: typeof found.female === 'number' ? found.female : 0,
    byGrade:
      found.byGrade && typeof found.byGrade === 'object' ? found.byGrade : {},
  };
}

function makeEligibility(team: TeamColor, isFull: boolean): TeamEligibility {
  return {
    team,
    canJoin: false,
    blockedBy: null,
    reason: '',
    relaxed: false,
    isFull,
  };
}

export function evaluateTeamEligibility(
  counts: TeamCounts[],
  camper: CamperContext,
  config?: Partial<TeamRulesConfig>
): TeamEligibilityResult {
  const cfg: TeamRulesConfig = { ...DEFAULT_TEAM_RULES, ...(config ?? {}) };
  const safeCounts = Array.isArray(counts) ? counts : [];

  const teams = {} as Record<TeamColor, TeamEligibility>;
  for (const key of TEAM_KEYS) {
    const c = countsFor(safeCounts, key);
    teams[key] = makeEligibility(key, c.total >= cfg.maxTeamSize);
  }

  // Step 1: the camper's current team is never a valid destination, and must
  // never contribute to availability math (it's not a "join" option at all).
  if (camper.currentTeam && teams[camper.currentTeam]) {
    teams[camper.currentTeam].blockedBy = 'already_on_team';
    teams[camper.currentTeam].reason = 'You are already on this team';
  }

  const remaining = TEAM_KEYS.filter(k => k !== camper.currentTeam);

  // Step 2: switches exhausted blocks every other team outright. A camper with
  // no current team is making a free first pick and is never blocked here.
  if (camper.currentTeam !== null && camper.switchesRemaining <= 0) {
    for (const key of remaining) {
      teams[key].blockedBy = 'no_switches_remaining';
      teams[key].reason = 'No team switches remaining';
    }
    return {
      teams,
      anyAvailable: false,
      relaxedApplied: false,
      blockingReason: 'no_switches_remaining',
    };
  }

  // Step 3: HARD pass — capacity and admin locks. Order of precedence matters
  // when multiple hard conditions apply to the same team.
  const hardSurvivors: TeamColor[] = [];
  for (const key of remaining) {
    const c = countsFor(safeCounts, key);
    if (cfg.teamsLocked) {
      teams[key].blockedBy = 'teams_locked';
      teams[key].reason = 'Team switching is currently locked';
      continue;
    }
    if (Array.isArray(cfg.lockedTeams) && cfg.lockedTeams.includes(key)) {
      teams[key].blockedBy = 'team_locked';
      teams[key].reason = 'This team has been locked by an admin';
      continue;
    }
    if (c.total >= cfg.maxTeamSize) {
      teams[key].blockedBy = 'at_capacity';
      teams[key].reason = 'Team is at maximum capacity';
      continue;
    }
    hardSurvivors.push(key);
  }

  if (hardSurvivors.length === 0) {
    // Step 6: nothing survived the hard pass — pick the most frequent hard
    // reason across teams (tie-break by precedence) to report to the caller.
    const counts_by_reason = new Map<BlockReason, number>();
    for (const key of remaining) {
      const reason = teams[key].blockedBy;
      if (reason)
        counts_by_reason.set(reason, (counts_by_reason.get(reason) ?? 0) + 1);
    }
    let blockingReason: BlockReason | null = null;
    let bestCount = -1;
    for (const reason of HARD_REASON_PRECEDENCE) {
      const n = counts_by_reason.get(reason) ?? 0;
      if (n > bestCount) {
        bestCount = n;
        blockingReason = n > 0 ? reason : blockingReason;
      }
    }
    // Fall back to whatever's present if none of the precedence reasons matched
    // (shouldn't normally happen, but stay defensive).
    if (!blockingReason && counts_by_reason.size > 0) {
      blockingReason = [...counts_by_reason.keys()][0];
    }
    return {
      teams,
      anyAvailable: false,
      relaxedApplied: false,
      blockingReason,
    };
  }

  // Step 4: SOFT pass — gender and grade balance, evaluated only over teams
  // that survived the hard pass.
  const softSurvivors: TeamColor[] = [];
  for (const key of hardSurvivors) {
    const c = countsFor(safeCounts, key);
    const genderCount = camper.gender === 'male' ? c.male : c.female;
    if (genderCount >= cfg.maxPerGender) {
      teams[key].blockedBy = 'gender_cap';
      teams[key].reason = 'Team already has enough campers of your gender';
      continue;
    }
    const gradeCount = c.byGrade?.[camper.grade] ?? 0;
    if (gradeCount >= cfg.maxPerGrade) {
      teams[key].blockedBy = 'grade_cap';
      teams[key].reason = 'Team already has enough campers in your grade';
      continue;
    }
    softSurvivors.push(key);
  }

  if (softSurvivors.length > 0) {
    for (const key of softSurvivors) {
      teams[key].canJoin = true;
      teams[key].blockedBy = null;
      teams[key].reason = 'Available';
      teams[key].relaxed = false;
    }
    return {
      teams,
      anyAvailable: true,
      relaxedApplied: false,
      blockingReason: null,
    };
  }

  // Step 5 — THE ESCAPE VALVE. Every team that's physically capable of taking
  // this camper was rejected only by balance preferences. Rather than strand
  // the camper, drop the soft rules entirely for the teams that survived the
  // hard pass. This is the core fix for the bug this file exists to close.
  for (const key of hardSurvivors) {
    teams[key].canJoin = true;
    teams[key].blockedBy = null;
    teams[key].reason =
      'Balance rules relaxed — this is the only team with space left';
    teams[key].relaxed = true;
  }
  return {
    teams,
    anyAvailable: true,
    relaxedApplied: true,
    blockingReason: null,
  };
}

export function pickBestTeam(
  result: TeamEligibilityResult,
  counts: TeamCounts[],
  camper: CamperContext
): TeamColor | null {
  if (!result || !result.anyAvailable) return null;
  const safeCounts = Array.isArray(counts) ? counts : [];

  const candidates = TEAM_KEYS.filter(key => result.teams[key]?.canJoin);
  if (candidates.length === 0) return null;

  let best: TeamColor | null = null;
  let bestTotal = Infinity;
  let bestGenderCount = Infinity;

  for (const key of candidates) {
    const c = countsFor(safeCounts, key);
    const genderCount = camper.gender === 'male' ? c.male : c.female;
    if (
      c.total < bestTotal ||
      (c.total === bestTotal && genderCount < bestGenderCount)
    ) {
      best = key;
      bestTotal = c.total;
      bestGenderCount = genderCount;
    }
  }

  return best;
}

export function describeBlockReason(
  reason: BlockReason,
  config: TeamRulesConfig
): string {
  const cfg = config ?? DEFAULT_TEAM_RULES;
  switch (reason) {
    case 'already_on_team':
      return 'You are already on this team';
    case 'teams_locked':
      return 'Team switching is currently locked for all teams';
    case 'team_locked':
      return 'This team has been locked by an admin';
    case 'at_capacity':
      return `Team is at maximum capacity (${cfg.maxTeamSize} players)`;
    case 'gender_cap':
      return `Team already has the maximum number of your gender (${cfg.maxPerGender})`;
    case 'grade_cap':
      return `Team already has the maximum number of your grade (${cfg.maxPerGrade})`;
    case 'no_switches_remaining':
      return 'No team switches remaining';
    default:
      return 'Not available';
  }
}

// Short copy for tight UI chips/badges — the full explanation is
// describeBlockReason's long form, typically shown via a `title` tooltip.
export function shortReasonLabel(reason: BlockReason | null): string {
  switch (reason) {
    case 'teams_locked':
    case 'team_locked':
      return 'Locked';
    case 'at_capacity':
      return 'Full';
    case 'gender_cap':
    case 'grade_cap':
      return 'Balance';
    case 'no_switches_remaining':
      return 'No switches';
    default:
      return 'Unavailable';
  }
}

export function countsFromPlayers(
  players: Record<
    string,
    Array<{ gender: string; grade: number; is_admin?: boolean }>
  >
): TeamCounts[] {
  const safePlayers = players && typeof players === 'object' ? players : {};

  return TEAM_KEYS.map(team => {
    const rawList = (safePlayers as Record<string, unknown>)[team];
    const list = Array.isArray(rawList) ? rawList : [];
    // Admins do not consume team capacity — matches current app behavior.
    const campers = list.filter(p => p && typeof p === 'object' && !p.is_admin);

    const byGrade: Record<number, number> = {};
    let male = 0;
    let female = 0;
    for (const p of campers) {
      if (p.gender === 'male') male++;
      else if (p.gender === 'female') female++;
      if (typeof p.grade === 'number') {
        byGrade[p.grade] = (byGrade[p.grade] ?? 0) + 1;
      }
    }

    return { team, total: campers.length, male, female, byGrade };
  });
}
