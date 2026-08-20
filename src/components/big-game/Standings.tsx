// The Wilderness: Big Game — final standings and the awards.
//
// Pure presentation; FinaleDirector owns the fetching. Two details matter
// here and are easy to get wrong:
//
//   Open times carry sub-second precision. Two teams can open in the same
//   second, and the server orders on the exact timestamp — showing only
//   hh:mm:ss would make a correct call look arbitrary to whoever lost.
//
//   The best-tribe award gets its own block. Twelve tribes competing only as
//   thirds of a team makes individual effort invisible, and this is the one
//   screen where it should not be.

import { Award, Layers, Trophy, Users } from 'lucide-react';
import type { Standings as StandingsData } from '../../lib/bigGame/types';

function openTime(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  const ms = String(d.getMilliseconds()).padStart(3, '0');
  return `${hh}:${mm}:${ss}.${ms}`;
}

const PLACE = ['1st', '2nd', '3rd', '4th'];

export default function Standings({ standings }: { standings: StandingsData }) {
  const { teams, tribes, bestTribe, decidedBy } = standings;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card-bg)] p-5">
        <div className="mb-4 flex items-center gap-2">
          <Trophy className="h-5 w-5 text-[var(--color-primary)]" />
          <h3 className="text-lg font-bold text-[var(--color-text)]">
            Final standings
          </h3>
        </div>

        <p className="mb-4 text-sm text-[var(--color-text-muted)]">
          {decidedBy === 'OPEN_TIME'
            ? 'Decided by vault open time. Teams that never opened rank after those that did, by station points.'
            : 'No team opened its vault, so the result falls back to station points.'}
        </p>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] text-left text-[var(--color-text-muted)]">
                <th className="py-2 pr-3 font-medium">Place</th>
                <th className="py-2 pr-3 font-medium">Team</th>
                <th className="py-2 pr-3 font-medium">Tribes</th>
                <th className="py-2 pr-3 font-medium">Points</th>
                <th className="py-2 pr-3 font-medium">Opened</th>
              </tr>
            </thead>
            <tbody>
              {teams.map((team, i) => (
                <tr
                  key={team.id}
                  className="border-b border-[var(--color-border)] last:border-0"
                >
                  <td className="py-3 pr-3 font-bold text-[var(--color-text)]">
                    {PLACE[i] ?? `${i + 1}th`}
                  </td>
                  <td className="py-3 pr-3">
                    <span className="font-semibold text-[var(--color-text)]">
                      {team.displayName}
                    </span>
                    {team.shortHanded && (
                      <span className="ml-2 rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                        short-handed
                      </span>
                    )}
                  </td>
                  <td className="py-3 pr-3 text-[var(--color-text-muted)]">
                    {team.tribeNames.join(', ')}
                  </td>
                  <td className="py-3 pr-3 font-semibold text-[var(--color-text)]">
                    {team.total}
                    <span className="text-[var(--color-text-muted)]">
                      {' '}
                      / 36
                    </span>
                  </td>
                  <td className="py-3 pr-3 font-mono text-[var(--color-text)]">
                    {openTime(team.openedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {bestTribe && (
        <section className="rounded-2xl border-2 border-[var(--color-primary)] bg-[var(--color-card-bg)] p-5">
          <div className="mb-2 flex items-center gap-2">
            <Award className="h-5 w-5 text-[var(--color-primary)]" />
            <h3 className="text-lg font-bold text-[var(--color-text)]">
              Best tribe
            </h3>
          </div>
          <p className="text-sm text-[var(--color-text-muted)]">
            Highest station points of all twelve tribes, independent of how
            their team finished.
          </p>
          <div className="mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <span className="text-2xl font-black text-[var(--color-text)]">
              {bestTribe.displayName}
            </span>
            <span className="text-lg font-bold text-[var(--color-primary)]">
              {bestTribe.points} / 12
            </span>
            <span className="text-sm text-[var(--color-text-muted)]">
              {bestTribe.clears} cleared · Team {bestTribe.teamId}
            </span>
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card-bg)] p-5">
        <div className="mb-4 flex items-center gap-2">
          <Users className="h-5 w-5 text-[var(--color-text-muted)]" />
          <h3 className="text-lg font-bold text-[var(--color-text)]">
            All tribes
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] text-left text-[var(--color-text-muted)]">
                <th className="py-2 pr-3 font-medium">Tribe</th>
                <th className="py-2 pr-3 font-medium">Team</th>
                <th className="py-2 pr-3 font-medium">Points</th>
                <th className="py-2 pr-3 font-medium">Cleared</th>
                <th className="py-2 pr-3 font-medium">Cards</th>
              </tr>
            </thead>
            <tbody>
              {[...tribes]
                .sort((a, b) => b.total - a.total || a.index - b.index)
                .map(tribe => (
                  <tr
                    key={tribe.id}
                    className="border-b border-[var(--color-border)] last:border-0"
                  >
                    <td className="py-2 pr-3 font-medium text-[var(--color-text)]">
                      {tribe.displayName}
                    </td>
                    <td className="py-2 pr-3 text-[var(--color-text-muted)]">
                      {tribe.teamId}
                    </td>
                    <td className="py-2 pr-3 font-semibold text-[var(--color-text)]">
                      {tribe.total}
                    </td>
                    <td className="py-2 pr-3 text-[var(--color-text-muted)]">
                      {tribe.clears}
                    </td>
                    <td className="py-2 pr-3 text-[var(--color-text-muted)]">
                      <Layers className="mr-1 inline h-3 w-3" />
                      {tribe.stoneCards}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
