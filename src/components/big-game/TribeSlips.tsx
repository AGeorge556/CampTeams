// The Wilderness: Big Game — printable tribe join-code slips.
//
// Twelve small cut-apart slips, one per tribe leader. The join code is the only
// credential in this game: a leader types it on any phone and is in, which is
// what makes a dead battery a non-event rather than a lost tribe.
//
// Printed black on white, three to a row, so a single page can be cut up with
// scissors five minutes before the horn.

import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, Loader2, Printer } from 'lucide-react';
import { setupState } from '../../lib/bigGame/api';
import type { SetupTribe } from '../../lib/bigGame/types';
import { useToast } from '../Toast';
import './print.css';

export default function TribeSlips() {
  const { addToast } = useToast();
  const [tribes, setTribes] = useState<SetupTribe[] | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const state = await setupState();
      setTribes(state.tribes);
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Could not load tribe slips',
        message: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading && !tribes) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-[var(--color-text-muted)]">
        <Loader2
          className="h-5 w-5 motion-safe:animate-spin"
          aria-hidden="true"
        />
        Loading tribe slips…
      </div>
    );
  }

  const missing = (tribes ?? []).filter(tribe => !tribe.joinCode);

  return (
    <div className="space-y-4">
      <div className="bg-print-hide flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-card-bg)] p-4">
        <div>
          <h2 className="text-lg font-bold text-[var(--color-text)]">
            Tribe join-code slips
          </h2>
          <p className="text-sm text-[var(--color-text-muted)]">
            Print, cut apart, and hand one to each tribe leader. Anyone holding
            the slip can lead the tribe from any phone.
          </p>
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)] active:opacity-80"
        >
          <Printer className="h-4 w-4" aria-hidden="true" />
          Print slips
        </button>
      </div>

      {missing.length > 0 && (
        <div className="bg-print-hide flex items-start gap-2 rounded-xl border border-amber-400 bg-amber-50 p-4 text-sm text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
          <AlertTriangle
            className="mt-0.5 h-4 w-4 shrink-0"
            aria-hidden="true"
          />
          <p>
            No join code for: {missing.map(tribe => tribe.id).join(', ')}.
            Generate them in Setup before printing.
          </p>
        </div>
      )}

      <div className="bg-print-root">
        <div className="bg-print-page grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(tribes ?? []).map(tribe => (
            <div key={tribe.id} className="bg-print-slip">
              <p className="text-xs font-bold uppercase tracking-[0.2em]">
                Wilderness Big Game
              </p>
              <p className="mt-1 text-2xl font-black leading-tight">
                {tribe.displayName}
              </p>
              <p className="text-sm font-semibold">
                {tribe.id} · {tribe.parentTeam}
              </p>

              <p className="mt-3 text-xs font-bold uppercase tracking-wide">
                Your tribe code
              </p>
              <p className="bg-print-code text-4xl leading-none">
                {tribe.joinCode || '——————'}
              </p>

              <p className="mt-3 text-xs leading-snug">
                Open the camp site at <strong>/wilderness</strong> and enter
                this code. Keep this slip — a second phone can join with the
                same code.
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
