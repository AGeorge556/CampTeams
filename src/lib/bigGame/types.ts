// The Wilderness: Big Game — the wire contract.
//
// Every shape here is what a `bg_*` RPC returns. The rule that shapes the whole
// file: nothing a tribe-leader session can call may carry a station code, a
// join code, or another tribe's state. If you add a field to a Leader* type,
// check it against that rule first.

export type BigGameStatus = 'SETUP' | 'ACTIVE' | 'PAUSED' | 'FINISHED';

export type RoundResultStatus =
  | 'COMPLETED'
  | 'MISSED'
  | 'OVERRIDDEN'
  | 'SKIPPED';

export interface GameSummary {
  status: BigGameStatus;
  currentRound: number; // 0 in SETUP, 1..6 once ACTIVE
  roundCount: number; // always 6, sent so the UI never hard-codes it
  revealNextEarly: boolean;
  startedAt: string | null;
  finishedAt: string | null;
  roundStartedAt: string | null;
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
  submittedCode: string | null;
  completedAt: string | null;
  overriddenBy: string | null;
}

export interface SelfTestResult {
  name: string;
  passed: boolean;
  detail: string | null;
}
