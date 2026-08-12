import { useState, useEffect } from 'react';
import { Users, Save, AlertCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { useCamp } from '../contexts/CampContext';
import { useToast } from './Toast';
import { TEAMS, TeamColor } from '../lib/supabase';
import Button from './ui/Button';
import { supabase } from '../lib/supabase';
import { useTeamBalancing } from '../hooks/useTeamBalancing';
import { describeBlockReason, shortReasonLabel } from '../lib/teamRules';
import { MAX_SWITCHES_PER_USER } from '../lib/constants';

export default function TeamSelection() {
  const { currentCamp, currentRegistration, refreshRegistration } = useCamp();
  const { addToast } = useToast();
  const {
    eligibility,
    config,
    bestAvailableTeam,
    loading: balancesLoading,
  } = useTeamBalancing();
  const [selectedTeam, setSelectedTeam] = useState<TeamColor | null>(null);
  const [loading, setLoading] = useState(false);

  // Preselect the best available team once eligibility resolves, instead of
  // defaulting to 'red' regardless of whether it's actually joinable.
  useEffect(() => {
    if (selectedTeam === null && bestAvailableTeam) {
      setSelectedTeam(bestAvailableTeam);
    }
  }, [bestAvailableTeam, selectedTeam]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentRegistration || !selectedTeam) return;

    const teamElig = eligibility?.teams[selectedTeam];
    if (!teamElig?.canJoin) {
      addToast({
        type: 'error',
        title: 'Cannot Join Team',
        message: teamElig?.blockedBy
          ? describeBlockReason(teamElig.blockedBy, config)
          : 'This team cannot accept more players',
      });
      return;
    }

    setLoading(true);

    try {
      // First pick is not a switch: preserve any existing switches_remaining
      // value (rather than resetting it) and don't log to team_switches —
      // mirrors PlayerLists' initial-join branch in handleSwitchTeam.
      const { error } = await supabase
        .from('camp_registrations')
        .update({
          current_team: selectedTeam,
          participate_in_teams: true,
          switches_remaining: currentRegistration.switches_remaining ?? 3,
        })
        .eq('id', currentRegistration.id)
        .eq('user_id', currentRegistration.user_id);

      if (error) throw error;

      addToast({
        type: 'success',
        title: 'Team Selected!',
        message: `You've joined the ${TEAMS[selectedTeam].name} team!`,
      });

      // Refresh the registration data
      await refreshRegistration();
    } catch (error: any) {
      console.error('Error selecting team:', error);
      addToast({
        type: 'error',
        title: 'Error',
        message: error.message || 'Failed to select team. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  if (balancesLoading || !eligibility) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--gradient-app-bg)]">
        <Loader2 className="w-8 h-8 text-[var(--color-primary)] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--gradient-app-bg)] px-4">
      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center">
            <Users className="h-16 w-16 text-[var(--color-primary)]" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-[var(--color-text)]">
            Welcome, {currentRegistration?.full_name}!
          </h2>
          <p className="mt-2 text-lg text-[var(--color-text-muted)]">
            Select your team for {currentCamp?.name}
          </p>
        </div>

        <form
          className="mt-8 space-y-6 bg-[var(--color-card-bg)] p-8 rounded-lg border border-[var(--color-border)] shadow-lg"
          onSubmit={handleSubmit}
        >
          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-4">
              Choose Your Team
            </label>

            {eligibility.relaxedApplied && (
              <div className="mb-4 px-3.5 py-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 flex items-start gap-2.5">
                <AlertTriangle className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  Balance rules were relaxed because no team had room while
                  staying balanced — the open team(s) below are temporarily
                  available regardless of gender/grade balance.
                </p>
              </div>
            )}

            {!eligibility.anyAvailable ? (
              <div className="px-4 py-4 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-[var(--color-danger)] shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-[var(--color-danger)]">
                    No team can accept you right now
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)] mt-1">
                    {eligibility.blockingReason
                      ? describeBlockReason(eligibility.blockingReason, config)
                      : 'All teams are currently unavailable.'}{' '}
                    Please contact an admin for help joining a team.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(TEAMS).map(([teamKey, teamConfig]) => {
                  const key = teamKey as TeamColor;
                  const elig = eligibility.teams[key];
                  const isAvailable = elig?.canJoin ?? false;
                  return (
                    <button
                      key={teamKey}
                      type="button"
                      onClick={() => isAvailable && setSelectedTeam(key)}
                      disabled={!isAvailable}
                      title={
                        !isAvailable && elig?.blockedBy
                          ? describeBlockReason(elig.blockedBy, config)
                          : undefined
                      }
                      className={`relative p-6 rounded-lg border-2 transition-all ${
                        selectedTeam === teamKey
                          ? `border-${teamKey}-500 bg-${teamKey}-50 ring-2 ring-${teamKey}-500 ring-opacity-50`
                          : 'border-[var(--color-border)] bg-[var(--color-bg)] hover:border-[var(--color-border-hover)]'
                      } ${!isAvailable ? 'opacity-50 cursor-not-allowed' : ''}`}
                      style={{
                        borderColor:
                          selectedTeam === teamKey
                            ? teamConfig.colorValue
                            : undefined,
                        backgroundColor:
                          selectedTeam === teamKey
                            ? `${teamConfig.colorValue}20`
                            : undefined,
                      }}
                    >
                      {selectedTeam === teamKey && isAvailable && (
                        <div
                          className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-white text-sm"
                          style={{ backgroundColor: teamConfig.colorValue }}
                        >
                          ✓
                        </div>
                      )}
                      {!isAvailable && (
                        <div className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center bg-red-500 text-white text-sm">
                          <AlertCircle className="w-4 h-4" />
                        </div>
                      )}
                      <div className="flex flex-col items-center space-y-3">
                        <div
                          className="w-16 h-16 rounded-full flex items-center justify-center"
                          style={{
                            backgroundColor: `${teamConfig.colorValue}30`,
                          }}
                        >
                          <div
                            className="w-12 h-12 rounded-full"
                            style={{ backgroundColor: teamConfig.colorValue }}
                          />
                        </div>
                        <span
                          className="text-lg font-semibold"
                          style={{
                            color:
                              selectedTeam === teamKey
                                ? teamConfig.colorValue
                                : 'var(--color-text)',
                          }}
                        >
                          {teamConfig.name}
                        </span>
                        {!isAvailable && (
                          <span className="text-xs text-red-500 text-center">
                            {shortReasonLabel(elig?.blockedBy ?? null)}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="pt-4">
            <Button
              type="submit"
              loading={loading}
              disabled={!selectedTeam}
              icon={<Save />}
              className="w-full"
            >
              {loading ? 'Joining Team...' : 'Join Team'}
            </Button>
          </div>

          <div className="text-center text-sm text-[var(--color-text-muted)]">
            <p>
              You can switch teams up to {MAX_SWITCHES_PER_USER} times later
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
