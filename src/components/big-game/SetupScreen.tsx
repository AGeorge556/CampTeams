// The Wilderness: Big Game — organizer setup screen.
//
// Everything that has to be true before the horn: tribe names, station
// locations, join codes, the 72 answer codes, and a readiness checklist that
// blocks Start until all of it holds. The checklist is computed server-side and
// re-checked inside bg_admin_start(), so this screen cannot be talked into
// starting a game that is not ready.

import { useCallback, useEffect, useState } from 'react';
import {
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Map as MapIcon,
  Play,
  RefreshCw,
  Save,
  Shuffle,
  XCircle,
} from 'lucide-react';
import {
  generateStationCodes,
  regenerateJoinCodes,
  setupState as fetchSetupState,
  startGame,
  stationCodes as fetchStationCodes,
  updateStation,
  updateStationCode,
  updateTribe,
} from '../../lib/bigGame/api';
import { PARENT_TEAMS, ROUNDS, ROUND_COUNT } from '../../lib/bigGame/route';
import type { SetupState, StationCode } from '../../lib/bigGame/types';
import { useToast } from '../Toast';
import TeamSetup from './TeamSetup';

interface SetupScreenProps {
  onViewRoutes?: () => void;
}

const cardClass =
  'rounded-xl border border-[var(--color-border)] bg-[var(--color-card-bg)] p-4';
const inputClass =
  'w-full min-h-[40px] rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-muted)] px-3 py-2 text-sm text-[var(--color-text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--color-primary)] disabled:opacity-50';
const secondaryButtonClass =
  'inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm font-medium text-[var(--color-text)] transition-colors hover:bg-[var(--color-bg-muted)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-40';

export default function SetupScreen({ onViewRoutes }: SetupScreenProps) {
  const { addToast } = useToast();
  const [state, setState] = useState<SetupState | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [seed, setSeed] = useState('');
  const [codes, setCodes] = useState<StationCode[] | null>(null);
  const [codesVisible, setCodesVisible] = useState(false);

  // Local edit buffers, so a half-typed location is not thrown away by a
  // refresh triggered from somewhere else on the screen.
  const [tribeEdits, setTribeEdits] = useState<
    Record<
      string,
      { displayName: string; parentTeam: string; joinCode: string }
    >
  >({});
  const [stationEdits, setStationEdits] = useState<
    Record<string, { location: string; instructions: string }>
  >({});

  const applyState = useCallback((next: SetupState) => {
    setState(next);
    setTribeEdits(
      Object.fromEntries(
        next.tribes.map(tribe => [
          tribe.id,
          {
            displayName: tribe.displayName,
            parentTeam: tribe.parentTeam,
            joinCode: tribe.joinCode,
          },
        ])
      )
    );
    setStationEdits(
      Object.fromEntries(
        next.stations.map(station => [
          station.id,
          {
            location: station.location,
            instructions: station.instructions ?? '',
          },
        ])
      )
    );
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      applyState(await fetchSetupState());
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Could not load setup',
        message: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setLoading(false);
    }
  }, [addToast, applyState]);

  useEffect(() => {
    void load();
  }, [load]);

  // Every mutation funnels through here: one place that shows a spinner, keeps
  // the last good state on failure, and surfaces the server's message verbatim.
  // The server's wording names the specific missing stations — paraphrasing it
  // would throw away the only thing the organizer actually needs to read.
  const run = useCallback(
    async (
      key: string,
      action: () => Promise<SetupState>,
      success?: string
    ) => {
      setBusy(key);
      try {
        applyState(await action());
        if (success) addToast({ type: 'success', title: success, message: '' });
      } catch (error) {
        addToast({
          type: 'error',
          title: 'That did not work',
          message: error instanceof Error ? error.message : String(error),
        });
      } finally {
        setBusy(null);
      }
    },
    [addToast, applyState]
  );

  const revealCodes = useCallback(async () => {
    setBusy('codes');
    try {
      setCodes(await fetchStationCodes());
      setCodesVisible(true);
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Could not load codes',
        message: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setBusy(null);
    }
  }, [addToast]);

  const hideCodes = useCallback(() => {
    setCodesVisible(false);
    setCodes(null);
  }, []);

  if (loading && !state) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-[var(--color-text-muted)]">
        <Loader2
          className="h-5 w-5 motion-safe:animate-spin"
          aria-hidden="true"
        />
        Loading setup…
      </div>
    );
  }

  if (!state) return null;

  const isSetup = state.game.status === 'SETUP';
  const codeFor = (stationId: string, round: number) =>
    codes?.find(c => c.stationId === stationId && c.round === round)?.code ??
    '';

  return (
    <div className="space-y-6">
      {/* Readiness leads, because it is the only thing that decides whether the
          event can begin at all. */}
      <section className={cardClass}>
        <h2 className="mb-3 text-lg font-bold text-[var(--color-text)]">
          Readiness
        </h2>
        <ul className="space-y-2">
          {state.checklist.map(item => (
            <li key={item.key} className="flex items-start gap-2 text-sm">
              {item.ok ? (
                <CheckCircle2
                  className="mt-0.5 h-4 w-4 shrink-0 text-green-600 dark:text-green-400"
                  aria-hidden="true"
                />
              ) : (
                <XCircle
                  className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-danger)]"
                  aria-hidden="true"
                />
              )}
              <span>
                <span className="font-medium text-[var(--color-text)]">
                  {item.label}
                </span>
                {item.detail && (
                  <span className="block text-[var(--color-text-muted)]">
                    {item.detail}
                  </span>
                )}
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={!state.canStart || busy !== null}
            onClick={() =>
              run(
                'start',
                async () => {
                  await startGame();
                  return fetchSetupState();
                },
                'The game has started — round 1 is live'
              )
            }
            className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-[var(--color-primary)] px-5 py-2 text-sm font-bold text-white transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)] active:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy === 'start' ? (
              <Loader2
                className="h-4 w-4 motion-safe:animate-spin"
                aria-hidden="true"
              />
            ) : (
              <Play className="h-4 w-4" aria-hidden="true" />
            )}
            Start game
          </button>

          {!state.canStart && (
            <p className="text-sm text-[var(--color-text-muted)]">
              {isSetup
                ? 'Finish the red items above first.'
                : `The game is ${state.game.status}.`}
            </p>
          )}

          {onViewRoutes && (
            <button
              type="button"
              onClick={onViewRoutes}
              className={secondaryButtonClass}
            >
              <MapIcon className="h-4 w-4" aria-hidden="true" />
              View route tables
            </button>
          )}

          <span className="text-sm text-[var(--color-text-muted)]">
            Rounds:{' '}
            <strong className="text-[var(--color-text)]">{ROUND_COUNT}</strong>{' '}
            (fixed)
          </span>
        </div>
      </section>

      {/* Stations. Location is the field that blocks Start, so it leads. */}
      <section className={cardClass}>
        <h2 className="mb-1 text-lg font-bold text-[var(--color-text)]">
          Stations
        </h2>
        <p className="mb-3 text-sm text-[var(--color-text-muted)]">
          Every station needs a location. Write what a 13-year-old would follow
          — &ldquo;behind the dining hall&rdquo; beats &ldquo;Zone C&rdquo;.
        </p>
        <div className="space-y-3">
          {state.stations.map(station => {
            const edit = stationEdits[station.id] ?? {
              location: '',
              instructions: '',
            };
            const dirty =
              edit.location !== station.location ||
              edit.instructions !== (station.instructions ?? '');
            return (
              <div
                key={station.id}
                className="grid gap-2 border-b border-[var(--color-border)] pb-3 last:border-0 last:pb-0 md:grid-cols-[7rem_1fr_1fr_auto] md:items-center"
              >
                <div className="text-sm font-bold text-[var(--color-text)]">
                  {station.id}
                  <span className="block text-xs font-normal text-[var(--color-text-muted)]">
                    {station.name}
                  </span>
                </div>
                <input
                  className={inputClass}
                  placeholder="Location (required)"
                  value={edit.location}
                  onChange={event =>
                    setStationEdits(prev => ({
                      ...prev,
                      [station.id]: { ...edit, location: event.target.value },
                    }))
                  }
                />
                <input
                  className={inputClass}
                  placeholder="Instructions for the leader (optional)"
                  value={edit.instructions}
                  onChange={event =>
                    setStationEdits(prev => ({
                      ...prev,
                      [station.id]: {
                        ...edit,
                        instructions: event.target.value,
                      },
                    }))
                  }
                />
                <button
                  type="button"
                  disabled={!dirty || busy !== null}
                  onClick={() =>
                    run(`station-${station.id}`, () =>
                      updateStation({
                        stationId: station.id,
                        location: edit.location,
                        instructions: edit.instructions,
                      })
                    )
                  }
                  className={secondaryButtonClass}
                >
                  {busy === `station-${station.id}` ? (
                    <Loader2
                      className="h-4 w-4 motion-safe:animate-spin"
                      aria-hidden="true"
                    />
                  ) : (
                    <Save className="h-4 w-4" aria-hidden="true" />
                  )}
                  Save
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Tribes */}
      <section className={cardClass}>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-[var(--color-text)]">
              Tribes
            </h2>
            <p className="text-sm text-[var(--color-text-muted)]">
              Tribe IDs are fixed — the printed cards refer to them.
            </p>
          </div>
          <button
            type="button"
            disabled={!isSetup || busy !== null}
            onClick={() => {
              if (
                !window.confirm(
                  'Regenerate all twelve join codes? Any slips already printed become invalid.'
                )
              )
                return;
              void run(
                'joincodes',
                regenerateJoinCodes,
                'New join codes generated'
              );
            }}
            className={secondaryButtonClass}
          >
            {busy === 'joincodes' ? (
              <Loader2
                className="h-4 w-4 motion-safe:animate-spin"
                aria-hidden="true"
              />
            ) : (
              <Shuffle className="h-4 w-4" aria-hidden="true" />
            )}
            Regenerate join codes
          </button>
        </div>

        <div className="space-y-3">
          {state.tribes.map(tribe => {
            const edit = tribeEdits[tribe.id] ?? {
              displayName: '',
              parentTeam: '',
              joinCode: '',
            };
            const dirty =
              edit.displayName !== tribe.displayName ||
              edit.parentTeam !== tribe.parentTeam ||
              edit.joinCode !== tribe.joinCode;
            return (
              <div
                key={tribe.id}
                className="grid gap-2 border-b border-[var(--color-border)] pb-3 last:border-0 last:pb-0 md:grid-cols-[4rem_1fr_10rem_9rem_auto] md:items-center"
              >
                <div className="text-sm font-bold text-[var(--color-text)]">
                  {tribe.id}
                </div>
                <input
                  className={inputClass}
                  placeholder="Display name"
                  value={edit.displayName}
                  onChange={event =>
                    setTribeEdits(prev => ({
                      ...prev,
                      [tribe.id]: { ...edit, displayName: event.target.value },
                    }))
                  }
                />
                <select
                  className={inputClass}
                  value={edit.parentTeam}
                  onChange={event =>
                    setTribeEdits(prev => ({
                      ...prev,
                      [tribe.id]: { ...edit, parentTeam: event.target.value },
                    }))
                  }
                >
                  {PARENT_TEAMS.map(team => (
                    <option key={team} value={team}>
                      {team}
                    </option>
                  ))}
                </select>
                <input
                  className={`${inputClass} font-mono uppercase tracking-widest`}
                  dir="ltr"
                  spellCheck={false}
                  autoComplete="off"
                  value={edit.joinCode}
                  onChange={event =>
                    setTribeEdits(prev => ({
                      ...prev,
                      [tribe.id]: {
                        ...edit,
                        joinCode: event.target.value.toUpperCase(),
                      },
                    }))
                  }
                />
                <button
                  type="button"
                  disabled={!dirty || busy !== null}
                  onClick={() =>
                    run(`tribe-${tribe.id}`, () =>
                      updateTribe({
                        tribeId: tribe.id,
                        displayName: edit.displayName,
                        parentTeam: edit.parentTeam,
                        joinCode: edit.joinCode,
                      })
                    )
                  }
                  className={secondaryButtonClass}
                >
                  {busy === `tribe-${tribe.id}` ? (
                    <Loader2
                      className="h-4 w-4 motion-safe:animate-spin"
                      aria-hidden="true"
                    />
                  ) : (
                    <Save className="h-4 w-4" aria-hidden="true" />
                  )}
                  Save
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Teams — the coverage validator here is what blocks Start. */}
      <section className={cardClass}>
        <TeamSetup />
      </section>

      {/* Station codes — hidden by default. */}
      <section className={cardClass}>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-[var(--color-text)]">
              Station codes
            </h2>
            <p className="text-sm text-[var(--color-text-muted)]">
              {state.codeCount} of 72 generated. One per station per round — the
              digits change every round, so a code shouted forward is worthless.
            </p>
          </div>
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => (codesVisible ? hideCodes() : void revealCodes())}
            className={secondaryButtonClass}
          >
            {codesVisible ? (
              <EyeOff className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Eye className="h-4 w-4" aria-hidden="true" />
            )}
            {codesVisible ? 'Hide codes' : 'Reveal codes'}
          </button>
        </div>

        <div className="mb-4 flex flex-wrap items-end gap-2">
          <label className="flex-1 text-sm text-[var(--color-text-muted)]">
            Seed
            <input
              className={inputClass}
              placeholder="e.g. wilderness2026"
              value={seed}
              onChange={event => setSeed(event.target.value)}
              disabled={!isSetup}
            />
          </label>
          <button
            type="button"
            disabled={!isSetup || !seed.trim() || busy !== null}
            onClick={() => {
              if (
                !window.confirm(
                  'Generate all 72 codes? Any moderator cards already printed become invalid.'
                )
              )
                return;
              void run(
                'gencodes',
                () => generateStationCodes(seed.trim()),
                'All 72 codes generated'
              );
            }}
            className="inline-flex min-h-[40px] items-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)] active:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy === 'gencodes' ? (
              <Loader2
                className="h-4 w-4 motion-safe:animate-spin"
                aria-hidden="true"
              />
            ) : (
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
            )}
            Generate all 72 codes
          </button>
          <p className="w-full text-xs text-[var(--color-text-muted)]">
            The same seed always produces the same 72 codes, so a reprinted card
            still matches the database.
          </p>
        </div>

        {codesVisible ? (
          <>
            <p className="mb-2 rounded-lg border border-[var(--color-danger)] px-3 py-2 text-sm font-semibold text-[var(--color-danger)]">
              These are the answer keys. Hide them before a camper walks past.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[46rem] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-border)]">
                    <th className="p-2 font-semibold text-[var(--color-text-muted)]">
                      Station
                    </th>
                    {ROUNDS.map(round => (
                      <th
                        key={round}
                        className="p-2 font-semibold text-[var(--color-text-muted)]"
                      >
                        Round {round}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {state.stations.map(station => (
                    <tr
                      key={station.id}
                      className="border-b border-[var(--color-border)]"
                    >
                      <td className="p-2 font-medium text-[var(--color-text)]">
                        {station.id}
                        <span className="block text-xs text-[var(--color-text-muted)]">
                          {station.name}
                        </span>
                      </td>
                      {ROUNDS.map(round => (
                        <td key={round} className="p-1">
                          <input
                            className={`${inputClass} font-mono uppercase`}
                            dir="ltr"
                            spellCheck={false}
                            autoComplete="off"
                            disabled={!isSetup || busy !== null}
                            defaultValue={codeFor(station.id, round)}
                            onBlur={event => {
                              const next = event.target.value
                                .trim()
                                .toUpperCase();
                              if (!next || next === codeFor(station.id, round))
                                return;
                              void (async () => {
                                setBusy(`code-${station.id}-${round}`);
                                try {
                                  setCodes(
                                    await updateStationCode({
                                      stationId: station.id,
                                      round,
                                      code: next,
                                    })
                                  );
                                  applyState(await fetchSetupState());
                                } catch (error) {
                                  addToast({
                                    type: 'error',
                                    title: 'Could not save that code',
                                    message:
                                      error instanceof Error
                                        ? error.message
                                        : String(error),
                                  });
                                  setCodes(await fetchStationCodes());
                                } finally {
                                  setBusy(null);
                                }
                              })();
                            }}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <p className="text-sm text-[var(--color-text-muted)]">
            Codes are hidden. Reveal them only when nobody is reading over your
            shoulder.
          </p>
        )}
      </section>
    </div>
  );
}
