// The Wilderness: Big Game — the director's Finale race control.
//
// There is deliberately no vault-code entry field anywhere in this component.
// The padlock is the check. A team that types the right code into a phone and
// still cannot open the lock will argue with a moderator instead of trying the
// lock again, so the site never validates it.
//
// The clocks tick locally but are measured against the server's time, not the
// laptop's: a director whose machine is two minutes off must not hand one team
// a two-minute advantage.

import type { ReactNode } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  Eye,
  EyeOff,
  Flag,
  KeyRound,
  Loader2,
  Play,
  Timer,
  UserMinus,
} from 'lucide-react';
import Button from '../ui/Button';
import { useToast } from '../Toast';
import Standings from './Standings';
import {
  BigGameError,
  finaleState,
  finishGame,
  markShortHanded,
  markTeamOpened,
  standings as fetchStandings,
  startFinale,
} from '../../lib/bigGame/api';
import type {
  FinaleState,
  FinaleTeamRow,
  Standings as StandingsData,
} from '../../lib/bigGame/types';

function errorMessage(err: unknown): string {
  if (err instanceof BigGameError || err instanceof Error) return err.message;
  return 'Something went wrong. Please try again.';
}

function mmss(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

function headStartLabel(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

function TeamRow({
  team,
  now,
  busy,
  onOpened,
  onShortHanded,
}: {
  team: FinaleTeamRow;
  now: number;
  busy: boolean;
  onOpened: () => void;
  onShortHanded: (next: boolean) => void;
}) {
  const startsAt = team.startsAt ? new Date(team.startsAt).getTime() : null;
  const opened = team.openedAt ? new Date(team.openedAt).getTime() : null;

  let clock: ReactNode;
  if (opened !== null && startsAt !== null) {
    clock = (
      <span className="font-mono text-2xl font-black tabular-nums text-green-700 dark:text-green-400">
        {mmss(opened - startsAt)}
      </span>
    );
  } else if (startsAt === null) {
    clock = (
      <span className="text-sm text-[var(--color-text-muted)]">
        not started
      </span>
    );
  } else if (now < startsAt) {
    clock = (
      <span className="font-mono text-2xl font-black tabular-nums text-[var(--color-text-muted)]">
        −{mmss(startsAt - now)}
      </span>
    );
  } else {
    clock = (
      <span className="font-mono text-2xl font-black tabular-nums text-[var(--color-primary)]">
        {mmss(now - startsAt)}
      </span>
    );
  }

  const isGo = startsAt !== null && now >= startsAt && opened === null;

  return (
    <div
      className={`rounded-2xl border-2 p-4 transition-colors ${
        isGo
          ? 'border-[var(--color-primary)] bg-[var(--color-bg-muted)]'
          : 'border-[var(--color-border)] bg-[var(--color-card-bg)]'
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-[var(--color-bg-muted)] px-2 py-0.5 text-xs font-bold text-[var(--color-text-muted)]">
              #{team.rank}
            </span>
            <span className="text-lg font-bold text-[var(--color-text)]">
              {team.displayName}
            </span>
            {team.shortHanded && (
              <span className="rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                short-handed
              </span>
            )}
          </div>
          <div className="mt-1 text-xs text-[var(--color-text-muted)]">
            {team.tribeNames.join(' · ')} — {team.total} pts, {team.clears}{' '}
            cleared · head start {headStartLabel(team.headStartSeconds)}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {clock}
          <Button
            variant={team.openedAt ? 'outline' : 'primary'}
            size="sm"
            loading={busy}
            onClick={onOpened}
            icon={<KeyRound className="h-4 w-4" />}
          >
            {team.openedAt ? 'Undo open' : 'Opened'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onShortHanded(!team.shortHanded)}
            icon={<UserMinus className="h-4 w-4" />}
          >
            {team.shortHanded ? 'Clear short' : 'Short-handed'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function FinaleDirector() {
  const [state, setState] = useState<FinaleState | null>(null);
  const [results, setResults] = useState<StandingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [revealCodes, setRevealCodes] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const skewRef = useRef(0);
  const { addToast } = useToast();

  const load = useCallback(async () => {
    try {
      const next = await finaleState();
      skewRef.current = new Date(next.serverTime).getTime() - Date.now();
      setState(next);
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Could not load the Finale',
        message: errorMessage(err),
      });
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    void load();
    const poll = window.setInterval(() => void load(), 2000);
    return () => window.clearInterval(poll);
  }, [load]);

  useEffect(() => {
    const tick = window.setInterval(
      () => setNow(Date.now() + skewRef.current),
      250
    );
    return () => window.clearInterval(tick);
  }, []);

  const run = async (key: string, fn: () => Promise<FinaleState>) => {
    setBusy(key);
    try {
      setState(await fn());
    } catch (err) {
      addToast({
        type: 'error',
        title: 'That did not work',
        message: errorMessage(err),
      });
    } finally {
      setBusy(null);
    }
  };

  const handleStart = async () => {
    if (
      !window.confirm(
        'Start the Finale clock?\n\nThis freezes the head-start ranking. Editing a score afterwards will NOT reshuffle a race that is already running.'
      )
    ) {
      return;
    }
    await run('start', startFinale);
  };

  const handleFinish = async () => {
    if (!window.confirm('End the game and publish final standings?')) return;
    setBusy('finish');
    try {
      setResults(await finishGame());
      await load();
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Could not end the game',
        message: errorMessage(err),
      });
    } finally {
      setBusy(null);
    }
  };

  const handleShowStandings = async () => {
    setBusy('standings');
    try {
      setResults(await fetchStandings());
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Could not load standings',
        message: errorMessage(err),
      });
    } finally {
      setBusy(null);
    }
  };

  if (loading && !state) {
    return (
      <div className="flex items-center justify-center py-16 text-[var(--color-text-muted)]">
        <Loader2 className="mr-2 h-5 w-5 motion-safe:animate-spin" />
        Loading the Finale…
      </div>
    );
  }

  if (!state) return null;

  const started = state.game.finaleStartedAt !== null;
  const inFinale = state.game.status === 'FINALE';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-[var(--color-text)]">
            The Finale
          </h2>
          <p className="text-sm text-[var(--color-text-muted)]">
            Teams pool their Stone Cards, spell the phrase and open a physical
            padlock. The site does not check the code — the lock does.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {!started && inFinale && (
            <Button
              variant="primary"
              loading={busy === 'start'}
              onClick={() => void handleStart()}
              icon={<Play className="h-4 w-4" />}
            >
              Start Finale
            </Button>
          )}
          <Button
            variant="outline"
            loading={busy === 'standings'}
            onClick={() => void handleShowStandings()}
            icon={<Timer className="h-4 w-4" />}
          >
            Standings
          </Button>
          {inFinale && (
            <Button
              variant="danger"
              loading={busy === 'finish'}
              onClick={() => void handleFinish()}
              icon={<Flag className="h-4 w-4" />}
            >
              End game
            </Button>
          )}
        </div>
      </div>

      {state.rankingsFrozen && (
        <p className="flex items-start gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-muted)] p-3 text-sm text-[var(--color-text-muted)]">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          Head starts are frozen from the moment Start was pressed. Score edits
          still record, but they will not change this race.
        </p>
      )}

      <div className="space-y-3">
        {state.teams.map(team => (
          <TeamRow
            key={team.id}
            team={team}
            now={now}
            busy={busy === `open:${team.id}`}
            onOpened={() =>
              void run(`open:${team.id}`, () => markTeamOpened(team.id))
            }
            onShortHanded={next =>
              void run(`short:${team.id}`, () => markShortHanded(team.id, next))
            }
          />
        ))}
      </div>

      <section className="rounded-2xl border border-[var(--color-danger)] bg-[var(--color-card-bg)] p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-[var(--color-text)]">Vault codes</h3>
            <p className="text-sm text-[var(--color-text-muted)]">
              Director only. Hidden by default so they are not on screen when a
              camper walks past.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setRevealCodes(v => !v)}
            icon={
              revealCodes ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )
            }
          >
            {revealCodes ? 'Hide' : 'Reveal'}
          </Button>
        </div>

        {revealCodes && (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {state.teams.map(team => (
              <div
                key={team.id}
                className="rounded-xl border border-[var(--color-border)] p-3"
              >
                <div className="font-semibold text-[var(--color-text)]">
                  {team.displayName}
                </div>
                {team.phrase || team.padlockCode ? (
                  <>
                    <div className="mt-1 font-mono text-lg tracking-wide text-[var(--color-text)]">
                      {team.phrase ?? '—'}
                    </div>
                    <div className="font-mono text-2xl font-black text-[var(--color-primary)]">
                      {team.padlockCode ?? '—'}
                    </div>
                  </>
                ) : (
                  <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                    Not entered yet — set the phrase and padlock code in Setup.
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {results && <Standings standings={results} />}
    </div>
  );
}
