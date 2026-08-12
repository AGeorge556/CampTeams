import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { CampSettings } from '../lib/types';
import { TeamColor } from '../lib/supabase';
import { TEAM_KEYS, DEFAULT_TEAM_RULES } from '../lib/teamRules';

export interface UseCampSettingsResult {
  settings: CampSettings | null;
  lockedTeams: TeamColor[];
  teamsLocked: boolean;
  maxTeamSize: number;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

function isTeamColor(value: unknown): value is TeamColor {
  return (
    typeof value === 'string' &&
    (TEAM_KEYS as readonly string[]).includes(value)
  );
}

// NOTE: camp_settings is a single global row, NOT scoped per camp_id — a known
// limitation of the current schema. All camps share one lock state. Treat this
// as a stopgap; a future migration should add camp_id here.
export function useCampSettings(): UseCampSettingsResult {
  const [settings, setSettings] = useState<CampSettings | null>(null);
  const [lockedTeams, setLockedTeams] = useState<TeamColor[]>([]);
  const [teamsLocked, setTeamsLocked] = useState<boolean>(false);
  const [maxTeamSize, setMaxTeamSize] = useState<number>(
    DEFAULT_TEAM_RULES.maxTeamSize
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('camp_settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (!data) {
        // No settings row yet — fall back to safe defaults. A missing row must
        // never strand campers with an empty/locked-out team list.
        setSettings(null);
        setLockedTeams([]);
        setTeamsLocked(false);
        setMaxTeamSize(DEFAULT_TEAM_RULES.maxTeamSize);
        return;
      }

      const rawLocked = (data as any).locked_teams;
      const coercedLocked: TeamColor[] = Array.isArray(rawLocked)
        ? rawLocked.filter(isTeamColor)
        : [];

      const settingsData: CampSettings = {
        id: data.id,
        teams_locked: data.teams_locked ?? false,
        lock_date: data.lock_date,
        max_team_size: data.max_team_size ?? DEFAULT_TEAM_RULES.maxTeamSize,
        locked_teams: coercedLocked,
        gallery_visible: data.gallery_visible ?? false,
        oil_extraction_visible: data.oil_extraction_visible ?? false,
        camp_start_date: data.camp_start_date,
        created_at: data.created_at,
        updated_at: data.updated_at,
      };

      setSettings(settingsData);
      setLockedTeams(coercedLocked);
      setTeamsLocked(settingsData.teams_locked);
      setMaxTeamSize(
        settingsData.max_team_size || DEFAULT_TEAM_RULES.maxTeamSize
      );
    } catch (err: any) {
      // A settings fetch failure must never strand campers — degrade to the
      // same safe defaults as "no row found".
      console.error('Error fetching camp settings:', err);
      setError(err?.message || 'Failed to load camp settings');
      setSettings(null);
      setLockedTeams([]);
      setTeamsLocked(false);
      setMaxTeamSize(DEFAULT_TEAM_RULES.maxTeamSize);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();

    // Subscribe to camp_settings changes so admin lock toggles / max_team_size
    // edits propagate live instead of requiring a page reload. camp_settings
    // is a single global row with no camp_id, so there's no filter here
    // (unlike usePlayers's per-camp subscription) — we listen to the whole
    // table.
    // NOTE: this requires realtime to be enabled for the camp_settings table
    // in the Supabase project. If it isn't, .subscribe() simply never fires
    // and this degrades to the original fetch-once-on-mount behavior — it
    // does not throw or block rendering.
    const channel = supabase
      .channel('camp_settings_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'camp_settings',
        },
        () => {
          fetchSettings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchSettings]);

  return {
    settings,
    lockedTeams,
    teamsLocked,
    maxTeamSize,
    loading,
    error,
    refresh: fetchSettings,
  };
}
