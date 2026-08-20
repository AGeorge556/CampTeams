// The Wilderness: Big Game — typed RPC client.
//
// Every call goes to a `bg_*` SECURITY DEFINER function. There are no direct
// table reads anywhere in this feature: the `bg_` tables carry RLS with no
// SELECT policies, so PostgREST cannot reach them even with a valid JWT. That
// is what keeps the 72 station codes off every client that is not an
// authenticated admin explicitly asking for the code sheet.

import { supabase } from '../supabase';
import type {
  AdminOverview,
  FinaleState,
  ScoreBoard,
  Standings,
  RoundResultStatus,
  TeamSummary,
  TeamValidation,
  AdvancePreview,
  AuditEntry,
  ExportRow,
  JoinResult,
  LeaderState,
  ModeratorCard,
  SelfTestResult,
  SetupState,
  StationCode,
  SubmitResult,
} from './types';

/**
 * The generated `Database` type has no entry for the `bg_*` functions, and
 * hand-editing the generated file would tie this removable feature to it. One
 * localized escape hatch keeps the rest of the module fully typed.
 */
const rpc = supabase.rpc.bind(supabase) as unknown as (
  fn: string,
  args?: Record<string, unknown>
) => PromiseLike<{ data: unknown; error: { message: string } | null }>;

export class BigGameError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BigGameError';
  }
}

async function call<T>(fn: string, args: Record<string, unknown> = {}) {
  const { data, error } = await rpc(fn, args);
  if (error) throw new BigGameError(error.message);
  return data as T;
}

// ---------------------------------------------------------------------------
// Tribe leader — callable without a site account (paper join code)
// ---------------------------------------------------------------------------

export type JoinResponse =
  | ({ ok: true } & JoinResult)
  | { ok: false; reason: 'INVALID' | 'THROTTLED' };

export function join(joinCode: string, deviceId: string) {
  return call<JoinResponse>('bg_join', {
    p_join_code: joinCode,
    p_device_id: deviceId,
  });
}

export type LeaderStateResponse =
  | { ok: true; state: LeaderState }
  | { ok: false; reason: 'INVALID_SESSION' };

export function leaderState(token: string) {
  return call<LeaderStateResponse>('bg_leader_state', { p_token: token });
}

export type SubmitResponse =
  | ({ ok: true } & SubmitResult)
  | { ok: false; reason: 'INVALID_SESSION' };

export function submitCode(params: {
  token: string;
  code: string;
  expectedRound: number;
  idempotencyKey: string;
}) {
  return call<SubmitResponse>('bg_submit_code', {
    p_token: params.token,
    p_code: params.code,
    p_expected_round: params.expectedRound,
    p_idempotency_key: params.idempotencyKey,
  });
}

// ---------------------------------------------------------------------------
// Admin / game director — every one of these re-checks is_admin_user() server side
// ---------------------------------------------------------------------------

export function adminOverview() {
  return call<AdminOverview>('bg_admin_overview');
}

export function setupState() {
  return call<SetupState>('bg_admin_setup_state');
}

export function updateTribe(params: {
  tribeId: string;
  displayName?: string;
  parentTeam?: string;
  joinCode?: string;
}) {
  return call<SetupState>('bg_admin_update_tribe', {
    p_tribe_id: params.tribeId,
    p_display_name: params.displayName ?? null,
    p_parent_team: params.parentTeam ?? null,
    p_join_code: params.joinCode ?? null,
  });
}

export function updateStation(params: {
  stationId: string;
  location?: string;
  shortDescription?: string;
  instructions?: string;
}) {
  return call<SetupState>('bg_admin_update_station', {
    p_station_id: params.stationId,
    p_location: params.location ?? null,
    p_short_description: params.shortDescription ?? null,
    p_instructions: params.instructions ?? null,
  });
}

export function regenerateJoinCodes() {
  return call<SetupState>('bg_admin_regenerate_join_codes');
}

export function generateStationCodes(seed: string) {
  return call<SetupState>('bg_admin_generate_codes', { p_seed: seed });
}

export function updateStationCode(params: {
  stationId: string;
  round: number;
  code: string;
}) {
  return call<StationCode[]>('bg_admin_update_code', {
    p_station_id: params.stationId,
    p_round: params.round,
    p_code: params.code,
  });
}

export function stationCodes() {
  return call<StationCode[]>('bg_admin_codes');
}

export function moderatorCards() {
  return call<ModeratorCard[]>('bg_admin_moderator_cards');
}

export function startGame() {
  return call<AdminOverview>('bg_admin_start');
}

export function advancePreview() {
  return call<AdvancePreview>('bg_admin_advance_preview');
}

export function advanceRound() {
  return call<AdminOverview>('bg_admin_advance_round');
}

export function setPaused(paused: boolean) {
  return call<AdminOverview>('bg_admin_set_paused', { p_paused: paused });
}

export function setRevealNextEarly(reveal: boolean) {
  return call<AdminOverview>('bg_admin_set_reveal_next_early', {
    p_reveal: reveal,
  });
}

export function overrideComplete(tribeId: string) {
  return call<AdminOverview>('bg_admin_override_complete', {
    p_tribe_id: tribeId,
  });
}

export function skipStation(tribeId: string) {
  return call<AdminOverview>('bg_admin_skip', { p_tribe_id: tribeId });
}

export function resetTribe(tribeId: string) {
  return call<AdminOverview>('bg_admin_reset_tribe', { p_tribe_id: tribeId });
}

export function resetAll(confirmation: string, force: boolean) {
  return call<AdminOverview>('bg_admin_reset_all', {
    p_confirmation: confirmation,
    p_force: force,
  });
}

export function auditLog(limit = 100) {
  return call<AuditEntry[]>('bg_admin_audit', { p_limit: limit });
}

export function exportResults() {
  return call<ExportRow[]>('bg_admin_export');
}

export function selfTest() {
  return call<SelfTestResult[]>('bg_selftest');
}

// ---------------------------------------------------------------------------
// Scoring, hints and teams (admin only)
// ---------------------------------------------------------------------------

export function scoreBoard() {
  return call<ScoreBoard>('bg_admin_scores');
}

/**
 * Set one cell of the score grid. `warning` comes back non-null when the
 * director marks CLEAR on a round where a hint was spent -- a warning, never a
 * block, because moderators make mistakes and the director must be able to
 * overrule them.
 */
export function setResult(params: {
  tribeId: string;
  round: number;
  status: RoundResultStatus;
}) {
  return call<{ board: ScoreBoard; warning: string | null }>(
    'bg_admin_set_result',
    {
      p_tribe_id: params.tribeId,
      p_round: params.round,
      p_status: params.status,
    }
  );
}

export function setHintsRemaining(tribeId: string, hintsRemaining: number) {
  return call<ScoreBoard>('bg_admin_set_hints', {
    p_tribe_id: tribeId,
    p_hints_remaining: hintsRemaining,
  });
}

export function setHintUsed(params: {
  tribeId: string;
  round: number;
  used: boolean;
}) {
  return call<ScoreBoard>('bg_admin_set_hint_used', {
    p_tribe_id: params.tribeId,
    p_round: params.round,
    p_used: params.used,
  });
}

export function teams() {
  return call<TeamSummary[]>('bg_admin_teams');
}

export function updateTeam(params: {
  teamId: string;
  displayName?: string;
  phrase?: string;
  padlockCode?: string;
  tribeIds?: string[];
}) {
  return call<TeamSummary[]>('bg_admin_update_team', {
    p_team_id: params.teamId,
    p_display_name: params.displayName ?? null,
    p_phrase: params.phrase ?? null,
    p_padlock_code: params.padlockCode ?? null,
    p_tribe_ids: params.tribeIds ?? null,
  });
}

/** Coverage check: each team's three tribes must hit all 12 stations once. */
export function validateTeams() {
  return call<TeamValidation[]>('bg_admin_validate_teams');
}

// ---------------------------------------------------------------------------
// The Finale
// ---------------------------------------------------------------------------

export function finaleState() {
  return call<FinaleState>('bg_admin_finale_state');
}

/** Freezes the head-start ranking. A later score edit will not reshuffle it. */
export function startFinale() {
  return call<FinaleState>('bg_admin_start_finale');
}

export function markTeamOpened(teamId: string) {
  return call<FinaleState>('bg_admin_team_opened', { p_team_id: teamId });
}

export function markShortHanded(teamId: string, shortHanded: boolean) {
  return call<FinaleState>('bg_admin_mark_short_handed', {
    p_team_id: teamId,
    p_short_handed: shortHanded,
  });
}

export function finishGame() {
  return call<Standings>('bg_admin_finish_game');
}

export function standings() {
  return call<Standings>('bg_admin_standings');
}
