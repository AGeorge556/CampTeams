// The Wilderness: Big Game — the 72-code answer sheet.
//
// Every code lives behind an explicit Reveal press: nothing is fetched on
// mount, so a director who opens this tab with a camper walking past never
// has 72 answers sitting on screen by accident. Hide both closes the table
// and drops the fetched codes from state — a stale reveal is not "hidden",
// it's still in memory, so Hide throws the data away, not just the view.

import { useState } from 'react';
import { AlertTriangle, Eye, EyeOff, Loader2 } from 'lucide-react';
import Button from '../ui/Button';
import { useToast } from '../Toast';
import { BigGameError, stationCodes } from '../../lib/bigGame/api';
import type { StationCode } from '../../lib/bigGame/types';
import { ROUNDS, STATION_BLUEPRINT } from '../../lib/bigGame/route';

function errorMessage(err: unknown): string {
  if (err instanceof BigGameError || err instanceof Error) return err.message;
  return 'Something went wrong. Please try again.';
}

export default function CodeSheet() {
  const [revealed, setRevealed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [codes, setCodes] = useState<StationCode[] | null>(null);
  const { addToast } = useToast();

  const handleReveal = async () => {
    setLoading(true);
    try {
      const data = await stationCodes();
      setCodes(data);
      setRevealed(true);
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Could not load codes',
        message: errorMessage(err),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleHide = () => {
    setRevealed(false);
    setCodes(null);
  };

  const lookup = new Map<string, string>();
  if (codes) {
    for (const entry of codes) {
      lookup.set(`${entry.stationId}:${entry.round}`, entry.code);
    }
  }

  return (
    <section className="space-y-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-card-bg)] p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-[var(--color-text)]">
            Code sheet
          </h3>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            All 72 answer codes — one per station, per round.
          </p>
        </div>
        {revealed ? (
          <Button
            variant="outline"
            icon={<EyeOff className="h-4 w-4" />}
            onClick={handleHide}
          >
            Hide codes
          </Button>
        ) : (
          <Button
            variant="primary"
            icon={<Eye className="h-4 w-4" />}
            loading={loading}
            onClick={() => void handleReveal()}
          >
            Reveal codes
          </Button>
        )}
      </div>

      {!revealed ? (
        <div className="flex items-start gap-2 rounded-md border border-[var(--color-border)] bg-[var(--color-bg-muted)] p-4 text-sm text-[var(--color-text-muted)]">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            Codes stay hidden until you press Reveal — check who's behind you
            before you open this.
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-start gap-2 rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              <strong>Answer keys visible.</strong> Every code below solves a
              station. Hide the sheet before anyone but staff can read your
              screen.
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-[var(--color-text-muted)]">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading codes…
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[var(--color-border)] text-sm">
                <thead className="bg-[var(--color-bg-muted)]">
                  <tr>
                    <th className="whitespace-nowrap px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                      Station
                    </th>
                    {ROUNDS.map(round => (
                      <th
                        key={round}
                        className="whitespace-nowrap px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]"
                      >
                        R{round}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                  {STATION_BLUEPRINT.map(station => (
                    <tr key={station.id}>
                      <th
                        scope="row"
                        className="whitespace-nowrap px-3 py-2 text-left font-medium text-[var(--color-text)]"
                      >
                        {station.id}
                        <span className="block text-xs font-normal text-[var(--color-text-muted)]">
                          {station.name}
                        </span>
                      </th>
                      {ROUNDS.map(round => (
                        <td
                          key={round}
                          className="whitespace-nowrap px-3 py-2 font-mono text-[var(--color-text)]"
                        >
                          {lookup.get(`${station.id}:${round}`) ?? '—'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </section>
  );
}
