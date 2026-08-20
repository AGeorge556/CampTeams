// The Wilderness: Big Game — the wire contract.
//
// Every shape here is what a `bg_*` RPC returns. The rule that shapes the whole
// file: nothing a tribe-leader session can call may carry a station code, a
// join code, or another tribe's state. If you add a field to a Leader* type,
// check it against that rule first.

export type BigGameStatus =
  | 'SETUP'
  | 'ACTIVE'
  | 'PAUSED'
  | 'FINALE'
  | 'FINISHED';

/**
 * A station visit is scored, not passed/failed. The moderator hands over the
 * code at the bell whatever happened, so the rotation never jams -- the code
 * proves the tribe was there, the score is the director's separate judgement.
 */
export type RoundResultStatus = 'CLEAR' | 'PARTIAL' | 'FAIL' | 'MISSED';

/**
 * Why a result was forced, kept apart from the score itself. A dead phone
 * (OVERRIDDEN) and a broken challenge (SKIPPED) both need recording, but
 * neither is a score -- collapsing them into the score would lose the reason
 * and make the export dishonest.
 */
export type ResultAdjustment = 'OVERRIDDEN' | 'SKIPPED';

export const RESULT_POINTS: Record<RoundResultStatus, number> = {
  CLEAR: 3,
  PARTIAL: 1,
  FAIL: 0,
  MISSED: 0,
};

export const RESULT_ORDER: RoundResultStatus[] = [
  'CLEAR',
  'PARTIAL',
  'FAIL',
  'MISSED',
];

export interface GameSummary {
  status: BigGameStatus;
  currentRound: number; // 0 in SETUP, 1..roundCount once ACTIVE
  roundCount: number; // 4, sent so the UI never hard-codes it
  revealNextEarly: boolean;
  startedAt: string | null;
  finishedAt: string | null;
  roundStartedAt: string | null;
  /** Set when the director presses Start on the Finale, null before. */
  finaleStartedAt: string | null;
}

// ---------------------------------------------------------------------------
// Tribe leader
// ---------------------------------------------------------------------------

export interface LeaderTribe {
  id: string;
  index: number;
  displayName: string;
  parentTeam: string;
}

export interface LeaderStation {
  id: string;
  index: number;
  name: string;
  location: string;
  shortDescription: string | null;
  instructions: string | null;
}

export interface LeaderRoundRecord {
  round: number;
  stationId: string;
  stationName: string;
  status: RoundResultStatus;
  completedAt: string | null;
}

export interface LeaderState {
  serverTime: string;
  game: GameSummary;
  tribe: LeaderTribe;
  /** Null in SETUP and FINISHED — a leader is never shown a destination early. */
  currentStation: LeaderStation | null;
  /** Only populated when the director has turned on reveal-next-early. */
  nextStation: LeaderStation | null;
  currentRoundCompleted: boolean;
  currentRoundStatus: RoundResultStatus | null;
  completedCount: number;
  history: LeaderRoundRecord[];
  /** Physical hint cards this tribe still holds. Starts at 2. */
  hintsRemaining: number;
  /** Derived from completed rounds -- the site never issues or stores cards. */
  stoneCardsCollected: number;
  /**
   * Populated only once the game reaches FINALE. Carries the team's name, its
   * three tribe names and its head start -- never the phrase, the letter
   * positions, or the padlock code.
   */
  finaleTeam: LeaderFinaleTeam | null;
}

export interface LeaderFinaleTeam {
  id: string;
  displayName: string;
  tribeNames: string[];
  headStartSeconds: number;
  /** Absolute time this team may begin; null until the director starts. */
  startsAt: string | null;
}

export interface JoinResult {
  token: string;
  state: LeaderState;
}

export type SubmitOutcome =
  | 'CORRECT'
  | 'ALREADY_COMPLETE'
  | 'INCORRECT'
  | 'NOT_STARTED'
  | 'PAUSED'
  | 'FINISHED'
  | 'THROTTLED'
  | 'ROUND_CHANGED';

export interface SubmitResult {
  outcome: SubmitOutcome;
  /** The round the server actually evaluated against. */
  round: number;
  state: LeaderState;
}

// ---------------------------------------------------------------------------
// Admin / game director
// ---------------------------------------------------------------------------

export interface AdminTribeRow {
  id: string;
  index: number;
  displayName: string;
  parentTeam: string;
  joinCode: string;
  currentStation: {
    id: string;
    index: number;
    name: string;
    location: string;
  } | null;
  currentRoundStatus: RoundResultStatus | null;
  completedCount: number;
  lastActivityAt: string | null;
  attemptsThisRound: number;
  teamId: string;
  points: number;
  /** Derived from rounds attended, so a short tribe shows before the Finale. */
  stoneCards: number;
  hintsRemaining: number;
}

export interface AdminStationRow {
  id: string;
  index: number;
  name: string;
  location: string;
  active: boolean;
  currentTribe: { id: string; displayName: string } | null;
  nextTribe: { id: string; displayName: string } | null;
  currentRoundStatus: RoundResultStatus | null;
}

export interface AdminOverview {
  serverTime: string;
  game: GameSummary;
  tribes: AdminTribeRow[];
  stations: AdminStationRow[];
  doneThisRound: number;
  tribeCount: number;
}

export interface ChecklistItem {
  key: string;
  label: string;
  ok: boolean;
  detail: string | null;
}

export interface SetupTribe {
  id: string;
  index: number;
  displayName: string;
  parentTeam: string;
  joinCode: string;
}

export interface SetupStation {
  id: string;
  index: number;
  name: string;
  location: string;
  shortDescription: string | null;
  instructions: string | null;
  active: boolean;
}

export interface SetupState {
  serverTime: string;
  game: GameSummary;
  tribes: SetupTribe[];
  stations: SetupStation[];
  codeCount: number;
  checklist: ChecklistItem[];
  canStart: boolean;
}

export interface StationCode {
  stationId: string;
  round: number;
  code: string;
}

export interface ModeratorCardRound {
  round: number;
  code: string;
  tribeId: string;
  tribeDisplayName: string;
  tribeParentTeam: string;
}

export interface ModeratorCard {
  stationId: string;
  stationIndex: number;
  stationName: string;
  location: string;
  shortDescription: string | null;
  instructions: string | null;
  rounds: ModeratorCardRound[];
}

export interface AdvancePreview {
  currentRound: number;
  nextRound: number | null;
  willFinish: boolean;
  /** Advancing past the last round enters the Finale rather than ending. */
  willEnterFinale: boolean;
  pendingTribes: { id: string; displayName: string }[];
}

export interface AuditEntry {
  id: string;
  actorLabel: string;
  action: string;
  detail: Record<string, unknown> | null;
  createdAt: string;
}

export interface ExportRow {
  tribeId: string;
  tribeDisplayName: string;
  parentTeam: string;
  round: number;
  stationId: string;
  stationName: string;
  status: RoundResultStatus;
  points: number;
  adjustment: ResultAdjustment | null;
  hintUsed: boolean;
  submittedCode: string | null;
  completedAt: string | null;
  overriddenBy: string | null;
}

export interface SelfTestResult {
  name: string;
  passed: boolean;
  detail: string | null;
}

// ---------------------------------------------------------------------------
// Scoring, teams, Stone Cards and the Finale
// ---------------------------------------------------------------------------

export interface TeamSummary {
  id: string; // 'A' | 'B' | 'C' | 'D'
  displayName: string;
  tribeIds: string[];
  tribeNames: string[];
}

/** One cell of the director's 12-tribes x 4-rounds score grid. */
export interface ScoreCell {
  tribeId: string;
  round: number;
  stationId: string;
  stationName: string;
  status: RoundResultStatus | null;
  adjustment: ResultAdjustment | null;
  hintUsed: boolean;
  points: number;
}

export interface ScoreTribeRow {
  id: string;
  index: number;
  displayName: string;
  teamId: string;
  cells: ScoreCell[];
  /** 0-12 across four stations. */
  total: number;
  clears: number;
  stoneCards: number;
  hintsRemaining: number;
}

export interface TeamStationCoverage {
  stationId: string;
  stationIndex: number;
  stationName: string;
  covered: boolean;
  byTribeId: string | null;
}

export interface TeamScoreRow {
  id: string;
  displayName: string;
  tribeIds: string[];
  /** 0-36 across three tribes. */
  total: number;
  clears: number;
  stoneCards: number;
  coverage: TeamStationCoverage[];
  coverageComplete: boolean;
}

export interface ScoreBoard {
  serverTime: string;
  rounds: number[];
  tribes: ScoreTribeRow[];
  teams: TeamScoreRow[];
}

export interface FinaleTeamRow {
  id: string;
  displayName: string;
  tribeIds: string[];
  tribeNames: string[];
  rank: number;
  total: number;
  clears: number;
  /** 0, 45, 90 or 135 seconds by rank. */
  headStartSeconds: number;
  /** Absolute time this team may begin; null until the Finale clock starts. */
  startsAt: string | null;
  openedAt: string | null;
  shortHanded: boolean;
  /** Director-only, omitted for every other caller. */
  phrase: string | null;
  padlockCode: string | null;
}

export interface FinaleState {
  serverTime: string;
  game: GameSummary;
  teams: FinaleTeamRow[];
  /** Frozen at Start so a late score edit cannot reshuffle a running race. */
  rankingsFrozen: boolean;
}

export interface BestTribeAward {
  tribeId: string;
  displayName: string;
  teamId: string;
  points: number;
  clears: number;
}

export interface Standings {
  serverTime: string;
  game: GameSummary;
  /** Ordered by open time, then by station points when nobody opened. */
  teams: FinaleTeamRow[];
  decidedBy: 'OPEN_TIME' | 'STATION_POINTS';
  bestTribe: BestTribeAward | null;
  tribes: ScoreTribeRow[];
}

export interface TeamValidation {
  teamId: string;
  displayName: string;
  ok: boolean;
  covered: number;
  duplicates: string[];
  missing: string[];
}
