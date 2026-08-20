// The Wilderness: Big Game — what a tribe leader sees in the Finale.
//
// Pure presentation. LeaderScreen owns polling and renders this once the
// director advances past the last round.
//
// What is deliberately absent: the phrase, the letter positions, and the
// padlock code. None of them exist in LeaderState at all — if this component
// ever seems to need one, that is the contract saying no. A leader who can
// read the phrase off a phone has defeated the entire puzzle.

import { useEffect, useState } from 'react';
import { Flag, Users } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { bigGameStrings } from '../../lib/bigGame/strings';
import type { LeaderState } from '../../lib/bigGame/types';

function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function FinaleLeader({ state }: { state: LeaderState }) {
  const { language, isRTL } = useLanguage();
  const strings = bigGameStrings(language);
  const team = state.finaleTeam;

  // The countdown ticks locally, but against the server's clock offset rather
  // than the phone's, so a camper whose phone runs three minutes fast does not
  // get to start early.
  const [skewMs] = useState(
    () => new Date(state.serverTime).getTime() - Date.now()
  );
  const [now, setNow] = useState(() => Date.now() + skewMs);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now() + skewMs), 500);
    return () => window.clearInterval(id);
  }, [skewMs]);

  if (!team) return null;

  const startsAtMs = team.startsAt ? new Date(team.startsAt).getTime() : null;
  const remaining = startsAtMs === null ? null : startsAtMs - now;
  const isGo = remaining !== null && remaining <= 0;

  return (
    <div
      dir={isRTL ? 'rtl' : 'ltr'}
      className="mx-auto w-full max-w-md space-y-5 px-4 py-6"
    >
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
          {strings.gameTitle}
        </p>
        <h1 className="mt-1 text-3xl font-black tracking-tight text-[var(--color-text)]">
          {strings.finaleTitle}
        </h1>
        <p className="mt-2 text-base text-[var(--color-text-muted)]">
          {strings.finaleBody}
        </p>
      </div>

      <section className="rounded-2xl border-2 border-[var(--color-primary)] bg-[var(--color-card-bg)] p-5 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-text-muted)]">
          {strings.finaleYourTeam}
        </p>
        <p className="mt-1 text-3xl font-black text-[var(--color-text)]">
          {team.displayName}
        </p>
      </section>

      <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card-bg)] p-5">
        <div className="mb-3 flex items-center gap-2">
          <Users className="h-5 w-5 shrink-0 text-[var(--color-text-muted)]" />
          <p className="text-sm font-semibold text-[var(--color-text)]">
            {strings.finaleFindOthers}
          </p>
        </div>
        <ul className="space-y-2">
          {team.tribeNames.map(name => {
            const isSelf = name === state.tribe.displayName;
            return (
              <li
                key={name}
                className={`rounded-xl border px-4 py-3 text-lg font-bold text-[var(--color-text)] ${
                  isSelf
                    ? 'border-[var(--color-primary)] bg-[var(--color-bg-muted)]'
                    : 'border-[var(--color-border)]'
                }`}
              >
                {name}
                {isSelf && (
                  <span className="ml-2 text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                    you
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card-bg)] p-6 text-center">
        {startsAtMs === null ? (
          <p className="text-lg font-semibold text-[var(--color-text-muted)]">
            {strings.finaleWaiting}
          </p>
        ) : isGo ? (
          <div className="flex flex-col items-center gap-2">
            <Flag className="h-10 w-10 text-[var(--color-primary)]" />
            <p className="text-3xl font-black uppercase tracking-wide text-[var(--color-primary)]">
              {strings.finaleGo}
            </p>
          </div>
        ) : (
          <>
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-text-muted)]">
              {strings.finaleStartsIn}
            </p>
            <p className="mt-1 font-mono text-5xl font-black tabular-nums text-[var(--color-text)]">
              {formatCountdown(remaining ?? 0)}
            </p>
          </>
        )}
      </section>

      <p className="text-center text-sm text-[var(--color-text-muted)]">
        {strings.stationsCompleted}: {state.stoneCardsCollected} /{' '}
        {state.game.roundCount}
      </p>
    </div>
  );
}
