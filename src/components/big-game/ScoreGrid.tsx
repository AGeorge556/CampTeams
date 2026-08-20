// The Wilderness: Big Game — the director's score grid.
//
// The counter-intuitive bit this screen exists for: a correct code does NOT
// mean the tribe succeeded. The moderator hands the code over at the bell
// whatever happened, so the rotation never jams. The code proves the tribe was
// there; the score is the director's separate judgement, entered here.
//
// Cells are one-click segmented controls rather than selects. A director
// scoring 48 cells while running an event should not have to open a dropdown
// forty-eight times.

import { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  Layers,
  Lightbulb,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import Button from '../ui/Button';
import { useToast } from '../Toast';
import {
  BigGameError,
  scoreBoard,
  setHintsRemaining,
  setResult,
} from '../../lib/bigGame/api';
import { RESULT_ORDER } from '../../lib/bigGame/types';
import type {
  RoundResultStatus,
  ScoreBoard,
  ScoreCell,
} from '../../lib/bigGame/types';

function errorMessage(err: unknown): string {
  if (err instanceof BigGameError || err instanceof Error) return err.message;
  return 'Something went wrong. Please try again.';
}

const RESULT_META: Record<
  RoundResultStatus,
  { short: string; label: string; on: string }
> = {
  CLEAR: {
    short: 'C',
    label: 'Clear — full objective (3 pts)',
    on: 'bg-green-600 text-white border-green-700',
  },
  PARTIAL: {
    short: 'P',
    label: 'Partial — reduced objective (1 pt)',
    on: 'bg-amber-500 text-white border-amber-600',
  },
  FAIL: {
    short: 'F',
    label: 'Fail — nothing achieved (0 pts)',
    on: 'bg-slate-600 text-white border-slate-700',
  },
  MISSED: {
    short: 'M',
    label: 'Missed — never submitted (0 pts)',
    on: 'bg-red-600 text-white border-red-700',
  },
};

function Cell({
  cell,
  busy,
  onPick,
}: {
  cell: ScoreCell;
  busy: boolean;
  onPick: (status: RoundResultStatus) => void;
}) {
  return (
    <td className="border-b border-[var(--color-border)] px-2 py-2 align-top">
      <div className="flex items-center justify-between gap-1 text-[10px] font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
        <span>{cell.stationId}</span>
        <span className="flex items-center gap-1">
          {cell.hintUsed && (
            <Lightbulb
              className="h-3 w-3 text-amber-500"
              aria-label="Hint card spent"
            />
          )}
          {cell.adjustment && (
            <span
              title={
                cell.adjustment === 'OVERRIDDEN'
                  ? 'Manually completed by an admin'
                  : 'Station skipped'
              }
              className="rounded bg-violet-100 px-1 text-[9px] text-violet-700 dark:bg-violet-950/50 dark:text-violet-300"
            >
              {cell.adjustment === 'OVERRIDDEN' ? 'OVR' : 'SKP'}
            </span>
          )}
        </span>
      </div>

      <div className="mt-1 flex gap-0.5" role="group">
        {RESULT_ORDER.map(status => {
          const active = cell.status === status;
          const meta = RESULT_META[status];
          return (
            <button
              key={status}
              type="button"
              disabled={busy}
              title={meta.label}
              aria-label={`${cell.tribeId} round ${cell.round}: ${meta.label}`}
              aria-pressed={active}
              onClick={() => onPick(status)}
              className={`h-7 w-7 rounded border text-xs font-bold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--color-primary)] disabled:opacity-40 ${
                active
                  ? meta.on
                  : 'border-[var(--color-border)] bg-[var(--color-bg-muted)] text-[var(--color-text-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-text)]'
              }`}
            >
              {meta.short}
            </button>
          );
        })}
      </div>
    </td>
  );
}

export default function ScoreGrid() {
  const [board, setBoard] = useState<ScoreBoard | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const { addToast } = useToast();

  const load = useCallback(async () => {
    try {
      setBoard(await scoreBoard());
    } catch (err) {
      // Keep the last good board on screen rather than blanking mid-event.
      addToast({
        type: 'error',
        title: 'Could not load scores',
        message: errorMessage(err),
      });
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    void load();
  }, [load]);

  const pick = async (
    tribeId: string,
    round: number,
    status: RoundResultStatus
  ) => {
    setBusyKey(`${tribeId}:${round}`);
    try {
      const res = await setResult({ tribeId, round, status });
      setBoard(res.board);
      // A hint caps the station at PARTIAL, but the director can overrule a
      // moderator, so this warns and the edit still stands.
      if (res.warning) {
        addToast({
          type: 'warning',
          title: 'Hint card was spent here',
          message: res.warning,
        });
      }
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Could not save that score',
        message: errorMessage(err),
      });
    } finally {
      setBusyKey(null);
    }
  };

  const changeHints = async (tribeId: string, next: number) => {
    setBusyKey(`hints:${tribeId}`);
    try {
      setBoard(await setHintsRemaining(tribeId, next));
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Could not update hints',
        message: errorMessage(err),
      });
    } finally {
      setBusyKey(null);
    }
  };

  if (loading && !board) {
    return (
      <div className="flex items-center justify-center py-16 text-[var(--color-text-muted)]">
        <Loader2 className="mr-2 h-5 w-5 motion-safe:animate-spin" />
        Loading scores…
      </div>
    );
  }

  if (!board) return null;

  const maxTribePoints = board.rounds.length * 3;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-[var(--color-text)]">
            Score entry
          </h2>
          <p className="text-sm text-[var(--color-text-muted)]">
            Clear 3 · Partial 1 · Fail 0 · Missed 0. Editable at any time,
            during or after the game.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => void load()}
          icon={<RefreshCw className="h-4 w-4" />}
        >
          Refresh
        </Button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-[var(--color-border)] bg-[var(--color-card-bg)]">
        <table className="w-full min-w-[860px] text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)] text-left text-[var(--color-text-muted)]">
              <th className="px-3 py-2 font-medium">Tribe</th>
              {board.rounds.map(r => (
                <th key={r} className="px-2 py-2 font-medium">
                  Round {r}
                </th>
              ))}
              <th className="px-3 py-2 font-medium">Points</th>
              <th className="px-3 py-2 font-medium">Cards</th>
              <th className="px-3 py-2 font-medium">Hints</th>
            </tr>
          </thead>
          <tbody>
            {board.tribes.map(tribe => {
              const short = tribe.stoneCards < board.rounds.length;
              return (
                <tr key={tribe.id}>
                  <td className="border-b border-[var(--color-border)] px-3 py-2">
                    <div className="font-semibold text-[var(--color-text)]">
                      {tribe.displayName}
                    </div>
                    <div className="text-xs text-[var(--color-text-muted)]">
                      Team {tribe.teamId}
                    </div>
                  </td>

                  {tribe.cells.map(cell => (
                    <Cell
                      key={`${cell.tribeId}:${cell.round}`}
                      cell={cell}
                      busy={busyKey === `${cell.tribeId}:${cell.round}`}
                      onPick={status => void pick(tribe.id, cell.round, status)}
                    />
                  ))}

                  <td className="border-b border-[var(--color-border)] px-3 py-2">
                    <span className="text-lg font-bold text-[var(--color-text)]">
                      {tribe.total}
                    </span>
                    <span className="text-[var(--color-text-muted)]">
                      {' '}
                      / {maxTribePoints}
                    </span>
                  </td>

                  <td className="border-b border-[var(--color-border)] px-3 py-2">
                    {/* A tribe short of cards has to be spotted before the
                        Finale, not when its team cannot spell the phrase. */}
                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold ${
                        short
                          ? 'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
                          : 'border-[var(--color-border)] text-[var(--color-text-muted)]'
                      }`}
                    >
                      <Layers className="h-3 w-3" />
                      {tribe.stoneCards} / {board.rounds.length}
                    </span>
                  </td>

                  <td className="border-b border-[var(--color-border)] px-3 py-2">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        aria-label={`Spend a hint for ${tribe.displayName}`}
                        disabled={
                          tribe.hintsRemaining <= 0 ||
                          busyKey === `hints:${tribe.id}`
                        }
                        onClick={() =>
                          void changeHints(tribe.id, tribe.hintsRemaining - 1)
                        }
                        className="h-7 w-7 rounded border border-[var(--color-border)] text-sm font-bold text-[var(--color-text)] hover:border-[var(--color-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-primary)] disabled:opacity-40"
                      >
                        −
                      </button>
                      <span className="w-6 text-center font-semibold text-[var(--color-text)]">
                        {tribe.hintsRemaining}
                      </span>
                      <button
                        type="button"
                        aria-label={`Restore a hint for ${tribe.displayName}`}
                        disabled={
                          tribe.hintsRemaining >= 2 ||
                          busyKey === `hints:${tribe.id}`
                        }
                        onClick={() =>
                          void changeHints(tribe.id, tribe.hintsRemaining + 1)
                        }
                        className="h-7 w-7 rounded border border-[var(--color-border)] text-sm font-bold text-[var(--color-text)] hover:border-[var(--color-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-primary)] disabled:opacity-40"
                      >
                        +
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-[var(--color-text-muted)]">
        Spending a hint card caps that station at Partial. Marking it Clear
        anyway is allowed — you get a warning, not a block.
      </p>

      <section className="space-y-3">
        <h3 className="text-lg font-bold text-[var(--color-text)]">
          Teams and station coverage
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          {board.teams.map(team => (
            <div
              key={team.id}
              className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card-bg)] p-4"
            >
              <div className="flex items-baseline justify-between">
                <span className="font-bold text-[var(--color-text)]">
                  {team.displayName}
                </span>
                <span className="text-lg font-black text-[var(--color-text)]">
                  {team.total}
                  <span className="text-sm font-medium text-[var(--color-text-muted)]">
                    {' '}
                    / 36
                  </span>
                </span>
              </div>
              <div className="mt-1 text-xs text-[var(--color-text-muted)]">
                {team.tribeIds.join(' · ')} — {team.stoneCards} cards
              </div>

              <div className="mt-3 flex flex-wrap gap-1">
                {team.coverage.map(s => (
                  <span
                    key={s.stationId}
                    title={`${s.stationName}${s.byTribeId ? ` — ${s.byTribeId}` : ' — not yet covered'}`}
                    className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                      s.covered
                        ? 'bg-green-100 text-green-800 dark:bg-green-950/50 dark:text-green-300'
                        : 'bg-[var(--color-bg-muted)] text-[var(--color-text-muted)]'
                    }`}
                  >
                    {s.stationId}
                  </span>
                ))}
              </div>

              {!team.coverageComplete && (
                <p className="mt-2 flex items-start gap-1.5 text-xs text-amber-700 dark:text-amber-300">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  Not all twelve stations covered yet. This team cannot assemble
                  its phrase until they are.
                </p>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
