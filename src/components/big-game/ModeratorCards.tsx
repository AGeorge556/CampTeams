// The Wilderness: Big Game — printable moderator cards.
//
// The most valuable thing this build produces. Station moderators never log in,
// never open the site, and never look at a phone: they stand at a cone with a
// sheet of paper, run the challenge, and hand over a code. One card per
// station, twelve pages, black on white.
//
// Each card carries that station's six codes AND the tribe expected in each
// round, so a moderator can check that the group in front of them is the group
// the schedule says should be there.

import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, Loader2, Printer } from 'lucide-react';
import { moderatorCards } from '../../lib/bigGame/api';
import type { ModeratorCard } from '../../lib/bigGame/types';
import { useToast } from '../Toast';
import './print.css';

export default function ModeratorCards() {
  const { addToast } = useToast();
  const [cards, setCards] = useState<ModeratorCard[] | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setCards(await moderatorCards());
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Could not load moderator cards',
        message: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading && !cards) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-[var(--color-text-muted)]">
        <Loader2
          className="h-5 w-5 motion-safe:animate-spin"
          aria-hidden="true"
        />
        Loading moderator cards…
      </div>
    );
  }

  const missingCodes = (cards ?? []).some(card =>
    card.rounds.some(round => !round.code)
  );
  const missingLocations = (cards ?? []).filter(card => !card.location.trim());

  return (
    <div className="space-y-4">
      <div className="bg-print-hide flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-card-bg)] p-4">
        <div>
          <h2 className="text-lg font-bold text-[var(--color-text)]">
            Moderator cards
          </h2>
          <p className="text-sm text-[var(--color-text-muted)]">
            Twelve pages, one per station. Print on A4 portrait and hand one to
            each station moderator.
          </p>
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)] active:opacity-80"
        >
          <Printer className="h-4 w-4" aria-hidden="true" />
          Print all cards
        </button>
      </div>

      {(missingCodes || missingLocations.length > 0) && (
        <div className="bg-print-hide flex items-start gap-2 rounded-xl border border-amber-400 bg-amber-50 p-4 text-sm text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
          <AlertTriangle
            className="mt-0.5 h-4 w-4 shrink-0"
            aria-hidden="true"
          />
          <div className="space-y-1">
            {missingCodes && (
              <p>
                Some rounds have no code yet — generate the 72 station codes in
                Setup before printing.
              </p>
            )}
            {missingLocations.length > 0 && (
              <p>
                No location set for:{' '}
                {missingLocations.map(card => card.stationId).join(', ')}. Those
                cards will print without one.
              </p>
            )}
          </div>
        </div>
      )}

      <div className="bg-print-root">
        {(cards ?? []).map(card => (
          <article key={card.stationId} className="bg-print-page">
            <header>
              <p className="text-sm font-bold uppercase tracking-[0.2em]">
                Station {card.stationId}
              </p>
              <h1 className="text-4xl font-black leading-tight">
                {card.stationName}
              </h1>
              <p className="mt-1 text-xl font-semibold">
                {card.location.trim() || '— location not set —'}
              </p>
            </header>

            <hr className="bg-print-rule my-4" />

            {card.shortDescription && (
              <p className="mb-1 text-base italic">{card.shortDescription}</p>
            )}
            {card.instructions && (
              <p className="mb-3 text-base">{card.instructions}</p>
            )}

            <p className="mb-4 text-base font-bold">
              Give the code only after the challenge is genuinely complete. Give
              only the code for the current round.
            </p>

            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b-2 border-black">
                  <th className="py-2 pr-3 text-base font-bold uppercase tracking-wide">
                    Round
                  </th>
                  <th className="py-2 pr-3 text-base font-bold uppercase tracking-wide">
                    Expected tribe
                  </th>
                  <th className="py-2 text-base font-bold uppercase tracking-wide">
                    Code
                  </th>
                </tr>
              </thead>
              <tbody>
                {card.rounds.map(round => (
                  <tr
                    key={round.round}
                    className="bg-print-row border-b border-black/40"
                  >
                    <td className="whitespace-nowrap py-3 pr-3 text-2xl font-black">
                      ROUND {round.round}
                    </td>
                    <td className="py-3 pr-3 text-lg font-semibold">
                      {round.tribeDisplayName ?? '—'}
                      {round.tribeId &&
                        round.tribeDisplayName !== round.tribeId && (
                          <span className="font-normal">
                            {' '}
                            ({round.tribeId})
                          </span>
                        )}
                      {round.tribeParentTeam && (
                        <span className="block text-sm font-normal">
                          {round.tribeParentTeam}
                        </span>
                      )}
                    </td>
                    <td className="bg-print-code py-3 text-3xl">
                      {round.code ?? '— not generated —'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <p className="mt-5 text-sm">
              If a tribe arrives that is not the one listed for this round, send
              them to the game director. Do not hand out a code you were not
              asked for.
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}
