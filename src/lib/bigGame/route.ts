// The Wilderness: Big Game — route engine.
//
// Twelve tribes rotate through twelve stations across six rounds. The route is
// a rotation, not an assignment table: in round r, tribe t stands at the
// station t + (r - 1), wrapping at 12. That single rule is what guarantees the
// invariant the whole event depends on — exactly one tribe per station per
// round — so it is computed, never stored. Storing 72 rows would let the
// stored copy and the rule disagree, and the physical game has no way to
// recover from two tribes arriving at the same cone.
//
// This module is pure and dependency-free on purpose: `npm run verify:big-game`
// compiles and executes it directly to prove the invariants before the event.

export const ROUND_COUNT = 6;
export const TRIBE_COUNT = 12;
export const STATION_COUNT = 12;

/**
 * Modulo that is correct for negative operands. JavaScript's `%` returns a
 * negative remainder for negative inputs, which would send the inverse lookup
 * (used by moderator cards) to station 0 or below at the wrap boundaries.
 */
export function mod12(n: number): number {
  return ((n % STATION_COUNT) + STATION_COUNT) % STATION_COUNT;
}

/** Which station does this tribe report to in this round? */
export function stationIndexForTribe(
  tribeIndex: number,
  round: number
): number {
  return mod12(tribeIndex - 1 + (round - 1)) + 1;
}

/** Which tribe arrives at this station in this round? (inverse of the above) */
export function tribeIndexAtStation(
  stationIndex: number,
  round: number
): number {
  return mod12(stationIndex - 1 - (round - 1)) + 1;
}

/**
 * Note the absence of a theme word. Each station's answer codes are that
 * station's theme word plus two digits, and the digits are drawn from an
 * eight-symbol alphabet — so a client that knows the word has only 64
 * possibilities left, which the submission throttle allows in about six
 * minutes, inside a single ten-minute round. The words live only in the
 * migration that seeds bg_stations and never reach a browser.
 */
export interface StationBlueprint {
  id: string;
  index: number;
  name: string;
  shortDescription: string;
}

export interface TribeBlueprint {
  id: string;
  index: number;
  parentTeam: string;
}

export const STATION_BLUEPRINT: readonly StationBlueprint[] = [
  {
    id: 'S1',
    index: 1,
    name: 'The Red Sea',
    shortDescription: 'Cross together, or not at all.',
  },
  {
    id: 'S2',
    index: 2,
    name: 'Marah',
    shortDescription: 'Make the bitter water sweet.',
  },
  {
    id: 'S3',
    index: 3,
    name: 'Manna',
    shortDescription: 'Gather exactly what the day requires.',
  },
  {
    id: 'S4',
    index: 4,
    name: 'Amalek',
    shortDescription: 'Hold up the staff; nobody wins alone.',
  },
  {
    id: 'S5',
    index: 5,
    name: 'The Tabernacle',
    shortDescription: 'Rebuild the pattern, piece by piece.',
  },
  {
    id: 'S6',
    index: 6,
    name: 'Pillar of Cloud',
    shortDescription: 'Follow a guide you cannot see.',
  },
  {
    id: 'S7',
    index: 7,
    name: 'The Twelve Spies',
    shortDescription: 'Weigh the evidence and decide.',
  },
  {
    id: 'S8',
    index: 8,
    name: 'The Wilderness',
    shortDescription: 'Find the way through the maze.',
  },
  {
    id: 'S9',
    index: 9,
    name: 'Water from the Rock',
    shortDescription: 'Strike together or nothing flows.',
  },
  {
    id: 'S10',
    index: 10,
    name: 'The Bronze Serpent',
    shortDescription: 'The answer is above eye level.',
  },
  {
    id: 'S11',
    index: 11,
    name: 'The Twelve Tribes',
    shortDescription: 'Sort the tribes into their places.',
  },
  {
    id: 'S12',
    index: 12,
    name: 'Promised Land Vault',
    shortDescription: 'Everything you learned, one last time.',
  },
];

export const PARENT_TEAMS = ['Team A', 'Team B', 'Team C', 'Team D'] as const;

export const TRIBE_BLUEPRINT: readonly TribeBlueprint[] = Array.from(
  { length: TRIBE_COUNT },
  (_, i) => ({
    id: `T${i + 1}`,
    index: i + 1,
    // T1-T3 -> Team A, T4-T6 -> Team B, T7-T9 -> Team C, T10-T12 -> Team D
    parentTeam: PARENT_TEAMS[Math.floor(i / 3)],
  })
);

export function stationByIndex(index: number): StationBlueprint | undefined {
  return STATION_BLUEPRINT.find(s => s.index === index);
}

export function tribeByIndex(index: number): TribeBlueprint | undefined {
  return TRIBE_BLUEPRINT.find(t => t.index === index);
}

export const ROUNDS: readonly number[] = Array.from(
  { length: ROUND_COUNT },
  (_, i) => i + 1
);

/** Rows = tribe, columns = round, cells = station index. */
export function tribeRouteMatrix(): number[][] {
  return TRIBE_BLUEPRINT.map(tribe =>
    ROUNDS.map(round => stationIndexForTribe(tribe.index, round))
  );
}

/** Rows = station, columns = round, cells = tribe index. */
export function stationScheduleMatrix(): number[][] {
  return STATION_BLUEPRINT.map(station =>
    ROUNDS.map(round => tribeIndexAtStation(station.index, round))
  );
}
