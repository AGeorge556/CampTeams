import { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useCamp } from '../contexts/CampContext';
import { TEAM_KEYS } from '../lib/teamRules';

export interface CampPlayer {
  id: string;
  user_id: string;
  full_name: string;
  grade: number;
  gender: 'male' | 'female';
  current_team: string | null;
  preferred_team: string | null;
  switches_remaining: number;
  participate_in_teams: boolean;
  role: string;
  is_admin: boolean;
}

export interface TeamPlayers {
  [key: string]: CampPlayer[];
}

export function usePlayers() {
  const { currentCamp } = useCamp();
  const [players, setPlayers] = useState<TeamPlayers>({
    red: [],
    blue: [],
    green: [],
    yellow: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlayers = useCallback(async () => {
    if (!currentCamp) {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      setLoading(true);

      // Fetch only the columns needed for team rosters — no PII (contact info lives in AdminPanel only)
      const { data, error: fetchError } = await supabase
        .from('camp_registrations')
        .select(
          'id, user_id, full_name, grade, gender, current_team, preferred_team, switches_remaining, participate_in_teams, role'
        )
        .eq('camp_id', currentCamp.id)
        .not('current_team', 'is', null)
        .eq('participate_in_teams', true)
        .order('full_name');

      if (fetchError) {
        throw fetchError;
      }

      // Fetch profiles to get the authoritative is_admin flag.
      // camp_registrations.role is per-camp and only marks staff roles within a
      // camp; global admin rights live on profiles.is_admin, which is the
      // source of truth here.
      const userIds = data?.map(r => r.user_id).filter(Boolean) ?? [];
      const adminUserIds = new Set<string>();
      if (userIds.length > 0) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('id, is_admin')
          .in('id', userIds);
        profileData?.forEach(p => {
          if (p.is_admin) adminUserIds.add(p.id);
        });
      }

      // Group players by team
      const teamPlayers: TeamPlayers = {
        red: [],
        blue: [],
        green: [],
        yellow: [],
      };

      data?.forEach(registration => {
        if (registration.current_team) {
          // Map camp_registration to CampPlayer format
          const player: CampPlayer = {
            id: registration.id,
            user_id: registration.user_id,
            full_name: registration.full_name,
            grade: registration.grade,
            // gender is a plain `string` in the DB schema but the app models it
            // as a union. Anything unexpected falls back to 'male' rather than
            // throwing — a bad value must not blank an entire team roster.
            gender: registration.gender === 'female' ? 'female' : 'male',
            current_team: registration.current_team,
            preferred_team: registration.preferred_team,
            switches_remaining: registration.switches_remaining ?? 0,
            participate_in_teams: registration.participate_in_teams ?? true,
            role: registration.role || 'camper',
            is_admin:
              adminUserIds.has(registration.user_id) ||
              registration.role === 'admin',
          };
          // Guard against a current_team value outside red|blue|green|yellow (bad seed
          // data, a renamed team, a stale row) — indexing teamPlayers with it would throw
          // and abort the whole fetch, blanking every team roster for every user.
          if (
            !TEAM_KEYS.includes(
              registration.current_team as (typeof TEAM_KEYS)[number]
            )
          ) {
            console.warn(
              `Skipping player with unrecognized current_team: ${registration.current_team}`
            );
            return;
          }
          teamPlayers[registration.current_team].push(player);
        }
      });

      // Only update state if data actually changed (deep comparison by JSON)
      setPlayers(prev => {
        const prevJSON = JSON.stringify(prev);
        const newJSON = JSON.stringify(teamPlayers);
        return prevJSON === newJSON ? prev : teamPlayers;
      });
    } catch (err: any) {
      console.error('Error fetching players:', err);
      setError(err.message || 'Failed to load players');
    } finally {
      setLoading(false);
    }
  }, [currentCamp]);

  useEffect(() => {
    if (!currentCamp) return;

    fetchPlayers();

    // Subscribe to camp_registrations changes for this camp
    const channel = supabase
      .channel(`camp_players_${currentCamp.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'camp_registrations',
          filter: `camp_id=eq.${currentCamp.id}`,
        },
        () => {
          fetchPlayers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchPlayers, currentCamp]);

  // Memoize team statistics for performance (admins excluded from all counts)
  const teamStats = useMemo(() => {
    const stats: Record<string, any> = {};

    Object.entries(players).forEach(([teamKey, teamPlayers]) => {
      const campers = teamPlayers.filter(p => !p.is_admin);
      const maleCount = campers.filter(p => p.gender === 'male').length;
      const femaleCount = campers.filter(p => p.gender === 'female').length;
      const grades = campers.map(p => p.grade);

      stats[teamKey] = {
        total: campers.length,
        male: maleCount,
        female: femaleCount,
        gradeRange:
          grades.length > 0
            ? `${Math.min(...grades)} - ${Math.max(...grades)}`
            : 'N/A',
        avgGrade:
          grades.length > 0
            ? (
                grades.reduce((sum, grade) => sum + grade, 0) / grades.length
              ).toFixed(1)
            : 'N/A',
      };
    });

    return stats;
  }, [players]);

  return {
    players,
    loading,
    error,
    teamStats,
    refetch: fetchPlayers,
  };
}
