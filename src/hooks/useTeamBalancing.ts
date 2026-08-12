import { useCallback, useMemo } from 'react';
import { TeamColor } from '../lib/supabase';
import { usePlayers } from './usePlayers';
import { useCamp } from '../contexts/CampContext';
import { useCampSettings } from './useCampSettings';
import {
  TeamCounts,
  TeamRulesConfig,
  TeamEligibilityResult,
  CamperContext,
  DEFAULT_TEAM_RULES,
  TEAM_KEYS,
  countsFromPlayers,
  evaluateTeamEligibility,
  pickBestTeam,
} from '../lib/teamRules';

export interface UseTeamBalancingResult {
  teamBalances: TeamCounts[];
  loading: boolean;
  eligibility: TeamEligibilityResult | null;
  config: TeamRulesConfig;
  bestAvailableTeam: TeamColor | null;
  isTeamAtCapacity: (t: TeamColor) => boolean;
  getTeamSize: (t: TeamColor) => number;
  getMaxTeamSize: () => number;
  refresh: () => void;
}

export function useTeamBalancing(): UseTeamBalancingResult {
  const { players, loading: playersLoading, refetch } = usePlayers();
  const { currentRegistration } = useCamp();
  const {
    lockedTeams,
    teamsLocked,
    maxTeamSize,
    loading: settingsLoading,
    refresh: refreshSettings,
  } = useCampSettings();

  const loading = playersLoading || settingsLoading;

  // Derived from live player rosters (already camp-scoped via usePlayers).
  // countsFromPlayers is defensive on its own — malformed/missing team keys
  // never throw, they just count as zero.
  const teamBalances = useMemo(() => countsFromPlayers(players), [players]);

  // HARD rules (capacity, admin locks) come from camp_settings; SOFT rules
  // (gender/grade balance) keep the historical defaults. Merging over
  // DEFAULT_TEAM_RULES means a settings fetch failure degrades to "no locks,
  // default capacity" rather than stranding anyone.
  const config: TeamRulesConfig = useMemo(
    () => ({
      ...DEFAULT_TEAM_RULES,
      maxTeamSize: maxTeamSize || DEFAULT_TEAM_RULES.maxTeamSize,
      lockedTeams,
      teamsLocked,
    }),
    [maxTeamSize, lockedTeams, teamsLocked]
  );

  const camper: CamperContext | null = useMemo(() => {
    if (!currentRegistration) return null;
    return {
      gender: currentRegistration.gender,
      grade: currentRegistration.grade,
      currentTeam: (currentRegistration.current_team as TeamColor) ?? null,
      switchesRemaining: currentRegistration.switches_remaining ?? 0,
    };
  }, [currentRegistration]);

  // Eligibility is null while loading or when there's no registration to
  // evaluate against — consumers should treat null as "don't know yet", not
  // "nothing is available".
  const eligibility: TeamEligibilityResult | null = useMemo(() => {
    if (loading || !camper) return null;
    return evaluateTeamEligibility(teamBalances, camper, config);
  }, [loading, camper, teamBalances, config]);

  const bestAvailableTeam: TeamColor | null = useMemo(() => {
    if (!eligibility || !camper) return null;
    return pickBestTeam(eligibility, teamBalances, camper);
  }, [eligibility, camper, teamBalances]);

  const isTeamAtCapacity = useCallback(
    (teamKey: TeamColor): boolean => {
      const team = teamBalances.find(b => b.team === teamKey);
      return team ? team.total >= config.maxTeamSize : false;
    },
    [teamBalances, config.maxTeamSize]
  );

  const getTeamSize = useCallback(
    (teamKey: TeamColor): number => {
      const team = teamBalances.find(b => b.team === teamKey);
      return team ? team.total : 0;
    },
    [teamBalances]
  );

  const getMaxTeamSize = useCallback(
    (): number => config.maxTeamSize,
    [config.maxTeamSize]
  );

  const refresh = useCallback(() => {
    refetch();
    refreshSettings();
  }, [refetch, refreshSettings]);

  return {
    teamBalances,
    loading,
    eligibility,
    config,
    bestAvailableTeam,
    isTeamAtCapacity,
    getTeamSize,
    getMaxTeamSize,
    refresh,
  };
}

// Re-exported so consumers of the old hook's team-key list have a single
// source of truth without importing lib/teamRules directly.
export { TEAM_KEYS };
