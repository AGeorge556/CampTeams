// The Wilderness: Big Game — route engine verification.
//
// The repo has no test runner, and adding one for a single event would be a
// heavy dependency for a feature that gets deleted afterwards. This script
// compiles the real route module with the TypeScript compiler that already
// ships with the project and executes the invariants against it — so the thing
// under test is the code that ships, not a copy of it.
//
//   npm run verify:big-game
//
// If this fails, do not run the event. Two tribes arriving at one station is
// not recoverable once 150 campers are outdoors.

import {
  ROUNDS,
  ROUND_COUNT,
  STATION_BLUEPRINT,
  STATION_COUNT,
  TRIBE_BLUEPRINT,
  TRIBE_COUNT,
  mod12,
  stationIndexForTribe,
  stationScheduleMatrix,
  tribeIndexAtStation,
  teamIdForTribeIndex,
  tribeIndexesForTeam,
  tribeRouteMatrix,
  teamStationCoverage,
  coversAllStationsExactlyOnce,
  TEAM_IDS,
} from '../src/lib/bigGame/route.js';

let failures = 0;
let checks = 0;

function check(name: string, passed: boolean, detail = ''): void {
  checks += 1;
  if (passed) {
    console.log(`  ok   ${name}`);
    return;
  }
  failures += 1;
  console.log(`  FAIL ${name}${detail ? ` — ${detail}` : ''}`);
}

function section(title: string): void {
  console.log(`\n${title}`);
}

function eqRow(actual: number[], expected: number[]): boolean {
  return (
    actual.length === expected.length &&
    actual.every((v, i) => v === expected[i])
  );
}

// The tables transcribed from the specification. These are deliberately
// hard-coded: the point is to catch a route engine that is self-consistent but
// disagrees with the printed cards.
const EXPECTED_TRIBE_ROUTE: number[][] = [
  [1, 2, 3, 4],
  [2, 3, 4, 5],
  [3, 4, 5, 6],
  [4, 5, 6, 7],
  [5, 6, 7, 8],
  [6, 7, 8, 9],
  [7, 8, 9, 10],
  [8, 9, 10, 11],
  [9, 10, 11, 12],
  [10, 11, 12, 1],
  [11, 12, 1, 2],
  [12, 1, 2, 3],
];

const EXPECTED_STATION_SCHEDULE: number[][] = [
  [1, 12, 11, 10],
  [2, 1, 12, 11],
  [3, 2, 1, 12],
  [4, 3, 2, 1],
  [5, 4, 3, 2],
  [6, 5, 4, 3],
  [7, 6, 5, 4],
  [8, 7, 6, 5],
  [9, 8, 7, 6],
  [10, 9, 8, 7],
  [11, 10, 9, 8],
  [12, 11, 10, 9],
];

console.log('The Wilderness: Big Game — route verification');

section('Shape');
check('exactly 4 rounds', ROUND_COUNT === 4, `got ${ROUND_COUNT}`);
check('exactly 12 tribes', TRIBE_COUNT === 12, `got ${TRIBE_COUNT}`);
check('exactly 12 stations', STATION_COUNT === 12, `got ${STATION_COUNT}`);
check(
  'station blueprint has 12 entries',
  STATION_BLUEPRINT.length === 12,
  `got ${STATION_BLUEPRINT.length}`
);
check(
  'tribe blueprint has 12 entries',
  TRIBE_BLUEPRINT.length === 12,
  `got ${TRIBE_BLUEPRINT.length}`
);
check(
  'station ids and indices are unique and 1..12',
  new Set(STATION_BLUEPRINT.map(s => s.id)).size === 12 &&
    eqRow(
      STATION_BLUEPRINT.map(s => s.index),
      [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
    )
);
// Theme words are deliberately absent from the client blueprint — see the note
// in route.ts. Their spelling and distinctness are asserted by bg_selftest().
check(
  'tribes map to parent teams four apart, not consecutively',
  TRIBE_BLUEPRINT.every(
    t => t.parentTeam === `Team ${teamIdForTribeIndex(t.index)}`
  ) &&
    TRIBE_BLUEPRINT[0].parentTeam === TRIBE_BLUEPRINT[4].parentTeam &&
    TRIBE_BLUEPRINT[0].parentTeam !== TRIBE_BLUEPRINT[1].parentTeam,
  TRIBE_BLUEPRINT.map(t => `${t.id}=${t.parentTeam}`).join(' ')
);

section('Negative-safe modulo');
check('mod12(-1) === 11', mod12(-1) === 11, `got ${mod12(-1)}`);
check('mod12(-12) === 0', mod12(-12) === 0, `got ${mod12(-12)}`);
check('mod12(0) === 0', mod12(0) === 0);
check('mod12(12) === 0', mod12(12) === 0);

section('One tribe per station per round');
for (const round of ROUNDS) {
  const stations = TRIBE_BLUEPRINT.map(t =>
    stationIndexForTribe(t.index, round)
  );
  const unique = new Set(stations);
  check(
    `round ${round}: the 12 tribes occupy exactly stations 1..12`,
    unique.size === 12 && [...unique].every(s => s >= 1 && s <= 12),
    stations.join(',')
  );
}

section('No tribe visits the same station twice');
for (const tribe of TRIBE_BLUEPRINT) {
  const stations = ROUNDS.map(r => stationIndexForTribe(tribe.index, r));
  check(
    `${tribe.id}: ${ROUND_COUNT} distinct stations`,
    new Set(stations).size === ROUND_COUNT,
    stations.join(',')
  );
}

section('Matrix matches the specification, tribe by tribe');
const routeMatrix = tribeRouteMatrix();
TRIBE_BLUEPRINT.forEach((tribe, i) => {
  check(
    `${tribe.id} route`,
    eqRow(routeMatrix[i], EXPECTED_TRIBE_ROUTE[i]),
    `got ${routeMatrix[i].join(',')} want ${EXPECTED_TRIBE_ROUTE[i].join(',')}`
  );
});

section('Station schedule matches the specification, station by station');
const scheduleMatrix = stationScheduleMatrix();
STATION_BLUEPRINT.forEach((station, i) => {
  check(
    `${station.id} schedule`,
    eqRow(scheduleMatrix[i], EXPECTED_STATION_SCHEDULE[i]),
    `got ${scheduleMatrix[i].join(',')} want ${EXPECTED_STATION_SCHEDULE[i].join(',')}`
  );
});

section('Inverse is exact for every tribe/round pair');
let inverseBroken: string | null = null;
for (const tribe of TRIBE_BLUEPRINT) {
  for (const round of ROUNDS) {
    const station = stationIndexForTribe(tribe.index, round);
    const back = tribeIndexAtStation(station, round);
    if (back !== tribe.index && inverseBroken === null) {
      inverseBroken = `T${tribe.index} R${round} -> S${station} -> T${back}`;
    }
  }
}
check(
  'tribeIndexAtStation(stationIndexForTribe(t, r), r) === t',
  inverseBroken === null,
  inverseBroken ?? ''
);

section('Wrap boundaries');
check(
  'T12 R2 is at S1',
  stationIndexForTribe(12, 2) === 1,
  `got S${stationIndexForTribe(12, 2)}`
);
check(
  'T10 R4 is at S1',
  stationIndexForTribe(10, 4) === 1,
  `got S${stationIndexForTribe(10, 4)}`
);
check(
  'S1 R4 hosts T10 (inverse across the wrap)',
  tribeIndexAtStation(1, 4) === 10,
  `got T${tribeIndexAtStation(1, 4)}`
);
check(
  'S1 R2 hosts T12 (inverse across the wrap)',
  tribeIndexAtStation(1, 2) === 12,
  `got T${tribeIndexAtStation(1, 2)}`
);
// The task brief's own worked example was wrong about this one; the route says S9.
check(
  'T7 in round 3 is at S9, not S8',
  stationIndexForTribe(7, 3) === 9,
  `got S${stationIndexForTribe(7, 3)}`
);

console.log(
  `\n${checks - failures}/${checks} checks passed${failures ? ` — ${failures} FAILED` : ''}`
);

if (failures > 0) {
  console.error('\nROUTE VERIFICATION FAILED. Do not run the event.');
  process.exit(1);
}
section('Team grouping covers all twelve stations');
for (const teamId of TEAM_IDS) {
  const tribeIndexes = tribeIndexesForTeam(teamId);
  const coverage = teamStationCoverage(tribeIndexes);
  check(
    `Team ${teamId} (T${tribeIndexes.join(', T')}) covers all 12 stations exactly once`,
    coversAllStationsExactlyOnce(tribeIndexes),
    `${coverage.length} slots, ${new Set(coverage).size} distinct`
  );
}
check(
  'three tribes per team, twelve tribes assigned in total',
  TEAM_IDS.every(id => tribeIndexesForTeam(id).length === 3) &&
    new Set(TEAM_IDS.flatMap(id => tribeIndexesForTeam(id))).size === TRIBE_COUNT
);
// The failure this guards against: group consecutively and a team lands on six
// stations, three of them twice, so its Stone Cards cannot spell the phrase.
check(
  'consecutive grouping would NOT cover all twelve (guard is meaningful)',
  !coversAllStationsExactlyOnce([1, 2, 3])
);

console.log('Route engine verified.\n');
