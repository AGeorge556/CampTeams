// The Wilderness: Big Game — the fixed rotation, laid out as two grids.
//
// Both tables are read straight off route.ts's pure functions — the rotation
// is computed from tribe/round arithmetic, never stored, so there is nothing
// here to hard-code without risking the grid disagreeing with the rule the
// physical event actually depends on (exactly one tribe per station per
// round).

import {
  ROUNDS,
  STATION_BLUEPRINT,
  TRIBE_BLUEPRINT,
  stationByIndex,
  stationScheduleMatrix,
  tribeByIndex,
  tribeRouteMatrix,
} from '../../lib/bigGame/route';

interface RouteMatrixProps {
  /** Highlights this round's column in both tables when the game is active. */
  currentRound?: number;
}

export default function RouteMatrix({ currentRound }: RouteMatrixProps = {}) {
  const tribeRows = tribeRouteMatrix();
  const stationRows = stationScheduleMatrix();

  const headerCellClass = (round: number) =>
    `whitespace-nowrap border-b border-[var(--color-border)] px-3 py-2 text-left text-xs font-medium uppercase tracking-wide ${
      round === currentRound
        ? 'bg-[var(--color-bg-muted)] text-[var(--color-primary)]'
        : 'text-[var(--color-text-muted)]'
    }`;

  const bodyCellClass = (round: number) =>
    `whitespace-nowrap px-3 py-2 ${
      round === currentRound
        ? 'bg-[var(--color-bg-muted)] font-semibold text-[var(--color-text)]'
        : 'text-[var(--color-text)]'
    }`;

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card-bg)] p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-[var(--color-text)]">
          Tribe route
        </h3>
        <p className="mb-4 mt-1 text-sm text-[var(--color-text-muted)]">
          Where each tribe reports to, round by round.
        </p>
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-sm">
            <thead>
              <tr>
                <th
                  scope="col"
                  className="sticky left-0 whitespace-nowrap border-b border-[var(--color-border)] bg-[var(--color-card-bg)] px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]"
                >
                  Tribe
                </th>
                {ROUNDS.map(round => (
                  <th
                    key={round}
                    scope="col"
                    className={headerCellClass(round)}
                  >
                    R{round}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TRIBE_BLUEPRINT.map((tribe, rowIndex) => (
                <tr
                  key={tribe.id}
                  className="border-b border-[var(--color-border)] last:border-0"
                >
                  <th
                    scope="row"
                    className="sticky left-0 whitespace-nowrap bg-[var(--color-card-bg)] px-3 py-2 text-left font-medium text-[var(--color-text)]"
                  >
                    {tribe.id}
                    <span className="block text-xs font-normal text-[var(--color-text-muted)]">
                      {tribe.parentTeam}
                    </span>
                  </th>
                  {tribeRows[rowIndex].map((stationIndex, colIndex) => {
                    const round = ROUNDS[colIndex];
                    const station = stationByIndex(stationIndex);
                    return (
                      <td key={round} className={bodyCellClass(round)}>
                        {station ? `${station.id} ${station.name}` : '—'}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card-bg)] p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-[var(--color-text)]">
          Station schedule
        </h3>
        <p className="mb-4 mt-1 text-sm text-[var(--color-text-muted)]">
          Who is arriving at each station, round by round — the moderator's
          view.
        </p>
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-sm">
            <thead>
              <tr>
                <th
                  scope="col"
                  className="sticky left-0 whitespace-nowrap border-b border-[var(--color-border)] bg-[var(--color-card-bg)] px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]"
                >
                  Station
                </th>
                {ROUNDS.map(round => (
                  <th
                    key={round}
                    scope="col"
                    className={headerCellClass(round)}
                  >
                    R{round}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {STATION_BLUEPRINT.map((station, rowIndex) => (
                <tr
                  key={station.id}
                  className="border-b border-[var(--color-border)] last:border-0"
                >
                  <th
                    scope="row"
                    className="sticky left-0 whitespace-nowrap bg-[var(--color-card-bg)] px-3 py-2 text-left font-medium text-[var(--color-text)]"
                  >
                    {station.id}
                    <span className="block text-xs font-normal text-[var(--color-text-muted)]">
                      {station.name}
                    </span>
                  </th>
                  {stationRows[rowIndex].map((tribeIndex, colIndex) => {
                    const round = ROUNDS[colIndex];
                    const tribe = tribeByIndex(tribeIndex);
                    return (
                      <td key={round} className={bodyCellClass(round)}>
                        {tribe ? tribe.id : '—'}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
