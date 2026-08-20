// The Wilderness: Big Game — team setup, coverage validation and the vault key.
//
// Two things here are load-bearing.
//
// Coverage: a team's three tribes must cover all twelve stations exactly once
// across the four rounds. The default grouping is four apart (T1,T5,T9) for
// exactly that reason — group consecutively and a team walks six stations,
// three of them twice, and can never spell its phrase. Regrouping by hand is
// the easiest way to break the event, so the server validates it and the
// readiness checklist refuses to start until every team passes.
//
// The vault key: the phrases and padlock codes are NOT in this repository. The
// director types them here, they live server-side behind an admin-only RPC,
// and the audit log records only that a phrase was set, never its value.

import { useCallback, useEffect, useState } from 'react';
import {
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Save,
  XCircle,
} from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { useToast } from '../Toast';
import {
  BigGameError,
  teams as fetchTeams,
  updateTeam,
  validateTeams,
} from '../../lib/bigGame/api';
import type { TeamSummary, TeamValidation } from '../../lib/bigGame/types';

function errorMessage(err: unknown): string {
  if (err instanceof BigGameError || err instanceof Error) return err.message;
  return 'Something went wrong. Please try again.';
}

interface Draft {
  displayName: string;
  phrase: string;
  padlockCode: string;
}

export default function TeamSetup() {
  const [teams, setTeams] = useState<TeamSummary[]>([]);
  const [checks, setChecks] = useState<TeamValidation[]>([]);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [revealKey, setRevealKey] = useState(false);
  const { addToast } = useToast();

  const load = useCallback(async () => {
    try {
      const [rows, validation] = await Promise.all([
        fetchTeams(),
        validateTeams(),
      ]);
      setTeams(rows);
      setChecks(validation);
      setDrafts(prev => {
        const next = { ...prev };
        for (const t of rows) {
          if (!next[t.id]) {
            next[t.id] = {
              displayName: t.displayName,
              phrase: '',
              padlockCode: '',
            };
          }
        }
        return next;
      });
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Could not load teams',
        message: errorMessage(err),
      });
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async (teamId: string) => {
    const draft = drafts[teamId];
    if (!draft) return;
    setBusy(teamId);
    try {
      // Empty means "leave unchanged", so a director who only renames a team
      // does not blank its vault key by omission.
      await updateTeam({
        teamId,
        displayName: draft.displayName || undefined,
        phrase: draft.phrase || undefined,
        padlockCode: draft.padlockCode || undefined,
      });
      addToast({
        type: 'success',
        title: 'Team saved',
        message: `${draft.displayName} updated.`,
      });
      setDrafts(prev => ({
        ...prev,
        [teamId]: { ...prev[teamId], phrase: '', padlockCode: '' },
      }));
      await load();
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Could not save the team',
        message: errorMessage(err),
      });
    } finally {
      setBusy(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-8 text-[var(--color-text-muted)]">
        <Loader2 className="h-5 w-5 motion-safe:animate-spin" />
        Loading teams…
      </div>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-[var(--color-text)]">
            Teams and the vault
          </h3>
          <p className="text-sm text-[var(--color-text-muted)]">
            Each team is three tribes, four apart, so between them they cover
            all twelve stations exactly once.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setRevealKey(v => !v)}
          icon={
            revealKey ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )
          }
        >
          {revealKey ? 'Hide vault key' : 'Enter vault key'}
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {teams.map(team => {
          const check = checks.find(c => c.teamId === team.id);
          const draft = drafts[team.id] ?? {
            displayName: team.displayName,
            phrase: '',
            padlockCode: '',
          };
          return (
            <div
              key={team.id}
              className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card-bg)] p-4"
            >
              <label
                htmlFor={`team-name-${team.id}`}
                className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]"
              >
                Team {team.id}
              </label>
              <Input
                id={`team-name-${team.id}`}
                value={draft.displayName}
                onChange={e =>
                  setDrafts(prev => ({
                    ...prev,
                    [team.id]: { ...draft, displayName: e.target.value },
                  }))
                }
              />

              <p className="mb-3 mt-2 text-sm text-[var(--color-text-muted)]">
                {team.tribeNames.join(' · ')}
              </p>

              {check && (
                <div
                  className={`mb-3 flex items-start gap-2 rounded-xl border p-2.5 text-xs ${
                    check.ok
                      ? 'border-green-300 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950/40 dark:text-green-300'
                      : 'border-red-300 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300'
                  }`}
                >
                  {check.ok ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                  ) : (
                    <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  )}
                  <span>
                    {check.ok ? (
                      'Covers all twelve stations exactly once.'
                    ) : (
                      <>
                        Covers {check.covered} of 12.
                        {check.missing.length > 0 && (
                          <> Missing {check.missing.join(', ')}.</>
                        )}
                        {check.duplicates.length > 0 && (
                          <> Repeats {check.duplicates.join(', ')}.</>
                        )}{' '}
                        This team could not assemble its phrase.
                      </>
                    )}
                  </span>
                </div>
              )}

              {revealKey && (
                <div className="mb-3 space-y-2 rounded-xl border border-[var(--color-danger)] p-3">
                  <p className="text-xs text-[var(--color-text-muted)]">
                    Stored server-side, never in the repository. Leave blank to
                    keep the current value.
                  </p>
                  <Input
                    aria-label={`Phrase for ${team.displayName}`}
                    placeholder="Phrase (e.g. MILK AND HONEY)"
                    value={draft.phrase}
                    onChange={e =>
                      setDrafts(prev => ({
                        ...prev,
                        [team.id]: { ...draft, phrase: e.target.value },
                      }))
                    }
                  />
                  <Input
                    aria-label={`Padlock code for ${team.displayName}`}
                    placeholder="Padlock code (4 digits)"
                    inputMode="numeric"
                    value={draft.padlockCode}
                    onChange={e =>
                      setDrafts(prev => ({
                        ...prev,
                        [team.id]: { ...draft, padlockCode: e.target.value },
                      }))
                    }
                  />
                </div>
              )}

              <Button
                variant="primary"
                size="sm"
                loading={busy === team.id}
                onClick={() => void save(team.id)}
                icon={<Save className="h-4 w-4" />}
              >
                Save team
              </Button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
